"""
Interview Session Model

This model represents an interview practice session with questions and answers.

Requirements: 14.1-14.10, 15.1-15.7, 16.1-16.10, 19.1-19.12
"""
from datetime import datetime
import enum

from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship, validates

from app.models.base import Base


class SessionStatus(str, enum.Enum):
    """Interview session status."""
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"


class InterviewSession(Base):
    """Interview session model for practice interviews."""
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(100), nullable=False, index=True)
    difficulty = Column(String(20), nullable=False)
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.IN_PROGRESS, nullable=False, index=True)
    question_count = Column(Integer, default=5, nullable=False)
    categories = Column(JSON, nullable=True)

    start_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)
    session_metadata = Column(JSON, nullable=True)

    user = relationship("User", back_populates="interview_sessions")
    session_questions = relationship("SessionQuestion", back_populates="session", cascade="all, delete-orphan")
    answers = relationship("Answer", back_populates="session", cascade="all, delete-orphan")
    session_summary = relationship("SessionSummary", back_populates="session", uselist=False, cascade="all, delete-orphan")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    @validates("status")
    def validate_status(self, key, value):
        """Normalize incoming status strings to SessionStatus enum values."""
        if isinstance(value, SessionStatus):
            return value
        if isinstance(value, str):
            return SessionStatus(value.strip().upper())
        raise ValueError(f"Invalid session status: {value}")

    def __repr__(self):
        return f"<InterviewSession(id={self.id}, user_id={self.user_id}, role='{self.role}', status='{self.status}')>"

    def to_dict(self):
        """Convert session to a frontend-safe dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'role': self.role,
            'difficulty': self.difficulty,
            'status': self.status.value.lower() if isinstance(self.status, SessionStatus) else str(self.status).lower(),
            'question_count': self.question_count,
            'categories': self.categories,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'session_metadata': self.session_metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

