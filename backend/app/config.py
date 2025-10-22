from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application settings
    app_env: str = "development"
    port: int = 8000
    
    # Database settings
    mongodb_uri: str
    
    # JWT settings
    jwt_secret: str
    jwt_expires_in: int = 604800  # 7 days in seconds
    
    # CORS settings
    cors_origins: str = "http://localhost:5173"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    def validate_required_settings(self) -> None:
        """Validate that all required settings are present."""
        if not self.mongodb_uri:
            raise ValueError("MONGODB_URI environment variable is required")
        if not self.jwt_secret:
            raise ValueError("JWT_SECRET environment variable is required")
        if len(self.jwt_secret) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters long")


# Global settings instance
settings = Settings()