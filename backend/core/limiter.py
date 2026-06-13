from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

def get_real_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
        
    return get_remote_address(request)

limiter = Limiter(key_func=get_real_ip)