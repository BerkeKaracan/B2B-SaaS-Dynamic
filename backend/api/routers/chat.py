from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from uuid import UUID
import logging
from core.database import supabase_admin
from api.routers.records import get_user_role

router = APIRouter(prefix="/api/chat", tags=["Chat"])
logger = logging.getLogger(__name__)

class ChatMessage(BaseModel):
    content: str

@router.get("/{tenant_id}")
def get_messages(tenant_id: UUID, limit: int = 50, user: dict = Depends(get_user_role)):
    try:
        if str(tenant_id) not in user["tenant_roles"]:
            raise HTTPException(status_code=403, detail="Unauthorized")
            
        res = supabase_admin.table("team_messages").select("*").eq("tenant_id", str(tenant_id)).order("created_at", desc=True).limit(limit).execute()
        return res.data[::-1] 
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to load chat messages for tenant %s", tenant_id)
        raise HTTPException(status_code=500, detail="Failed to load chat messages") from e

@router.post("/{tenant_id}")
def post_message(tenant_id: UUID, payload: ChatMessage, user: dict = Depends(get_user_role)):
    try:
        if str(tenant_id) not in user["tenant_roles"]:
            raise HTTPException(status_code=403, detail="Unauthorized")
            
        data = {
            "tenant_id": str(tenant_id),
            "user_id": user["user_id"],
            "user_email": user["email"],
            "user_name": user["full_name"],
            "content": payload.content
        }
        res = supabase_admin.table("team_messages").insert(data).execute()
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to post chat message for tenant %s", tenant_id)
        raise HTTPException(status_code=500, detail="Failed to post chat message") from e