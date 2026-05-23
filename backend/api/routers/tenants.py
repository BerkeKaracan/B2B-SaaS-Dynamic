from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr
from uuid import UUID

from core.database import supabase, supabase_admin 

router = APIRouter(
    prefix="/api/tenants",
    tags=["Tenants"],
)

class SetPasswordRequest(BaseModel):
    password: str

class UpdateTierRequest(BaseModel):
    tier: str

class InviteUserRequest(BaseModel):
    email: EmailStr
    role: str = "employee"

class UpdateRoleRequest(BaseModel):
    role: str

@router.get("/{tenant_id}")
def get_tenant(tenant_id: UUID):
    try:
        response = supabase.table("tenants").select("id, name, tier, created_at").eq("id", str(tenant_id)).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Workspace not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{tenant_id}/tier")
def update_tenant_tier(tenant_id: UUID, request: UpdateTierRequest):
    try:
        valid_tiers = ["basic", "advanced", "pro"]
        if request.tier not in valid_tiers:
            raise HTTPException(status_code=400, detail="Invalid tier")
        supabase.table("tenants").update({"tier": request.tier}).eq("id", str(tenant_id)).execute()
        return {"message": f"Plan upgraded to {request.tier.upper()}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{tenant_id}/team")
def get_tenant_members(tenant_id: UUID):
    try:
        response = supabase.table("tenant_users").select(
            "id, tenant_id, user_id, role, created_at"
        ).eq("tenant_id", str(tenant_id)).execute()

        members = []
        for row in response.data:
            uid = str(row.get("user_id"))
            email = "Pending..."
            
            try:
                user_data = supabase_admin.auth.admin.get_user_by_id(uid)
                if user_data and user_data.user and user_data.user.email:
                    email = user_data.user.email
            except Exception:
                pass
            
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
def invite_team_member(tenant_id: UUID, request: InviteUserRequest):
    try:
        tenant_res = supabase.table("tenants").select("tier").eq("id", str(tenant_id)).execute()
        if not tenant_res.data:
            raise HTTPException(status_code=404, detail="Workspace not found")
            
        raw_tier = tenant_res.data[0].get("tier")
        current_tier = raw_tier.lower() if raw_tier else "basic"
        if current_tier == "free":
            current_tier = "basic"
            
        team_res = supabase.table("tenant_users").select("id, user_id", count="exact").eq("tenant_id", str(tenant_id)).execute()
        current_seat_count = team_res.count if team_res.count is not None else len(team_res.data)
        
        limits = {"basic": 3, "advanced": 50, "pro": float('inf')}
        limit = limits.get(current_tier, 3)
        
        FRONTEND_URL = "https://b2-b-saa-s-dynamic.vercel.app"
        redirect_url = f"{FRONTEND_URL}/accept-invite?tenant_id={tenant_id}"

        for member in team_res.data:
            uid = str(member.get("user_id"))
            try:
                user_data = supabase_admin.auth.admin.get_user_by_id(uid)
                if user_data and user_data.user and user_data.user.email == request.email:
                    supabase_admin.auth.admin.invite_user_by_email(
                        request.email,
                        options={"redirect_to": redirect_url}
                    )
                    return {"message": "User is already in the workspace. Invitation resent."}
            except Exception:
                continue

        if current_seat_count >= limit:
            raise HTTPException(status_code=403, detail=f"Seat limit reached for {current_tier.upper()} plan. Maximum {limit} members allowed.")
        
        auth_res = supabase_admin.auth.admin.invite_user_by_email(
            request.email,
            options={"redirect_to": redirect_url}
        )
        
        if not auth_res.user:
            raise HTTPException(status_code=400, detail="Could not invite user.")

        real_user_id = auth_res.user.id

        existing_user = supabase.table("tenant_users").select("id").eq("tenant_id", str(tenant_id)).eq("user_id", real_user_id).execute()
        
        if not existing_user.data:
            new_member = {
                "tenant_id": str(tenant_id),
                "user_id": real_user_id,
                "role": request.role
            }
            supabase.table("tenant_users").insert(new_member).execute()
        
        return {"message": "Invitation email sent successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/set-password")
def set_password(request: SetPasswordRequest, authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş davet linki.")

        uid = user_res.user.id
        
        response = supabase_admin.auth.admin.update_user_by_id(
            uid,
            {"password": request.password, "email_confirm": True}
        )
        
        return {"message": "Password set successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{tenant_id}/team/{member_id}")
def remove_member(tenant_id: UUID, member_id: UUID):
    try:
        supabase.table("tenant_users").delete().eq("id", str(member_id)).eq("tenant_id", str(tenant_id)).execute()
        return {"message": "Member removed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{tenant_id}/team/{member_id}")
def update_member_role(tenant_id: UUID, member_id: UUID, request: UpdateRoleRequest):
    try:
        supabase.table("tenant_users").update({"role": request.role}).eq("id", str(member_id)).eq("tenant_id", str(tenant_id)).execute()
        return {"message": "Role updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))