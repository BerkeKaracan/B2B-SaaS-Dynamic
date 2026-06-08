from pydantic_settings import BaseSettings
import os
class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    supabase_service_role_key: str

    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
