from pydantic import BaseModel, Field
from typing import Dict, Any
from uuid import UUID
from datetime import datetime

class RecordCreate(BaseModel):
    tenant_id: UUID = Field(..., description="Unique identifier for the tenant/company")
    module_name: str = Field(..., description="The context module, e.g., 'fleet_vehicles'")
    record_data: Dict[str, Any] = Field(default_factory=dict, description="Flexible JSON payload")

class RecordResponse(RecordCreate):
    id: UUID
    created_at: datetime

    class Config:
        # Allows Pydantic to read data even if it's not a standard dict
        from_attributes = True