"""Password reset token model."""

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class PasswordResetToken(BaseModel):
    """Password reset token model for secure password reset flow."""
    
    __tablename__ = "password_reset_tokens"
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    is_used = Column(Boolean, default=False, nullable=False)
    expires_at = Column(String(50), nullable=False)  # ISO format datetime string
    
    # Relationship
    user = relationship("User", back_populates="password_reset_tokens")
    
    def __repr__(self):
        return f"<PasswordResetToken(id={self.id}, user_id={self.user_id}, is_used={self.is_used})>"
