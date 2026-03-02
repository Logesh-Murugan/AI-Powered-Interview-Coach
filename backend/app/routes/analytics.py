"""
Analytics API routes.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.analytics_service import AnalyticsService
from app.services.cache_service import CacheService
from app.schemas.analytics import AnalyticsOverview, SessionStatistics, SkillStatistics, ProgressMetrics, AIInsights
from app.schemas.performance_comparison import PerformanceComparison

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/overview", response_model=AnalyticsOverview)
async def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complete analytics overview for current user.
    
    Requirements: 20.1-20.15
    - Returns comprehensive performance metrics
    - Cached for 1 hour
    - Response time < 100ms (cache hit) or < 500ms (cache miss)
    
    Returns:
        AnalyticsOverview: Complete analytics dashboard data
    """
    try:
        cache_service = CacheService()
        analytics_service = AnalyticsService(db, cache_service)
        
        analytics = analytics_service.get_analytics_overview(current_user.id)
        
        logger.info(
            f"Analytics overview retrieved for user {current_user.id}, "
            f"cache_hit={analytics.cache_hit}"
        )
        
        return analytics
        
    except Exception as e:
        logger.error(f"Error retrieving analytics for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve analytics data"
        )


@router.get("/sessions", response_model=SessionStatistics)
async def get_session_analytics(
    date_range: Optional[int] = 30,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get session history with analytics.
    
    Requirements: 6.6
    - Returns sessions_by_date, average_duration, completion_rate
    - Supports date_range filter (days, default 30)
    - Supports status filter (completed, in_progress, abandoned)
    - Cached for 1 hour
    
    Args:
        date_range: Number of days to include (default 30)
        status: Filter by session status (optional)
        
    Returns:
        SessionStatistics: Session analytics data
    """
    try:
        cache_service = CacheService()
        analytics_service = AnalyticsService(db, cache_service)
        
        stats = analytics_service.get_session_statistics(
            current_user.id,
            date_range=date_range,
            status_filter=status
        )
        
        logger.info(
            f"Session analytics retrieved for user {current_user.id}, "
            f"cache_hit={stats.get('cache_hit', False)}"
        )
        
        return SessionStatistics(**stats)
        
    except Exception as e:
        logger.error(f"Error retrieving session analytics for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve session analytics"
        )


@router.get("/skills", response_model=SkillStatistics)
async def get_skill_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get skill-based performance analytics.
    
    Requirements: 6.6
    - Returns performance_by_skill, top_skills, weak_skills
    - Calculates average scores per skill from resume
    - Cached for 1 hour
    
    Returns:
        SkillStatistics: Skill performance data
    """
    try:
        cache_service = CacheService()
        analytics_service = AnalyticsService(db, cache_service)
        
        stats = analytics_service.get_skill_statistics(current_user.id)
        
        logger.info(
            f"Skill analytics retrieved for user {current_user.id}, "
            f"cache_hit={stats.get('cache_hit', False)}"
        )
        
        return SkillStatistics(**stats)
        
    except Exception as e:
        logger.error(f"Error retrieving skill analytics for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve skill analytics"
        )


@router.get("/progress", response_model=ProgressMetrics)
async def get_progress_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get progress tracking over time.
    
    Requirements: 6.6
    - Returns weekly_improvement, monthly_improvement, trend_direction
    - Calculates score deltas over time periods
    - Includes confidence intervals for trends
    - Cached for 1 hour
    
    Returns:
        ProgressMetrics: Progress and improvement metrics
    """
    try:
        cache_service = CacheService()
        analytics_service = AnalyticsService(db, cache_service)
        
        metrics = analytics_service.get_progress_metrics(current_user.id)
        
        logger.info(
            f"Progress analytics retrieved for user {current_user.id}, "
            f"cache_hit={metrics.get('cache_hit', False)}"
        )
        
        return ProgressMetrics(**metrics)
        
    except Exception as e:
        logger.error(f"Error retrieving progress analytics for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve progress analytics"
        )


@router.get("/insights", response_model=AIInsights)
async def get_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get AI-generated insights and recommendations.
    
    Requirements: 6.6, 13.7
    - Analyzes user performance patterns using AI
    - Generates personalized recommendations
    - Returns insights_text, recommendations, readiness_score
    - Cached for 24 hours
    
    Returns:
        AIInsights: AI-generated insights and recommendations
    """
    try:
        cache_service = CacheService()
        analytics_service = AnalyticsService(db, cache_service)
        
        insights = await analytics_service.get_ai_insights(current_user.id)
        
        logger.info(
            f"AI insights retrieved for user {current_user.id}, "
            f"cache_hit={insights.get('cache_hit', False)}"
        )
        
        return AIInsights(**insights)
        
    except ValueError as e:
        logger.warning(f"AI insights validation error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error retrieving AI insights for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve AI insights"
        )


@router.get("/comparison", response_model=PerformanceComparison)
async def get_performance_comparison(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get anonymous performance comparison against cohort.
    
    Requirements: 21.1-21.8
    - Compare user against others with same target role
    - Calculate percentile rank
    - Show top performer habits
    - Maintain complete anonymity
    - Response time < 300ms
    
    Returns:
        PerformanceComparison: Anonymous comparison data
    
    Raises:
        400: User must have target role set
        400: User must complete at least one interview
        400: Not enough users in cohort for comparison
        500: Internal server error
    """
    try:
        cache_service = CacheService()
        analytics_service = AnalyticsService(db, cache_service)
        
        comparison = analytics_service.get_performance_comparison(current_user.id)
        
        logger.info(
            f"Performance comparison retrieved for user {current_user.id}, "
            f"percentile={comparison.user_percentile}, cache_hit={comparison.cache_hit}"
        )
        
        return comparison
        
    except ValueError as e:
        logger.warning(f"Performance comparison validation error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error retrieving performance comparison for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve performance comparison data"
        )
