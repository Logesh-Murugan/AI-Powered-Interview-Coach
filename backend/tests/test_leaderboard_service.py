"""
Tests for leaderboard service.
Requirements: 24.1-24.10
"""
import pytest
from datetime import datetime, timedelta
from app.services.leaderboard_service import LeaderboardService
from app.models.user import User
from app.models.interview_session import InterviewSession
from app.models.session_summary import SessionSummary
from app.models.leaderboard_entry import LeaderboardEntry


class TestLeaderboardService:
    """Test suite for LeaderboardService."""
    
    def test_calculate_weekly_leaderboard(self, db, test_user):
        """Test weekly leaderboard calculation."""
        # Create test users with sessions
        users = []
        for i in range(15):
            user = User(
                email=f"user{i}@example.com",
                password_hash="hashed",
                name=f"User {i}",
                account_status="active",
                leaderboard_opt_out=False
            )
            db.add(user)
            users.append(user)
        db.commit()
        
        # Create sessions for last 7 days
        for i, user in enumerate(users):
            # Create 3 sessions per user
            for j in range(3):
                session = InterviewSession(
                    user_id=user.id,
                    role="Software Engineer",
                    difficulty="medium",
                    status="completed",
                    question_count=5,
                    created_at=datetime.utcnow() - timedelta(days=j)
                )
                db.add(session)
                db.flush()
                
                summary = SessionSummary(
                    session_id=session.id,
                    overall_session_score=90 - i,  # Descending scores
                    total_questions=5,
                    total_time_seconds=300,
                    avg_content_quality=90.0,
                    avg_clarity=90.0,
                    avg_confidence=90.0,
                    avg_technical_accuracy=90.0,
                    top_strengths=[],
                    top_improvements=[],
                    category_performance={}
                )
                db.add(summary)
        
        db.commit()
        
        # Calculate leaderboard
        service = LeaderboardService(db)
        entries = service.calculate_leaderboard('weekly')
        
        # Verify results
        assert len(entries) == 10  # Top 10 users (Req 24.4)
        assert entries[0].rank == 1
        assert entries[0].average_score == 90.0  # Best score
        assert entries[9].rank == 10
        
        # Verify anonymization (Req 24.5)
        for entry in entries:
            assert entry.anonymous_username.startswith("User_")
            assert len(entry.anonymous_username) == 9  # User_XXXX
    
    def test_calculate_all_time_leaderboard(self, db):
        """Test all-time leaderboard calculation."""
        # Create users with old sessions
        users = []
        for i in range(5):
            user = User(
                email=f"alltime{i}@example.com",
                password_hash="hashed",
                name=f"AllTime User {i}",
                account_status="active",
                leaderboard_opt_out=False
            )
            db.add(user)
            users.append(user)
        db.commit()
        
        # Create sessions from 30 days ago
        for i, user in enumerate(users):
            session = InterviewSession(
                user_id=user.id,
                role="Software Engineer",
                difficulty="medium",
                status="completed",
                question_count=5,
                created_at=datetime.utcnow() - timedelta(days=30)
            )
            db.add(session)
            db.flush()
            
            summary = SessionSummary(
                session_id=session.id,
                overall_session_score=85 + i,
                total_questions=5,
                total_time_seconds=300,
                avg_content_quality=85.0,
                avg_clarity=85.0,
                avg_confidence=85.0,
                avg_technical_accuracy=85.0,
                top_strengths=[],
                top_improvements=[],
                category_performance={}
            )
            db.add(summary)
        
        db.commit()
        
        # Calculate all-time leaderboard
        service = LeaderboardService(db)
        entries = service.calculate_leaderboard('all_time')
        
        # Verify results (Req 24.7)
        assert len(entries) == 5
        assert entries[0].average_score == 89.0  # Highest score
        assert entries[4].average_score == 85.0  # Lowest score
    
    def test_leaderboard_opt_out(self, db):
        """Test that opted-out users are excluded from leaderboard."""
        # Create users, some opted out
        users = []
        for i in range(5):
            user = User(
                email=f"optout{i}@example.com",
                password_hash="hashed",
                name=f"OptOut User {i}",
                account_status="active",
                leaderboard_opt_out=True if i < 2 else False  # First 2 opt out
            )
            db.add(user)
            users.append(user)
        db.commit()
        
        # Create sessions for all users
        for user in users:
            session = InterviewSession(
                user_id=user.id,
                role="Software Engineer",
                difficulty="medium",
                status="completed",
                question_count=5
            )
            db.add(session)
            db.flush()
            
            summary = SessionSummary(
                session_id=session.id,
                overall_session_score=90.0,
                total_questions=5,
                total_time_seconds=300,
                avg_content_quality=90.0,
                avg_clarity=90.0,
                avg_confidence=90.0,
                avg_technical_accuracy=90.0,
                top_strengths=[],
                top_improvements=[],
                category_performance={}
            )
            db.add(summary)
        
        db.commit()
        
        # Calculate leaderboard
        service = LeaderboardService(db)
        entries = service.calculate_leaderboard('weekly')
        
        # Verify only non-opted-out users included (Req 24.10)
        assert len(entries) == 3  # Only 3 users not opted out
    
    def test_get_leaderboard_from_cache(self, db, test_user):
        """Test retrieving leaderboard from cache."""
        # Create and calculate leaderboard
        session = InterviewSession(
            user_id=test_user.id,
            role="Software Engineer",
            difficulty="medium",
            status="completed",
            question_count=5
        )
        db.add(session)
        db.flush()
        
        summary = SessionSummary(
            session_id=session.id,
            overall_session_score=95.0,
            total_questions=5,
            total_time_seconds=300,
            avg_content_quality=95.0,
            avg_clarity=95.0,
            avg_confidence=95.0,
            avg_technical_accuracy=95.0,
            top_strengths=[],
            top_improvements=[],
            category_performance={}
        )
        db.add(summary)
        db.commit()
        
        service = LeaderboardService(db)
        
        # First call - calculates and caches
        service.calculate_leaderboard('weekly')
        
        # Second call - should retrieve from cache (Req 24.8, 24.9)
        start_time = datetime.utcnow()
        result = service.get_leaderboard('weekly')
        elapsed = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        # Verify response time < 50ms (Req 24.9)
        assert elapsed < 50, f"Response time {elapsed}ms exceeds 50ms"
        assert len(result) == 1
        assert result[0]['average_score'] == 95.0
    
    def test_update_leaderboard_preference(self, db, test_user):
        """Test updating user's leaderboard preference."""
        service = LeaderboardService(db)
        
        # Opt out
        result = service.update_user_leaderboard_preference(test_user.id, True)
        assert result['leaderboard_opt_out'] is True
        
        # Verify in database
        db.refresh(test_user)
        assert test_user.leaderboard_opt_out is True
        
        # Opt back in
        result = service.update_user_leaderboard_preference(test_user.id, False)
        assert result['leaderboard_opt_out'] is False
        
        db.refresh(test_user)
        assert test_user.leaderboard_opt_out is False
    
    def test_get_leaderboard_preference(self, db, test_user):
        """Test getting user's leaderboard preference."""
        service = LeaderboardService(db)
        
        # Default should be opted in
        result = service.get_user_leaderboard_preference(test_user.id)
        assert result['leaderboard_opt_out'] is False
        
        # Update and verify
        test_user.leaderboard_opt_out = True
        db.commit()
        
        result = service.get_user_leaderboard_preference(test_user.id)
        assert result['leaderboard_opt_out'] is True
    
    def test_anonymous_username_format(self, db):
        """Test anonymous username generation format."""
        service = LeaderboardService(db)
        
        # Generate multiple usernames
        usernames = [service._generate_anonymous_username() for _ in range(100)]
        
        # Verify format (Req 24.5)
        for username in usernames:
            assert username.startswith("User_")
            assert len(username) == 9
            # Extract digits
            digits = username.split("_")[1]
            assert digits.isdigit()
            assert 1000 <= int(digits) <= 9999
    
    def test_leaderboard_ranking_order(self, db):
        """Test that leaderboard ranks users by average score descending."""
        # Create users with specific scores
        scores = [95.0, 88.0, 92.0, 85.0, 90.0]
        users = []
        
        for i, score in enumerate(scores):
            user = User(
                email=f"rank{i}@example.com",
                password_hash="hashed",
                name=f"Rank User {i}",
                account_status="active",
                leaderboard_opt_out=False
            )
            db.add(user)
            users.append(user)
        db.commit()
        
        # Create sessions with specific scores
        for user, score in zip(users, scores):
            session = InterviewSession(
                user_id=user.id,
                role="Software Engineer",
                difficulty="medium",
                status="completed",
                question_count=5
            )
            db.add(session)
            db.flush()
            
            summary = SessionSummary(
                session_id=session.id,
                overall_session_score=score,
                total_questions=5,
                total_time_seconds=300,
                avg_content_quality=score,
                avg_clarity=score,
                avg_confidence=score,
                avg_technical_accuracy=score,
                top_strengths=[],
                top_improvements=[],
                category_performance={}
            )
            db.add(summary)
        
        db.commit()
        
        # Calculate leaderboard
        service = LeaderboardService(db)
        entries = service.calculate_leaderboard('weekly')
        
        # Verify ranking order (Req 24.3)
        expected_order = [95.0, 92.0, 90.0, 88.0, 85.0]
        actual_order = [entry.average_score for entry in entries]
        assert actual_order == expected_order
        
        # Verify ranks
        for i, entry in enumerate(entries, start=1):
            assert entry.rank == i
    
    def test_leaderboard_total_interviews_count(self, db, test_user):
        """Test that total_interviews is correctly counted."""
        # Create multiple sessions
        for i in range(5):
            session = InterviewSession(
                user_id=test_user.id,
                role="Software Engineer",
                difficulty="medium",
                status="completed",
                question_count=5
            )
            db.add(session)
            db.flush()
            
            summary = SessionSummary(
                session_id=session.id,
                overall_session_score=90.0,
                total_questions=5,
                total_time_seconds=300,
                avg_content_quality=90.0,
                avg_clarity=90.0,
                avg_confidence=90.0,
                avg_technical_accuracy=90.0,
                top_strengths=[],
                top_improvements=[],
                category_performance={}
            )
            db.add(summary)
        
        db.commit()
        
        # Calculate leaderboard
        service = LeaderboardService(db)
        entries = service.calculate_leaderboard('weekly')
        
        # Verify total interviews (Req 24.6)
        assert len(entries) == 1
        assert entries[0].total_interviews == 5


@pytest.fixture
def test_user(db):
    """Create a test user."""
    user = User(
        email="leaderboard_test@example.com",
        password_hash="hashed_password",
        name="Leaderboard Test User",
        account_status="active",
        leaderboard_opt_out=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
