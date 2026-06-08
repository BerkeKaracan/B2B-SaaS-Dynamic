from fastapi import APIRouter, HTTPException, Query, Depends, Header
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
import time

from core.database import supabase
from models.record import RecordCreate, RecordUpdate, RecordResponse

router = APIRouter(
    prefix="/api/records",
    tags=["Dynamic Records"]
)

AUTH_CACHE = {}
CACHE_TTL_SECONDS = 300

def get_user_role(authorization: str = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    token = authorization.replace("Bearer ", "")
    current_time = time.time()
    
    if token in AUTH_CACHE:
        cached_data, timestamp = AUTH_CACHE[token]
        if current_time - timestamp < CACHE_TTL_SECONDS:
            return cached_data
            
    if len(AUTH_CACHE) > 1000:
        AUTH_CACHE.clear()

    try:
        from core.database import supabase, get_auth_client  
        
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")
            
        user_id = user_res.user.id
        email = str(user_res.user.email).lower().strip()
        full_name = email.split("@")[0]
        
        role_res = supabase.table("tenant_users").select("role, tenant_id").eq("user_id", user_id).execute()
        
        tenant_roles = {}
        if role_res.data:
            for row in role_res.data:
                tenant_roles[str(row.get("tenant_id"))] = row.get("role", "employee")
            
        if not tenant_roles:
            raise HTTPException(status_code=403, detail="User does not belong to any workspace")
            
        user_client = get_auth_client(token)
            
        result = {
            "user_id": user_id, 
            "full_name": full_name, 
            "email": email, 
            "tenant_roles": tenant_roles,
            "client": user_client  
        }
        
        AUTH_CACHE[token] = (result, current_time)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token or session expired")

@router.post("/", response_model=RecordResponse)
def create_record(record: RecordCreate, user: dict = Depends(get_user_role)):
    try:
        data = record.model_dump(mode='json')
        req_tenant = str(data.get("tenant_id"))
        
        if req_tenant not in user["tenant_roles"]:
            raise HTTPException(status_code=403, detail="You do not have permission to create records in this workspace.")
            
        if "record_data" not in data or not data["record_data"]:
            data["record_data"] = {}
            
        data["record_data"]["updated_at"] = datetime.now(timezone.utc).isoformat()
        data["record_data"]["updated_by"] = user["full_name"]
        data["record_data"]["owner_email"] = user["email"]
        data["record_data"]["collaborators"] = [{"email": user["email"], "role": "editor"}]

        response = user["client"].table("custom_records").insert(data).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create record")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[RecordResponse])
def get_records(
    tenant_id: UUID = Query(...), 
    module_name: Optional[str] = Query(None), 
    limit: int = Query(100, ge=1, le=1000), 
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_user_role)
):
    try:
        tenant_str = str(tenant_id)
        
        if tenant_str not in user["tenant_roles"]:
            raise HTTPException(status_code=403, detail="You do not have access to this workspace's records.")
            
        user_role = user["tenant_roles"][tenant_str]
        
        query = user["client"].table("custom_records").select("*").eq("tenant_id", tenant_str)
        if module_name:
            query = query.eq("module_name", module_name)
            
        response = query.execute()
        records = response.data

        final_records = records
        if user_role not in ["admin", "owner"]:
            filtered_records = []
            for record in records:
                record_data = record.get("record_data", {})
                visibility = record_data.get("visibility", "public")
                owner_email = str(record_data.get("owner_email", "")).lower().strip()
                
                collaborators = record_data.get("collaborators", [])
                is_collab = any(isinstance(c, dict) and str(c.get("email", "")).lower().strip() == user["email"] for c in collaborators)

                if visibility != "just_admin" or is_collab or owner_email == user["email"]:
                    filtered_records.append(record)
            final_records = filtered_records
        return final_records[offset : offset + limit]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{record_id}", response_model=RecordResponse)
