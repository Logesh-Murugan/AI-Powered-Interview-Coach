"""
Session Summary Model

This model stores comprehensive session performance summaries.

Requirements: 19.1-19.12
"""
from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import Base


class SessionSummary(Base):
    """
    Session summary model for comprehensive performance reports.
    
    Requirements: 19.1-19.12
    """
    __tablename__ = "session_summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True, unique=True)
    
    # Overall scores
    overall_session_score = Column(Float, nullable=False)  # Weighted average of all questions
    
    # Average criterion scores
    avg_content_quality = Column(Float, nullable=False)
    avg_clarity = Column(Float, nullable=False)
    avg_confidence = Column(Float, nullable=False)
    avg_technical_accuracy = Column(Float, nullable=False)
    
    # Trend analysis
    score_trend = Column(Float, nullable=True)  # Percentage change from previous session
    previous_session_score = Column(Float, nullable=True)
    
    # Aggregated feedback
    top_strengths = Column(JSON, nullable=False)  # Top 3 most mentioned strengths
    top_improvements = Column(JSON, nullable=False)  # Top 3 most mentioned improvements
    
    # Category performance
    category_performance = Column(JSON, nullable=False)  # {category: avg_score}
    
    # Visualization data
    radar_chart_data = Column(JSON, nullable=True)  # Data for criteria radar chart
    line_chart_data = Column(JSON, nullable=True)  # Data for score progression
    
    # Metadata
    total_questions = Column(Integer, nullable=False)
    total_time_seconds = Column(Integer, nullable=False)
    
    # Timing
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    session = relationship("InterviewSession", back_populates="session_summary")
    
    # Timestamps from base
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<SessionSummary(id={self.id}, session_id={self.session_id}, overall_score={self.overall_session_score})>"
    
    def to_dict(self):
        """Convert session summary to dictionary"""
        return {
            'id': self.id,
            'session_id': self.session_id,
            'overall_session_score': self.overall_session_score,
            'avg_content_quality': self.avg_content_quality,
            'avg_clarity': self.avg_clarity,
            'avg_confidence': self.avg_confidence,
            'avg_technical_accuracy': self.avg_technical_accuracy,
            'score_trend': self.score_trend,
            'previous_session_score': self.previous_session_score,
            'top_strengths': self.top_strengths,
            'top_improvements': self.top_improvements,
            'category_performance': self.category_performance,
            'radar_chart_data': self.radar_chart_data,
            'line_chart_data': self.line_chart_data,
            'total_questions': self.total_questions,
            'total_time_seconds': self.total_time_seconds,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
