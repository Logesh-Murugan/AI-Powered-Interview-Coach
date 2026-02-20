"""
Leaderboard service for gamification system.
Requirements: 24.1-24.10
"""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from app.models.leaderboard_entry import LeaderboardEntry
from app.models.user import User
from app.models.interview_session import InterviewSession
from app.models.session_summary import SessionSummary
from app.services.cache_service import CacheService
from app.utils.cache_keys import CacheKeys
import random
import logging

logger = logging.getLogger(__name__)


class LeaderboardService:
    """Service for managing leaderboards."""
    
    def __init__(self, db: Session):
        self.db = db
        self.cache_service = CacheService()
    
    def calculate_leaderboard(self, period: str = 'weekly') -> List[LeaderboardEntry]:
        """
        Calculate leaderboard for specified period.
        
        Requirements: 24.1-24.7
        
        Args:
            period: 'weekly' or 'all_time'
        
        Returns:
            List of LeaderboardEntry objects
        """
        start_time = datetime.utcnow()
        
        try:
            # Determine date filter (Req 24.2)
            if period == 'weekly':
                cutoff_date = datetime.utcnow() - timedelta(days=7)
                date_filter = InterviewSession.created_at >= cutoff_date
            else:  # all_time (Req 24.7)
                date_filter = True
            
            # Query user performance (Req 24.3)
            query = self.db.query(
                InterviewSession.user_id,
                func.avg(SessionSummary.overall_session_score).label('average_score'),
                func.count(InterviewSession.id).label('total_interviews')
            ).join(
                SessionSummary, InterviewSession.id == SessionSummary.session_id
            ).join(
                User, InterviewSession.user_id == User.id
            ).filter(
                and_(
                    InterviewSession.status == 'completed',
                    InterviewSession.deleted_at.is_(None),
                    SessionSummary.deleted_at.is_(None),
                    User.deleted_at.is_(None),
                    User.leaderboard_opt_out == False,  # Req 24.10
                    date_filter
                )
            ).group_by(
                InterviewSession.user_id
            ).order_by(
                desc('average_score')  # Req 24.3
            ).limit(10)  # Req 24.4: Top 10 users
            
            results = query.all()
            
            # Clear old entries for this period
            self.db.query(LeaderboardEntry).filter(
                LeaderboardEntry.period == period
            ).delete()
            
            # Create leaderboard entries
            entries = []
            calculated_at = datetime.utcnow()
            
            for rank, result in enumerate(results, start=1):
                # Anonymize username (Req 24.5)
                anonymous_username = self._generate_anonymous_username()
                
                # Create entry (Req 24.6)
                entry = LeaderboardEntry(
                    period=period,
                    rank=rank,
                    anonymous_username=anonymous_username,
                    average_score=round(float(result.average_score), 2),
                    total_interviews=result.total_interviews,
                    calculated_at=calculated_at
                )
                
                self.db.add(entry)
                entries.append(entry)
            
            self.db.commit()
            
            # Cache results (Req 24.8)
            self._cache_leaderboard(period, entries)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds() * 1000
            logger.info(f"Leaderboard calculated for {period}: {len(entries)} entries in {elapsed:.2f}ms")
            
            return entries
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error calculating leaderboard for {period}: {e}")
            raise
    
    def get_leaderboard(self, period: str = 'weekly') -> List[Dict]:
        """
        Get leaderboard for specified period.
        
        Requirements: 24.8, 24.9
        
        Args:
            period: 'weekly' or 'all_time'
        
        Returns:
            List of leaderboard entries as dictionaries
        """
        start_time = datetime.utcnow()
        
        # Try to get from cache first (Req 24.8, 24.9)
        cache_key = CacheKeys.leaderboard(period)
        cached_data = self.cache_service.get(cache_key)
        
        if cached_data:
            elapsed = (datetime.utcnow() - start_time).total_seconds() * 1000
            logger.info(f"Leaderboard retrieved from cache for {period} in {elapsed:.2f}ms")
            return cached_data
        
        # Get from database
        entries = self.db.query(LeaderboardEntry).filter(
            LeaderboardEntry.period == period
        ).order_by(LeaderboardEntry.rank).all()
        
        # Convert to dict
        result = [
            {
                'rank': entry.rank,
                'anonymous_username': entry.anonymous_username,
                'average_score': entry.average_score,
                'total_interviews': entry.total_interviews,
                'calculated_at': entry.calculated_at.isoformat()
            }
            for entry in entries
        ]
        
        # Cache for 24 hours (Req 24.8)
        self.cache_service.set(cache_key, result, ttl=86400)
        
        elapsed = (datetime.utcnow() - start_time).total_seconds() * 1000
        logger.info(f"Leaderboard retrieved from database for {period} in {elapsed:.2f}ms")
        
        return result
    
    def _generate_anonymous_username(self) -> str:
        """
        Generate anonymous username in format User_XXXX.
        
        Requirement: 24.5
        
        Returns:
            Anonymous username string
        """
        random_digits = random.randint(1000, 9999)
        return f"User_{random_digits}"
    
    def _cache_leaderboard(self, period: str, entries: List[LeaderboardEntry]):
        """
        Cache leaderboard entries in Redis.
        
        Requirement: 24.8
        
        Args:
            period: 'weekly' or 'all_time'
            entries: List of LeaderboardEntry objects
        """
        cache_key = CacheKeys.leaderboard(period)
        
        data = [
            {
                'rank': entry.rank,
                'anonymous_username': entry.anonymous_username,
                'average_score': entry.average_score,
                'total_interviews': entry.total_interviews,
                'calculated_at': entry.calculated_at.isoformat()
            }
            for entry in entries
        ]
        
        # Cache for 24 hours (Req 24.8)
        self.cache_service.set(cache_key, data, ttl=86400)
        logger.info(f"Leaderboard cached for {period}: {len(entries)} entries")
    
    def update_user_leaderboard_preference(self, user_id: int, opt_out: bool) -> Dict:
        """
        Update user's leaderboard opt-out preference.
        
        Requirement: 24.10
        
        Args:
            user_id: User ID
            opt_out: True to opt out, False to opt in
        
        Returns:
            Dictionary with updated preference
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        user.leaderboard_opt_out = opt_out
        self.db.commit()
        
        logger.info(f"User {user_id} leaderboard opt-out set to {opt_out}")
        
        return {
            'user_id': user_id,
            'leaderboard_opt_out': opt_out
        }
    
    def get_user_leaderboard_preference(self, user_id: int) -> Dict:
        """
        Get user's leaderboard opt-out preference.
        
        Requirement: 24.10
        
        Args:
            user_id: User ID
        
        Returns:
            Dictionary with preference
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        return {
            'user_id': user_id,
            'leaderboard_opt_out': user.leaderboard_opt_out
        }
