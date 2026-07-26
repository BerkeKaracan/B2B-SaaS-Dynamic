"""Feature-flag consumer for SaaS Engine.

Flag management lives in Pulse Flag (multi-tenant by project delivery key).
This module evaluates whether a feature is enabled for a tenant.

Resolution:
1. Resolve tenants.tier from DB.
2. If FEATURE_FLAGS_URL set and Pulse OK → Pulse is source of truth.
3. If Pulse unset/unreachable/error → local tier fallback for known keys
   (ai.canvas_generator → advanced|pro).
"""

from __future__ import annotations

import json
import logging
import os
from typing import Literal, Optional, Tuple
from urllib.error import URLError, HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import HTTPException

from core.database import supabase_admin

logger = logging.getLogger("saas_engine.feature_gate")

AI_CANVAS_GENERATOR = "ai.canvas_generator"

# Local entitlement ONLY when Pulse is unset/unreachable.
_LOCAL_TIER_FLAGS: dict[str, set[str]] = {
    AI_CANVAS_GENERATOR: {"advanced", "pro"},
}

RemoteStatus = Literal["unset", "ok", "error"]


def normalize_tier(raw: Optional[str]) -> str:
    tier = (raw or "basic").strip().lower()
    if tier == "free":
        return "basic"
    return tier


def get_tenant_tier(tenant_id: str) -> str:
    res = (
        supabase_admin.table("tenants")
        .select("tier")
        .eq("id", tenant_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return normalize_tier(res.data[0].get("tier"))


def assert_tenant_member(tenant_id: str, user_id: str) -> None:
    member_check = (
        supabase_admin.table("tenant_users")
        .select("id")
        .eq("tenant_id", tenant_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not member_check.data:
        raise HTTPException(status_code=403, detail="Workspace access denied.")


def _evaluate_remote(
    key: str, tenant_id: str, tier: str
) -> Tuple[RemoteStatus, Optional[bool]]:
    """Returns (status, enabled). enabled is set only when status == 'ok'."""
    base = (os.getenv("FEATURE_FLAGS_URL") or "").strip().rstrip("/")
    if not base:
        return "unset", None

    api_key = (os.getenv("FEATURE_FLAGS_API_KEY") or "").strip()
    if not api_key:
        logger.error(
            "FEATURE_FLAGS_URL is set but FEATURE_FLAGS_API_KEY is missing"
        )
        return "error", None

    query = urlencode(
        {
            "key": key,
            "tenant_id": tenant_id,
            "tier": normalize_tier(tier),
        }
    )
    url = f"{base}/evaluate?{query}"
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {api_key}",
        "User-Agent": "saas-engine-feature-gate",
    }

    try:
        req = Request(url, headers=headers, method="GET")
        with urlopen(req, timeout=2.5) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        if isinstance(payload, dict) and "enabled" in payload:
            return "ok", bool(payload["enabled"])
        logger.warning("Feature flag remote response missing enabled: %s", payload)
        return "error", None
    except HTTPError as exc:
        body = ""
        try:
            body = exc.read().decode("utf-8", errors="replace")[:200]
        except Exception:
            pass
        logger.warning(
            "Feature flag remote evaluate HTTP %s for %s: %s",
            exc.code,
            key,
            body,
        )
        return "error", None
    except (URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
        logger.warning("Feature flag remote evaluate failed for %s: %s", key, exc)
        return "error", None


def _evaluate_local(key: str, tier: str) -> bool:
    allowed = _LOCAL_TIER_FLAGS.get(key)
    if allowed is None:
        return False
    return normalize_tier(tier) in allowed


def resolve_feature_enabled(
    key: str,
    tier: str,
    remote_status: RemoteStatus,
    remote_enabled: Optional[bool],
) -> bool:
    """Pulse SoT when OK; local tier matrix only as fallback (mirrors Next featureGate)."""
    if remote_status == "ok":
        return bool(remote_enabled)

    return _evaluate_local(key, tier)


def is_feature_enabled(
    key: str, tenant_id: str, *, tier: Optional[str] = None
) -> bool:
    resolved_tier = (
        normalize_tier(tier) if tier is not None else get_tenant_tier(tenant_id)
    )
    status, remote_enabled = _evaluate_remote(key, tenant_id, resolved_tier)
    return resolve_feature_enabled(key, resolved_tier, status, remote_enabled)


def require_feature(key: str, tenant_id: str, user_id: str) -> None:
    """Raise 403 if the user cannot access the workspace or the feature is off."""
    assert_tenant_member(tenant_id, user_id)

    if not is_feature_enabled(key, tenant_id):
        raise HTTPException(
            status_code=403,
            detail="This feature is not enabled for your workspace.",
        )
