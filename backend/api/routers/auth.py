import re
import uuid
from typing import Optional, List, Tuple

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client
from core.config import settings
from core.database import supabase, supabase_admin, get_auth_client
from models.auth import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
    OnboardingRequest,
    OnboardingResponse,
    UserProfileUpdate,
    UserPasswordUpdate,
    AvatarUrlUpdate,
    MfaEnrollResponse,
    MfaCodeRequest,
    MfaLoginVerifyRequest,
    MfaVerifyResponse,
    MfaFactorSummary,
    MfaStatusResponse,
    MfaUnenrollRequest,
)
from core.limiter import limiter
from api.routers.records import blacklist_auth_token, invalidate_user_role_cache

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

security = HTTPBearer()


def _session_client(access_token: str, refresh_token: str = ""):
    """Build a Supabase client authenticated as the end user for MFA APIs."""
    # Fresh client + set_session so auth.mfa.* uses the user JWT (header-only
    # clients often fail MFA enroll/list in supabase-py).
    client = create_client(settings.supabase_url, settings.supabase_key)
    try:
        client.auth.set_session(access_token, refresh_token or access_token)
    except Exception as exc:
        print("MFA set_session fallback:", exc)
        return get_auth_client(access_token)
    return client


def _extract_mfa_tokens(verified) -> Tuple[str, str]:
    """AuthMFAVerifyResponse exposes tokens at the top level (not .session)."""
    access = getattr(verified, "access_token", None)
    refresh = getattr(verified, "refresh_token", None) or ""
    if access:
        return str(access), str(refresh)

    session = getattr(verified, "session", None)
    if session and getattr(session, "access_token", None):
        return (
            str(session.access_token),
            str(getattr(session, "refresh_token", "") or ""),
        )

    raise HTTPException(status_code=400, detail="MFA verification failed")


def _verified_totp_factors(client) -> List:
    factors = client.auth.mfa.list_factors()
    totp = getattr(factors, "totp", None)
    if totp:
        return list(totp)
    all_factors = getattr(factors, "all", None) or []
    return [
        f
        for f in all_factors
        if getattr(f, "factor_type", None) == "totp"
        and getattr(f, "status", None) == "verified"
    ]


