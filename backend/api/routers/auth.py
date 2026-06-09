import re
from fastapi import APIRouter, HTTPException, Header, Request
from core.database import supabase, supabase_admin
from models.auth import RegisterRequest, RegisterResponse, LoginRequest, LoginResponse
from core.limiter import limiter

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=RegisterResponse)
@limiter.limit("3/minute")
def register_workspace(request: Request, request_data: RegisterRequest) -> RegisterResponse:
    try:
        auth_res = supabase.auth.sign_up({
            "email": request_data.email,
            "password": request_data.password,
            "options": {
                "data": {"full_name": request_data.full_name}
            }
        })
        
        user_id = auth_res.user.id if auth_res.user else None
        if not user_id:
             raise HTTPException(status_code=400, detail="Failed to create user.")

        tenant_res = supabase_admin.table("tenants").insert({
            "name": request_data.workspace_name
        }).execute()
        
        tenant_id = tenant_res.data[0]["id"]

        supabase_admin.table("tenant_users").insert({
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
@limiter.limit("5/minute")
def login_workspace(request: Request, request_data: LoginRequest) -> LoginResponse:
    try:
        auth_res = supabase.auth.sign_in_with_password({
            "email": request_data.email,
            "password": request_data.password
        })
        
        user_id = auth_res.user.id if auth_res.user else None
        session = auth_res.session
        
        if not user_id or not session:
            raise HTTPException(status_code=400, detail="Invalid email or password.")
            
        tenant_user_res = supabase_admin.table("tenant_users")\
            .select("tenant_id")\
            .eq("user_id", user_id)\
            .order("created_at")\
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

def get_current_user_role(request: Request, authorization: str = Header(...)) -> dict:
    try:
        token = authorization.replace("Bearer ", "")
        user_res = supabase.auth.get_user(token)
        
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")
            
        user_id = user_res.user.id

        current_tenant_id = request.headers.get("x-tenant-id") or request.headers.get("tenant-id")
        if not current_tenant_id:
            referer = request.headers.get("referer", "")
            match = re.search(r"/(?:dashboard|share)/([0-9a-fA-F\-]{36})", referer)
            if match:
                current_tenant_id = match.group(1)

        role = "employee" 
        try:
            query = supabase_admin.table("tenant_users").select("role").eq("user_id", user_id)
            if current_tenant_id:
                query = query.eq("tenant_id", current_tenant_id)
                
            role_res = query.execute()
            if role_res.data:
                role = role_res.data[0].get("role", "employee")
        except Exception:
            pass 
        
        return {
            "user_id": user_id,
            "role": role 
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
  
@router.get("/me")
def get_current_user(request: Request, authorization: str = Header(...)) -> dict:
    try:
        token = authorization.replace("Bearer ", "")
        user_res = supabase.auth.get_user(token)
        
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")
            
        full_name = user_res.user.user_metadata.get("full_name", "User")
        words = full_name.split()
        initials = "".join([word[0] for word in words]).upper()[:2]

        current_tenant_id = request.headers.get("x-tenant-id") or request.headers.get("tenant-id")
        
        if not current_tenant_id:
            referer = request.headers.get("referer", "")
            match = re.search(r"/(?:dashboard|share)/([0-9a-fA-F\-]{36})", referer)
            if match:
                current_tenant_id = match.group(1)

        role = "employee" 
        try:
            query = supabase_admin.table("tenant_users").select("role").eq("user_id", user_res.user.id)
            if current_tenant_id:
                query = query.eq("tenant_id", current_tenant_id)
                
            role_res = query.execute()
            if role_res.data:
                role = role_res.data[0].get("role", "employee")
        except Exception:
            pass 
        
        return {
            "full_name": full_name,
            "initials": initials,
            "role": role
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))