"""
Celery tasks for leaderboard system.
Requirements: 24.1
"""
from app.database import SessionLocal
from app.services.leaderboard_service import LeaderboardService
from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(name="calculate_daily_leaderboards")
def calculate_daily_leaderboards():
    """
    Calculate both weekly and all-time leaderboards.
    
    Requirement: 24.1 - Scheduled daily at midnight UTC
    
    This task:
    - Calculates weekly leaderboard (last 7 days)
    - Calculates all-time leaderboard
    - Caches results in Redis
    """
    db = SessionLocal()
    
    try:
        service = LeaderboardService(db)
        
        # Calculate weekly leaderboard
        logger.info("Starting weekly leaderboard calculation")
        weekly_entries = service.calculate_leaderboard('weekly')
        logger.info(f"Weekly leaderboard calculated: {len(weekly_entries)} entries")
        
        # Calculate all-time leaderboard
        logger.info("Starting all-time leaderboard calculation")
        alltime_entries = service.calculate_leaderboard('all_time')
        logger.info(f"All-time leaderboard calculated: {len(alltime_entries)} entries")
        
        return {
            'status': 'success',
            'weekly_entries': len(weekly_entries),
            'alltime_entries': len(alltime_entries)
        }
        
    except Exception as e:
        logger.error(f"Error calculating leaderboards: {e}")
        return {
            'status': 'error',
            'message': str(e)
        }
    finally:
        db.close()