def get_record(record_id: UUID, user: dict = Depends(get_user_role)):
    try:
        response = user["client"].table("custom_records").select("*").eq("id", str(record_id)).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Record not found")
            
        record = response.data[0]
        rec_tenant = str(record.get("tenant_id"))
        
        if rec_tenant not in user["tenant_roles"]:
            raise HTTPException(status_code=403, detail="Unauthorized to access this record")
            
        user_role = user["tenant_roles"][rec_tenant]
        record_data = record.get("record_data", {})
        visibility = record_data.get("visibility", "public")
        owner_email = str(record_data.get("owner_email", "")).lower().strip()
        
        collaborators = record_data.get("collaborators", [])
        is_collab = any(isinstance(c, dict) and str(c.get("email", "")).lower().strip() == user["email"] for c in collaborators)
        
        if user_role not in ["admin", "owner"] and owner_email != user["email"] and visibility == "just_admin" and not is_collab:
            raise HTTPException(status_code=403, detail="Forbidden: Admin only record")
            
        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{record_id}", response_model=RecordResponse)
def update_record(record_id: UUID, payload: RecordUpdate, user: dict = Depends(get_user_role)):
    try:
        existing_res = user["client"].table("custom_records").select("record_data, tenant_id").eq("id", str(record_id)).execute()
        if not existing_res.data:
            raise HTTPException(status_code=404, detail="Record not found")
            
        rec_tenant = str(existing_res.data[0].get("tenant_id"))
        
        if rec_tenant not in user["tenant_roles"]:
            raise HTTPException(status_code=403, detail="Unauthorized to modify this record")
            
        user_role = user["tenant_roles"][rec_tenant]
        current_record_data = existing_res.data[0].get("record_data", {})
        
        visibility = current_record_data.get("visibility", "public")
        collaborators = current_record_data.get("collaborators", [])
        owner_email = str(current_record_data.get("owner_email", "")).lower().strip()
       
        is_editor = any(isinstance(c, dict) and str(c.get("email", "")).lower().strip() == user["email"] and c.get("role") == "editor" for c in collaborators)

        if user_role not in ["admin", "owner"] and owner_email != user["email"]:
            if visibility == "just_admin" and not is_editor:
                raise HTTPException(status_code=403, detail="You do not have permission to modify this record.")

        payload_data = payload.record_data
        
        try:
            new_collabs = payload_data.get("collaborators", [])
            old_collabs = current_record_data.get("collaborators", [])
            
            old_emails = {str(c.get("email", "")).lower().strip() for c in old_collabs if isinstance(c, dict) and c.get("email")}
            added_collabs = [c for c in new_collabs if isinstance(c, dict) and c.get("email") and str(c.get("email", "")).lower().strip() not in old_emails]
            
            for collab in added_collabs:
                target_email = str(collab.get("email")).lower().strip()
                project_name = payload_data.get('name', payload_data.get('title', 'Untitled Canvas'))
                inviter = user['full_name']
                
                notification_payload = {
                    "target_email": target_email,
                    "type": "project_invite",
                    "title": "Project Invitation",
                    "message": f"{inviter} invited you to collaborate on '{project_name}'.",
                    "link": f"/dashboard/{rec_tenant}/projects/{str(record_id)}"
                }
                user["client"].table("notifications").insert(notification_payload).execute()
        except Exception as notif_err:
            print(f"Notification processing error: {notif_err}") 
        
        payload_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        payload_data["updated_by"] = user["full_name"]

        response = (user["client"].table("custom_records").update({"record_data": payload_data}).eq("id", str(record_id)).execute())
        if not response.data:
            raise HTTPException(status_code=404, detail="Record not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{record_id}")
def delete_record(record_id: UUID, user: dict = Depends(get_user_role)):
    try:
        res = user["client"].table("custom_records").select("tenant_id").eq("id", str(record_id)).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Record not found")
            
        rec_tenant = str(res.data[0]["tenant_id"])
        if rec_tenant not in user["tenant_roles"]:
            raise HTTPException(status_code=403, detail="Unauthorized")
            
        if user["tenant_roles"][rec_tenant] not in ["admin", "owner"]:
            raise HTTPException(status_code=403, detail="Only admins can permanently delete records.")
            
        response = user["client"].table("custom_records").delete().eq("id", str(record_id)).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Record not found")
        return {"message": "Record permanently deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))