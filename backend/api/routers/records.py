from fastapi import APIRouter, HTTPException, Query, Depends, Header
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from core.database import supabase
from models.record import RecordCreate, RecordUpdate, RecordResponse

router = APIRouter(
    prefix="/api/records",
    tags=["Dynamic Records"]
)

def get_user_role(authorization: str = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    try:
        token = authorization.replace("Bearer ", "")
        user_res = supabase.auth.get_user(token)
        
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")
            
        user_id = user_res.user.id
        email = user_res.user.email
        full_name = email.split("@")[0]
        role = "employee"
        role_res = supabase.table("tenant_users").select("role").eq("user_id", user_id).execute()
        if role_res.data:
            role = role_res.data[0].get("role", "employee")
            
        return {"user_id": user_id, "role": role, "full_name": full_name}
    except Exception as e:
        print(f"Auth Error: {str(e)}") # Konsola gerçek hatayı bas
        raise HTTPException(status_code=401, detail="Invalid token or session expired")


@router.post("/", response_model=RecordResponse)
def create_record(
    record: RecordCreate,
    user: dict = Depends(get_user_role)
):
    try:
        data = record.model_dump(mode='json')
        
        if "record_data" not in data or not data["record_data"]:
            data["record_data"] = {}
            
        data["record_data"]["updated_at"] = datetime.now(timezone.utc).isoformat()
        data["record_data"]["updated_by"] = user["full_name"]

        response = supabase.table("custom_records").insert(data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create record")
            
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[RecordResponse])
def get_records(
    tenant_id: UUID = Query(..., description="Mandatory tenant ID for data isolation"),
    module_name: Optional[str] = Query(None, description="Optional module filter (e.g., 'fleet_vehicles')"),
    user: dict = Depends(get_user_role)
):
    try:
        query = supabase.table("custom_records").select("*").eq("tenant_id", str(tenant_id))
        
        if module_name:
            query = query.eq("module_name", module_name)
            
        response = query.execute()
        records = response.data

        if user["role"] not in ["admin", "owner"]:
            filtered_records = []
            for record in records:
                record_data = record.get("record_data", {})
                visibility = record_data.get("visibility", "public")

                if visibility != "just_admin":
                    filtered_records.append(record)
            return filtered_records
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{record_id}", response_model=RecordResponse)
def get_record(
    record_id: UUID,
    user: dict = Depends(get_user_role)
):
    try:
        response = supabase.table("custom_records").select("*").eq("id", str(record_id)).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Record not found")
            
        record = response.data[0]
        record_data = record.get("record_data", {})
        visibility = record_data.get("visibility", "public")
        
        if user["role"] not in ["admin", "owner"] and visibility == "just_admin":
            raise HTTPException(status_code=403, detail="Forbidden: Admin only record")
            
        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{record_id}", response_model=RecordResponse)
def update_record(
    record_id: UUID, 
    payload: RecordUpdate,
    user: dict = Depends(get_user_role)
):
    try:
        existing_res = supabase.table("custom_records").select("record_data").eq("id", str(record_id)).execute()
        if not existing_res.data:
            raise HTTPException(status_code=404, detail="Record not found")
            
        current_record_data = existing_res.data[0].get("record_data", {})

        if user["role"] not in ["admin", "owner"]:
            if current_record_data.get("visibility") == "just_admin":
                raise HTTPException(status_code=403, detail="You do not have permission to modify an Admin Only record.")

        payload_data = payload.record_data
        payload_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        payload_data["updated_by"] = user["full_name"]

        response = (
            supabase.table("custom_records")
            .update({"record_data": payload_data})
            .eq("id", str(record_id))
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Record not found")

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{record_id}")
def delete_record(
    record_id: UUID,
    user: dict = Depends(get_user_role)
):
    try:
        if user["role"] not in ["admin", "owner"]:
            raise HTTPException(status_code=403, detail="Only admins can permanently delete records.")

        response = supabase.table("custom_records").delete().eq("id", str(record_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Record not found")
            
        return {"message": "Record permanently deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))