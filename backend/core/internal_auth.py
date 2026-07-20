"""Shared secret gate for middleware/ops-only endpoints."""

from __future__ import annotations

import hmac
import os

from fastapi import Header, HTTPException, Request


def get_internal_api_secret() -> str:
    return (os.getenv("INTERNAL_API_SECRET") or "").strip()


def extract_internal_secret(
    request: Request,
    x_internal_secret: str | None = None,
    authorization: str | None = None,
) -> str | None:
    if x_internal_secret and x_internal_secret.strip():
        return x_internal_secret.strip()
    # Fallback: Authorization: Bearer <INTERNAL_API_SECRET>
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    # Also accept custom header casing variants via request
    alt = request.headers.get("x-internal-secret")
    if alt and alt.strip():
        return alt.strip()
    return None


def require_internal_secret(
    request: Request,
    x_internal_secret: str | None = Header(default=None, alias="X-Internal-Secret"),
    authorization: str | None = Header(default=None),
) -> None:
    """Opaque 404 when secret missing/wrong — do not leak auth failure detail."""
    expected = get_internal_api_secret()
    provided = extract_internal_secret(request, x_internal_secret, authorization)
    if not expected or not provided or not hmac.compare_digest(provided, expected):
        raise HTTPException(status_code=404, detail="Not found")
