from pydantic import BaseModel, Field
from typing import Dict, Any, List, Literal, Optional
from uuid import UUID
from datetime import datetime

class RecordCreate(BaseModel):
    tenant_id: UUID = Field(..., description="Unique identifier for the tenant/company")
    module_name: str = Field(..., description="The context module, e.g., 'projects'")
    record_data: Dict[str, Any] = Field(default_factory=dict, description="Flexible JSON payload")

class RecordUpdate(BaseModel):
    record_data: Dict[str, Any] = Field(..., description="Updated JSON payload")

class RecordResponse(RecordCreate):
    id: UUID
    created_at: datetime
    visibility_mode: Optional[str] = None
    owner_user_id: Optional[UUID] = None
    is_global_public: Optional[bool] = None

    class Config:
        from_attributes = True


class DepartmentGrantInput(BaseModel):
    department_id: UUID
    permission: Literal["view", "edit"] = "view"


class AccessGrantInput(BaseModel):
    subject_type: Literal["user", "department", "custom_role"]
    subject_id: UUID
    permission: Literal["view", "edit", "manage"] = "view"


class ProjectAccessUpdate(BaseModel):
    visibility_mode: Literal["private", "open", "admin_only", "department"] = "private"
    department_ids: List[UUID] = Field(default_factory=list)
    department_grants: List[DepartmentGrantInput] = Field(default_factory=list)
    grants: Optional[List[AccessGrantInput]] = None
