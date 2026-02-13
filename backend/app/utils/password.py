"""Password hashing and validation utilities using bcrypt."""

import re
import bcrypt
from typing import Tuple


def hash_password(password: str) -> str:
    """
    Hash password using bcrypt with cost factor 12.
    
    Args:
        password: Plain text password to hash
        
    Returns:
        Hashed password string
        
    Example:
        >>> hashed = hash_password("MySecurePass123!")
        >>> print(hashed)
        $2b$12$...
    """
    # Generate salt with cost factor 12
    salt = bcrypt.gensalt(rounds=12)
    # Hash the password
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    # Return as string
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to compare against
        
    Returns:
        True if password matches hash, False otherwise
        
    Example:
        >>> hashed = hash_password("MySecurePass123!")
        >>> verify_password("MySecurePass123!", hashed)
        True
        >>> verify_password("WrongPassword", hashed)
        False
    """
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


def validate_password_strength(password: str) -> Tuple[bool, str]:
    """
    Validate password meets strength requirements.
    
    Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    
    Args:
        password: Password to validate
        
    Returns:
        Tuple of (is_valid, error_message)
        
    Example:
        >>> validate_password_strength("weak")
        (False, "Password must be at least 8 characters long")
        >>> validate_password_strength("MySecurePass123!")
        (True, "")
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number"
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    
    return True, ""
