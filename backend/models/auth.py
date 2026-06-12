from pydantic import BaseModel, EmailStr
from typing import Optional

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
    tenant_id: str
    user_id: str

class OnboardingRequest(BaseModel):
    usage_type: str 
    workspace_name: Optional[str] = None

class OnboardingResponse(BaseModel):
    message: str
    tenant_id: str
    user_id: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None

class UserPasswordUpdate(BaseModel):
    password: str