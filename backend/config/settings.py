"""
Configuration and settings management
"""

import os
from typing import Optional
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """Application settings"""
    
    # App config
    APP_NAME: str = "Spreadsheet Data Reader"
    APP_VERSION: str = "1.0.0"
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = ENV == "development"
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./spreadsheet_reader.db"
    )
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/callback")
    
    # Allowed email domain
    ALLOWED_EMAIL_DOMAIN: str = "student.itera.ac.id"
    
    # Google Sheets API
    GOOGLE_SHEETS_API_KEY: str = os.getenv("GOOGLE_SHEETS_API_KEY", "")
    
    # Session
    SESSION_SECRET_KEY: str = os.getenv("SESSION_SECRET_KEY", "your-secret-key-change-in-production")
    SESSION_TIMEOUT_MINUTES: int = int(os.getenv("SESSION_TIMEOUT_MINUTES", 30))
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:5000",
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
    ]
    
    @classmethod
    def validate(cls) -> bool:
        """Validate required settings"""
        required = [
            cls.GOOGLE_CLIENT_ID,
            cls.GOOGLE_CLIENT_SECRET,
        ]
        return all(required)

@lru_cache()
def get_settings() -> Settings:
    """Get application settings (cached)"""
    return Settings()

settings = get_settings()
