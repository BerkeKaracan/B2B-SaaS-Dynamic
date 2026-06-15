from fastapi import APIRouter, HTTPException, Query
from uuid import UUID
import json
import traceback

from core.database import supabase, supabase_admin

router = APIRouter(
    prefix="/api/public",
    tags=["Public Share"]
)

def sanitize_public_record(record: dict) -> dict:
    raw_data = record.get("record_data", {})
    
    if isinstance(raw_data, str):
        try:
            raw_data = json.loads(raw_data)
        except:
            raw_data = {}
            
    if not isinstance(raw_data, dict):
        raw_data = {}
        
    safe_data = raw_data.copy()
    safe_data.pop("owner_email", None)
    safe_data.pop("collaborators", None)
    safe_data.pop("api_keys", None) 
    
    record["record_data"] = safe_data
    return record

@router.get("/records")
def get_public_records(limit: int = Query(8, ge=1, le=20)):
    try:
        response = supabase_admin.table("custom_records")\
            .select("id, tenant_id, module_name, record_data")\
            .eq("record_data->>is_global_shared", "true")\
            .limit(limit)\
            .execute()
            
        if not response.data:
            return []
            
        return [sanitize_public_record(record) for record in response.data]
        
    except Exception as e:
        print(f"Public Records List Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch public frameworks")

@router.get("/records/{record_id}")
def get_public_record_by_id(record_id: UUID):
    try:
        response = supabase_admin.table("custom_records")\
            .select("id, tenant_id, module_name, record_data")\
            .eq("id", str(record_id))\
            .execute()
            
        if not response.data:
            raise HTTPException(status_code=404, detail="Framework not found")
            
        record = response.data[0]
        record_data = record.get("record_data", {})
        
        if isinstance(record_data, str):
            try:
                record_data = json.loads(record_data)
            except:
                record_data = {}
        elif not isinstance(record_data, dict):
            record_data = {}
        
        is_global = str(record_data.get("is_global_shared", "false")).lower()
        
        if is_global != "true":
            raise HTTPException(status_code=403, detail="This framework is not publicly shared.")
            
        return sanitize_public_record(record)
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"CRITICAL ERROR in get_public_record_by_id: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Database or Parsing Error: {str(e)}")