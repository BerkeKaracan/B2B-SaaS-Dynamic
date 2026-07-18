from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request


def get_real_ip(request: Request) -> str:
    """Client IP behind Render / reverse proxies (X-Forwarded-For aware).

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


limiter = Limiter(key_func=get_real_ip)
