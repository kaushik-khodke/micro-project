import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "NeuroBridge AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 11520 # 8 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./neurobridge.db")
    
    # AI Services
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL_NAME: str = "gemini-2.5-flash" # Use 1.5 Flash for optimal performance and clinical context
    
    # Storage
    STORAGE_PATH: str = os.getenv("STORAGE_PATH", "./storage")
    UPLOADS_DIR: str = os.path.join(STORAGE_PATH, "uploads")
    
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
