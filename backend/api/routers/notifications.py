from fastapi import APIRouter, HTTPException, Depends, Header
from core.database import supabase, supabase_admin 

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"]
)

def get_current_user_email(authorization: str = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    try:
        token = authorization.replace("Bearer ", "")
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")
        return str(user_res.user.email).lower().strip()
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("")
def get_my_notifications(email: str = Depends(get_current_user_email)):
    try:
        response = supabase_admin.table("notifications").select("*") \
            .eq("target_email", email) \
            .order("created_at", desc=True) \
            .limit(20) \
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{notification_id}/read")
def mark_as_read(notification_id: str, email: str = Depends(get_current_user_email)):
    try:
        supabase_admin.table("notifications").update({"is_read": True}) \
            .eq("id", notification_id) \
            .eq("target_email", email) \
            .execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/read-all")
def mark_all_as_read(email: str = Depends(get_current_user_email)):
    try:
        supabase_admin.table("notifications").update({"is_read": True}) \
            .eq("target_email", email) \
            .eq("is_read", False) \
            .execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))