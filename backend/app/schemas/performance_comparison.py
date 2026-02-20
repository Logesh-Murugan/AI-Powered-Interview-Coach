"""
Performance comparison schemas for anonymous peer comparison.

Requirements: 21.1-21.8
"""
from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class CohortStats(BaseModel):
    """Statistics for user cohort (same target role)."""
    target_role: str = Field(..., description="Target role for this cohort")
    total_users: int = Field(..., ge=0, description="Total users in cohort")
    cohort_average_score: float = Field(..., ge=0, le=100, description="Average score for cohort")
    cohort_median_score: float = Field(..., ge=0, le=100, description="Median score for cohort")
    score_distribution: dict = Field(default_factory=dict, description="Score distribution by range")


class TopPerformerHabits(BaseModel):
    """Practice habits of top performers (90th percentile)."""
    avg_sessions_per_week: float = Field(..., ge=0, description="Average sessions per week")
    avg_practice_hours: float = Field(..., ge=0, description="Average practice hours")
    avg_questions_per_session: float = Field(..., ge=0, description="Average questions per session")
    most_practiced_categories: list[str] = Field(default_factory=list, description="Top 3 categories")
    consistency_score: float = Field(..., ge=0, le=100, description="Practice consistency metric")


class PerformanceComparison(BaseModel):
    """
    Anonymous performance comparison data.
    
    Requirements: 21.1-21.8
    """
    # User's performance
    user_average_score: float = Field(..., ge=0, le=100, description="User's average score")
    user_percentile: float = Field(..., ge=0, le=100, description="User's percentile rank (0-100)")
    user_rank_description: str = Field(..., description="Human-readable rank description")
    
    # Cohort statistics
    cohort_stats: CohortStats = Field(..., description="Statistics for user's cohort")
    
    # Comparison insights
    score_difference: float = Field(..., description="Difference from cohort average (can be negative)")
    performance_level: str = Field(..., description="beginner, intermediate, advanced, expert")
    
    # Top performer insights
    top_performer_habits: TopPerformerHabits = Field(..., description="Habits of top 10% performers")
    
    # Recommendations
    improvement_suggestions: list[str] = Field(default_factory=list, description="Personalized suggestions")
    
    # Metadata
    comparison_date: datetime = Field(default_factory=datetime.utcnow, description="When comparison was calculated")
    cache_hit: bool = Field(False, description="Whether data was served from cache")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_average_score": 78.5,
                "user_percentile": 65.0,
                "user_rank_description": "You're performing better than 65% of users preparing for Software Engineer roles",
                "cohort_stats": {
                    "target_role": "Software Engineer",
                    "total_users": 150,
                    "cohort_average_score": 75.2,
                    "cohort_median_score": 76.0,
                    "score_distribution": {
                        "0-60": 20,
                        "60-70": 35,
                        "70-80": 45,
                        "80-90": 35,
                        "90-100": 15
                    }
                },
                "score_difference": 3.3,
                "performance_level": "intermediate",
                "top_performer_habits": {
                    "avg_sessions_per_week": 4.5,
                    "avg_practice_hours": 6.2,
                    "avg_questions_per_session": 8.0,
                    "most_practiced_categories": ["Technical", "System_Design", "Behavioral"],
                    "consistency_score": 85.0
                },
                "improvement_suggestions": [
                    "Top performers practice 4-5 times per week. Consider increasing your practice frequency.",
                    "Focus on Technical and System_Design categories to reach the 90th percentile."
                ],
                "comparison_date": "2026-02-14T16:00:00",
                "cache_hit": False
            }
        }
