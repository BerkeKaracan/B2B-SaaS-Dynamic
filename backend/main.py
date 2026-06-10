from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from core.limiter import limiter

import time
import logging

from api.routers import records, auth, tenants, public, notifications

app = FastAPI(
    title="SaaS Engine API",
    description="B2B Multi-tenant SaaS API with flexible JSONB architecture",
    version="1.0.0"
)

# --- LOGGING SETUP ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("saas_engine")

# --- MONITORING MIDDLEWARE ---
@app.middleware("http")
async def monitor_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    log_data = {
        "method": request.method,
        "path": request.url.path,
        "status": response.status_code,
        "duration_ms": round(process_time * 1000, 2),
        "ip": request.client.host if request.client else "unknown"
    }
    
    if request.url.path.startswith("/api/"):
        if response.status_code >= 400:
            logger.error(f"API Error: {log_data}")
        else:
            logger.info(f"API Success: {log_data}")
            
    return response

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://saas-engine-backend.onrender.com",
    "https://b2-b-saa-s-dynamic.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost:3000|.*\.localhost:3000|.*\.vercel\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(records.router)
app.include_router(auth.router)
app.include_router(tenants.router)
app.include_router(public.router)
app.include_router(notifications.router)

@app.get("/health", tags=["System"])
async def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": "SaaS Engine API"}