def _resolve_tenant_id(user_id: str) -> str:
    tenant_user_res = (
        supabase_admin.table("tenant_users")
        .select("tenant_id, role")
        .eq("user_id", user_id)
        .order("created_at")
        .execute()
    )
    if tenant_user_res.data:
        return str(tenant_user_res.data[0]["tenant_id"])
    return ""

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
        full_name = meta.get("full_name") or meta.get("name") or meta.get("user_name") or meta.get("preferred_username") or "User"
        email = user_res.user.email

        existing_user = supabase_admin.table("tenant_users").select("id").eq("user_id", user_id).limit(1).execute()
        if existing_user.data:
            raise HTTPException(status_code=400, detail="User already completed onboarding.")

        final_workspace_name = request_data.workspace_name
        
        if request_data.usage_type == "individual":
            short_id = str(uuid.uuid4())[:6]
            final_workspace_name = f"{full_name}'s Workspace {short_id}"
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

        safe_email = email.lower().strip() if email else f"{user_id}@no-email.com"

        supabase_admin.table("tenant_users").insert({
            "tenant_id": tenant_id,
            "user_id": user_id,
            "role": "owner",
            "email": safe_email
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

        target_tenant_id = _resolve_tenant_id(str(user_id))
        refresh_token = getattr(session, "refresh_token", "") or ""

        mfa_required = False
        factor_id: Optional[str] = None
        try:
            user_client = _session_client(session.access_token, refresh_token)
            verified = _verified_totp_factors(user_client)
            if verified:
                mfa_required = True
                factor_id = str(verified[0].id)
        except Exception as mfa_err:
            print("MFA factor check error:", mfa_err)

        return LoginResponse(
            message="MFA required." if mfa_required else "Login successful.",
            access_token=session.access_token,
            refresh_token=refresh_token,
            tenant_id=target_tenant_id,
            user_id=str(user_id),
            mfa_required=mfa_required,
            factor_id=factor_id,
        )
        
    except HTTPException:
        raise
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
        
        full_name = meta.get("full_name") or meta.get("name") or meta.get("user_name") or meta.get("preferred_username") or "User"
        avatar_url = meta.get("avatar_url") or meta.get("avatar") or "" 
        email = user_res.user.email 
        
        words = full_name.split() if full_name else ["U"]
        initials = "".join([word[0] for word in words if word]).upper()[:2]
        if not initials:
            initials = "US"

        requested_tenant_id = request.headers.get("x-tenant-id") or request.headers.get("tenant-id")
        if requested_tenant_id in ("undefined", "null", ""):
            requested_tenant_id = None
        
        role = "employee"
        # Never echo a spoofed x-tenant-id until membership is proven
        resolved_tenant_id = None
        
        custom_role_name = None
        department_name = None
        job_title = None
        timezone = None

        try:
            base_query = (
                supabase_admin.table("tenant_users")
                .select(
                    "tenant_id, role, custom_role_id, department_id, job_title, timezone"
                )
                .eq("user_id", user_res.user.id)
            )

            membership_row = None
            if requested_tenant_id:
                role_res = base_query.eq("tenant_id", requested_tenant_id).execute()
                if role_res.data:
                    membership_row = role_res.data[0]
            else:
                role_res = base_query.order("created_at", desc=True).limit(1).execute()
                if role_res.data:
                    membership_row = role_res.data[0]

            if membership_row:
                role = membership_row.get("role", "employee")
                resolved_tenant_id = membership_row.get("tenant_id")
                custom_role_id = membership_row.get("custom_role_id")
                department_id = membership_row.get("department_id")
                job_title = membership_row.get("job_title")
                timezone = membership_row.get("timezone")

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
        
        return {
            "user_id": user_res.user.id,
            "email": email,
            "full_name": full_name,
            "initials": initials,
            "role": role,
            "custom_role_name": custom_role_name,
            "department_name": department_name,
            "avatar_url": avatar_url,
            "tenant_id": resolved_tenant_id,
            "job_title": job_title, 
            "timezone": timezone    
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout")
def logout_session(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Revoke the current access token for API auth (Redis blacklist + role cache)."""
    token = creds.credentials
    try:
        user_res = supabase.auth.get_user(token)
        if user_res and user_res.user:
            invalidate_user_role_cache(str(user_res.user.id))
    except Exception:
        pass
    blacklist_auth_token(token)
    return {"message": "Logged out"}


@router.put("/me")
def update_profile(request: Request, request_data: UserProfileUpdate, creds: HTTPAuthorizationCredentials = Depends(security)):
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
        
        if request_data.job_title is not None or request_data.timezone is not None:
            current_tenant_id = request.headers.get("x-tenant-id") or request.headers.get("tenant-id")
            
            if current_tenant_id and current_tenant_id not in ["undefined", "null"]:
                update_payload = {}
                if request_data.job_title is not None:
                    update_payload["job_title"] = request_data.job_title
                if request_data.timezone is not None:
                    update_payload["timezone"] = request_data.timezone
                    
                if update_payload:
                    supabase_admin.table("tenant_users").update(update_payload).eq("user_id", user_id).eq("tenant_id", current_tenant_id).execute()

        return {"success": True, "message": "Profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/avatar")
def upload_avatar(
    request_data: AvatarUrlUpdate,
    creds: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        avatar_url = (request_data.avatar_url or "").strip()
        if not avatar_url:
            raise HTTPException(status_code=400, detail="avatar_url is required")

        token = creds.credentials
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")

        user_id = user_res.user.id
        current_metadata = user_res.user.user_metadata or {}
        current_metadata["avatar_url"] = avatar_url

        supabase_admin.auth.admin.update_user_by_id(
            user_id,
            {"user_metadata": current_metadata},
        )

        return {"success": True, "avatar_url": avatar_url}
    except HTTPException:
        raise
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


@router.get("/mfa/status", response_model=MfaStatusResponse)
def mfa_status(creds: HTTPAuthorizationCredentials = Depends(security)) -> MfaStatusResponse:
    try:
        token = creds.credentials
        client = _session_client(token)
        factors = client.auth.mfa.list_factors()
        summaries: List[MfaFactorSummary] = []

        for f in getattr(factors, "totp", None) or []:
            summaries.append(
                MfaFactorSummary(
                    id=str(f.id),
                    friendly_name=getattr(f, "friendly_name", None),
                    status=getattr(f, "status", "verified"),
                    factor_type=getattr(f, "factor_type", "totp"),
                )
            )

        if not summaries:
            for f in getattr(factors, "all", None) or []:
                if getattr(f, "factor_type", None) != "totp":
                    continue
                summaries.append(
                    MfaFactorSummary(
                        id=str(f.id),
                        friendly_name=getattr(f, "friendly_name", None),
                        status=getattr(f, "status", None),
                        factor_type="totp",
                    )
                )

        enabled = False
        if getattr(factors, "totp", None):
            enabled = len(list(factors.totp)) > 0
        else:
            enabled = any((s.status or "").lower() == "verified" for s in summaries)

        return MfaStatusResponse(enabled=enabled, factors=summaries)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/mfa/enroll", response_model=MfaEnrollResponse)
def mfa_enroll(creds: HTTPAuthorizationCredentials = Depends(security)) -> MfaEnrollResponse:
    try:
        token = creds.credentials
        # Ensure JWT is valid before MFA enroll
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")

        client = _session_client(token)
        enrolled = client.auth.mfa.enroll(
            {"factor_type": "totp", "friendly_name": "Authenticator"}
        )
        totp = getattr(enrolled, "totp", None)
        if not totp:
            raise HTTPException(status_code=400, detail="Failed to enroll TOTP factor")

        return MfaEnrollResponse(
            factor_id=str(enrolled.id),
            qr_code=getattr(totp, "qr_code", "") or "",
            secret=getattr(totp, "secret", "") or "",
            uri=getattr(totp, "uri", "") or "",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/mfa/verify-enrollment", response_model=MfaVerifyResponse)
def mfa_verify_enrollment(
    request_data: MfaCodeRequest,
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> MfaVerifyResponse:
    try:
        token = creds.credentials
        client = _session_client(token)
        verified = client.auth.mfa.challenge_and_verify(
            {
                "factor_id": request_data.factor_id,
                "code": request_data.code.strip(),
            }
        )
        access, refresh = _extract_mfa_tokens(verified)
        if not access:
            access = token

        user_res = supabase.auth.get_user(access)
        user_id = user_res.user.id if user_res and user_res.user else ""

        return MfaVerifyResponse(
            message="Two-factor authentication enabled.",
            access_token=access,
            refresh_token=refresh,
            tenant_id=_resolve_tenant_id(str(user_id)) if user_id else "",
            user_id=str(user_id) if user_id else "",
        )
    except HTTPException:
        raise
    except Exception as e:
        print("MFA verify-enrollment error:", e)
        raise HTTPException(
            status_code=400,
            detail="Invalid authenticator code. Please try again.",
        ) from e


@router.post("/mfa/verify", response_model=MfaVerifyResponse)
@limiter.limit("10/minute")
def mfa_verify_login(
    request: Request,
    request_data: MfaLoginVerifyRequest,
) -> MfaVerifyResponse:
    try:
        if not request_data.access_token:
            raise HTTPException(status_code=400, detail="Missing access token for MFA")

        client = _session_client(
            request_data.access_token, request_data.refresh_token
        )
        # Ensure GoTrue has an active session before challenge/verify
        if not client.auth.get_session():
            client.auth.set_session(
                request_data.access_token,
                request_data.refresh_token or request_data.access_token,
            )

        verified = client.auth.mfa.challenge_and_verify(
            {
                "factor_id": request_data.factor_id,
                "code": request_data.code.strip(),
            }
        )
        access, refresh = _extract_mfa_tokens(verified)

        user_res = supabase.auth.get_user(access)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session after MFA")

        user_id = str(user_res.user.id)
        return MfaVerifyResponse(
            message="Login successful.",
            access_token=access,
            refresh_token=refresh,
            tenant_id=_resolve_tenant_id(user_id),
            user_id=user_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        print("MFA login verify error:", e)
        raise HTTPException(
            status_code=400,
            detail="Invalid authenticator code. Please try again.",
        ) from e


@router.delete("/mfa/factors/{factor_id}", response_model=MfaStatusResponse)
def mfa_unenroll(
    factor_id: str,
    request_data: MfaUnenrollRequest,
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> MfaStatusResponse:
    try:
        token = creds.credentials
        client = _session_client(token)

        client.auth.mfa.challenge_and_verify(
            {
                "factor_id": factor_id,
                "code": request_data.code.strip(),
            }
        )
        client.auth.mfa.unenroll({"factor_id": factor_id})
        return mfa_status(creds)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail="Could not disable 2FA. Check the authenticator code.",
        ) from e
