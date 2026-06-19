from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from core.database import supabase 

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

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
async def get_my_tasks(tenant_id: str, email: str):
    try:
        response = supabase.table("records") \
            .select("*") \
            .eq("tenant_id", tenant_id) \
            .eq("module_name", "tasks") \
            .execute()
        
        data = response.data
        filtered_tasks = [
            t for t in data 
            if t.get("record_data", {}).get("assigned_to", "").lower() == email.lower()
        ]
        return filtered_tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync")
async def sync_tasks(payload: SyncRequest):
    try:
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))