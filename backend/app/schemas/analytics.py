"""
Analytics schemas for API responses.
"""
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class ScoreOverTime(BaseModel):
    """Score data point for time series."""
    week: str = Field(..., description="Week start date (YYYY-MM-DD)")
    avg_score: float = Field(..., ge=0, le=100, description="Average score for the week")
    session_count: int = Field(..., ge=0, description="Number of sessions in the week")


class CategoryPerformance(BaseModel):
    """Performance breakdown by category."""
    category: str = Field(..., description="Question category")
    avg_score: float = Field(..., ge=0, le=100, description="Average score for category")
    question_count: int = Field(..., ge=0, description="Number of questions answered")
    trend: Optional[str] = Field(None, description="Trend: improving, declining, stable")


class PracticeRecommendation(BaseModel):
    """Personalized practice recommendation."""
    category: str = Field(..., description="Category to focus on")
    priority: str = Field(..., description="Priority: high, medium, low")
    suggestion: str = Field(..., description="Specific recommendation")
    current_score: float = Field(..., ge=0, le=100, description="Current average score")
    target_score: float = Field(..., ge=0, le=100, description="Target score to achieve")


class AnalyticsOverview(BaseModel):
    """Complete analytics dashboard data."""
    # Summary metrics
    total_interviews_completed: int = Field(..., ge=0, description="Total completed sessions")
    average_score_all_time: Optional[float] = Field(None, ge=0, le=100, description="Overall average score")
    average_score_last_30_days: Optional[float] = Field(None, ge=0, le=100, description="Recent 30-day average")
    improvement_rate: Optional[float] = Field(None, description="Percentage improvement (first 5 vs last 5)")
    total_practice_hours: float = Field(..., ge=0, description="Total practice time in hours")
    
    # Time series data
    score_over_time: List[ScoreOverTime] = Field(default_factory=list, description="Weekly score progression")
    
    # Category breakdown
    category_performance: List[CategoryPerformance] = Field(default_factory=list, description="Performance by category")
    
    # Strengths and weaknesses
    top_5_strengths: List[str] = Field(default_factory=list, description="Top performing categories")
    top_5_weaknesses: List[str] = Field(default_factory=list, description="Categories needing improvement")
    
    # Recommendations
    practice_recommendations: List[PracticeRecommendation] = Field(
        default_factory=list,
        description="Personalized practice suggestions"
    )
    
    # Metadata
    last_session_date: Optional[datetime] = Field(None, description="Date of most recent session")
    cache_hit: bool = Field(False, description="Whether data was served from cache")
    calculated_at: datetime = Field(default_factory=datetime.utcnow, description="When analytics were calculated")

    class Config:
        json_schema_extra = {
            "example": {
                "total_interviews_completed": 15,
                "average_score_all_time": 78.5,
                "average_score_last_30_days": 82.3,
                "improvement_rate": 12.5,
                "total_practice_hours": 8.5,
                "score_over_time": [
                    {"week": "2026-01-06", "avg_score": 75.0, "session_count": 3},
                    {"week": "2026-01-13", "avg_score": 78.5, "session_count": 4},
                    {"week": "2026-01-20", "avg_score": 82.0, "session_count": 5}
                ],
                "category_performance": [
                    {"category": "Technical", "avg_score": 85.0, "question_count": 20, "trend": "improving"},
                    {"category": "Behavioral", "avg_score": 75.0, "question_count": 15, "trend": "stable"}
                ],
                "top_5_strengths": ["Technical", "System_Design"],
                "top_5_weaknesses": ["Behavioral", "Domain_Specific"],
                "practice_recommendations": [
                    {
                        "category": "Behavioral",
                        "priority": "high",
                        "suggestion": "Focus on behavioral questions using STAR method",
                        "current_score": 75.0,
                        "target_score": 85.0
                    }
                ],
                "last_session_date": "2026-02-14T10:30:00",
                "cache_hit": False,
                "calculated_at": "2026-02-14T15:45:00"
            }
        }


class SessionAnalytics(BaseModel):
    """Analytics for a specific session."""
    session_id: int
    role: str
    difficulty: str
    overall_score: float = Field(..., ge=0, le=100)
    questions_answered: int
    time_taken_minutes: float
    completed_at: datetime
    category_scores: dict = Field(default_factory=dict, description="Scores by category")


class SkillAnalytics(BaseModel):
    """Analytics for skill performance."""
    skill_name: str
    times_tested: int
    average_score: float = Field(..., ge=0, le=100)
    last_tested: Optional[datetime] = None
    proficiency_level: str = Field(..., description="beginner, intermediate, advanced, expert")


class ProgressAnalytics(BaseModel):
    """Progress tracking over time."""
    start_date: datetime
    end_date: datetime
    sessions_completed: int
    average_score: float = Field(..., ge=0, le=100)
    improvement_percentage: float
    consistency_score: float = Field(..., ge=0, le=100, description="Practice consistency metric")
    milestone_reached: Optional[str] = None
