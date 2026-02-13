"""
FastAPI Application Entry Point
"""
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from loguru import logger
from contextlib import asynccontextmanager
import time
import uuid

from app.config import settings
from app.logging_config import setup_logging
from app.database import get_db
from app.services.cache_service import cache_service

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
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request ID Middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """
    Add unique request ID to each request for tracing.
    """
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    # Process request
    response = await call_next(request)
    
    # Add request ID to response headers
    response.headers["X-Request-ID"] = request_id
    
    return response


# Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Log all requests with timing information.
    """
    start_time = time.time()
    
    # Get request_id (set by add_request_id middleware)
    request_id = getattr(request.state, "request_id", "unknown")
    
    # Log request
    logger.info(
        "Request started",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host if request.client else None,
        }
    )
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000
    
    # Log response
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
    # Test database connection
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"
        logger.error(f"Database health check failed: {e}")
    
    # Test cache connection
    cache_status = "connected" if cache_service.is_available() else "unavailable"
    
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "cache": cache_status,
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

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(resumes.router, prefix="/api/v1/resumes", tags=["resumes"])
app.include_router(questions.router)  # Already has prefix in router definition
app.include_router(interview_sessions.router, prefix="/api/v1/interviews", tags=["interviews"])
app.include_router(evaluations.router, prefix="/api/v1/evaluations", tags=["evaluations"])

# Mount static files for uploaded resumes
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Create uploads directory if it doesn't exist
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)

# Mount uploads directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
logger.info("Static files mounted: /uploads -> uploads/")
