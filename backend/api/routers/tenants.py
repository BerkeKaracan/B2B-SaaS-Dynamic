from fastapi import APIRouter, HTTPException
from uuid import UUID

from core.database import supabase

router = APIRouter(
    prefix="/api/tenants",
    tags=["Tenants"],
)


@router.get("/{tenant_id}")
def get_tenant(tenant_id: UUID):
    try:
        response = (
            supabase.table("tenants")
            .select("id, name, created_at")
            .eq("id", str(tenant_id))
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Workspace not found")

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
