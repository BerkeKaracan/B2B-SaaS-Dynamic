from fastapi import APIRouter, HTTPException, Query
from uuid import UUID
import uuid

from core.database import supabase
from models.record import RecordResponse

router = APIRouter(
    prefix="/api/public",
    tags=["Public Share"]
)

@router.get("/records")
def get_public_records(limit: int = Query(8, ge=1, le=20)):
    try:
        response = supabase.table("custom_records").select("*") \
            .eq("record_data->>is_global_public", "true") \
            .limit(limit) \
            .execute()
        
        records = response.data
        active_records = [
            r for r in records 
            if r.get("record_data", {}).get("status") != "archived"
        ]
        
        return active_records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/records/{record_id}", response_model=RecordResponse)
def get_public_record(record_id: str):
    try:
        try:
            valid_uuid = uuid.UUID(record_id, version=4)
        except ValueError:
            raise HTTPException(status_code=404, detail="Workspace not found")

        response = supabase.table("custom_records").select("*").eq("id", str(valid_uuid)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Workspace not found")
            
        record = response.data[0]
        record_data = record.get("record_data", {})
        
        is_global = record_data.get("is_global_public")
        
        if str(is_global).lower() != "true":
            raise HTTPException(status_code=403, detail="Forbidden: This workspace is not shared globally.")
            
        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))