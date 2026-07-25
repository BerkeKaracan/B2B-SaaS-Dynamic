"""Local Supabase access-token verification + Redis blacklist.

Prefers HS256 local verify when SUPABASE_JWT_SECRET is set.
Falls back to supabase.auth.get_user() when the secret is missing/empty
so production keeps working if Cloud Run env was overwritten with "".
"""

from __future__ import annotations

import hashlib
import logging
import os
import time
from typing import Any

import jwt
import redis
from fastapi import HTTPException

from core.config import settings, get_supabase_jwt_secret
from core.database import supabase

logger = logging.getLogger("saas_engine.auth_jwt")

redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

TOKEN_BLACKLIST_PREFIX = "auth_blacklist:"
BLACKLIST_MIN_TTL_SECONDS = 60
BLACKLIST_MAX_TTL_SECONDS = 60 * 60 * 24 * 7


def _blacklist_key(token: str) -> str:
    return f"{TOKEN_BLACKLIST_PREFIX}{token}"


def token_fingerprint(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()[:16]


def remaining_token_ttl_seconds(token: str, fallback: int = 3600) -> int:
    """TTL for blacklist entries = remaining JWT lifetime (clamped)."""
    try:
        unverified = jwt.decode(
            token,
            options={"verify_signature": False, "verify_exp": False},
            algorithms=["HS256"],
        )
        exp = unverified.get("exp")
        if exp is None:
            return max(BLACKLIST_MIN_TTL_SECONDS, min(fallback, BLACKLIST_MAX_TTL_SECONDS))
        remaining = int(exp) - int(time.time())
        return max(
            BLACKLIST_MIN_TTL_SECONDS,
            min(
                remaining if remaining > 0 else BLACKLIST_MIN_TTL_SECONDS,
                BLACKLIST_MAX_TTL_SECONDS,
            ),
        )
    except Exception:
        return max(BLACKLIST_MIN_TTL_SECONDS, min(fallback, BLACKLIST_MAX_TTL_SECONDS))


def is_token_blacklisted(token: str) -> bool:
    try:
        return bool(redis_client.get(_blacklist_key(token)))
    except Exception as exc:
        logger.error("Redis blacklist read error: %s", exc)
        raise HTTPException(status_code=503, detail="Auth store unavailable") from exc


def blacklist_auth_token(token: str | None) -> None:
    """Revoke an access token until its natural expiry."""
    if not token:
        return
    ttl = remaining_token_ttl_seconds(token)
    try:
        redis_client.setex(_blacklist_key(token), ttl, "1")
        redis_client.delete(f"auth_token:{token}")
    except Exception as exc:
        logger.error("Redis blacklist write error: %s", exc)


def _jwt_secret() -> str:
    """Non-empty JWT secret from process env / settings, or ''."""
    for candidate in (
        os.environ.get("SUPABASE_JWT_SECRET"),
        getattr(settings, "supabase_jwt_secret", None),
        get_supabase_jwt_secret(),
    ):
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()
    return ""


def _verify_via_supabase_auth(token: str) -> dict[str, Any]:
    """Network fallback when local JWT secret is unavailable."""
    try:
        user_res = supabase.auth.get_user(token)
    except Exception as exc:
        logger.error("supabase.auth.get_user fallback failed: %s", exc)
        raise HTTPException(status_code=401, detail="Invalid session") from exc

    if not user_res or not user_res.user:
        raise HTTPException(status_code=401, detail="Invalid session")

    user = user_res.user
    meta = user.user_metadata or {}
    if not isinstance(meta, dict):
        meta = {}
    email = str(user.email or "").lower().strip()
    return {
        "user_id": str(user.id),
        "email": email,
        "user_metadata": meta,
        "claims": {},
        "exp": None,
    }


def verify_access_token(token: str, *, check_blacklist: bool = True) -> dict[str, Any]:
    """Verify signature + exp (local), or Auth API fallback; then Redis blacklist."""
    if not token or len(token) < 20:
        raise HTTPException(status_code=401, detail="Invalid session")

    if check_blacklist:
        try:
            if is_token_blacklisted(token):
                raise HTTPException(status_code=401, detail="Session revoked")
        except HTTPException:
            raise

    secret = _jwt_secret()

    # Empty Cloud Run env var (key present, value "") → Auth API fallback.
    # Never 500 the whole API because of a missing/blank JWT secret.
    if not secret:
        logger.warning(
            "SUPABASE_JWT_SECRET missing/empty — falling back to supabase.auth.get_user"
        )
        return _verify_via_supabase_auth(token)

    try:
        claims = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Session expired") from exc
    except jwt.InvalidAudienceError:
        try:
            claims = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={"require": ["exp", "sub"]},
            )
        except jwt.PyJWTError as exc:
            raise HTTPException(status_code=401, detail="Invalid session") from exc
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid session") from exc

    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session")

    email = str(claims.get("email") or "").lower().strip()
    meta = claims.get("user_metadata") or {}
    if not isinstance(meta, dict):
        meta = {}

    return {
        "user_id": str(user_id),
        "email": email,
        "user_metadata": meta,
        "claims": claims,
        "exp": claims.get("exp"),
    }
