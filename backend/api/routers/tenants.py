from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from uuid import UUID
import uuid

from core.database import supabase

router = APIRouter(
    prefix="/api/tenants",
    tags=["Tenants"],
)

class UpdateTierRequest(BaseModel):
    tier: str

class InviteUserRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = "employee"

@router.get("/{tenant_id}")
def get_tenant(tenant_id: UUID):
    try:
        response = (
            supabase.table("tenants")
            .select("id, name, tier, created_at")
            .eq("id", str(tenant_id))
            .execute()
        )
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
def get_team_members(tenant_id: UUID):
    try:
        response = supabase.table("tenant_users").select("*").eq("tenant_id", str(tenant_id)).execute()
        return response.data
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
            raise HTTPException(status_code=403, detail=f"Seat limit reached for {current_tier.upper()} plan. Upgrade to add more.")

        auth_res = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {"full_name": "Team Member"}
            }
        })

        if not auth_res.user:
            raise HTTPException(status_code=400, detail="Could not create user account. Maybe email already exists.")
            
        real_user_id = auth_res.user.id
        new_member = {
            "tenant_id": str(tenant_id),
            "user_id": real_user_id,
            "role": request.role
        }
        supabase.table("tenant_users").insert(new_member).execute()
        
        return {"message": "Team member added successfully"}
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
