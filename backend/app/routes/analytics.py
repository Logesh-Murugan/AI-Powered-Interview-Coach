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
    force_refresh: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complete analytics overview for current user.
    
    Requirements: 20.1-20.15
    - Returns comprehensive performance metrics
    - Cached for 1 hour (unless force_refresh is True)
    - Response time < 100ms (cache hit) or < 500ms (cache miss)
    
    Returns:
        AnalyticsOverview: Complete analytics dashboard data
    """
    try:
        cache_service = CacheService()
        analytics_service = AnalyticsService(db, cache_service)
        
        if force_refresh:
            analytics_service.invalidate_cache(current_user.id)
            
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
    status_filter: Optional[str] = None,
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
    """
    try:
        cache_service = CacheService()
        analytics_service = AnalyticsService(db, cache_service)
        
        stats = analytics_service.get_session_statistics(
            current_user.id,
            date_range=date_range,
            status_filter=status_filter
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
    force_refresh: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get anonymous performance comparison against cohort.
    
    Requirements: 21.1-21.8
    - Force refresh allows bypassing stale cache (cached for 24h by default)
    """
    try:
        cache_service = CacheService()
        analytics_service = AnalyticsService(db, cache_service)
        
        if force_refresh:
            analytics_service.invalidate_cache(current_user.id)
            
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
