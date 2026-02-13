"""JWT token generation and validation utilities."""

import jwt
from datetime import datetime, timedelta
from typing import Dict, Optional
from app.config import settings


def create_access_token(user_id: int, email: str, role: str = "user") -> str:
    """
    Create JWT access token with 15-minute expiry.
    
    Args:
        user_id: User's database ID
        email: User's email address
        role: User's role (default: "user")
        
    Returns:
        Encoded JWT token string
        
    Example:
        >>> token = create_access_token(1, "user@example.com")
        >>> print(token)
        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    """
    now = datetime.utcnow()
    payload = {
        'sub': user_id,
        'email': email,
        'role': role,
        'type': 'access',
        'exp': now + timedelta(minutes=15),
        'iat': now
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')


def create_refresh_token(user_id: int) -> str:
    """
    Create JWT refresh token with 7-day expiry.
    
    Args:
        user_id: User's database ID
        
    Returns:
        Encoded JWT token string
        
    Example:
        >>> token = create_refresh_token(1)
        >>> print(token)
        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    """
    now = datetime.utcnow()
    payload = {
        'sub': user_id,
        'type': 'refresh',
        'exp': now + timedelta(days=7),
        'iat': now
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')


def decode_token(token: str) -> Optional[Dict]:
    """
    Decode and validate JWT token.
    
    Args:
        token: JWT token string to decode
        
    Returns:
        Decoded token payload dict, or None if invalid
        
    Raises:
        jwt.ExpiredSignatureError: If token has expired
        jwt.InvalidTokenError: If token is invalid
        
    Example:
        >>> token = create_access_token(1, "user@example.com")
        >>> payload = decode_token(token)
        >>> print(payload['sub'])
        1
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        # Token has expired
        raise
    except jwt.InvalidTokenError:
        # Token is invalid
        raise


def verify_access_token(token: str) -> Optional[Dict]:
    """
    Verify access token and return payload.
    
    Args:
        token: JWT access token string
        
    Returns:
        Token payload if valid, None otherwise
        
    Example:
        >>> token = create_access_token(1, "user@example.com")
        >>> payload = verify_access_token(token)
        >>> print(payload['email'])
        user@example.com
    """
    try:
        payload = decode_token(token)
        if payload.get('type') != 'access':
            return None
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def verify_refresh_token(token: str) -> Optional[Dict]:
    """
    Verify refresh token and return payload.
    
    Args:
        token: JWT refresh token string
        
    Returns:
        Token payload if valid, None otherwise
        
    Example:
        >>> token = create_refresh_token(1)
        >>> payload = verify_refresh_token(token)
        >>> print(payload['sub'])
        1
    """
    try:
        payload = decode_token(token)
        if payload.get('type') != 'refresh':
            return None
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def get_token_expiry(token: str) -> Optional[datetime]:
    """
    Get expiry datetime from token.
    
    Args:
        token: JWT token string
        
    Returns:
        Expiry datetime (UTC), or None if invalid
        
    Example:
        >>> token = create_access_token(1, "user@example.com")
        >>> expiry = get_token_expiry(token)
        >>> print(expiry)
        2026-02-09 12:30:00
    """
    try:
        payload = decode_token(token)
        exp_timestamp = payload.get('exp')
        if exp_timestamp:
            return datetime.utcfromtimestamp(exp_timestamp)
        return None
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
