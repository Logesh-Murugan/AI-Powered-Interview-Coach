"""
Unit tests for analytics service.
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from app.services.analytics_service import AnalyticsService
from app.models.user import User
from app.models.interview_session import InterviewSession
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.models.question import Question
from app.models.session_question import SessionQuestion
import uuid


class TestAnalyticsService:
    """Test suite for AnalyticsService."""
    
    def test_analytics_with_no_sessions(self, db):
        """Test analytics calculation when user has no completed sessions."""
        # Create user
        user = User(
            email=f"test_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Test User"
        )
        db.add(user)
        db.commit()
        
        # Create analytics service
        cache_service = Mock()
        cache_service.get.return_value = None
        analytics_service = AnalyticsService(db, cache_service)
        
        # Get analytics
        analytics = analytics_service.get_analytics_overview(user.id)
        
        # Assertions
        assert analytics.total_interviews_completed == 0
        assert analytics.average_score_all_time is None
        assert analytics.average_score_last_30_days is None
        assert analytics.improvement_rate is None
        assert analytics.total_practice_hours == 0.0
        assert len(analytics.score_over_time) == 0
        assert len(analytics.category_performance) == 0
        assert len(analytics.top_5_strengths) == 0
        assert len(analytics.top_5_weaknesses) == 0
        assert analytics.cache_hit is False
    
    def test_analytics_with_single_session(self, db):
        """Test analytics calculation with one completed session."""
        # Create user
        user = User(
            email=f"test2_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Test User 2"
        )
        db.add(user)
        db.commit()
        
        # Create session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status="completed",
            start_time=datetime.utcnow() - timedelta(hours=1),
            end_time=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        
        # Create question
        question = Question(
            question_text="Test question",
            category="Technical",
            difficulty="Medium",
            expected_answer_points=["Point 1", "Point 2"],
            time_limit_seconds=300
        )
        db.add(question)
        db.commit()
        
        # Create session question
        session_question = SessionQuestion(
            session_id=session.id,
            question_id=question.id,
            display_order=1,
            status="answered"
        )
        db.add(session_question)
        db.commit()
        
        # Create answer
        answer = Answer(
            session_id=session.id,
            session_question_id=session_question.id,
            answer_text="Test answer",
            time_taken=180,  # 3 minutes
            submitted_at=datetime.utcnow()
        )
        db.add(answer)
        db.commit()
        
        # Create evaluation
        evaluation = Evaluation(
            answer_id=answer.id,
            overall_score=85.0,
            content_quality=80.0,
            clarity=85.0,
            confidence=90.0,
            technical_accuracy=85.0,
            strengths=["Good structure"],
            improvements=["Add more details"],
            suggestions=["Practice more"],
            evaluated_at=datetime.utcnow()
        )
        db.add(evaluation)
        db.commit()
        
        # Create analytics service
        cache_service = Mock()
        cache_service.get.return_value = None
        analytics_service = AnalyticsService(db, cache_service)
        
        # Get analytics
        analytics = analytics_service.get_analytics_overview(user.id)
        
        # Assertions
        assert analytics.total_interviews_completed == 1
        assert analytics.average_score_all_time == 85.0
        assert analytics.average_score_last_30_days == 85.0
        assert analytics.improvement_rate is None  # Need at least 5 sessions
        assert analytics.total_practice_hours == 0.05  # 180 seconds = 0.05 hours
        assert len(analytics.score_over_time) == 1
        assert len(analytics.category_performance) == 1
        assert analytics.category_performance[0].category == "Technical"
        assert analytics.category_performance[0].avg_score == 85.0
    
    def test_analytics_cache_hit(self, db):
        """Test that analytics are returned from cache when available."""
        # Create user
        user = User(
            email=f"test3_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Test User 3"
        )
        db.add(user)
        db.commit()
        
        # Mock cached data
        cached_data = {
            "total_interviews_completed": 10,
            "average_score_all_time": 80.0,
            "average_score_last_30_days": 82.0,
            "improvement_rate": 10.0,
            "total_practice_hours": 5.0,
            "score_over_time": [],
            "category_performance": [],
            "top_5_strengths": [],
            "top_5_weaknesses": [],
            "practice_recommendations": [],
            "last_session_date": None,
            "cache_hit": False,
            "calculated_at": datetime.utcnow().isoformat()
        }
        
        # Create analytics service with mocked cache
        cache_service = Mock()
        cache_service.get.return_value = cached_data
        analytics_service = AnalyticsService(db, cache_service)
        
        # Get analytics
        analytics = analytics_service.get_analytics_overview(user.id)
        
        # Assertions
        assert analytics.cache_hit is True
        assert analytics.total_interviews_completed == 10
        assert analytics.average_score_all_time == 80.0
        
        # Verify cache was checked
        cache_service.get.assert_called_once_with(f"analytics:{user.id}")
    
    def test_improvement_rate_calculation(self, db):
        """Test improvement rate calculation with 10 sessions."""
        # Create user
        user = User(
            email=f"test4_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Test User 4"
        )
        db.add(user)
        db.commit()
        
        # Create 10 sessions with improving scores
        for i in range(10):
            session = InterviewSession(
                user_id=user.id,
                role="Software Engineer",
                difficulty="Medium",
                status="completed",
                start_time=datetime.utcnow() - timedelta(days=10-i, hours=1),
                end_time=datetime.utcnow() - timedelta(days=10-i)
            )
            db.add(session)
            db.commit()
            
            # Create question
            question = Question(
                question_text=f"Question {i+1}",
                category="Technical",
                difficulty="Medium",
                expected_answer_points=["Point 1"],
                time_limit_seconds=300
            )
            db.add(question)
            db.commit()
            
            # Create session question
            session_question = SessionQuestion(
                session_id=session.id,
                question_id=question.id,
                display_order=1,
                status="answered"
            )
            db.add(session_question)
            db.commit()
            
            # Create answer
            answer = Answer(
                session_id=session.id,
                session_question_id=session_question.id,
                answer_text=f"Answer {i+1}",
                time_taken=180,
                submitted_at=datetime.utcnow() - timedelta(days=10-i)
            )
            db.add(answer)
            db.commit()
            
            # Create evaluation with improving score
            # First 5: 60-70, Last 5: 80-90
            score = 60.0 + (i * 3.0) if i < 5 else 80.0 + ((i-5) * 2.0)
            evaluation = Evaluation(
                answer_id=answer.id,
                overall_score=score,
                content_quality=score,
                clarity=score,
                confidence=score,
                technical_accuracy=score,
                strengths=["Good"],
                improvements=["Better"],
                suggestions=["Practice"],
                evaluated_at=datetime.utcnow() - timedelta(days=10-i)
            )
            db.add(evaluation)
            db.commit()
        
        # Create analytics service
        cache_service = Mock()
        cache_service.get.return_value = None
        analytics_service = AnalyticsService(db, cache_service)
        
        # Get analytics
        analytics = analytics_service.get_analytics_overview(user.id)
        
        # Assertions
        assert analytics.total_interviews_completed == 10
        assert analytics.improvement_rate is not None
        assert analytics.improvement_rate > 0  # Should show improvement
    
    def test_category_strengths_weaknesses(self, db):
        """Test identification of strengths and weaknesses."""
        # Create user
        user = User(
            email=f"test5_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Test User 5"
        )
        db.add(user)
        db.commit()
        
        # Create session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status="completed",
            start_time=datetime.utcnow() - timedelta(hours=1),
            end_time=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        
        # Create questions in different categories with different scores
        categories_scores = [
            ("Technical", 90.0),  # Strength
            ("Behavioral", 50.0),  # Weakness
            ("System_Design", 85.0),  # Strength
            ("Coding", 45.0),  # Weakness
        ]
        
        for category, score in categories_scores:
            question = Question(
                question_text=f"{category} question",
                category=category,
                difficulty="Medium",
                expected_answer_points=["Point 1"],
                time_limit_seconds=300
            )
            db.add(question)
            db.commit()
            
            session_question = SessionQuestion(
                session_id=session.id,
                question_id=question.id,
                display_order=1,
                status="answered"
            )
            db.add(session_question)
            db.commit()
            
            answer = Answer(
                session_id=session.id,
                session_question_id=session_question.id,
                answer_text=f"{category} answer",
                time_taken=180,
                submitted_at=datetime.utcnow()
            )
            db.add(answer)
            db.commit()
            
            evaluation = Evaluation(
                answer_id=answer.id,
                overall_score=score,
                content_quality=score,
                clarity=score,
                confidence=score,
                technical_accuracy=score,
                strengths=["Good"],
                improvements=["Better"],
                suggestions=["Practice"],
                evaluated_at=datetime.utcnow()
            )
            db.add(evaluation)
            db.commit()
        
        # Create analytics service
        cache_service = Mock()
        cache_service.get.return_value = None
        analytics_service = AnalyticsService(db, cache_service)
        
        # Get analytics
        analytics = analytics_service.get_analytics_overview(user.id)
        
        # Assertions
        assert len(analytics.top_5_strengths) == 2  # Technical, System_Design
        assert "Technical" in analytics.top_5_strengths
        assert "System_Design" in analytics.top_5_strengths
        
        assert len(analytics.top_5_weaknesses) == 2  # Behavioral, Coding
        assert "Behavioral" in analytics.top_5_weaknesses
        assert "Coding" in analytics.top_5_weaknesses
        
        # Check recommendations generated for weaknesses
        assert len(analytics.practice_recommendations) == 2
        recommendation_categories = [r.category for r in analytics.practice_recommendations]
        assert "Behavioral" in recommendation_categories
        assert "Coding" in recommendation_categories
    
    def test_cache_invalidation(self, db):
        """Test cache invalidation."""
        # Create user
        user = User(
            email=f"test6_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Test User 6"
        )
        db.add(user)
        db.commit()
        
        # Create analytics service with mocked cache
        cache_service = Mock()
        analytics_service = AnalyticsService(db, cache_service)
        
        # Invalidate cache
        analytics_service.invalidate_cache(user.id)
        
        # Verify cache delete was called
        cache_service.delete.assert_called_once_with(f"analytics:{user.id}")
