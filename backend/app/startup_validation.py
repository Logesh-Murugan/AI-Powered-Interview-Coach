"""
Startup validation for required runtime dependencies.
"""
from pathlib import Path

from loguru import logger
from sqlalchemy import inspect, text

from app.config import settings
from app.database import engine
from app.services.cache_service import cache_service


def validate_startup() -> dict:
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(exist_ok=True)

    db_status = _validate_database()
    cache_status = _validate_cache()
    ai_status = _validate_ai_config()
    email_status = _validate_email_config()

    result = {
        "database": db_status,
        "cache": cache_status,
        "uploads_dir": str(uploads_dir.resolve()),
        "ai": ai_status,
        "email": email_status,
    }
    logger.info("Startup validation completed", extra=result)
    return result


def _validate_database() -> dict:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            inspector = inspect(connection)
            tables = set(inspector.get_table_names())
    except Exception as exc:
        raise RuntimeError(
            f"Database connection failed. Check DATABASE_URL and PostgreSQL availability. Details: {exc}"
        ) from exc

    required_tables = {"users", "refresh_tokens", "interview_sessions"}
    missing_tables = sorted(required_tables - tables)
    if missing_tables:
        raise RuntimeError(
            "Database migrations appear incomplete. Missing tables: "
            f"{', '.join(missing_tables)}. Run 'alembic upgrade head'."
        )

    return {"status": "ok", "checked_tables": sorted(required_tables)}


def _validate_cache() -> dict:
    if not cache_service.is_available():
        raise RuntimeError(
            "Redis is unavailable. Check REDIS_HOST/REDIS_PORT and ensure the Redis service is running."
        )
    return {"status": "ok", "host": settings.REDIS_HOST, "port": settings.REDIS_PORT}


def _validate_ai_config() -> dict:
    keys = [settings.HUGGINGFACE_API_KEY, settings.HUGGINGFACE_API_KEY_2, settings.HUGGINGFACE_API_KEY_3]
    configured = [k for k in keys if k and str(k).strip()]
    if not configured:
        logger.warning(
            "No HuggingFace API keys configured. AI generation will rely on cache/fallback only. "
            "Add HUGGINGFACE_API_KEY* values in backend/.env for full functionality."
        )
        return {"status": "warning", "configured_keys": []}
    return {"status": "ok", "configured_keys": ["HUGGINGFACE_API_KEY", "HUGGINGFACE_API_KEY_2", "HUGGINGFACE_API_KEY_3"]}


def _validate_email_config() -> dict:
    if not settings.EMAIL_ENABLED:
        return {"status": "disabled"}

    missing = []
    if not settings.SMTP_HOST:
        missing.append("SMTP_HOST")
    if not settings.effective_smtp_user:
        missing.append("SMTP_USERNAME/SMTP_USER")
    if not settings.SMTP_PASSWORD:
        missing.append("SMTP_PASSWORD")
    if not settings.effective_email_from:
        missing.append("EMAIL_FROM_ADDRESS/EMAIL_FROM")
    if not settings.FRONTEND_URL:
        missing.append("FRONTEND_URL")

    if missing:
        raise RuntimeError(
            "Email is enabled but configuration is incomplete. Missing: " + ", ".join(missing)
        )

    return {
        "status": "ok",
        "host": settings.SMTP_HOST,
        "from_address": settings.effective_email_from,
    }
