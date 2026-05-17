from fastapi import APIRouter, HTTPException, Header
from core.database import supabase
from models.auth import RegisterRequest, RegisterResponse, LoginRequest, LoginResponse

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



@router.post("/login", response_model=LoginResponse)
def login_workspace(request: LoginRequest) -> LoginResponse:
    try:
        auth_res = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        user_id = auth_res.user.id if auth_res.user else None
        session = auth_res.session
        
        if not user_id or not session:
            raise HTTPException(status_code=400, detail="Invalid email or password.")
        tenant_user_res = supabase.table("tenant_users")\
            .select("tenant_id")\
            .eq("user_id", user_id)\
            .execute()
            
        if not tenant_user_res.data:
            raise HTTPException(status_code=404, detail="No workspace found for this user.")
            
        tenant_id = tenant_user_res.data[0]["tenant_id"]
        
        return LoginResponse(
            message="Login successful.",
            access_token=session.access_token,
            tenant_id=str(tenant_id),
            user_id=str(user_id)
        )
        
    except Exception as e:
        error_msg = str(e)
        if "invalid" in error_msg.lower() or "credentials" in error_msg.lower():
            raise HTTPException(status_code=400, detail="Invalid email or password.")
        raise HTTPException(status_code=500, detail=error_msg)

@router.get("/me")
def get_current_user(authorization: str = Header(...)) -> dict[str, str]:
    try:
        token = authorization.replace("Bearer ", "")
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")
        full_name = user_res.user.user_metadata.get("full_name", "User")
        words = full_name.split()
        initials = "".join([word[0] for word in words]).upper()[:2]
        
        return {
            "full_name": full_name,
            "initials": initials
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))