"""
Streak tracking API endpoints.
Requirements: 23.1-23.10
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.streak_service import StreakService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/current")
async def get_current_streak(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Get current streak information for authenticated user.
    
    Returns current streak, longest streak, and activity status.
    """
    try:
        service = StreakService(db)
        streak_info = service.get_current_streak(current_user.id)
        return {
            "success": True,
            "data": streak_info
        }
    except Exception as e:
        logger.error(f"Error fetching current streak for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch streak information")


@router.get("/history")
async def get_streak_history(
    days: int = Query(default=30, ge=1, le=90, description="Number of days of history"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Get streak history for authenticated user.
    
    Args:
        days: Number of days of history to return (1-90)
    
    Returns streak history as array of {date, streak_count} objects.
    """
    try:
        service = StreakService(db)
        history = service.get_streak_history(current_user.id, days)
        return {
            "success": True,
            "data": {
                "history": history,
                "days_requested": days,
                "total_entries": len(history)
            }
        }
    except Exception as e:
        logger.error(f"Error fetching streak history for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch streak history")


@router.get("/stats")
async def get_streak_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Get comprehensive streak statistics for authenticated user.
    
    Returns detailed statistics including current streak, longest streak,
    total practice days, average streak, and progress toward achievements.
    """
    try:
        service = StreakService(db)
        stats = service.get_streak_stats(current_user.id)
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        logger.error(f"Error fetching streak stats for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch streak statistics")
