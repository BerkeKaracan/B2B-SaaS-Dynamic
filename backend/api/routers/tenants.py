from fastapi import APIRouter, HTTPException, Header, Depends, UploadFile, File
from pydantic import BaseModel, EmailStr
from uuid import UUID
import uuid
from typing import Optional

from core.database import supabase, supabase_admin, get_auth_client
from api.routers.records import get_user_role

router = APIRouter(
    prefix="/api/tenants",
    tags=["Tenants"],
)

class SetPasswordRequest(BaseModel):
    password: str
    token: Optional[str] = None
    type: Optional[str] = "access_token"

class UpdateTierRequest(BaseModel):
    tier: str

class InviteUserRequest(BaseModel):
    email: EmailStr
    role: str = "employee"

class UpdateTeamMemberRequest(BaseModel):
    role: Optional[str] = None
    department_id: Optional[str] = None
    custom_role_id: Optional[str] = None

class UpdateTenantRequest(BaseModel):
    name: str
    timezone: Optional[str] = "UTC"
    date_format: Optional[str] = "YYYY-MM-DD"

class TransferOwnershipRequest(BaseModel):
    new_owner_member_id: UUID

class CreateDepartmentRequest(BaseModel):
    name: str

class CreateRoleRequest(BaseModel):
    name: str

@router.get("/{tenant_id}")
def get_tenant(tenant_id: UUID, user: dict = Depends(get_user_role)):
    try:
        if str(tenant_id) not in user["tenant_roles"]:
            raise HTTPException(status_code=403, detail="Workspace access denied")
        response = user["client"].table("tenants").select("id, name, tier, logo_url, timezone, date_format, slug, created_at, usage_type").eq("id", str(tenant_id)).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Workspace not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/by-slug/{slug}")
def get_tenant_by_slug(slug: str):
    try:
        response = supabase_admin.table("tenants").select("id").eq("slug", slug).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Workspace not found for this slug")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{tenant_id}/tier")
def update_tenant_tier(tenant_id: UUID, request: UpdateTierRequest, user: dict = Depends(get_user_role)):
    try:
        current_role = user["tenant_roles"].get(str(tenant_id), "").lower()
        if current_role not in ["admin", "owner"]:
            raise HTTPException(status_code=403, detail="Unauthorized")
            
        valid_tiers = ["basic", "advanced", "pro"]
        if request.tier not in valid_tiers:
            raise HTTPException(status_code=400, detail="Invalid tier")
            
        supabase_admin.table("tenants").update({"tier": request.tier}).eq("id", str(tenant_id)).execute()
        return {"message": f"Plan upgraded to {request.tier.upper()}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{tenant_id}/logo")
