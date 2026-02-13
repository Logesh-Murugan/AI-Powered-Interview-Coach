"""
Session Summary Schemas

Pydantic schemas for session summary requests and responses.

Requirements: 19.1-19.12
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class SessionSummaryResponse(BaseModel):
    """
    Response schema for session summary.
    
    Requirements: 19.1-19.12
    """
    id: int = Field(..., description="Summary ID")
    session_id: int = Field(..., description="Session ID")
    
    # Overall scores
    overall_session_score: float = Field(..., description="Overall session score (0-100)")
    
    # Average criterion scores
    avg_content_quality: float = Field(..., description="Average content quality score")
    avg_clarity: float = Field(..., description="Average clarity score")
    avg_confidence: float = Field(..., description="Average confidence score")
    avg_technical_accuracy: float = Field(..., description="Average technical accuracy score")
    
    # Trend analysis
    score_trend: Optional[float] = Field(None, description="Percentage change from previous session")
    previous_session_score: Optional[float] = Field(None, description="Previous session score")
    
    # Aggregated feedback
    top_strengths: List[str] = Field(..., description="Top 3 most mentioned strengths")
    top_improvements: List[str] = Field(..., description="Top 3 most mentioned improvements")
    
    # Category performance
    category_performance: Dict[str, float] = Field(..., description="Average score per category")
    
    # Visualization data
    radar_chart_data: Optional[Dict[str, Any]] = Field(None, description="Radar chart data for criteria")
    line_chart_data: Optional[Dict[str, Any]] = Field(None, description="Line chart data for progression")
    
    # Metadata
    total_questions: int = Field(..., description="Total number of questions")
    total_time_seconds: int = Field(..., description="Total time spent in seconds")
    
    # Timestamps
    generated_at: Optional[str] = Field(None, description="When summary was generated")
    created_at: Optional[str] = Field(None, description="When record was created")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "session_id": 123,
                "overall_session_score": 78.5,
                "avg_content_quality": 80.0,
                "avg_clarity": 75.0,
                "avg_confidence": 82.0,
                "avg_technical_accuracy": 77.0,
                "score_trend": 5.2,
                "previous_session_score": 74.6,
                "top_strengths": [
                    "Clear communication",
                    "Good technical knowledge",
                    "Structured answers"
                ],
                "top_improvements": [
                    "Add more specific examples",
                    "Improve time management",
                    "Provide more context"
                ],
                "category_performance": {
                    "Technical": 82.5,
                    "Behavioral": 75.0,
                    "System_Design": 78.0
                },
                "radar_chart_data": {
                    "labels": ["Content Quality", "Clarity", "Confidence", "Technical Accuracy"],
                    "values": [80.0, 75.0, 82.0, 77.0]
                },
                "line_chart_data": {
                    "labels": ["Session 1", "Session 2", "Session 3"],
                    "scores": [70.5, 74.6, 78.5]
                },
                "total_questions": 5,
                "total_time_seconds": 1800,
                "generated_at": "2026-02-12T10:30:00",
                "created_at": "2026-02-12T10:30:00"
            }
        }
