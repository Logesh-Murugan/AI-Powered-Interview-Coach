"""Email configuration for SMTP service."""

from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class EmailConfig(BaseSettings):
    """Email configuration from environment variables."""

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_USE_TLS: bool = True

    EMAIL_FROM_ADDRESS: str = "noreply@interviewmaster.ai"
    EMAIL_FROM_NAME: str = "InterviewMaster AI"

    FRONTEND_URL: str = "http://localhost:5173"
    EMAIL_PROVIDER: str = "smtp"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )


email_config = EmailConfig()


def get_email_config() -> EmailConfig:
    """Get email configuration instance."""

    return email_config
