"""Authentication routes for user registration and login."""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.auth import (
    UserRegisterRequest,
    UserRegisterResponse,
    UserResponse,
    UserLoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    LogoutRequest,
    LogoutResponse,
    LogoutAllResponse,
    PasswordResetRequestRequest,
    PasswordResetRequestResponse,
    PasswordResetRequest,
    PasswordResetResponse
)
from app.services.auth_service import AuthService

router = APIRouter()


@router.post(
    "/register",
    response_model=UserRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Register a new user with email, password, and name. Email must be unique and password must meet strength requirements.",
    responses={
        201: {
            "description": "User registered successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "User registered successfully. Please check your email for verification.",
                        "user": {
                            "id": 1,
                            "email": "user@example.com",
                            "name": "John Doe",
                            "target_role": "Software Engineer",
                            "experience_level": None,
                            "account_status": "pending_verification",
                            "created_at": "2026-02-09T11:30:00",
                            "updated_at": "2026-02-09T11:30:00"
                        }
                    }
                }
            }
        },
        400: {
            "description": "Validation error (weak password, invalid email, etc.)",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Password must contain at least one uppercase letter"
                    }
                }
            }
        },
        409: {
            "description": "Email already registered",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Email already registered"
                    }
                }
            }
        }
    }
)
async def register(
    user_data: UserRegisterRequest,
    db: Session = Depends(get_db)
) -> UserRegisterResponse:
    """
    Register a new user.
    
    - **email**: Valid email address (RFC 5322 compliant)
    - **password**: Minimum 8 characters with uppercase, lowercase, number, and special character
    - **name**: User's full name (2-255 characters)
    - **target_role**: Optional target job role for interview preparation
    
    Returns user data with account_status set to 'pending_verification'.
    Password is hashed before storage and never returned in response.
    """
    # Register user
    user = AuthService.register_user(db, user_data)
    
    # Convert to response model
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        target_role=user.target_role,
        experience_level=user.experience_level.value if user.experience_level else None,
        account_status=user.account_status.value,
        created_at=user.created_at.isoformat() if hasattr(user.created_at, 'isoformat') else str(user.created_at),
        updated_at=user.updated_at.isoformat() if hasattr(user.updated_at, 'isoformat') else str(user.updated_at)
    )
    
    return UserRegisterResponse(
        message="User registered successfully. Please check your email for verification.",
        user=user_response
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Login user",
    description="Authenticate user with email and password. Returns access and refresh tokens.",
    responses={
        200: {
            "description": "Login successful",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "bearer",
                        "user": {
                            "id": 1,
                            "email": "user@example.com",
                            "name": "John Doe",
                            "target_role": "Software Engineer",
                            "experience_level": None,
                            "account_status": "active",
                            "created_at": "2026-02-09T11:30:00",
                            "updated_at": "2026-02-09T11:30:00"
                        }
                    }
                }
            }
        },
        401: {
            "description": "Invalid credentials",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Invalid credentials"
                    }
                }
            }
        },
        423: {
            "description": "Account locked",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Account locked due to multiple failed login attempts"
                    }
                }
            }
        }
    }
)
async def login(
    credentials: UserLoginRequest,
    request: Request,
    db: Session = Depends(get_db)
) -> TokenResponse:
    """
    Login user and return JWT tokens.
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns access token (15-minute expiry) and refresh token (7-day expiry).
    Failed login attempts are tracked and account is locked after 5 failures.
    """
    # Authenticate user
    user = AuthService.authenticate_user(db, credentials.email, credentials.password)
    
    # Generate tokens and store refresh token
    tokens = AuthService.generate_tokens(db, user, request)
    
    # Convert user to response model
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        target_role=user.target_role,
        experience_level=user.experience_level.value if user.experience_level else None,
        account_status=user.account_status.value,
        created_at=user.created_at.isoformat() if hasattr(user.created_at, 'isoformat') else str(user.created_at),
        updated_at=user.updated_at.isoformat() if hasattr(user.updated_at, 'isoformat') else str(user.updated_at)
    )
    
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type=tokens["token_type"],
        user=user_response
    )


@router.post(
    "/refresh",
    response_model=RefreshTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh access token",
    description="Generate a new access token using a valid refresh token.",
    responses={
        200: {
            "description": "New access token generated",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "bearer"
                    }
                }
            }
        },
        401: {
            "description": "Invalid, expired, or revoked refresh token",
            "content": {
                "application/json": {
                    "examples": {
                        "invalid": {
                            "value": {"detail": "Invalid or expired refresh token"}
                        },
                        "revoked": {
                            "value": {"detail": "Refresh token has been revoked"}
                        },
                        "expired": {
                            "value": {"detail": "Refresh token has expired"}
                        }
                    }
                }
            }
        }
    }
)
async def refresh_token(
    token_request: RefreshTokenRequest,
    db: Session = Depends(get_db)
) -> RefreshTokenResponse:
    """
    Refresh access token using refresh token.
    
    - **refresh_token**: Valid JWT refresh token
    
    Returns a new access token with 15-minute expiry.
    Refresh token must not be revoked or expired.
    """
    # Generate new access token
    result = AuthService.refresh_access_token(db, token_request.refresh_token)
    
    return RefreshTokenResponse(
        access_token=result["access_token"],
        token_type=result["token_type"]
    )



