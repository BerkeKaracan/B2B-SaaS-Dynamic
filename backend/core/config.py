from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    supabase_service_role_key: str

    REDIS_URL: str
    
    SENTRY_DSN: str | None = None

    AWS_REGION: str
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_S3_BUCKET_NAME: str
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()