from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    supabase_service_role_key: str

    REDIS_URL: str
    
    SENTRY_DSN: str | None = None

    AWS_REGION: str | None = None
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_S3_BUCKET_NAME: str | None = None
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()