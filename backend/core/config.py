from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    supabase_service_role_key: str

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()