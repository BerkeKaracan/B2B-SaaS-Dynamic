from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from uuid import UUID

from core.database import supabase, supabase_admin 

router = APIRouter(
    prefix="/api/tenants",
    tags=["Tenants"],
)

class UpdateTierRequest(BaseModel):
    tier: str

class InviteUserRequest(BaseModel):
    email: EmailStr
    role: str = "employee"

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
    """
    Fetches all members of a specific tenant and joins with the users table 
    to retrieve their actual email addresses using Supabase native join.
    """
    try:
        response = supabase.table("tenant_users").select(
            "id, tenant_id, user_id, role, created_at, users(email)"
        ).eq("tenant_id", str(tenant_id)).execute()

        members = []
        for row in response.data:
            user_data = row.get("users") or {}
            
            members.append({
                "id": str(row.get("id")),
                "tenant_id": str(row.get("tenant_id")),
                "user_id": str(row.get("user_id")),
                "role": row.get("role"),
                "created_at": row.get("created_at"),
                "email": user_data.get("email") 
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
            
        current_tier = tenant_res.data[0].get("tier", "basic")
        team_res = supabase.table("tenant_users").select("id", count="exact").eq("tenant_id", str(tenant_id)).execute()
        current_seat_count = team_res.count if team_res.count else 0
        
        limits = {"basic": 3, "advanced": 50, "pro": float('inf')}
        if current_seat_count >= limits[current_tier]:
            raise HTTPException(status_code=403, detail=f"Seat limit reached for {current_tier.upper()} plan.")
        FRONTEND_URL = "https://b2-b-saa-s-dynamic.vercel.app"

        redirect_url = f"{FRONTEND_URL}/dashboard/{tenant_id}"

        auth_res = supabase_admin.auth.admin.invite_user_by_email(
            request.email,
            options={"redirect_to": redirect_url}
        )
        
        if not auth_res.user:
            raise HTTPException(status_code=400, detail="Could not invite user.")

        real_user_id = auth_res.user.id
            
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

@router.delete("/{tenant_id}/team/{member_id}")
def remove_team_member(tenant_id: UUID, member_id: UUID):
    try:
        supabase.table("tenant_users").delete().eq("id", str(member_id)).eq("tenant_id", str(tenant_id)).execute()
        return {"message": "Team member removed. Seat is available."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))