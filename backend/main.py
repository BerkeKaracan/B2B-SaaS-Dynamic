from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from core.limiter import limiter, get_real_ip

import time
import logging

from api.routers import records, auth, tenants, public, notifications, ai, public_ai, github, chat, fx, storage, internal
from core.config import settings

import sentry_sdk
from api.routers import tasks

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        # Keep production overhead low (100% tracing/profiling was blowing small instances).
        traces_sample_rate=0.1,
        profiles_sample_rate=0.0,
    )
    logging.info("Sentry started and watching system.")


def _resolve_is_production() -> bool:
    """True when ENVIRONMENT/APP_ENV is production, or when running on Render."""
    env_raw = os.getenv("ENVIRONMENT")
    if env_raw is None or not str(env_raw).strip():
        env_raw = os.getenv("APP_ENV")
    env = str(env_raw or "").strip().lower()
    if env in {"production", "prod"}:
        return True
    # Render sets RENDER=true; hide docs even if ENVIRONMENT was forgotten.
    if os.getenv("RENDER", "").strip().lower() in {"true", "1"}:
        return True
    return False


IS_PRODUCTION = _resolve_is_production()
# Explicit None in production — all three must stay disabled.
DOCS_URL = None if IS_PRODUCTION else "/docs"
REDOC_URL = None if IS_PRODUCTION else "/redoc"
OPENAPI_URL = None if IS_PRODUCTION else "/openapi.json"

app = FastAPI(
    title="SaaS Engine API",
    description="B2B Multi-tenant SaaS API with flexible JSONB architecture",
    version="1.2.0",
    # Behind Next.js reverse proxy — never 307 to internal Docker hostnames.
    redirect_slashes=False,
    docs_url=DOCS_URL,
    redoc_url=REDOC_URL,
    openapi_url=OPENAPI_URL,
)

# --- LOGGING SETUP ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("saas_engine")
logger.info(
    "API boot: ENVIRONMENT=%r APP_ENV=%r RENDER=%r is_production=%s docs_url=%s",
    os.getenv("ENVIRONMENT"),
    os.getenv("APP_ENV"),
    os.getenv("RENDER"),
    IS_PRODUCTION,
    DOCS_URL,
)

# --- MONITORING & SECURITY MIDDLEWARE ---
@app.middleware("http")
async def monitor_and_secure_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    log_data = {
        "method": request.method,
        "url": str(request.url),
        "process_time": f"{process_time:.4f}s",
        "status_code": response.status_code,
        "client_ip": get_real_ip(request),
    }
    
    if request.url.path.startswith("/api/"):
        if response.status_code >= 400:
            logger.error(f"API Error: {log_data}")
        else:
            logger.info(f"API Success: {log_data}")

    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https: wss:"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    if "server" in response.headers:
        del response.headers["server"]
                
    return response

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://saas-engine-backend.onrender.com",
    "https://b2-b-saa-s-dynamic.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_origin_regex=r"https?://(localhost:3000|.*\.localhost:3000|.*\.vercel\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
# Outermost: trust X-Forwarded-* from Render so request.client + SlowAPI see real IPs.
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

@app.get("/")
async def root():
    return {"status": "alive", "message": "SaaS Engine API is running"}

@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

app.include_router(records.router)
app.include_router(auth.router)
app.include_router(tenants.router)
app.include_router(public.router)
app.include_router(notifications.router)
app.include_router(ai.router)
app.include_router(public_ai.router)
app.include_router(github.router)
app.include_router(chat.router)
app.include_router(tasks.router)
app.include_router(fx.router)
app.include_router(storage.router)
app.include_router(internal.router)