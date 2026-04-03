"""
Evaluation Model

This model stores AI-generated evaluations of user answers.

Requirements: 18.1-18.14
"""
from sqlalchemy import Column, Integer, Float, Text, ForeignKey, DateTime, JSON, String
from sqlalchemy.orm import relationship, synonym
from sqlalchemy.sql import func
from datetime import datetime

from app.models.base import Base


class Evaluation(Base):
    """
    Evaluation model for AI-generated answer feedback.
    
    Requirements: 18.1-18.14
    """
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    answer_id = Column(Integer, ForeignKey("answers.id", ondelete="CASCADE"), nullable=False, index=True, unique=True)
    
    # Scores (0-100)
    content_quality = Column(Float, default=0.0, nullable=False)
    clarity = Column(Float, default=0.0, nullable=False)
    confidence = Column(Float, default=0.0, nullable=False)
    technical_accuracy = Column(Float, default=0.0, nullable=False)
    overall_score = Column(Float, default=0.0, nullable=False)  # Weighted average
    
    # Feedback sections
    strengths = Column(JSON, default=list, nullable=False)  # Array of strength points
    improvements = Column(JSON, default=list, nullable=False)  # Array of improvement suggestions
    suggestions = Column(JSON, default=list, nullable=False)  # Array of actionable suggestions
    example_answer = Column(Text, nullable=True)  # Optional example answer
    
    # Metadata
    provider_name = Column(String(50), nullable=True)  # Which AI provider generated this
    evaluation_metadata = Column(JSON, nullable=True)  # Additional evaluation data
    
    # Timing
    evaluated_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=func.now(), nullable=False)
    
    communication_clarity = synonym('clarity')
    problem_solving = synonym('technical_accuracy')
    weaknesses = synonym('improvements')
    improvement_suggestions = synonym('suggestions')
    evaluation_text = synonym('example_answer')

    # Relationships
    answer = relationship("Answer", back_populates="evaluation")
    
    # Timestamps from base
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=func.now(), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<Evaluation(id={self.id}, answer_id={self.answer_id}, overall_score={self.overall_score})>"
    
    def to_dict(self):
        """Convert evaluation to dictionary"""
        return {
            'id': self.id,
            'answer_id': self.answer_id,
            'content_quality': self.content_quality,
            'clarity': self.clarity,
            'confidence': self.confidence,
            'technical_accuracy': self.technical_accuracy,
            'overall_score': self.overall_score,
            'strengths': self.strengths,
            'improvements': self.improvements,
            'suggestions': self.suggestions,
            'example_answer': self.example_answer,
            'provider_name': self.provider_name,
            'evaluated_at': self.evaluated_at.isoformat() if self.evaluated_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


