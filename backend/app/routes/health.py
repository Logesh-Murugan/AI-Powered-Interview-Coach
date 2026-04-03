"""
Comprehensive health check endpoints

Provides detailed health status of all system components.
"""
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.services.cache_service import cache_service
from app.config import settings

router = APIRouter(tags=["Health"])


@router.get("/detailed")
async def detailed_health_check(db: Session = Depends(get_db)):
    """Detailed health check of all subsystems"""

    health = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "subsystems": {}
    }

    # Database
    try:
        db.execute(text("SELECT 1"))
        health["subsystems"]["database"] = {
            "status": "healthy",
            "type": "PostgreSQL"
        }
    except Exception as e:
        health["status"] = "unhealthy"
        health["subsystems"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }

    # Redis
    try:
        if cache_service.is_available():
            cache_service.set("health_check", "ok", ttl=10)
            value = cache_service.get("health_check")
            health["subsystems"]["redis"] = {
                "status": "healthy" if value == "ok" else "degraded"
            }
        else:
            health["status"] = "degraded"
            health["subsystems"]["redis"] = {
                "status": "unavailable"
            }
    except Exception as e:
        health["status"] = "degraded"
        health["subsystems"]["redis"] = {
            "status": "unhealthy",
            "error": str(e)
        }

    return health


@router.get("/metrics")
async def get_metrics():
    """Get system metrics"""
    from app.monitoring.error_tracker import error_tracker
    from app.monitoring.performance_tracker import perf_tracker

    return {
        "errors": error_tracker.get_metrics(),
        "performance": perf_tracker.get_metrics(),
        "cache": cache_service.get_metrics(),
        "timestamp": datetime.utcnow().isoformat()
    }