@router.post(
    "/logout",
    response_model=LogoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Logout from current session",
    description="Invalidate the current refresh token to logout from this device/session.",
    responses={
        200: {
            "description": "Logged out successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Logged out successfully"
                    }
                }
            }
        },
        401: {
            "description": "Invalid refresh token",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Invalid refresh token"
                    }
                }
            }
        }
    }
)
async def logout(
    logout_request: LogoutRequest,
    db: Session = Depends(get_db)
) -> LogoutResponse:
    """
    Logout from current session.
    
    - **refresh_token**: JWT refresh token to invalidate
    
    Invalidates the provided refresh token, effectively logging out from the current device/session.
    Other sessions on different devices remain active.
    """
    # Logout from current session
    result = AuthService.logout(db, logout_request.refresh_token)
    
    return LogoutResponse(
        message=result["message"]
    )


@router.post(
    "/logout-all",
    response_model=LogoutAllResponse,
    status_code=status.HTTP_200_OK,
    summary="Logout from all devices",
    description="Invalidate all refresh tokens for the authenticated user, logging out from all devices.",
    responses={
        200: {
            "description": "Logged out from all devices successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Logged out from all devices successfully",
                        "revoked_sessions": 3
                    }
                }
            }
        },
        401: {
            "description": "Unauthorized - invalid or missing access token",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Not authenticated"
                    }
                }
            }
        }
    }
)
async def logout_all_devices(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> LogoutAllResponse:
    """
    Logout from all devices.
    
    Requires valid access token in Authorization header.
    Invalidates all refresh tokens for the authenticated user, effectively logging out from all devices.
    This is useful for security purposes when you suspect unauthorized access.
    """
    # Logout from all devices
    result = AuthService.logout_all_devices(db, current_user["user_id"])
    
    return LogoutAllResponse(
        message=result["message"],
        revoked_sessions=result["revoked_sessions"]
    )



@router.post(
    "/password-reset-request",
    response_model=PasswordResetRequestResponse,
    status_code=status.HTTP_200_OK,
    summary="Request password reset",
    description="Request a password reset link to be sent to the user's email.",
    responses={
        200: {
            "description": "Password reset request processed",
            "content": {
                "application/json": {
                    "example": {
                        "message": "If the email exists, a password reset link has been sent"
                    }
                }
            }
        }
    }
)
async def request_password_reset(
    request_data: PasswordResetRequestRequest,
    db: Session = Depends(get_db)
) -> PasswordResetRequestResponse:
    """
    Request password reset.
    
    - **email**: User's email address
    
    Generates a password reset token with 1-hour expiry and sends it via email.
    Always returns success message to prevent email enumeration.
    """
    # Request password reset
    result = AuthService.request_password_reset(db, request_data.email)
    
    return PasswordResetRequestResponse(
        message=result["message"]
    )


@router.post(
    "/password-reset",
    response_model=PasswordResetResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset password",
    description="Reset user password using the reset token from email.",
    responses={
        200: {
            "description": "Password reset successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Password reset successfully"
                    }
                }
            }
        },
        400: {
            "description": "Invalid, expired, or already used token",
            "content": {
                "application/json": {
                    "examples": {
                        "invalid": {
                            "value": {"detail": "Invalid or expired reset link"}
                        },
                        "used": {
                            "value": {"detail": "Invalid or expired reset link"}
                        },
                        "expired": {
                            "value": {"detail": "Invalid or expired reset link"}
                        }
                    }
                }
            }
        },
        422: {
            "description": "Validation error - weak password",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Password must contain at least one uppercase letter"
                    }
                }
            }
        }
    }
)
async def reset_password(
    reset_data: PasswordResetRequest,
    db: Session = Depends(get_db)
) -> PasswordResetResponse:
    """
    Reset password using reset token.
    
    - **token**: Password reset token from email
    - **new_password**: New password (min 8 chars with uppercase, lowercase, number, special char)
    
    Validates token, updates password, marks token as used, and invalidates all refresh tokens.
    """
    # Reset password
    result = AuthService.reset_password(db, reset_data.token, reset_data.new_password)
    
    return PasswordResetResponse(
        message=result["message"]
    )
