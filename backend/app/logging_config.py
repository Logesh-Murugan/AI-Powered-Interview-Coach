"""
Logging configuration using Loguru for structured JSON logs
"""
import json
import sys
from loguru import logger
from app.config import settings


def serialize_record(record):
    """Serialize log record to stable JSON."""
    subset = {
        "timestamp": record["time"].isoformat(),
        "level": record["level"].name,
        "message": record["message"],
        "module": record["module"],
        "function": record["function"],
        "line": record["line"],
    }

    if record["extra"]:
        subset["extra"] = record["extra"]

    if record["exception"]:
        subset["exception"] = {
            "type": record["exception"].type.__name__,
            "value": str(record["exception"].value),
        }

    return json.dumps(subset, ensure_ascii=True)


def _json_sink(message):
    """Write JSON logs in a Windows-safe way."""
    record = message.record
    serialized = serialize_record(record)
    try:
        sys.stdout.write(serialized + "\n")
    except UnicodeEncodeError:
        sys.stdout.buffer.write((serialized + "\n").encode("utf-8", errors="replace"))


def setup_logging():
    """Configure Loguru logger with structured JSON output."""
    logger.remove()

    logger.add(
        _json_sink,
        level=settings.LOG_LEVEL,
        backtrace=True,
        diagnose=settings.DEBUG,
    )

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
