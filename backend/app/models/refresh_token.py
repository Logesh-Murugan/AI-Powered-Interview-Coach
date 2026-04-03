"""Refresh token model for JWT token management."""

from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import BaseModel


class RefreshToken(BaseModel):
    """
    Refresh token model for managing user sessions.
    Stores hashed refresh tokens for validation and revocation.
    """
    __tablename__ = "refresh_tokens"
    
    # Foreign key to users table
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Token hash (we store hash, not the actual token)
    token_hash = Column(String(255), nullable=False, unique=True, index=True)
    
    # Device/session information
    device_fingerprint = Column(String(255), nullable=True)
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 max length
    
    # Token status
    is_revoked = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Relationship to user
    user = relationship("User", back_populates="refresh_tokens")
    
    def __repr__(self):
        return f"<RefreshToken(id={self.id}, user_id={self.user_id}, revoked={self.is_revoked})>"
