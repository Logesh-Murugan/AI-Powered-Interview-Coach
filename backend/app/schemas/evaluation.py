"""
Evaluation Schemas

Pydantic schemas for answer evaluation requests and responses.

Requirements: 18.1-18.14
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class EvaluationScores(BaseModel):
    """Evaluation scores for different criteria"""
    content_quality: float = Field(..., ge=0, le=100, description="Content quality score (0-100)")
    clarity: float = Field(..., ge=0, le=100, description="Clarity score (0-100)")
    confidence: float = Field(..., ge=0, le=100, description="Confidence score (0-100)")
    technical_accuracy: float = Field(..., ge=0, le=100, description="Technical accuracy score (0-100)")
    overall_score: float = Field(..., ge=0, le=100, description="Overall weighted score (0-100)")


class EvaluationFeedback(BaseModel):
    """Evaluation feedback sections"""
    strengths: List[str] = Field(..., description="List of strengths identified")
    improvements: List[str] = Field(..., description="List of areas for improvement")
    suggestions: List[str] = Field(..., description="List of actionable suggestions")
    example_answer: Optional[str] = Field(None, description="Example of a strong answer")


class EvaluationResponse(BaseModel):
    """Response schema for answer evaluation"""
    evaluation_id: int = Field(..., description="Evaluation ID")
    answer_id: int = Field(..., description="Answer ID")
    scores: EvaluationScores = Field(..., description="Evaluation scores")
    feedback: EvaluationFeedback = Field(..., description="Evaluation feedback")
    evaluated_at: Optional[str] = Field(None, description="Evaluation timestamp (ISO 8601)")
    
    class Config:
        from_attributes = True


class EvaluationRequest(BaseModel):
    """Request schema for triggering evaluation"""
    answer_id: int = Field(..., description="Answer ID to evaluate")
