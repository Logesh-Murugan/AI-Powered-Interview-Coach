"""
Logging configuration using Loguru for structured JSON logs
"""
import sys
import json
from loguru import logger
from app.config import settings


def serialize_record(record):
    """
    Serialize log record to JSON format.
    """
    subset = {
        "timestamp": record["time"].isoformat(),
        "level": record["level"].name,
        "message": record["message"],
        "module": record["module"],
        "function": record["function"],
        "line": record["line"],
    }
    
    # Add extra fields if present
    if record["extra"]:
        subset["extra"] = record["extra"]
    
    # Add exception info if present
    if record["exception"]:
        subset["exception"] = {
            "type": record["exception"].type.__name__,
            "value": str(record["exception"].value),
        }
    
    return json.dumps(subset)


def patched_write(text):
    """
    Patch write to output JSON.
    """
    record = json.loads(text)
    sys.stdout.write(serialize_record(record) + "\n")


def setup_logging():
    """
    Configure Loguru logger with structured JSON output.
    """
    # Remove default handler
    logger.remove()
    
    # Add custom handler with JSON serialization
    logger.add(
        sys.stdout,
        format="{message}",
        level=settings.LOG_LEVEL,
        serialize=True,
        backtrace=True,
        diagnose=settings.DEBUG,
    )
    
    # Add file handler for production
    if settings.ENVIRONMENT == "production":
        logger.add(
            "logs/app.log",
            rotation="500 MB",
            retention="10 days",
            compression="zip",
            level="INFO",
            serialize=True,
        )
    
    logger.info(
        "Logging configured",
        extra={
            "environment": settings.ENVIRONMENT,
            "log_level": settings.LOG_LEVEL,
        }
    )
