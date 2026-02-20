"""
Streak tracking service for gamification.
Requirements: 23.1-23.10
"""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.user import User
from app.models.user_achievement import AchievementType
from app.services.achievement_service import AchievementService
import logging

logger = logging.getLogger(__name__)


class StreakService:
    """Service for tracking user practice streaks."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def update_streak(self, user_id: int) -> Dict:
        """
        Update user's practice streak after session completion.
        
        Requirements: 23.1-23.10
        
        Args:
            user_id: User ID
        
        Returns:
            Dictionary with streak information
        """
        start_time = datetime.utcnow()
        
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError(f"User {user_id} not found")
            
            current_time = datetime.utcnow()
            last_practice = user.last_practice_date
            
            # Calculate new streak
            new_streak = self._calculate_new_streak(current_time, last_practice, user.current_streak)
            
            # Update user fields (Req 23.1, 23.2)
            user.last_practice_date = current_time
            old_streak = user.current_streak or 0
            user.current_streak = new_streak
            
            # Update longest streak if needed
            if new_streak > (user.longest_streak or 0):
                user.longest_streak = new_streak
            
            # Update streak history (Req 23.9)
            streak_history = user.streak_history or []
            streak_history.append({
                'date': current_time.isoformat(),
                'streak_count': new_streak
            })
            # Keep only last 90 days of history
            if len(streak_history) > 90:
                streak_history = streak_history[-90:]
            user.streak_history = streak_history
            
            self.db.commit()
            self.db.refresh(user)
            
            # Check and award streak achievements (Req 23.7, 23.8)
            achievement_service = AchievementService(self.db)
            awarded_achievements = []
            
            if new_streak >= 7 and old_streak < 7:
                achievement = achievement_service.check_and_award_achievement(
                    user_id,
                    AchievementType.SEVEN_DAY_STREAK
                )
                if achievement:
                    awarded_achievements.append(achievement)
                    logger.info(f"Awarded Seven_Day_Streak to user {user_id}")
            
            if new_streak >= 30 and old_streak < 30:
                achievement = achievement_service.check_and_award_achievement(
                    user_id,
                    AchievementType.THIRTY_DAY_STREAK
                )
                if achievement:
                    awarded_achievements.append(achievement)
                    logger.info(f"Awarded Thirty_Day_Streak to user {user_id}")
            
            # Req 23.10: Complete within 100ms
            elapsed = (datetime.utcnow() - start_time).total_seconds() * 1000
            logger.info(f"Streak updated for user {user_id}: {old_streak} -> {new_streak} in {elapsed:.2f}ms")
            
            return {
                'user_id': user_id,
                'current_streak': new_streak,
                'longest_streak': user.longest_streak,
                'last_practice_date': current_time.isoformat(),
                'streak_increased': new_streak > old_streak,
                'achievements_awarded': [a.achievement_type.value for a in awarded_achievements],
                'processing_time_ms': round(elapsed, 2)
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating streak for user {user_id}: {e}")
            raise
    
    def _calculate_new_streak(
        self,
        current_time: datetime,
        last_practice: Optional[datetime],
        current_streak: int
    ) -> int:
        """
        Calculate new streak value based on time since last practice.
        
        Requirements: 23.3, 23.4, 23.5, 23.6
        
        Args:
            current_time: Current timestamp
            last_practice: Last practice timestamp (can be None)
            current_streak: Current streak count
        
        Returns:
            New streak count
        """
        # First practice ever
        if last_practice is None:
            return 1
        
        # Calculate time difference
        time_diff = current_time - last_practice
        hours_diff = time_diff.total_seconds() / 3600
        
        # Req 23.4: Increment if within 24 hours
        if hours_diff <= 24:
            return current_streak + 1
        
        # Req 23.5: Reset to 1 if gap > 24 hours but <= 48 hours (grace period)
        elif hours_diff <= 48:
            logger.info(f"Streak reset to 1 (grace period): {hours_diff:.1f} hours since last practice")
            return 1
        
        # Req 23.6: Reset to 0 if gap > 48 hours
        else:
            logger.info(f"Streak broken: {hours_diff:.1f} hours since last practice")
            return 0
    
    def get_current_streak(self, user_id: int) -> Dict:
        """
        Get current streak information for a user.
        
        Args:
            user_id: User ID
        
        Returns:
            Dictionary with current streak info
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        # Check if streak is still active
        is_active = False
        if user.last_practice_date:
            time_diff = datetime.utcnow() - user.last_practice_date
            hours_diff = time_diff.total_seconds() / 3600
            is_active = hours_diff <= 48  # Within grace period
        
        return {
            'user_id': user_id,
            'current_streak': user.current_streak or 0,
            'longest_streak': user.longest_streak or 0,
            'last_practice_date': user.last_practice_date.isoformat() if user.last_practice_date else None,
            'is_active': is_active,
            'days_until_seven': max(0, 7 - (user.current_streak or 0)),
            'days_until_thirty': max(0, 30 - (user.current_streak or 0))
        }
    
    def get_streak_history(self, user_id: int, days: int = 30) -> List[Dict]:
        """
        Get streak history for a user.
        
        Requirements: 23.9
        
        Args:
            user_id: User ID
            days: Number of days of history to return
        
        Returns:
            List of streak history entries
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        streak_history = user.streak_history or []
        
        # Filter to requested number of days
        if days and len(streak_history) > days:
            streak_history = streak_history[-days:]
        
        return streak_history
    
    def get_streak_stats(self, user_id: int) -> Dict:
        """
        Get comprehensive streak statistics for a user.
        
        Args:
            user_id: User ID
        
        Returns:
            Dictionary with streak statistics
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        streak_history = user.streak_history or []
        
        # Calculate statistics
        total_practice_days = len(streak_history)
        
        # Calculate average streak from history
        if streak_history:
            streak_values = [entry.get('streak_count', 0) for entry in streak_history]
            avg_streak = sum(streak_values) / len(streak_values)
        else:
            avg_streak = 0
        
        # Check if streak is active
        is_active = False
        if user.last_practice_date:
            time_diff = datetime.utcnow() - user.last_practice_date
            hours_diff = time_diff.total_seconds() / 3600
            is_active = hours_diff <= 48
        
        return {
            'user_id': user_id,
            'current_streak': user.current_streak or 0,
            'longest_streak': user.longest_streak or 0,
            'total_practice_days': total_practice_days,
            'average_streak': round(avg_streak, 2),
            'is_active': is_active,
            'last_practice_date': user.last_practice_date.isoformat() if user.last_practice_date else None,
            'progress_to_seven_days': min(100, ((user.current_streak or 0) / 7) * 100),
            'progress_to_thirty_days': min(100, ((user.current_streak or 0) / 30) * 100)
        }
