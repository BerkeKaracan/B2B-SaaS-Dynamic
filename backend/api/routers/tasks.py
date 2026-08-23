from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional

from core.database import supabase_admin, get_auth_client
from core.project_access import (
    Permission,
    build_access_context_for_user,
    assert_project_access,
)

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])
security = HTTPBearer()


def verify_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = creds.credentials
        from core.database import supabase

        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Unauthorized: Please log in.")
        user_res.user._access_token = token  # type: ignore[attr-defined]
        return user_res.user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired session.")


def _auth_client_for_user(user):
    token = getattr(user, "_access_token", None)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid session")
    return get_auth_client(token)


def _load_project(tenant_id: str, project_id: str) -> dict:
    res = (
        supabase_admin.table("custom_records")
        .select("*")
        .eq("id", project_id)
        .eq("tenant_id", tenant_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Project not found")
    return res.data[0]


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
    try:
        ctx = build_access_context_for_user(
            str(user.id), str(user.email or ""), tenant_id
        )
        user_email = ctx.email
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
        tasks = response.data or []
        filtered = []
        for task in tasks:
            project_id = (task.get("record_data") or {}).get("project_id")
            if not project_id:
                filtered.append(task)
                continue
            try:
                project = _load_project(tenant_id, str(project_id))
                assert_project_access(ctx, project, Permission.VIEW)
                filtered.append(task)
            except HTTPException:
                continue
        return filtered
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync")
async def sync_tasks(payload: SyncRequest, user=Depends(verify_user)):
    try:
        ctx = build_access_context_for_user(
            str(user.id), str(user.email or ""), payload.tenant_id
        )
        project = _load_project(payload.tenant_id, payload.project_id)
        assert_project_access(ctx, project, Permission.EDIT)

        supabase_admin.table("records").delete().eq("tenant_id", payload.tenant_id).eq(
            "module_name", "tasks"
        ).eq("record_data->>project_id", payload.project_id).execute()

        if payload.tasks:
            inserts = [
                {
                    "tenant_id": payload.tenant_id,
                    "module_name": "tasks",
                    "record_data": t.model_dump(),
                }
                for t in payload.tasks
            ]
            supabase_admin.table("records").insert(inserts).execute()

        return {"status": "ok", "message": "Tasks synchronized successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
