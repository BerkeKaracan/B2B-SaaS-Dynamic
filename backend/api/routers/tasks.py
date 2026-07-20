from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional

from core.database import supabase, supabase_admin 

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])
security = HTTPBearer()

def verify_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = creds.credentials
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Unauthorized: Please log in.")
        return user_res.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired session.")

class TaskData(BaseModel):
    project_id: str
    project_name: str
    title: str
    status: str
    priority: str
    due_date: Optional[str] = None
    assigned_to: str

class SyncRequest(BaseModel):
    tenant_id: str
    project_id: str
    tasks: List[TaskData]

@router.get("/me")
async def get_my_tasks(tenant_id: str, user=Depends(verify_user)):
    """List tasks assigned to the authenticated user within a tenant they belong to.

    Ignores any client-supplied email — uses JWT email only.
    Requires tenant_users membership (x-tenant-id / query tenant_id alone is not enough).
    """
    try:
        member_check = (
            supabase_admin.table("tenant_users")
            .select("id")
            .eq("tenant_id", tenant_id)
            .eq("user_id", user.id)
            .execute()
        )
        if not member_check.data:
            raise HTTPException(status_code=403, detail="Workspace access denied.")

        user_email = str(user.email or "").lower().strip()
        if not user_email:
            raise HTTPException(status_code=400, detail="User email missing from session.")

        response = (
            supabase_admin.table("records")
            .select("*")
            .eq("tenant_id", tenant_id)
            .eq("module_name", "tasks")
            .ilike("record_data->>assigned_to", user_email)
            .execute()
        )
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync")
async def sync_tasks(payload: SyncRequest, user = Depends(verify_user)):
    try:
        member_check = supabase_admin.table("tenant_users") \
            .select("id") \
            .eq("tenant_id", payload.tenant_id) \
            .eq("user_id", user.id) \
            .execute()
            
        if not member_check.data:
            raise HTTPException(status_code=403, detail="Workspace access denied.")

        supabase.table("records") \
            .delete() \
            .eq("tenant_id", payload.tenant_id) \
            .eq("module_name", "tasks") \
            .eq("record_data->>project_id", payload.project_id) \
            .execute()
            
        if payload.tasks:
            inserts = [
                {
                    "tenant_id": payload.tenant_id,
                    "module_name": "tasks",
                    "record_data": t.model_dump()
                }
                for t in payload.tasks
            ]
            supabase.table("records").insert(inserts).execute()
            
        return {"status": "ok", "message": "Tasks synchronized successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))