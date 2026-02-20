"""
Achievement API endpoints.
Requirements: 22.1-22.10
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.achievement_service import AchievementService, ACHIEVEMENT_DEFINITIONS
from app.schemas.achievement import (
    AllAchievementsResponse,
    UserAchievementsResponse,
    AchievementProgressResponse,
    UserAchievementResponse,
    AchievementDefinition
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=AllAchievementsResponse)
async def get_all_achievements(
    db: Session = Depends(get_db)
):
    """
    Get all available achievements.
    
    Returns list of all achievement definitions with metadata.
    """
    try:
        service = AchievementService(db)
        achievements = service.get_all_achievements()
        
        return AllAchievementsResponse(
            achievements=achievements,
            total_count=len(achievements)
        )
    except Exception as e:
        logger.error(f"Error fetching all achievements: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch achievements")


@router.get("/user", response_model=UserAchievementsResponse)
async def get_user_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's earned achievements.
    
    Returns list of achievements earned by the authenticated user.
    """
    try:
        service = AchievementService(db)
        achievements = service.get_user_achievements(current_user.id)
        total_available = len(ACHIEVEMENT_DEFINITIONS)
        total_earned = len(achievements)
        completion_percentage = (total_earned / total_available * 100) if total_available > 0 else 0
        
        return UserAchievementsResponse(
            achievements=[
                UserAchievementResponse(
                    id=a.id,
                    user_id=a.user_id,
                    achievement_type=a.achievement_type,
                    earned_at=a.earned_at,
                    achievement_metadata=a.achievement_metadata
                )
                for a in achievements
            ],
            total_earned=total_earned,
            total_available=total_available,
            completion_percentage=round(completion_percentage, 2)
        )
    except Exception as e:
        logger.error(f"Error fetching user achievements for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user achievements")


@router.get("/progress", response_model=AchievementProgressResponse)
async def get_achievement_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get progress toward all achievements for current user.
    
    Returns detailed progress information for each achievement,
    including current progress, target, and percentage complete.
    """
    try:
        service = AchievementService(db)
        progress = service.get_achievement_progress(current_user.id)
        total_earned = sum(1 for p in progress if p.is_earned)
        total_available = len(progress)
        
        return AchievementProgressResponse(
            progress=progress,
            total_earned=total_earned,
            total_available=total_available
        )
    except Exception as e:
        logger.error(f"Error fetching achievement progress for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch achievement progress")
