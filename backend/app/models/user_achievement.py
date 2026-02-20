"""
User Achievement model for gamification system.
"""
from sqlalchemy import Column, Integer, ForeignKey, Enum as SQLEnum, DateTime, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum
from datetime import datetime


class AchievementType(str, enum.Enum):
    """Achievement types for gamification."""
    FIRST_INTERVIEW = "First_Interview"
    TEN_INTERVIEWS = "Ten_Interviews"
    FIFTY_INTERVIEWS = "Fifty_Interviews"
    PERFECT_SCORE = "Perfect_Score"
    SEVEN_DAY_STREAK = "Seven_Day_Streak"
    THIRTY_DAY_STREAK = "Thirty_Day_Streak"
    CATEGORY_MASTER = "Category_Master"


class UserAchievement(BaseModel):
    """
    User achievement model for tracking earned badges.
    
    Requirements: 22.1-22.10
    """
    __tablename__ = "user_achievements"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    achievement_type = Column(SQLEnum(AchievementType), nullable=False, index=True)
    earned_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    achievement_metadata = Column(JSON, nullable=True)  # Store additional context (e.g., category for Category_Master)
    
    # Relationships
    user = relationship("User", back_populates="achievements")
    
    def __repr__(self):
        return f"<UserAchievement(user_id={self.user_id}, type={self.achievement_type}, earned_at={self.earned_at})>"
