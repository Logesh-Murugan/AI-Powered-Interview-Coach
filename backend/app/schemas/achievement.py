"""
Achievement schemas for API requests and responses.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, List
from enum import Enum


class AchievementType(str, Enum):
    """Achievement types for gamification."""
    FIRST_INTERVIEW = "First_Interview"
    TEN_INTERVIEWS = "Ten_Interviews"
    FIFTY_INTERVIEWS = "Fifty_Interviews"
    PERFECT_SCORE = "Perfect_Score"
    SEVEN_DAY_STREAK = "Seven_Day_Streak"
    THIRTY_DAY_STREAK = "Thirty_Day_Streak"
    CATEGORY_MASTER = "Category_Master"


class AchievementDefinition(BaseModel):
    """Definition of an achievement with metadata."""
    type: AchievementType
    name: str
    description: str
    icon: str
    rarity: str = Field(..., description="common, rare, epic, legendary")
    
    class Config:
        json_schema_extra = {
            "example": {
                "type": "First_Interview",
                "name": "First Steps",
                "description": "Complete your first interview session",
                "icon": "🎯",
                "rarity": "common"
            }
        }


class UserAchievementResponse(BaseModel):
    """Response model for user's earned achievement."""
    id: int
    user_id: int
    achievement_type: AchievementType
    earned_at: datetime
    achievement_metadata: Optional[Dict] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "user_id": 123,
                "achievement_type": "First_Interview",
                "earned_at": "2026-02-14T10:30:00Z",
                "achievement_metadata": None
            }
        }


class AchievementProgress(BaseModel):
    """Progress toward earning an achievement."""
    achievement_type: AchievementType
    name: str
    description: str
    icon: str
    is_earned: bool
    earned_at: Optional[datetime] = None
    current_progress: int
    target_progress: int
    progress_percentage: float
    
    class Config:
        json_schema_extra = {
            "example": {
                "achievement_type": "Ten_Interviews",
                "name": "Getting Started",
                "description": "Complete 10 interview sessions",
                "icon": "🚀",
                "is_earned": False,
                "earned_at": None,
                "current_progress": 7,
                "target_progress": 10,
                "progress_percentage": 70.0
            }
        }


class AllAchievementsResponse(BaseModel):
    """Response with all available achievements."""
    achievements: List[AchievementDefinition]
    total_count: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "achievements": [
                    {
                        "type": "First_Interview",
                        "name": "First Steps",
                        "description": "Complete your first interview session",
                        "icon": "🎯",
                        "rarity": "common"
                    }
                ],
                "total_count": 7
            }
        }


class UserAchievementsResponse(BaseModel):
    """Response with user's earned achievements."""
    achievements: List[UserAchievementResponse]
    total_earned: int
    total_available: int
    completion_percentage: float
    
    class Config:
        json_schema_extra = {
            "example": {
                "achievements": [
                    {
                        "id": 1,
                        "user_id": 123,
                        "achievement_type": "First_Interview",
                        "earned_at": "2026-02-14T10:30:00Z",
                        "metadata": None
                    }
                ],
                "total_earned": 1,
                "total_available": 7,
                "completion_percentage": 14.29
            }
        }


class AchievementProgressResponse(BaseModel):
    """Response with progress toward all achievements."""
    progress: List[AchievementProgress]
    total_earned: int
    total_available: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "progress": [
                    {
                        "achievement_type": "First_Interview",
                        "name": "First Steps",
                        "description": "Complete your first interview session",
                        "icon": "🎯",
                        "is_earned": True,
                        "earned_at": "2026-02-14T10:30:00Z",
                        "current_progress": 1,
                        "target_progress": 1,
                        "progress_percentage": 100.0
                    }
                ],
                "total_earned": 1,
                "total_available": 7
            }
        }


class AchievementNotification(BaseModel):
    """Notification payload for newly earned achievement."""
    achievement_type: AchievementType
    name: str
    description: str
    icon: str
    earned_at: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "achievement_type": "First_Interview",
                "name": "First Steps",
                "description": "Complete your first interview session",
                "icon": "🎯",
                "earned_at": "2026-02-14T10:30:00Z"
            }
        }
