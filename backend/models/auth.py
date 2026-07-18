from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class RegisterResponse(BaseModel):
    message: str
    user_id: str

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    message: str
    access_token: str
    refresh_token: str = ""
    tenant_id: str
    user_id: str
    mfa_required: bool = False
    factor_id: Optional[str] = None

class OnboardingRequest(BaseModel):
    usage_type: str 
    workspace_name: Optional[str] = None

class OnboardingResponse(BaseModel):
    message: str
    tenant_id: str
    user_id: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    job_title: Optional[str] = None 
    timezone: Optional[str] = None  

class UserPasswordUpdate(BaseModel):
    password: str

class AvatarUrlUpdate(BaseModel):
    avatar_url: str


class MfaEnrollResponse(BaseModel):
    factor_id: str
    qr_code: str
    secret: str
    uri: str


class MfaCodeRequest(BaseModel):
    factor_id: str
    code: str = Field(..., min_length=6, max_length=8)


class MfaLoginVerifyRequest(BaseModel):
    factor_id: str
    code: str = Field(..., min_length=6, max_length=8)
    access_token: str
    refresh_token: str


class MfaVerifyResponse(BaseModel):
    message: str
    access_token: str
    refresh_token: str = ""
    tenant_id: str = ""
    user_id: str = ""


class MfaFactorSummary(BaseModel):
    id: str
    friendly_name: Optional[str] = None
    status: Optional[str] = None
    factor_type: Optional[str] = None


class MfaStatusResponse(BaseModel):
    enabled: bool
    factors: List[MfaFactorSummary] = []


class MfaUnenrollRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=8)