async def upload_workspace_logo(tenant_id: UUID, file: UploadFile = File(...), user: dict = Depends(get_user_role)):
    try:
        current_role = user["tenant_roles"].get(str(tenant_id), "").lower()
        if current_role not in ["admin", "owner"]:
            raise HTTPException(status_code=403, detail="Unauthorized to upload logo")
        
        valid_content_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if file.content_type not in valid_content_types:
            raise HTTPException(status_code=400, detail="Invalid file format. Only JPG, PNG, WEBP and GIF are allowed.")

        file_bytes = await file.read()
        if len(file_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
            
        file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else "png"
        file_name = f"{tenant_id}_{uuid.uuid4().hex}.{file_ext}"
        
        supabase_admin.storage.from_("workspace_assets").upload(
            path=file_name,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
        
        public_url = supabase_admin.storage.from_("workspace_assets").get_public_url(file_name)
        supabase_admin.table("tenants").update({"logo_url": public_url}).eq("id", str(tenant_id)).execute()
        
        return {"logo_url": public_url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{tenant_id}/team")
def get_tenant_members(tenant_id: UUID, user: dict = Depends(get_user_role)):
    try:
        if str(tenant_id) not in user["tenant_roles"]:
            raise HTTPException(status_code=403, detail="Workspace access denied")
        
        response = supabase_admin.table("tenant_users").select(
            "id, tenant_id, user_id, role, department_id, custom_role_id, email, created_at"
        ).eq("tenant_id", str(tenant_id)).execute()

        missing_email_uids = [str(row.get("user_id")) for row in response.data if not row.get("email")]
        user_email_map = {}
        
        if missing_email_uids:
            for uid in missing_email_uids:
                try:
                    user_data = supabase_admin.auth.admin.get_user_by_id(uid)
                    if user_data and user_data.user:
                        user_email_map[uid] = user_data.user.email
                except Exception as e:
                    print(f"Failed to fetch email for {uid}: {e}")

        members = []
        for row in response.data:
            uid = str(row.get("user_id"))
            email = row.get("email")
            
            if not email:
                email = user_email_map.get(uid, "Pending...")
            
            members.append({
                "id": str(row.get("id")),
                "tenant_id": str(row.get("tenant_id")),
                "user_id": uid,
                "role": row.get("role"),
                "department_id": row.get("department_id"),
                "custom_role_id": row.get("custom_role_id"),
                "created_at": row.get("created_at"),
                "email": email 
            })
            
        return members
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{tenant_id}/team")
def invite_team_member(tenant_id: UUID, request: InviteUserRequest, user: dict = Depends(get_user_role)):
    try:
        current_role = user["tenant_roles"].get(str(tenant_id), "").lower()
        if current_role not in ["admin", "owner"]:
            raise HTTPException(status_code=403, detail="Only admins and owners can invite members")

        tenant_res = user["client"].table("tenants").select("tier").eq("id", str(tenant_id)).execute()
        if not tenant_res.data:
            raise HTTPException(status_code=404, detail="Workspace not found")
            
        current_tier = (tenant_res.data[0].get("tier") or "basic").lower()
        if current_tier == "free":
            current_tier = "basic"
            
        team_res = supabase_admin.table("tenant_users").select("id", count="exact").eq("tenant_id", str(tenant_id)).execute()
        current_seat_count = team_res.count if team_res.count is not None else len(team_res.data)
        
        limits = {"basic": 3, "advanced": 50, "pro": float('inf')}
        limit = limits.get(current_tier, 3)
        
        request_email = request.email.lower().strip()
        
        if request_email == user["email"]:
            return {"message": "You are already a member of this workspace."}
            
        existing_member = supabase_admin.table("tenant_users").select("id").eq("tenant_id", str(tenant_id)).eq("email", request_email).execute()
        if existing_member.data:
            return {"message": "User is already in this workspace."}
            
        if current_seat_count >= limit:
            raise HTTPException(status_code=403, detail=f"Seat limit reached for {current_tier.upper()} plan.")

        real_user_id = None
        existing_user_query = supabase_admin.table("tenant_users").select("user_id").eq("email", request_email).limit(1).execute()
        if existing_user_query.data:
            real_user_id = existing_user_query.data[0]["user_id"]
        else:
            FRONTEND_URL = "https://b2-b-saa-s-dynamic.vercel.app"
            redirect_url = f"{FRONTEND_URL}/accept-invite?tenant_id={tenant_id}"
            auth_res = supabase_admin.auth.admin.invite_user_by_email(
                request_email,
                options={"redirect_to": redirect_url}
            )
            if not auth_res.user:
                raise HTTPException(status_code=400, detail="Could not invite user.")
            real_user_id = auth_res.user.id

        new_member = {
            "tenant_id": str(tenant_id),
            "user_id": real_user_id,
            "email": request_email,
            "role": request.role
        }
        supabase_admin.table("tenant_users").insert(new_member).execute()
        
        try:
            notification_payload = {
                "target_email": request_email,
                "type": "invite", 
                "title": "New Workspace Access",
                "message": f"You have been added to a new workspace by {user['full_name']}.",
                "action_url": f"/dashboard/{tenant_id}"
            }
            supabase_admin.table("notifications").insert(notification_payload).execute()
        except Exception as notif_err:
            print(f"Notification error: {notif_err}")
        
        return {"message": "User successfully added to workspace."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/set-password")
def set_password(request: SetPasswordRequest, authorization: str = Header(None)):
    try:
        extracted_token = request.token
        if not extracted_token and authorization:
            extracted_token = authorization.replace("Bearer ", "")
            
        if not extracted_token:
            raise HTTPException(status_code=400, detail="Token is missing")

        session_token = extracted_token

        if request.type == "code":
            auth_res = supabase.auth.exchange_code_for_session(extracted_token)
            if auth_res and auth_res.session:
                session_token = auth_res.session.access_token
        elif request.type == "token_hash":
            auth_res = supabase.auth.verify_otp({"token_hash": extracted_token, "type": "invite"})
            if auth_res and auth_res.session:
                session_token = auth_res.session.access_token

        user_client = get_auth_client(session_token)
        update_res = user_client.auth.update_user({"password": request.password})
        
        if not update_res.user:
            raise Exception("Failed to update user password")

        return {"message": "Password set successfully", "access_token": session_token}

    except Exception as e:
        print(f"Set password error: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired invite link.")

@router.delete("/{tenant_id}/team/{member_id}")
def remove_member(tenant_id: UUID, member_id: UUID, user: dict = Depends(get_user_role)):
    try:
        current_role = user["tenant_roles"].get(str(tenant_id), "").lower()
        if current_role not in ["admin", "owner"]:
            raise HTTPException(status_code=403, detail="Unauthorized: Only admins and owners can remove members")
            
        target_user = supabase_admin.table("tenant_users").select("role").eq("id", str(member_id)).eq("tenant_id", str(tenant_id)).execute()
        if target_user.data and target_user.data[0].get("role", "").lower() == "owner":
            raise HTTPException(status_code=403, detail="Cannot remove the workspace owner. Transfer ownership first.")
            
        supabase_admin.table("tenant_users").delete().eq("id", str(member_id)).eq("tenant_id", str(tenant_id)).execute()
        return {"message": "Member removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{tenant_id}/team/{member_id}")
def update_team_member(tenant_id: UUID, member_id: UUID, request: UpdateTeamMemberRequest, user: dict = Depends(get_user_role)):
    try:
        current_role = user["tenant_roles"].get(str(tenant_id), "").lower()
        if current_role not in ["admin", "owner"]:
            raise HTTPException(status_code=403, detail="Unauthorized: Only admins and owners can update roles")
            
        if request.role and request.role.lower() == "owner":
            raise HTTPException(status_code=400, detail="Cannot assign 'owner' role directly. Use transfer ownership instead.")

        target_user = supabase_admin.table("tenant_users").select("role").eq("id", str(member_id)).eq("tenant_id", str(tenant_id)).execute()
        if target_user.data and target_user.data[0].get("role", "").lower() == "owner":
            raise HTTPException(status_code=403, detail="Cannot modify the role of the workspace owner.")
            
        provided_data = request.model_dump(exclude_unset=True)
        if not provided_data:
            return {"message": "No data to update"}

        update_data = {}
        for key, value in provided_data.items():
            update_data[key] = None if value == "" else value
            
        supabase_admin.table("tenant_users").update(update_data).eq("id", str(member_id)).eq("tenant_id", str(tenant_id)).execute()
        return {"message": "Member updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.patch("/{tenant_id}")
def update_tenant(tenant_id: UUID, request: UpdateTenantRequest, user: dict = Depends(get_user_role)):
    try:
        current_role = user["tenant_roles"].get(str(tenant_id), "").lower()
        if current_role not in ["admin", "owner"]:
            raise HTTPException(status_code=403, detail="Unauthorized: Only admins and owners can rename workspace")
            
        supabase_admin.table("tenants").update({
            "name": request.name,
            "timezone": request.timezone,
            "date_format": request.date_format
        }).eq("id", str(tenant_id)).execute()
        return {"message": "Workspace renamed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{tenant_id}/transfer-ownership")
def transfer_ownership(tenant_id: UUID, request: TransferOwnershipRequest, user: dict = Depends(get_user_role)):
    try:
        current_role = user["tenant_roles"].get(str(tenant_id), "").lower()
        if current_role != "owner":
            raise HTTPException(status_code=403, detail="Unauthorized: Only the current owner can transfer ownership")
            
        target_member = supabase_admin.table("tenant_users").select("id, role").eq("id", str(request.new_owner_member_id)).eq("tenant_id", str(tenant_id)).execute()
        
        if not target_member.data:
            raise HTTPException(status_code=404, detail="Target member not found in this workspace")
            
        if target_member.data[0].get("role", "").lower() == "owner":
            raise HTTPException(status_code=400, detail="Target user is already the owner")

        supabase_admin.table("tenant_users").update({"role": "admin"}).eq("tenant_id", str(tenant_id)).eq("role", "owner").execute()
        supabase_admin.table("tenant_users").update({"role": "owner"}).eq("id", str(request.new_owner_member_id)).eq("tenant_id", str(tenant_id)).execute()

        return {"message": "Ownership transferred successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{tenant_id}")
def delete_tenant(tenant_id: UUID, user: dict = Depends(get_user_role)):
    try:
        current_role = user["tenant_roles"].get(str(tenant_id), "").lower()
        if current_role != "owner":
            raise HTTPException(status_code=403, detail="Unauthorized: Only the owner can delete the workspace")
            
        supabase_admin.table("tenants").delete().eq("id", str(tenant_id)).execute()
        return {"message": "Workspace deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ORGANIZATION: DEPARTMENTS & CUSTOM ROLES
# ==========================================

# --- DEPARTMENTS ---
@router.get("/{tenant_id}/departments")
def get_departments(tenant_id: UUID, user: dict = Depends(get_user_role)):
    try:
        if str(tenant_id) not in user["tenant_roles"]:
            raise HTTPException(status_code=403, detail="Workspace access denied")
        
        response = supabase_admin.table("departments").select("id, name, created_at").eq("tenant_id", str(tenant_id)).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{tenant_id}/departments")
def create_department(tenant_id: UUID, request: CreateDepartmentRequest, user: dict = Depends(get_user_role)):
    try:
        current_role = user["tenant_roles"].get(str(tenant_id), "").lower()
        if current_role not in ["admin", "owner"]:
            raise HTTPException(status_code=403, detail="Only admins and owners can create departments")
            
        new_dept = {
            "tenant_id": str(tenant_id),
            "name": request.name
        }
        response = supabase_admin.table("departments").insert(new_dept).execute()
        return response.data[0] if response.data else {"message": "Department created"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{tenant_id}/departments/{department_id}")
def delete_department(tenant_id: UUID, department_id: UUID, user: dict = Depends(get_user_role)):
    try:
        current_role = user["tenant_roles"].get(str(tenant_id), "").lower()
        if current_role not in ["admin", "owner"]:
            raise HTTPException(status_code=403, detail="Only admins and owners can delete departments")
            
        supabase_admin.table("departments").delete().eq("id", str(department_id)).eq("tenant_id", str(tenant_id)).execute()
        return {"message": "Department deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- CUSTOM ROLES ---
@router.get("/{tenant_id}/roles")
def get_custom_roles(tenant_id: UUID, user: dict = Depends(get_user_role)):
    try:
        if str(tenant_id) not in user["tenant_roles"]:
            raise HTTPException(status_code=403, detail="Workspace access denied")
        
        response = supabase_admin.table("custom_roles").select("id, name, created_at").eq("tenant_id", str(tenant_id)).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{tenant_id}/roles")
def create_custom_role(tenant_id: UUID, request: CreateRoleRequest, user: dict = Depends(get_user_role)):
    try:
        current_role = user["tenant_roles"].get(str(tenant_id), "").lower()
        if current_role not in ["admin", "owner"]:
            raise HTTPException(status_code=403, detail="Only admins and owners can create roles")
            
        new_role = {
            "tenant_id": str(tenant_id),
            "name": request.name
        }
        response = supabase_admin.table("custom_roles").insert(new_role).execute()
        return response.data[0] if response.data else {"message": "Role created"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{tenant_id}/roles/{role_id}")
def delete_custom_role(tenant_id: UUID, role_id: UUID, user: dict = Depends(get_user_role)):
    try:
        current_role = user["tenant_roles"].get(str(tenant_id), "").lower()
        if current_role not in ["admin", "owner"]:
            raise HTTPException(status_code=403, detail="Only admins and owners can delete roles")
            
        supabase_admin.table("custom_roles").delete().eq("id", str(role_id)).eq("tenant_id", str(tenant_id)).execute()
        return {"message": "Role deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))