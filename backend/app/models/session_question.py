"""
Session Question Model

This model links questions to interview sessions with display order and timing.

Requirements: 14.8, 14.9, 15.1-15.7
"""
from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import Base


class SessionQuestion(Base):
    """
    Session question model linking questions to sessions.
    
    Requirements: 14.8, 14.9, 15.4
    """
    __tablename__ = "session_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    display_order = Column(Integer, nullable=False)  # Order in which questions are displayed
    
    # Timing
    question_displayed_at = Column(DateTime, nullable=True)  # When question was first shown to user
    
    # Answer tracking
    answer_id = Column(Integer, ForeignKey("answers.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), default="pending", nullable=False)  # pending, answered, skipped
    
    # Relationships
    session = relationship("InterviewSession", back_populates="session_questions")
    question = relationship("Question")
    answer = relationship("Answer", foreign_keys=[answer_id], post_update=True)
    
    # Timestamps from base
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<SessionQuestion(id={self.id}, session_id={self.session_id}, question_id={self.question_id}, order={self.display_order})>"
    
    def to_dict(self):
        """Convert session question to dictionary"""
        return {
            'id': self.id,
            'session_id': self.session_id,
            'question_id': self.question_id,
            'display_order': self.display_order,
            'question_displayed_at': self.question_displayed_at.isoformat() if self.question_displayed_at else None,
            'answer_id': self.answer_id,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
