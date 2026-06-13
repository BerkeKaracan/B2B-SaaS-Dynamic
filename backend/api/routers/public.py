from fastapi import APIRouter, HTTPException, Query
from uuid import UUID
import uuid

from core.database import supabase, supabase_admin
from models.record import RecordResponse

router = APIRouter(
    prefix="/api/public",
    tags=["Public Share"]
)

def sanitize_public_record(record: dict) -> dict:
    if "record_data" in record and isinstance(record["record_data"], dict):
        safe_data = record["record_data"].copy()
        
        safe_data.pop("owner_email", None)
        safe_data.pop("collaborators", None)
        safe_data.pop("api_keys", None) 
        
        record["record_data"] = safe_data
    return record

@router.get("/records")
def get_public_records(limit: int = Query(8, ge=1, le=20)):
    try:
        response = supabase_admin.table("custom_records")\
            .select("id, tenant_id, module_name, record_data, created_at")\
            .eq("record_data->>visibility", "public")\
            .neq("record_data->>template", "blank")\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
            
        if not response.data:
            return []
            
        return [sanitize_public_record(record) for record in response.data]
        
    except Exception as e:
        print(f"Public Records Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch public frameworks")

@router.get("/records/{record_id}")
def get_public_record_by_id(record_id: UUID):
    try:
        response = supabase_admin.table("custom_records")\
            .select("id, tenant_id, module_name, record_data, created_at, updated_at")\
            .eq("id", str(record_id))\
            .execute()
            
        if not response.data:
            raise HTTPException(status_code=404, detail="Framework not found")
            
        record = response.data[0]
        record_data = record.get("record_data", {})
        
        if record_data.get("visibility") != "public":
            raise HTTPException(status_code=403, detail="This framework is private or restricted.")
            
        return sanitize_public_record(record)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))