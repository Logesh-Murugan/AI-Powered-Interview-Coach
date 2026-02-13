"""
Interview Session Model

This model represents an interview practice session with questions and answers.

Requirements: 14.1-14.10, 15.1-15.7, 16.1-16.10, 19.1-19.12
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.models.base import Base


class SessionStatus(str, enum.Enum):
    """Interview session status"""
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class InterviewSession(Base):
    """
    Interview session model for practice interviews.
    
    Requirements: 14.1-14.10
    """
    __tablename__ = "interview_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(100), nullable=False, index=True)
    difficulty = Column(String(20), nullable=False)
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.IN_PROGRESS, nullable=False, index=True)
    question_count = Column(Integer, nullable=False)
    categories = Column(JSON, nullable=True)  # Array of category names
    
    # Timestamps
    start_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)
    
    # Metadata
    session_metadata = Column(JSON, nullable=True)  # Additional session configuration
    
    # Relationships
    user = relationship("User", back_populates="interview_sessions")
    session_questions = relationship("SessionQuestion", back_populates="session", cascade="all, delete-orphan")
    answers = relationship("Answer", back_populates="session", cascade="all, delete-orphan")
    session_summary = relationship("SessionSummary", back_populates="session", uselist=False, cascade="all, delete-orphan")
    
    # Timestamps from base
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<InterviewSession(id={self.id}, user_id={self.user_id}, role='{self.role}', status='{self.status}')>"
    
    def to_dict(self):
        """Convert session to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'role': self.role,
            'difficulty': self.difficulty,
            'status': self.status.value if isinstance(self.status, SessionStatus) else self.status,
            'question_count': self.question_count,
            'categories': self.categories,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'session_metadata': self.session_metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
