from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

from core.config import settings


def get_real_ip(request: Request) -> str:
    """Client IP behind Cloud Run / reverse proxies (X-Forwarded-For aware).

    Prefer proxy headers; fall back to request.client (populated by
    uvicorn ProxyHeadersMiddleware when trusted).
    """
    for header in (
        "x-forwarded-for",
        "x-real-ip",
        "cf-connecting-ip",
        "true-client-ip",
    ):
        value = request.headers.get(header)
        if value:
            # Left-most entry is the original client in standard XFF chains.
            return value.split(",")[0].strip()

    if request.client and request.client.host:
        return request.client.host

    return get_remote_address(request)


# Redis-backed so limits survive multi-instance / restarts (Cloud Run).
# In-memory fallback if Redis is briefly unreachable.
limiter = Limiter(
    key_func=get_real_ip,
    storage_uri=settings.REDIS_URL,
    key_prefix="wsos",
    in_memory_fallback_enabled=True,
)
