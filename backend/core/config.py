from pydantic_settings import BaseSettings
import os
class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    supabase_service_role_key: str

    REDIS_HOST = os.getenv("REDIS_HOST")
    REDIS_PORT = os.getenv("REDIS_PORT")
    REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
