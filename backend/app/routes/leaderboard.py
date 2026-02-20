"""
Leaderboard API endpoints.
Requirements: 24.1-24.10
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.leaderboard_service import LeaderboardService
from app.schemas.leaderboard import (
    LeaderboardResponse,
    LeaderboardEntryResponse,
    LeaderboardPreferenceUpdate,
    LeaderboardPreferenceResponse
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=LeaderboardResponse)
async def get_leaderboard(
    period: str = Query('weekly', regex='^(weekly|all_time)$', description="Leaderboard period"),
    db: Session = Depends(get_db)
):
    """
    Get leaderboard for specified period.
    
    Requirements: 24.8, 24.9
    
    - **period**: 'weekly' or 'all_time'
    
    Returns leaderboard with top 10 users, anonymized usernames, and cached data (< 50ms).
    """
    start_time = datetime.utcnow()
    
    try:
        service = LeaderboardService(db)
        entries = service.get_leaderboard(period)
        
        # Convert to response format
        entry_responses = [
            LeaderboardEntryResponse(**entry)
            for entry in entries
        ]
        
        # Get last updated time
        last_updated = entries[0]['calculated_at'] if entries else datetime.utcnow().isoformat()
        
        elapsed = (datetime.utcnow() - start_time).total_seconds() * 1000
        logger.info(f"Leaderboard endpoint response time: {elapsed:.2f}ms")
        
        # Req 24.9: Response time < 50ms (from cache)
        if elapsed > 50 and entries:
            logger.warning(f"Leaderboard response time exceeded 50ms: {elapsed:.2f}ms")
        
        return LeaderboardResponse(
            period=period,
            entries=entry_responses,
            total_entries=len(entry_responses),
            last_updated=last_updated
        )
        
    except Exception as e:
        logger.error(f"Error getting leaderboard: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get leaderboard: {str(e)}")


@router.get("/preference", response_model=LeaderboardPreferenceResponse)
async def get_leaderboard_preference(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's leaderboard opt-out preference.
    
    Requirement: 24.10
    """
    try:
        service = LeaderboardService(db)
        preference = service.get_user_leaderboard_preference(current_user.id)
        
        return LeaderboardPreferenceResponse(**preference)
        
    except Exception as e:
        logger.error(f"Error getting leaderboard preference: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get preference: {str(e)}")


@router.put("/preference", response_model=LeaderboardPreferenceResponse)
async def update_leaderboard_preference(
    preference: LeaderboardPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's leaderboard opt-out preference.
    
    Requirement: 24.10
    
    - **opt_out**: True to opt out of leaderboard, False to opt in
    """
    try:
        service = LeaderboardService(db)
        result = service.update_user_leaderboard_preference(current_user.id, preference.opt_out)
        
        logger.info(f"User {current_user.id} updated leaderboard preference: opt_out={preference.opt_out}")
        
        return LeaderboardPreferenceResponse(**result)
        
    except Exception as e:
        logger.error(f"Error updating leaderboard preference: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update preference: {str(e)}")
