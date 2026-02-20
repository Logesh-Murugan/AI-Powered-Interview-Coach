"""
Tests for Achievement Service
Requirements: 22.1-22.10
"""
import pytest
from datetime import datetime
from sqlalchemy.orm import Session
from app.services.achievement_service import AchievementService, ACHIEVEMENT_DEFINITIONS
from app.models.user_achievement import UserAchievement, AchievementType
from app.models.user import User
from app.models.interview_session import InterviewSession, SessionStatus
from app.models.evaluation import Evaluation
from app.models.session_question import SessionQuestion
from app.models.answer import Answer


class TestAchievementService:
    """Test suite for AchievementService."""
    
    def test_check_and_award_achievement_new(self, db: Session, test_user: User):
        """Test awarding a new achievement."""
        service = AchievementService(db)
        
        # Award First_Interview achievement
        achievement = service.check_and_award_achievement(
            test_user.id,
            AchievementType.FIRST_INTERVIEW
        )
        
        assert achievement is not None
        assert achievement.user_id == test_user.id
        assert achievement.achievement_type == AchievementType.FIRST_INTERVIEW
        assert achievement.earned_at is not None
        
        # Check user's total_achievements_count incremented
        db.refresh(test_user)
        assert test_user.total_achievements_count == "1"
    
    def test_check_and_award_achievement_duplicate(self, db: Session, test_user: User):
        """Test that duplicate achievements are not awarded (Req 22.2)."""
        service = AchievementService(db)
        
        # Award achievement first time
        achievement1 = service.check_and_award_achievement(
            test_user.id,
            AchievementType.FIRST_INTERVIEW
        )
        assert achievement1 is not None
        
        # Try to award same achievement again
        achievement2 = service.check_and_award_achievement(
            test_user.id,
            AchievementType.FIRST_INTERVIEW
        )
        assert achievement2 is None
        
        # Check only one achievement exists
        achievements = db.query(UserAchievement).filter(
            UserAchievement.user_id == test_user.id
        ).all()
        assert len(achievements) == 1
    
    def test_check_first_interview(self, db: Session, test_user: User):
        """Test First_Interview achievement (Req 22.6)."""
        service = AchievementService(db)
        
        # No sessions yet
        achievement = service.check_first_interview(test_user.id)
        assert achievement is None
        
        # Create completed session
        session = InterviewSession(
            user_id=test_user.id,
            role="Software Engineer",
            difficulty="medium",
            status=SessionStatus.COMPLETED
        )
        db.add(session)
        db.commit()
        
        # Check again
        achievement = service.check_first_interview(test_user.id)
        assert achievement is not None
        assert achievement.achievement_type == AchievementType.FIRST_INTERVIEW
    
    def test_check_perfect_score(self, db: Session, test_user: User):
        """Test Perfect_Score achievement (Req 22.7)."""
        service = AchievementService(db)
        
        # Create session with perfect score evaluation
        session = InterviewSession(
            user_id=test_user.id,
            role="Software Engineer",
            difficulty="medium",
            status=SessionStatus.COMPLETED
        )
        db.add(session)
        db.flush()
        
        sq = SessionQuestion(
            session_id=session.id,
            question_id=1,
            order=1,
            category="algorithms"
        )
        db.add(sq)
        db.flush()
        
        answer = Answer(
            user_id=test_user.id,
            session_id=session.id,
            question_id=1,
            answer_text="Perfect answer",
            time_taken=300
        )
        db.add(answer)
        db.flush()
        
        evaluation = Evaluation(
            answer_id=answer.id,
            session_question_id=sq.id,
            overall_score=100,
            content_quality=100,
            clarity=100,
            confidence=100,
            technical_accuracy=100,
            strengths=["Perfect"],
            improvements=[]
        )
        db.add(evaluation)
        db.commit()
        
        # Check achievement
        achievement = service.check_perfect_score(test_user.id, evaluation.id)
        assert achievement is not None
        assert achievement.achievement_type == AchievementType.PERFECT_SCORE
    
    def test_get_all_achievements(self, db: Session):
        """Test getting all achievement definitions."""
        service = AchievementService(db)
        achievements = service.get_all_achievements()
        
        assert len(achievements) == 7
        assert all(isinstance(a.type, AchievementType) for a in achievements)
    
    def test_get_user_achievements(self, db: Session, test_user: User):
        """Test getting user's earned achievements."""
        service = AchievementService(db)
        
        # Award some achievements
        service.check_and_award_achievement(test_user.id, AchievementType.FIRST_INTERVIEW)
        service.check_and_award_achievement(test_user.id, AchievementType.PERFECT_SCORE)
        
        # Get user achievements
        achievements = service.get_user_achievements(test_user.id)
        assert len(achievements) == 2
        assert all(a.user_id == test_user.id for a in achievements)
    
    def test_get_achievement_progress(self, db: Session, test_user: User):
        """Test getting achievement progress."""
        service = AchievementService(db)
        
        # Create some completed sessions
        for i in range(5):
            session = InterviewSession(
                user_id=test_user.id,
                role="Software Engineer",
                difficulty="medium",
                status=SessionStatus.COMPLETED
            )
            db.add(session)
        db.commit()
        
        # Get progress
        progress = service.get_achievement_progress(test_user.id)
        
        assert len(progress) == 7  # All achievement types
        
        # Check First_Interview progress
        first_interview_progress = next(
            p for p in progress if p.achievement_type == AchievementType.FIRST_INTERVIEW
        )
        assert first_interview_progress.current_progress == 1
        assert first_interview_progress.target_progress == 1
        assert first_interview_progress.progress_percentage == 100.0
        
        # Check Ten_Interviews progress
        ten_interviews_progress = next(
            p for p in progress if p.achievement_type == AchievementType.TEN_INTERVIEWS
        )
        assert ten_interviews_progress.current_progress == 5
        assert ten_interviews_progress.target_progress == 10
        assert ten_interviews_progress.progress_percentage == 50.0
    
    def test_achievement_processing_time(self, db: Session, test_user: User):
        """Test that achievement processing completes within 200ms (Req 22.10)."""
        import time
        service = AchievementService(db)
        
        start_time = time.time()
        achievement = service.check_and_award_achievement(
            test_user.id,
            AchievementType.FIRST_INTERVIEW
        )
        elapsed_ms = (time.time() - start_time) * 1000
        
        assert achievement is not None
        assert elapsed_ms < 200, f"Achievement processing took {elapsed_ms:.2f}ms, should be < 200ms"


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
