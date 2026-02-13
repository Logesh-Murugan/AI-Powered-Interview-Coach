"""Pydantic schemas for authentication endpoints."""

from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional
from app.utils.password import validate_password_strength


class UserRegisterRequest(BaseModel):
    """Schema for user registration request."""
    
    email: EmailStr = Field(
        ...,
        description="User's email address (RFC 5322 compliant)",
        examples=["user@example.com"]
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="User's password (min 8 chars, must include uppercase, lowercase, number, special char)",
        examples=["MySecurePass123!"]
    )
    name: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="User's full name",
        examples=["John Doe"]
    )
    target_role: Optional[str] = Field(
        None,
        max_length=255,
        description="Target job role for interview preparation",
        examples=["Software Engineer"]
    )
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets strength requirements."""
        is_valid, error_message = validate_password_strength(v)
        if not is_valid:
            raise ValueError(error_message)
        return v
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate name is not empty or whitespace only."""
        if not v or not v.strip():
            raise ValueError("Name cannot be empty or whitespace only")
        return v.strip()
    
    @field_validator('email')
    @classmethod
    def validate_email_lowercase(cls, v: str) -> str:
        """Convert email to lowercase for consistency."""
        return v.lower()


class UserResponse(BaseModel):
    """Schema for user response (excludes sensitive data)."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    email: str
    name: str
    target_role: Optional[str] = None
    experience_level: Optional[str] = None
    account_status: str
    created_at: str
    updated_at: str


class UserRegisterResponse(BaseModel):
    """Schema for user registration response."""
    model_config = ConfigDict(from_attributes=True)
    
    message: str = Field(
        ...,
        description="Success message",
        examples=["User registered successfully. Please check your email for verification."]
    )
    user: UserResponse


class UserLoginRequest(BaseModel):
    """Schema for user login request."""
    
    email: EmailStr = Field(
        ...,
        description="User's email address",
        examples=["user@example.com"]
    )
    password: str = Field(
        ...,
        description="User's password",
        examples=["MySecurePass123!"]
    )
    
    @field_validator('email')
    @classmethod
    def validate_email_lowercase(cls, v: str) -> str:
        """Convert email to lowercase for consistency."""
        return v.lower()


class TokenResponse(BaseModel):
    """Schema for token response."""
    
    access_token: str = Field(
        ...,
        description="JWT access token (15-minute expiry)"
    )
    refresh_token: str = Field(
        ...,
        description="JWT refresh token (7-day expiry)"
    )
    token_type: str = Field(
        default="bearer",
        description="Token type"
    )
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request."""
    
    refresh_token: str = Field(
        ...,
        description="JWT refresh token"
    )


class RefreshTokenResponse(BaseModel):
    """Schema for refresh token response."""
    
    access_token: str = Field(
        ...,
        description="New JWT access token (15-minute expiry)"
    )
    token_type: str = Field(
        default="bearer",
        description="Token type"
    )


class LogoutRequest(BaseModel):
    """Schema for logout request."""
    
    refresh_token: str = Field(
        ...,
        description="JWT refresh token to invalidate"
    )


class LogoutResponse(BaseModel):
    """Schema for logout response."""
    
    message: str = Field(
        ...,
        description="Success message",
        examples=["Logged out successfully"]
    )


class LogoutAllResponse(BaseModel):
    """Schema for logout all devices response."""
    
    message: str = Field(
        ...,
        description="Success message",
        examples=["Logged out from all devices successfully"]
    )
    revoked_sessions: int = Field(
        ...,
        description="Number of sessions revoked",
        examples=[3]
    )


class PasswordResetRequestRequest(BaseModel):
    """Schema for password reset request."""
    
    email: EmailStr = Field(
        ...,
        description="User's email address",
        examples=["user@example.com"]
    )
    
    @field_validator('email')
    @classmethod
    def validate_email_lowercase(cls, v: str) -> str:
        """Convert email to lowercase for consistency."""
        return v.lower()


class PasswordResetRequestResponse(BaseModel):
    """Schema for password reset request response."""
    
    message: str = Field(
        ...,
        description="Success message",
        examples=["If the email exists, a password reset link has been sent"]
    )


class PasswordResetRequest(BaseModel):
    """Schema for password reset."""
    
    token: str = Field(
        ...,
        description="Password reset token from email",
        examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."]
    )
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="New password (min 8 chars, must include uppercase, lowercase, number, special char)",
        examples=["NewSecurePass123!"]
    )
    
    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets strength requirements."""
        from app.utils.password import validate_password_strength
        is_valid, error_message = validate_password_strength(v)
        if not is_valid:
            raise ValueError(error_message)
        return v


class PasswordResetResponse(BaseModel):
    """Schema for password reset response."""
    
    message: str = Field(
        ...,
        description="Success message",
        examples=["Password reset successfully"]
    )
