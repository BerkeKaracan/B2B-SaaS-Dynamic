"""Ops / internal-only endpoints (no end-user JWT)."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from core.database import supabase_admin
from core.internal_auth import require_internal_secret
from core.limiter import limiter

router = APIRouter(
    prefix="/api/internal",
    tags=["Internal"],
)


class InternalTierRequest(BaseModel):
    tier: str


@router.post("/tenants/{tenant_id}/tier")
@limiter.limit("60/minute")
def set_tenant_tier_internal(
    request: Request,
    tenant_id: UUID,
    body: InternalTierRequest,
    _: None = Depends(require_internal_secret),
):
    """Set workspace tier without user JWT (ops / future billing adapter)."""
    valid_tiers = {"basic", "advanced", "pro"}
    tier = (body.tier or "").lower().strip()
    if tier not in valid_tiers:
        raise HTTPException(status_code=400, detail="Invalid tier")

    try:
        existing = (
            supabase_admin.table("tenants")
            .select("id")
            .eq("id", str(tenant_id))
            .limit(1)
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Not found")

        supabase_admin.table("tenants").update({"tier": tier}).eq(
            "id", str(tenant_id)
        ).execute()
        return {"message": f"Plan set to {tier.upper()}", "tier": tier}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
