"""
FastAPI Application Entry Point
"""
import logging
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from loguru import logger
from contextlib import asynccontextmanager
import time
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s"
)

from app.config import settings
from app.logging_config import setup_logging
from app.database import get_db
from app.services.cache_service import cache_service
from app.startup_validation import validate_startup
from app.middleware.validation import ValidationMiddleware

# Initialize logging
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown tasks.
    """
    # Startup
    logger.info(
        "Application starting",
        extra={
            "app_name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "debug": settings.DEBUG,
        }
    )
    app.state.startup_status = validate_startup()
    yield
    # Shutdown
    logger.info("Application shutting down")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    description="AI-powered interview preparation platform",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Request Validation Middleware
app.add_middleware(ValidationMiddleware)


# Request ID Middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """
    Add unique request ID to each request for tracing.
    """
    if request.method == "OPTIONS":
        return await call_next(request)

    request_id = str(uuid.uuid4())
    request.state.request_id = request_id

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Log all requests with timing information.
    """
    if request.method == "OPTIONS":
        return await call_next(request)

    start_time = time.time()
    request_id = getattr(request.state, "request_id", "unknown")

    logger.info(
        "Request started",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host if request.client else None,
        }
    )

    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000

    logger.info(
        "Request completed",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
        }
    )

    return response


# Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unhandled errors.
    """
    request_id = getattr(request.state, "request_id", "unknown")

    logger.error(
        "Unhandled exception",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "error": str(exc),
        }
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "meta": {
                "request_id": request_id,
            },
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An internal error occurred. Please try again later.",
                "request_id": request_id,
            }
        }
    )


# Health Check Endpoint
@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint for monitoring.
    Includes database and cache connectivity checks.
    """
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"
        logger.error(f"Database health check failed: {e}")

    cache_status = "connected" if cache_service.is_available() else "unavailable"

    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "cache": cache_status,
        "startup": getattr(app.state, "startup_status", None),
    }


# Cache Metrics Endpoint
@app.get("/cache/metrics")
async def cache_metrics():
    """
    Get cache performance metrics.
    """
    return cache_service.get_metrics()


# Root Endpoint
@app.get("/")
async def root():
    """
    Root endpoint with API information.
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs" if settings.DEBUG else "Documentation disabled in production",
    }


# Import and include routers
from app.routes import auth_router
from app.routes import users
from app.routes import resumes
from app.routes import questions
from app.routes import interview_sessions
from app.routes import evaluations
from app.routes import analytics
from app.routes import achievements
from app.routes import streaks
from app.routes import leaderboard
from app.routes import cache_stats
from app.routes import resume_analysis
from app.routes import study_plans
from app.routes import company_coaching
from app.routes import export
from app.routes import admin
from app.routes import media
from app.routes import health

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(resumes.router, prefix="/api/v1/resumes", tags=["resumes"])
app.include_router(questions.router)
app.include_router(interview_sessions.router, prefix="/api/v1/interviews", tags=["interviews"])
app.include_router(evaluations.router, prefix="/api/v1/evaluations", tags=["evaluations"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(achievements.router, prefix="/api/v1/achievements", tags=["achievements"])
app.include_router(streaks.router, prefix="/api/v1/streaks", tags=["streaks"])
app.include_router(leaderboard.router, prefix="/api/v1/leaderboard", tags=["leaderboard"])
app.include_router(cache_stats.router, prefix="/api/v1/cache", tags=["cache"])
app.include_router(resume_analysis.router)
app.include_router(study_plans.router, prefix="/api/v1/study-plans", tags=["study-plans"])
app.include_router(company_coaching.router)
app.include_router(export.router, prefix="/api/v1/export", tags=["export"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(media.router, prefix="/api/v1/media", tags=["media"])
app.include_router(health.router, prefix="/api/v1/health", tags=["health"])

# Mount static files for uploaded resumes and media
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.utils.media_storage import MediaStorageManager

uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)

# Create media storage directories
MediaStorageManager.STORAGE_ROOT.mkdir(parents=True, exist_ok=True)
MediaStorageManager.AUDIO_DIR.mkdir(exist_ok=True)
MediaStorageManager.VIDEO_DIR.mkdir(exist_ok=True)
MediaStorageManager.TEMP_DIR.mkdir(exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/media", StaticFiles(directory="storage/media"), name="media")
logger.info("Static files mounted: /uploads -> uploads/, /media -> storage/media/")
