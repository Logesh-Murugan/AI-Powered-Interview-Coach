"""
Tests for Streak Service
Requirements: 23.1-23.10
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.services.streak_service import StreakService
from app.models.user import User
from app.models.user_achievement import UserAchievement, AchievementType


class TestStreakService:
    """Test suite for StreakService."""
    
    def test_first_practice_creates_streak(self, db: Session, test_user: User):
        """Test that first practice creates a streak of 1."""
        service = StreakService(db)
        
        result = service.update_streak(test_user.id)
        
        assert result['current_streak'] == 1
        assert result['streak_increased'] is True
        
        db.refresh(test_user)
        assert test_user.current_streak == "1"
        assert test_user.last_practice_date is not None
    
    def test_practice_within_24_hours_increments_streak(self, db: Session, test_user: User):
        """Test that practicing within 24 hours increments streak (Req 23.4)."""
        service = StreakService(db)
        
        # First practice
        service.update_streak(test_user.id)
        db.refresh(test_user)
        
        # Set last practice to 20 hours ago
        test_user.last_practice_date = datetime.utcnow() - timedelta(hours=20)
        test_user.current_streak = "1"
        db.commit()
        
        # Second practice within 24 hours
        result = service.update_streak(test_user.id)
        
        assert result['current_streak'] == 2
        assert result['streak_increased'] is True
    
    def test_practice_after_24_hours_resets_to_one(self, db: Session, test_user: User):
        """Test that practicing after 24 hours but within 48 resets to 1 (Req 23.5)."""
        service = StreakService(db)
        
        # Set up user with streak of 5, last practice 30 hours ago
        test_user.last_practice_date = datetime.utcnow() - timedelta(hours=30)
        test_user.current_streak = "5"
        db.commit()
        
        # Practice after 24 hours (grace period)
        result = service.update_streak(test_user.id)
        
        assert result['current_streak'] == 1
        assert result['streak_increased'] is False
    
    def test_practice_after_48_hours_resets_to_zero(self, db: Session, test_user: User):
        """Test that practicing after 48 hours resets to 0 (Req 23.6)."""
        service = StreakService(db)
        
        # Set up user with streak of 10, last practice 50 hours ago
        test_user.last_practice_date = datetime.utcnow() - timedelta(hours=50)
        test_user.current_streak = "10"
        db.commit()
        
        # Practice after 48 hours (streak broken)
        result = service.update_streak(test_user.id)
        
        assert result['current_streak'] == 0
        assert result['streak_increased'] is False
    
    def test_longest_streak_updated(self, db: Session, test_user: User):
        """Test that longest streak is tracked correctly."""
        service = StreakService(db)
        
        # Build up a streak
        for i in range(5):
            test_user.last_practice_date = datetime.utcnow() - timedelta(hours=20)
            test_user.current_streak = str(i)
            db.commit()
            service.update_streak(test_user.id)
        
        db.refresh(test_user)
        assert int(test_user.longest_streak) >= 5
    
    def test_seven_day_streak_achievement(self, db: Session, test_user: User):
        """Test that Seven_Day_Streak achievement is awarded (Req 23.7)."""
        service = StreakService(db)
        
        # Set up user with 6-day streak
        test_user.last_practice_date = datetime.utcnow() - timedelta(hours=20)
        test_user.current_streak = "6"
        db.commit()
        
        # Practice to reach 7 days
        result = service.update_streak(test_user.id)
        
        assert result['current_streak'] == 7
        assert AchievementType.SEVEN_DAY_STREAK.value in result['achievements_awarded']
        
        # Verify achievement in database
        achievement = db.query(UserAchievement).filter(
            UserAchievement.user_id == test_user.id,
            UserAchievement.achievement_type == AchievementType.SEVEN_DAY_STREAK
        ).first()
        assert achievement is not None
    
    def test_thirty_day_streak_achievement(self, db: Session, test_user: User):
        """Test that Thirty_Day_Streak achievement is awarded (Req 23.8)."""
        service = StreakService(db)
        
        # Set up user with 29-day streak
        test_user.last_practice_date = datetime.utcnow() - timedelta(hours=20)
        test_user.current_streak = "29"
        db.commit()
        
        # Practice to reach 30 days
        result = service.update_streak(test_user.id)
        
        assert result['current_streak'] == 30
        assert AchievementType.THIRTY_DAY_STREAK.value in result['achievements_awarded']
        
        # Verify achievement in database
        achievement = db.query(UserAchievement).filter(
            UserAchievement.user_id == test_user.id,
            UserAchievement.achievement_type == AchievementType.THIRTY_DAY_STREAK
        ).first()
        assert achievement is not None
    
    def test_streak_history_stored(self, db: Session, test_user: User):
        """Test that streak history is stored as JSONB (Req 23.9)."""
        service = StreakService(db)
        
        # Practice multiple times
        for i in range(3):
            if i > 0:
                test_user.last_practice_date = datetime.utcnow() - timedelta(hours=20)
                test_user.current_streak = str(i)
                db.commit()
            service.update_streak(test_user.id)
        
        db.refresh(test_user)
        streak_history = test_user.streak_history
        
        assert len(streak_history) == 3
        assert all('date' in entry and 'streak_count' in entry for entry in streak_history)
    
    def test_get_current_streak(self, db: Session, test_user: User):
        """Test getting current streak information."""
        service = StreakService(db)
        
        # Set up user with active streak
        test_user.last_practice_date = datetime.utcnow() - timedelta(hours=10)
        test_user.current_streak = "5"
        test_user.longest_streak = "10"
        db.commit()
        
        result = service.get_current_streak(test_user.id)
        
        assert result['current_streak'] == 5
        assert result['longest_streak'] == 10
        assert result['is_active'] is True
        assert result['days_until_seven'] == 2
        assert result['days_until_thirty'] == 25
    
    def test_get_streak_history(self, db: Session, test_user: User):
        """Test getting streak history."""
        service = StreakService(db)
        
        # Add some history
        test_user.streak_history = [
            {'date': '2026-02-10T10:00:00', 'streak_count': 1},
            {'date': '2026-02-11T10:00:00', 'streak_count': 2},
            {'date': '2026-02-12T10:00:00', 'streak_count': 3}
        ]
        db.commit()
        
        history = service.get_streak_history(test_user.id, days=30)
        
        assert len(history) == 3
        assert history[0]['streak_count'] == 1
        assert history[2]['streak_count'] == 3
    
    def test_get_streak_stats(self, db: Session, test_user: User):
        """Test getting comprehensive streak statistics."""
        service = StreakService(db)
        
        # Set up user with history
        test_user.last_practice_date = datetime.utcnow() - timedelta(hours=10)
        test_user.current_streak = "5"
        test_user.longest_streak = "10"
        test_user.streak_history = [
            {'date': '2026-02-10T10:00:00', 'streak_count': 1},
            {'date': '2026-02-11T10:00:00', 'streak_count': 2},
            {'date': '2026-02-12T10:00:00', 'streak_count': 3}
        ]
        db.commit()
        
        stats = service.get_streak_stats(test_user.id)
        
        assert stats['current_streak'] == 5
        assert stats['longest_streak'] == 10
        assert stats['total_practice_days'] == 3
        assert stats['average_streak'] == 2.0
        assert stats['is_active'] is True
        assert 0 <= stats['progress_to_seven_days'] <= 100
        assert 0 <= stats['progress_to_thirty_days'] <= 100
    
    def test_streak_calculation_performance(self, db: Session, test_user: User):
        """Test that streak calculation completes within 100ms (Req 23.10)."""
        import time
        service = StreakService(db)
        
        # Set up user with existing streak
        test_user.last_practice_date = datetime.utcnow() - timedelta(hours=20)
        test_user.current_streak = "5"
        db.commit()
        
        start_time = time.time()
        result = service.update_streak(test_user.id)
        elapsed_ms = (time.time() - start_time) * 1000
        
        assert elapsed_ms < 100, f"Streak calculation took {elapsed_ms:.2f}ms, should be < 100ms"
        assert 'processing_time_ms' in result
        assert result['processing_time_ms'] < 100


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        password_hash="hashed_password",
        name="Test User",
        account_status="active"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
