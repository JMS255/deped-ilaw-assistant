from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    groq_api_key: str = ""
    gemini_api_key: str = ""
    supabase_url: str
    supabase_service_key: str
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()