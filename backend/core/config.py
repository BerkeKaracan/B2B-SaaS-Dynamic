from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    supabase_service_role_key: str

    REDIS_URL: str
    
    SENTRY_DSN: str | None = None 
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()