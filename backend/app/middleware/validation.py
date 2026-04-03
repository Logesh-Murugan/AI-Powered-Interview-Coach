"""
Request validation middleware

Validates request size and content to prevent abuse.
"""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)


class ValidationMiddleware(BaseHTTPMiddleware):
    """Validate request size and content"""

    MAX_REQUEST_SIZE = 100 * 1024 * 1024  # 100MB for file uploads
    MAX_JSON_SIZE = 10 * 1024 * 1024  # 10MB for JSON

    async def dispatch(self, request: Request, call_next):
        # Check content length
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)

                # Check if it's a file upload
                content_type = request.headers.get("content-type", "")
                if "multipart/form-data" in content_type:
                    max_size = self.MAX_REQUEST_SIZE
                else:
                    max_size = self.MAX_JSON_SIZE

                if size > max_size:
                    raise HTTPException(
                        status_code=413,
                        detail=f"Request too large: {size} bytes (max: {max_size})"
                    )
            except ValueError:
                pass  # Invalid content-length header, let FastAPI handle it

        response = await call_next(request)
        return response
