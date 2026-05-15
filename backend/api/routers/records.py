from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from uuid import UUID

from core.database import supabase
from models.record import RecordCreate, RecordResponse

router = APIRouter(
    prefix="/api/records",
    tags=["Dynamic Records"]
)

@router.post("/", response_model=RecordResponse)
async def create_record(record: RecordCreate):
    """
    Create a new dynamic JSONB record for a specific tenant and module.
    """
    try:
        # model_dump(mode='json') safely converts UUIDs to strings for Supabase
        data = record.model_dump(mode='json')
        
        response = supabase.table("custom_records").insert(data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create record")
            
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[RecordResponse])
async def get_records(
    tenant_id: UUID = Query(..., description="Mandatory tenant ID for data isolation"),
    module_name: Optional[str] = Query(None, description="Optional module filter (e.g., 'fleet_vehicles')")
):
    """
    Fetch records securely. 
    A tenant_id is strictly required to prevent cross-tenant data leaks.
    """
    try:
        # Start building the Supabase query with the mandatory tenant filter
        query = supabase.table("custom_records").select("*").eq("tenant_id", str(tenant_id))
        
        # Add module filter if requested
        if module_name:
            query = query.eq("module_name", module_name)
            
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))