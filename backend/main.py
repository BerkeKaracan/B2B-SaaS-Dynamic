from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import our newly created router
from api.routers import records

# Initialize the FastAPI application
app = FastAPI(
    title="SaaS Engine API",
    description="B2B Multi-tenant SaaS API with flexible JSONB architecture",
    version="1.0.0"
)

# Configure CORS to allow communication with the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the routers
app.include_router(records.router)

@app.get("/health", tags=["System"])
async def health_check():
    """
    Simple health check endpoint to verify the API is running.
    """
    return {"status": "healthy", "service": "SaaS Engine API"}