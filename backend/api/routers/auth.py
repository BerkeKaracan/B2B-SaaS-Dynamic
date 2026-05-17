from fastapi import APIRouter, HTTPException
from core.database import supabase
from models.auth import RegisterRequest, RegisterResponse

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=RegisterResponse)
def register_workspace(request: RegisterRequest) -> RegisterResponse:
    try:
        auth_res = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {"full_name": request.full_name}
            }
        })
        
        user_id = auth_res.user.id if auth_res.user else None
        if not user_id:
             raise HTTPException(status_code=400, detail="Failed to create user.")

        tenant_res = supabase.table("tenants").insert({
            "name": request.workspace_name
        }).execute()
        
        tenant_id = tenant_res.data[0]["id"]

        supabase.table("tenant_users").insert({
            "tenant_id": tenant_id,
            "user_id": user_id,
            "role": "owner"
        }).execute()

        return RegisterResponse(
            message="Workspace created successfully.",
            tenant_id=str(tenant_id),
            user_id=str(user_id)
        )

    except Exception as e:
        error_msg = str(e)
        if "rate limit" in error_msg.lower() or "invalid" in error_msg.lower() or "password" in error_msg.lower():
            raise HTTPException(status_code=400, detail=error_msg)

        if hasattr(e, 'message'):
            raise HTTPException(status_code=400, detail=e.message)
        raise HTTPException(status_code=500, detail=error_msg)