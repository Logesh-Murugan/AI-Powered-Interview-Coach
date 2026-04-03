"""
Answer Draft Model

This model stores auto-saved answer drafts to prevent data loss.

Requirements: 17.1-17.7
"""
from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.models.base import Base


class AnswerDraft(Base):
    """
    Answer draft model for auto-saving user answers.
    
    Requirements: 17.1-17.7
    """
    __tablename__ = "answer_drafts"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Draft content
    draft_text = Column(Text, nullable=False)
    
    # Timing
    last_saved_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User")
    
    # Timestamps from base
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=func.now(), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<AnswerDraft(id={self.id}, session_id={self.session_id}, question_id={self.question_id}, user_id={self.user_id})>"
    
    def to_dict(self):
        """Convert answer draft to dictionary"""
        return {
            'id': self.id,
            'session_id': self.session_id,
            'question_id': self.question_id,
            'user_id': self.user_id,
            'draft_text': self.draft_text,
            'last_saved_at': self.last_saved_at.isoformat() if self.last_saved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
