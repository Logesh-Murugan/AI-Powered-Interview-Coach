"""Email configuration for SMTP service."""

import os
from typing import Optional
from pydantic_settings import BaseSettings


class EmailConfig(BaseSettings):
    """Email configuration from environment variables."""
    
    # SMTP Server Settings
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: Optional[str] = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    
    # Email Settings
    EMAIL_FROM_ADDRESS: str = os.getenv("EMAIL_FROM_ADDRESS", "noreply@interviewmaster.ai")
    EMAIL_FROM_NAME: str = os.getenv("EMAIL_FROM_NAME", "InterviewMaster AI")
    
    # Frontend URL for email links
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Email Provider Type (for provider-specific configurations)
    EMAIL_PROVIDER: str = os.getenv("EMAIL_PROVIDER", "smtp")  # smtp, gmail, sendgrid, ses
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from .env file


# Global email configuration instance
email_config = EmailConfig()


def get_email_config() -> EmailConfig:
    """Get email configuration instance."""
    return email_config
