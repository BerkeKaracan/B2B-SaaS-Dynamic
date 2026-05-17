from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from api.routers import records, auth

app = FastAPI(
    title="SaaS Engine API",
    description="B2B Multi-tenant SaaS API with flexible JSONB architecture",
    version="1.0.0"
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://saas-engine-backend.onrender.com" 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(records.router)
app.include_router(auth.router)

@app.get("/health", tags=["System"])
async def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": "SaaS Engine API"}