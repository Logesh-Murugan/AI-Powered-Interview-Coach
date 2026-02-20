"""
Integration tests for analytics API endpoints.
"""
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.models.user import User
from app.models.interview_session import InterviewSession
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.models.question import Question
from app.models.session_question import SessionQuestion
import uuid
from app.utils.jwt import create_access_token


client = TestClient(app)


class TestAnalyticsEndpoints:
    """Test suite for analytics API endpoints."""
    
    def test_get_analytics_overview_success(self, db):
        """Test GET /api/v1/analytics/overview with authenticated user."""
        # Create user
        user = User(
            email=f"analytics_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Analytics User"
        )
        db.add(user)
        db.commit()
        
        # Create completed session with evaluation
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
        
        question = Question(
            question_text="Test question",
            category="Technical",
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
            answer_text="Test answer",
            time_taken=180,
            submitted_at=datetime.utcnow()
        )
        db.add(answer)
        db.commit()
        
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
        
        # Create access token
        token = create_access_token(user.id, user.email)
        
        # Make request
        response = client.get(
            "/api/v1/analytics/overview",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        
        assert "total_interviews_completed" in data
        assert data["total_interviews_completed"] == 1
        
        assert "average_score_all_time" in data
        assert data["average_score_all_time"] == 85.0
        
        assert "average_score_last_30_days" in data
        assert data["average_score_last_30_days"] == 85.0
        
        assert "total_practice_hours" in data
        assert data["total_practice_hours"] == 0.05  # 180 seconds
        
        assert "score_over_time" in data
        assert isinstance(data["score_over_time"], list)
        
        assert "category_performance" in data
        assert len(data["category_performance"]) == 1
        assert data["category_performance"][0]["category"] == "Technical"
        
        assert "top_5_strengths" in data
        assert "top_5_weaknesses" in data
        assert "practice_recommendations" in data
        
        assert "cache_hit" in data
        assert "calculated_at" in data
    
    def test_get_analytics_overview_unauthenticated(self):
        """Test GET /api/v1/analytics/overview without authentication."""
        response = client.get("/api/v1/analytics/overview")
        
        # Should return 401 Unauthorized
        assert response.status_code == 401
    
    def test_get_analytics_overview_invalid_token(self):
        """Test GET /api/v1/analytics/overview with invalid token."""
        response = client.get(
            "/api/v1/analytics/overview",
            headers={"Authorization": "Bearer invalid_token"}
        )
        
        # Should return 401 Unauthorized
        assert response.status_code == 401
    
    def test_get_analytics_overview_no_data(self, db):
        """Test GET /api/v1/analytics/overview for user with no sessions."""
        # Create user with no sessions
        user = User(
            email=f"nodata_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="No Data User"
        )
        db.add(user)
        db.commit()
        
        # Create access token
        token = create_access_token(user.id, user.email)
        
        # Make request
        response = client.get(
            "/api/v1/analytics/overview",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_interviews_completed"] == 0
        assert data["average_score_all_time"] is None
        assert data["average_score_last_30_days"] is None
        assert data["improvement_rate"] is None
        assert data["total_practice_hours"] == 0.0
        assert len(data["score_over_time"]) == 0
        assert len(data["category_performance"]) == 0
    
    def test_get_analytics_overview_response_time(self, db):
        """Test that analytics endpoint meets response time requirements."""
        import time
        
        # Create user
        user = User(
            email=f"performance_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Performance User"
        )
        db.add(user)
        db.commit()
        
        # Create access token
        token = create_access_token(user.id, user.email)
        
        # Measure response time
        start_time = time.time()
        response = client.get(
            "/api/v1/analytics/overview",
            headers={"Authorization": f"Bearer {token}"}
        )
        duration_ms = (time.time() - start_time) * 1000
        
        # Assertions
        assert response.status_code == 200
        
        # First request (cache miss) should be < 500ms (Requirement 20.15)
        assert duration_ms < 500, f"Response time {duration_ms}ms exceeds 500ms limit"
        
        # Second request (cache hit) should be < 100ms (Requirement 20.2)
        start_time = time.time()
        response = client.get(
            "/api/v1/analytics/overview",
            headers={"Authorization": f"Bearer {token}"}
        )
        duration_ms = (time.time() - start_time) * 1000
        
        assert response.status_code == 200
        data = response.json()
        assert data["cache_hit"] is True
        
        # Cache hit should be faster
        assert duration_ms < 100, f"Cache hit response time {duration_ms}ms exceeds 100ms limit"
    
    def test_get_session_analytics_placeholder(self, db):
        """Test GET /api/v1/analytics/sessions placeholder endpoint."""
        # Create user
        user = User(
            email=f"sessions_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Sessions User"
        )
        db.add(user)
        db.commit()
        
        # Create access token
        token = create_access_token(user.id, user.email)
        
        # Make request
        response = client.get(
            "/api/v1/analytics/sessions",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["user_id"] == user.id
    
    def test_get_skill_analytics_placeholder(self, db):
        """Test GET /api/v1/analytics/skills placeholder endpoint."""
        # Create user
        user = User(
            email=f"skills_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Skills User"
        )
        db.add(user)
        db.commit()
        
        # Create access token
        token = create_access_token(user.id, user.email)
        
        # Make request
        response = client.get(
            "/api/v1/analytics/skills",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["user_id"] == user.id
    
    def test_get_progress_analytics_placeholder(self, db):
        """Test GET /api/v1/analytics/progress placeholder endpoint."""
        # Create user
        user = User(
            email=f"progress_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Progress User"
        )
        db.add(user)
        db.commit()
        
        # Create access token
        token = create_access_token(user.id, user.email)
        
        # Make request
        response = client.get(
            "/api/v1/analytics/progress",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["user_id"] == user.id
    
    def test_get_insights_placeholder(self, db):
        """Test GET /api/v1/analytics/insights placeholder endpoint."""
        # Create user
        user = User(
            email=f"insights_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Insights User"
        )
        db.add(user)
        db.commit()
        
        # Create access token
        token = create_access_token(user.id, user.email)
        
        # Make request
        response = client.get(
            "/api/v1/analytics/insights",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["user_id"] == user.id
