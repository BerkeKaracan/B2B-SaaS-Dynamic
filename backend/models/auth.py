from pydantic import BaseModel, EmailStr
from typing import Optional

class RegisterRequest(BaseModel):
    workspace_name: str
    full_name: str
    email: EmailStr
    password: str

class RegisterResponse(BaseModel):
    message: str
    tenant_id: str
    user_id: str