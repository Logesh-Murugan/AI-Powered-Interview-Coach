"""Authentication middleware for JWT token validation."""

from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import jwt

from app.utils.jwt import verify_access_token


security = HTTPBearer()


class AuthMiddleware:
    """Middleware for JWT authentication."""
    
    @staticmethod
    async def verify_token(request: Request) -> dict:
        """
        Verify JWT token from request headers.
        
        Args:
            request: FastAPI request object
            
        Returns:
            Token payload dict
            
        Raises:
            HTTPException: 401 if token is missing, invalid, or expired
        """
        # Get Authorization header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authorization header",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Check Bearer scheme
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header format",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        token = parts[1]
        
        # Verify token
        try:
            payload = verify_access_token(token)
            if payload is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"}
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"}
            )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Dependency to get current user from JWT token.
    
    Args:
        credentials: HTTP Bearer credentials from request
        
    Returns:
        Dict with user_id, email, and role
        
    Raises:
        HTTPException: 401 if token is invalid or expired
        
    Example:
        ```python
        @app.get("/protected")
        async def protected_route(current_user: dict = Depends(get_current_user)):
            return {"user_id": current_user["user_id"]}
        ```
    """
    token = credentials.credentials
    
    try:
        payload = verify_access_token(token)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"}
            )
        # Return user info with consistent key names
        return {
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "role": payload.get("role")
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"}
        )


async def get_current_user_optional(request: Request) -> Optional[dict]:
    """
    Optional dependency to get current user from JWT token.
    Returns None if no token or invalid token, instead of raising exception.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Token payload or None
        
    Example:
        ```python
        @app.get("/optional-auth")
        async def optional_route(current_user: Optional[dict] = Depends(get_current_user_optional)):
            if current_user:
                return {"user_id": current_user["sub"]}
            return {"message": "Anonymous user"}
        ```
    """
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        return None
    
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None
    
    token = parts[1]
    
    try:
        payload = verify_access_token(token)
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
