"""
Company Coaching Background Tasks

Celery tasks for company coaching maintenance and monitoring.

Requirements: 29.11
"""
from celery import shared_task
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.company_coaching_session import CompanyCoachingSession
from loguru import logger


@shared_task(name="cleanup_old_coaching_sessions")
def cleanup_old_coaching_sessions():
    """
    Clean up coaching sessions older than 90 days.
    
    Runs daily to maintain database size.
    """
    db: Session = SessionLocal()
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=90)
        
        deleted_count = db.query(CompanyCoachingSession).filter(
            CompanyCoachingSession.created_at < cutoff_date
        ).delete()
        
        db.commit()
        
        logger.info(f"Cleaned up {deleted_count} old coaching sessions")
        return {"deleted_count": deleted_count}
    except Exception as e:
        db.rollback()
        logger.error(f"Error cleaning up coaching sessions: {e}")
        raise
    finally:
        db.close()


@shared_task(name="track_coaching_usage")
def track_coaching_usage():
    """
    Track coaching session usage for monitoring and rate limiting.
    
    Runs hourly to monitor usage patterns.
    """
    db: Session = SessionLocal()
    try:
        from sqlalchemy import func
        
        # Get current month stats
        first_day_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Total sessions this month
        total_sessions = db.query(func.count(CompanyCoachingSession.id)).filter(
            CompanyCoachingSession.created_at >= first_day_of_month
        ).scalar()
        
        # Unique users this month
        unique_users = db.query(func.count(func.distinct(CompanyCoachingSession.user_id))).filter(
            CompanyCoachingSession.created_at >= first_day_of_month
        ).scalar()
        
        # Average execution time
        avg_execution_time = db.query(func.avg(CompanyCoachingSession.execution_time_ms)).filter(
            CompanyCoachingSession.created_at >= first_day_of_month
        ).scalar()
        
        # Most popular companies
        popular_companies = db.query(
            CompanyCoachingSession.company_name,
            func.count(CompanyCoachingSession.id).label('count')
        ).filter(
            CompanyCoachingSession.created_at >= first_day_of_month
        ).group_by(CompanyCoachingSession.company_name).order_by(
            func.count(CompanyCoachingSession.id).desc()
        ).limit(10).all()
        
        stats = {
            'total_sessions': total_sessions,
            'unique_users': unique_users,
            'avg_execution_time_ms': float(avg_execution_time) if avg_execution_time else 0,
            'popular_companies': [
                {'company': company, 'count': count}
                for company, count in popular_companies
            ]
        }
        
        logger.info(f"Coaching usage stats: {stats}")
        return stats
    except Exception as e:
        logger.error(f"Error tracking coaching usage: {e}")
        raise
    finally:
        db.close()


# Schedule tasks (configure in Celery beat)
# cleanup_old_coaching_sessions: Daily at 2 AM
# track_coaching_usage: Hourly
