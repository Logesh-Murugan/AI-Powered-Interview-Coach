"""
Answer Model

This model stores user answers to interview questions.

Requirements: 16.1-16.10, 18.1-18.14, Recording System
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, UniqueConstraint, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
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
    
    # Recording fields (nullable for backward compatibility)
    audio_url = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)
    recording_duration = Column(Float, nullable=True)  # Duration in seconds
    recording_format = Column(String(20), nullable=True)  # webm, mp4, etc.
    transcription = Column(Text, nullable=True)
    voice_analysis = Column(JSON, nullable=True)  # Speaking pace, filler words, etc.
    video_analysis = Column(JSON, nullable=True)  # Video quality, lighting, stability, etc.
    input_method = Column(String(20), nullable=True, comment="How answer was provided: text, voice, video")
    
    # Timing
    time_taken = Column(Integer, nullable=False)  # Time taken in seconds
    submitted_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=func.now(), nullable=False)
    
    # Relationships
    session = relationship("InterviewSession", back_populates="answers")
    question = relationship("Question")
    user = relationship("User", back_populates="answers")
    evaluation = relationship("Evaluation", back_populates="answer", uselist=False, foreign_keys="[Evaluation.answer_id]")
    
    # Timestamps from base
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=func.now(), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Unique constraint: one answer per question per session
    __table_args__ = (
        UniqueConstraint('session_id', 'question_id', name='uq_answers_session_question'),
    )
    
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
            'audio_url': self.audio_url,
            'video_url': self.video_url,
            'recording_duration': self.recording_duration,
            'recording_format': self.recording_format,
            'transcription': self.transcription,
            'voice_analysis': self.voice_analysis,
            'video_analysis': self.video_analysis,
            'input_method': self.input_method,
            'time_taken': self.time_taken,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
