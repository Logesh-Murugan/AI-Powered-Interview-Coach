"""
Answer Model

This model stores user answers to interview questions.

Requirements: 16.1-16.10, 18.1-18.14
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import Base


class Answer(Base):
    """
    Answer model for user responses to interview questions.
    
    Requirements: 16.1-16.10
    """
    __tablename__ = "answers"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Answer content
    answer_text = Column(Text, nullable=False)
    
    # Timing
    time_taken = Column(Integer, nullable=False)  # Time taken in seconds
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    session = relationship("InterviewSession", back_populates="answers")
    question = relationship("Question")
    user = relationship("User", back_populates="answers")
    evaluation = relationship("Evaluation", back_populates="answer", uselist=False, foreign_keys="[Evaluation.answer_id]")
    
    # Timestamps from base
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Answer(id={self.id}, session_id={self.session_id}, question_id={self.question_id}, user_id={self.user_id})>"
    
    def to_dict(self):
        """Convert answer to dictionary"""
        return {
            'id': self.id,
            'session_id': self.session_id,
            'question_id': self.question_id,
            'user_id': self.user_id,
            'answer_text': self.answer_text,
            'time_taken': self.time_taken,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
