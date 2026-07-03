import re
import uuid
from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.database import supabase, supabase_admin
from models.auth import RegisterRequest, RegisterResponse, LoginRequest, LoginResponse, OnboardingRequest, OnboardingResponse, UserProfileUpdate, UserPasswordUpdate
from core.limiter import limiter

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

security = HTTPBearer()

@router.post("/register", response_model=RegisterResponse)
@limiter.limit("3/minute")
def register_user(request: Request, request_data: RegisterRequest) -> RegisterResponse:
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

        return RegisterResponse(
            message="User registered successfully. Please proceed to onboarding.",
            user_id=str(user_id)
        )

    except Exception as e:
        error_msg = str(e)
        if "rate limit" in error_msg.lower() or "invalid" in error_msg.lower() or "password" in error_msg.lower():
            raise HTTPException(status_code=400, detail=error_msg)

        if hasattr(e, 'message'):
            raise HTTPException(status_code=400, detail=e.message)
        raise HTTPException(status_code=500, detail=error_msg)


@router.post("/onboarding", response_model=OnboardingResponse)
@limiter.limit("3/minute")
def complete_onboarding(request: Request, request_data: OnboardingRequest, creds: HTTPAuthorizationCredentials = Depends(security)) -> OnboardingResponse:
    try:
        token = creds.credentials
        user_res = supabase.auth.get_user(token)
        
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid or expired session.")
            
        user_id = user_res.user.id
        
        meta = user_res.user.user_metadata or {}
        full_name = meta.get("full_name") or meta.get("name") or "User"
        email = user_res.user.email

        existing_user = supabase_admin.table("tenant_users").select("id").eq("user_id", user_id).limit(1).execute()
        if existing_user.data:
            raise HTTPException(status_code=400, detail="User already completed onboarding.")

        final_workspace_name = request_data.workspace_name
        
        if request_data.usage_type == "individual":
            final_workspace_name = f"{full_name}'s Workspace"
        elif request_data.usage_type == "team":
            if not final_workspace_name or not final_workspace_name.strip():
                raise HTTPException(status_code=400, detail="Workspace name is required for team usage.")
        else:
            raise HTTPException(status_code=400, detail="Invalid usage_type. Must be 'individual' or 'team'.")

        tenant_res = supabase_admin.table("tenants").insert({
            "name": final_workspace_name,
            "usage_type": request_data.usage_type
        }).execute()
        
        tenant_id = tenant_res.data[0]["id"]

        supabase_admin.table("tenant_users").insert({
            "tenant_id": tenant_id,
            "user_id": user_id,
            "role": "owner",
            "email": email.lower().strip() if email else ""
        }).execute()

        return OnboardingResponse(
            message="Onboarding completed and workspace created successfully.",
            tenant_id=str(tenant_id),
            user_id=str(user_id)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
            .select("tenant_id, role")\
            .eq("user_id", user_id)\
            .order("created_at")\
            .execute()
            
        target_tenant_id = ""
        
        if tenant_user_res.data:
            if tenant_user_res.data and len(tenant_user_res.data) > 0:
                target_tenant_id = tenant_user_res.data[0]["tenant_id"]
        
        return LoginResponse(
            message="Login successful.",
            access_token=session.access_token,
            tenant_id=str(target_tenant_id),
            user_id=str(user_id)
        )
        
    except Exception as e:
        error_msg = str(e)
        if "invalid" in error_msg.lower() or "credentials" in error_msg.lower():
            raise HTTPException(status_code=400, detail="Invalid email or password.")
        raise HTTPException(status_code=500, detail=error_msg)


def get_current_user_role(request: Request, creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = creds.credentials
        user_res = supabase.auth.get_user(token)
        
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")
            
        user_id = user_res.user.id
        current_tenant_id = request.headers.get("x-tenant-id") or request.headers.get("tenant-id")

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
def get_current_user(request: Request, creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = creds.credentials
        user_res = supabase.auth.get_user(token)
        
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")
            
        meta = user_res.user.user_metadata or {}
        
        full_name = meta.get("full_name") or meta.get("name") or "User"
        avatar_url = meta.get("avatar_url") or meta.get("avatar") or "" 
        email = user_res.user.email 
        
        words = full_name.split() if full_name else ["U"]
        initials = "".join([word[0] for word in words if word]).upper()[:2]
        if not initials:
            initials = "US"

        current_tenant_id = request.headers.get("x-tenant-id") or request.headers.get("tenant-id")
        
        role = "employee" 
        resolved_tenant_id = current_tenant_id
        
        custom_role_name = None
        department_name = None

        try:
            query = supabase_admin.table("tenant_users").select("tenant_id, role, custom_role_id, department_id").eq("user_id", user_res.user.id)
            if current_tenant_id and current_tenant_id not in ["undefined", "null"]:
                query = query.eq("tenant_id", current_tenant_id)
            else:
                query = query.order("created_at", desc=True)
                
            role_res = query.execute()
            if role_res.data:
                role = role_res.data[0].get("role", "employee")
                custom_role_id = role_res.data[0].get("custom_role_id")
                department_id = role_res.data[0].get("department_id")
                
                if not resolved_tenant_id:
                    resolved_tenant_id = role_res.data[0].get("tenant_id")

                if custom_role_id:
                    cr_res = supabase_admin.table("custom_roles").select("name").eq("id", custom_role_id).execute()
                    if cr_res.data:
                        custom_role_name = cr_res.data[0]["name"]
                
                if department_id:
                    dp_res = supabase_admin.table("departments").select("name").eq("id", department_id).execute()
                    if dp_res.data:
                        department_name = dp_res.data[0]["name"]

        except Exception as ex:
            print("Role fetch error:", ex)
            pass 
        
        return {
            "user_id": user_res.user.id,
            "email": email,
            "full_name": full_name,
            "initials": initials,
            "role": role,
            "custom_role_name": custom_role_name,
            "department_name": department_name,
            "avatar_url": avatar_url,
            "tenant_id": resolved_tenant_id
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.put("/me")
def update_profile(request_data: UserProfileUpdate, creds: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = creds.credentials
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")
            
        user_id = user_res.user.id
        current_metadata = user_res.user.user_metadata or {}
        
        if request_data.full_name is not None:
            current_metadata["full_name"] = request_data.full_name

        supabase_admin.auth.admin.update_user_by_id(
            user_id,
            {"user_metadata": current_metadata}
        )
        
        return {"success": True, "message": "Profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/avatar")
async def upload_avatar(file: UploadFile = File(...), creds: HTTPAuthorizationCredentials = Depends(security)):
    try:
        allowed_mime_types = ["image/jpeg", "image/png", "image/webp"]
        if file.content_type not in allowed_mime_types:
            raise HTTPException(status_code=400, detail="Geçersiz dosya türü. Sadece JPEG, PNG ve WEBP formatları desteklenir.")

        file.file.seek(0, 2)
        file_size = file.file.tell()  
        file.file.seek(0)  

        max_file_size = 5 * 1024 * 1024  
        if file_size > max_file_size:
            raise HTTPException(status_code=400, detail="Dosya çok büyük. Lütfen en fazla 5MB boyutunda bir resim yükleyin.")

        token = creds.credentials
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")
            
        user_id = user_res.user.id
        file_ext = file.filename.split(".")[-1]
        file_name = f"{user_id}/{uuid.uuid4()}.{file_ext}"
        
        file_bytes = await file.read()
        
        supabase_admin.storage.from_("avatars").upload(
            file_name,
            file_bytes,
            file_options={"content-type": file.content_type, "upsert": "true"}
        )
        
        public_url = supabase_admin.storage.from_("avatars").get_public_url(file_name)
        
        current_metadata = user_res.user.user_metadata or {}
        current_metadata["avatar_url"] = public_url

        supabase_admin.auth.admin.update_user_by_id(
            user_id,
            {"user_metadata": current_metadata}
        )
        
        return {"success": True, "avatar_url": public_url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.put("/password")
def update_password(request_data: UserPasswordUpdate, creds: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = creds.credentials
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")
            
        user_id = user_res.user.id
        supabase_admin.auth.admin.update_user_by_id(
            user_id,
            {"password": request_data.password}
        )
        
        return {"success": True, "message": "Password updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))