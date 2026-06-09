from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, EmailStr
from uuid import UUID
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

class UpdateRoleRequest(BaseModel):
    role: str

@router.get("/{tenant_id}")
def get_tenant(tenant_id: UUID, user: dict = Depends(get_user_role)):
    try:
        if str(tenant_id) not in user["tenant_roles"]:
            raise HTTPException(status_code=403, detail="Workspace access denied")
        response = user["client"].table("tenants").select("id, name, tier, created_at").eq("id", str(tenant_id)).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Workspace not found")
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

@router.get("/{tenant_id}/team")
def get_tenant_members(tenant_id: UUID, user: dict = Depends(get_user_role)):
    try:
        if str(tenant_id) not in user["tenant_roles"]:
            raise HTTPException(status_code=403, detail="Workspace access denied")
        response = supabase_admin.table("tenant_users").select(
            "id, tenant_id, user_id, role, email, created_at"
        ).eq("tenant_id", str(tenant_id)).execute()

        missing_email_uids = [str(row.get("user_id")) for row in response.data if not row.get("email")]
        user_email_map = {}
        
        if missing_email_uids:
            try:
                users_list = supabase_admin.auth.admin.list_users()
                users = getattr(users_list, 'users', users_list)
                for u in users:
                    if u.id in missing_email_uids:
                        user_email_map[u.id] = u.email
            except Exception as e:
                print(f"List users error: {e}")

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
            
        raw_tier = tenant_res.data[0].get("tier")
        current_tier = raw_tier.lower() if raw_tier else "basic"
        if current_tier == "free":
            current_tier = "basic"
            
        team_res = supabase_admin.table("tenant_users").select("id, user_id", count="exact").eq("tenant_id", str(tenant_id)).execute()
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
        try:
            users_list = supabase_admin.auth.admin.list_users()
            users = getattr(users_list, 'users', users_list) 
            for u in users:
                if u.email == request_email:
                    real_user_id = u.id
                    break
        except Exception as e:
            print(f"List users error: {e}")

        if real_user_id:
            pass
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
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş davet linki. Lütfen yeni bir davet isteyin.")

@router.delete("/{tenant_id}/team/{member_id}")
def remove_member(tenant_id: UUID, member_id: UUID, user: dict = Depends(get_user_role)):
    try:
        current_role = user["tenant_roles"].get(str(tenant_id), "").lower()
        if current_role not in ["admin", "owner"]:
            raise HTTPException(status_code=403, detail="Unauthorized: Only admins and owners can remove members")
            
        supabase_admin.table("tenant_users").delete().eq("id", str(member_id)).eq("tenant_id", str(tenant_id)).execute()
        return {"message": "Member removed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{tenant_id}/team/{member_id}")
def update_member_role(tenant_id: UUID, member_id: UUID, request: UpdateRoleRequest, user: dict = Depends(get_user_role)):
    try:
        current_role = user["tenant_roles"].get(str(tenant_id), "").lower()
        if current_role not in ["admin", "owner"]:
            raise HTTPException(status_code=403, detail="Unauthorized: Only admins and owners can update roles")
            
        supabase_admin.table("tenant_users").update({"role": request.role}).eq("id", str(member_id)).eq("tenant_id", str(tenant_id)).execute()
        return {"message": "Role updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))