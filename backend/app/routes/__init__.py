"""API routes package."""

from app.routes.auth import router as auth_router
from app.routes import resumes

__all__ = ['auth_router', 'resumes']
