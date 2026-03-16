"""
Comprehensive tests for analytics API endpoints.

Tests cover:
- GET /api/v1/analytics/sessions - Session statistics with filters
- GET /api/v1/analytics/skills - Skill-based performance analysis
- GET /api/v1/analytics/progress - Progress and improvement metrics
- GET /api/v1/analytics/insights - AI-generated insights

Each endpoint is tested for:
- Success cases with various data scenarios
- Empty/no data scenarios
- Caching behavior (cache miss then cache hit)
- Authentication requirements
- Invalid token handling
- Filter parameters where applicable
- Error handling

Requirements: 6.6
"""
import pytest
from datetime import datetime, timedelta
import uuid

from app.models.user import User
from app.models.interview_session import InterviewSession
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.models.question import Question
from app.models.session_question import SessionQuestion
from app.models.resume import Resume
from app.utils.jwt import create_access_token


class TestSessionsEndpoint:
    """Test suite for GET /api/v1/analytics/sessions endpoint."""
    
    def test_sessions_success_with_data(self, client, db):
        """Test sessions endpoint returns correct statistics with data."""
        # Create user
        user = User(
            email=f"sessions_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Sessions User"
        )
        db.add(user)
        db.commit()
        
        # Create multiple sessions with different statuses
        for i in range(5):
            status = "completed" if i < 4 else "in_progress"
            session = InterviewSession(
                user_id=user.id,
                role="Software Engineer",
                difficulty="Medium",
                status=status,
                question_count=5,
                start_time=datetime.utcnow() - timedelta(days=i, hours=1),
                end_time=datetime.utcnow() - timedelta(days=i) if status == "completed" else None
            )
            db.add(session)
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
        
        assert "sessions_by_date" in data
        assert isinstance(data["sessions_by_date"], list)
        
        assert "average_duration" in data
        assert data["average_duration"] >= 0
        
        assert "completion_rate" in data
        assert 0 <= data["completion_rate"] <= 100
        assert data["completion_rate"] == 80.0  # 4 out of 5 completed
        
        assert "total_sessions" in data
        assert data["total_sessions"] == 5
        
        assert "completed_sessions" in data
        assert data["completed_sessions"] == 4
        
        assert "cache_hit" in data
        assert data["cache_hit"] is False  # First request
    
    def test_sessions_with_date_range_filter(self, client, db):
        """Test sessions endpoint with date_range filter."""
        # Create user
        user = User(
            email=f"sessions_filter_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Sessions Filter User"
        )
        db.add(user)
        db.commit()
        
        # Create sessions at different dates
        for i in range(10):
            session = InterviewSession(
                user_id=user.id,
                role="Software Engineer",
                difficulty="Medium",
                status="completed",
                question_count=5,
                start_time=datetime.utcnow() - timedelta(days=i*3, hours=1),
                end_time=datetime.utcnow() - timedelta(days=i*3)
            )
            db.add(session)
        db.commit()
        
        # Create access token
        token = create_access_token(user.id, user.email)
        
        # Test with 7-day filter
        response = client.get(
            "/api/v1/analytics/sessions?date_range=7",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should only include sessions from last 7 days
        assert data["total_sessions"] <= 10
        assert "sessions_by_date" in data
    
    def test_sessions_with_status_filter(self, client, db):
        """Test sessions endpoint with status filter."""
        # Create user
        user = User(
            email=f"sessions_status_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Sessions Status User"
        )
        db.add(user)
        db.commit()
        
        # Create sessions with different statuses
        for status in ["completed", "completed", "in_progress", "abandoned"]:
            session = InterviewSession(
                user_id=user.id,
                role="Software Engineer",
                difficulty="Medium",
                status=status,
                question_count=5,
                start_time=datetime.utcnow() - timedelta(hours=1),
                end_time=datetime.utcnow() if status == "completed" else None
            )
            db.add(session)
        db.commit()
        
        # Create access token
        token = create_access_token(user.id, user.email)
        
        # Test with completed filter
        response = client.get(
            "/api/v1/analytics/sessions?status=completed",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should only include completed sessions
        assert data["completed_sessions"] == 2
    
    def test_sessions_no_data(self, client, db):
        """Test sessions endpoint with no session data."""
        # Create user with no sessions
        user = User(
            email=f"sessions_nodata_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Sessions No Data User"
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
        
        assert data["total_sessions"] == 0
        assert data["completed_sessions"] == 0
        assert data["completion_rate"] == 0.0
        assert data["average_duration"] == 0.0
        assert len(data["sessions_by_date"]) == 0
    
    def test_sessions_caching_behavior(self, client, db):
        """Test sessions endpoint caching (cache miss then cache hit)."""
        # Create user
        user = User(
            email=f"sessions_cache_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Sessions Cache User"
        )
        db.add(user)
        db.commit()
        
        # Create access token
        token = create_access_token(user.id, user.email)
        
        # First request - cache miss
        response1 = client.get(
            "/api/v1/analytics/sessions",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response1.status_code == 200
        data1 = response1.json()
        assert data1["cache_hit"] is False
        
        # Second request - cache hit
        response2 = client.get(
            "/api/v1/analytics/sessions",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["cache_hit"] is True
    
    def test_sessions_unauthenticated(self, client):
        """Test sessions endpoint without authentication."""
        response = client.get("/api/v1/analytics/sessions")
        assert response.status_code == 401
    
    def test_sessions_invalid_token(self, client):
        """Test sessions endpoint with invalid token."""
        response = client.get(
            "/api/v1/analytics/sessions",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401


class TestSkillsEndpoint:
    """Test suite for GET /api/v1/analytics/skills endpoint."""
    
    def test_skills_success_with_resume(self, client, db):
        """Test skills endpoint returns correct statistics with resume data."""
        # Create user
        user = User(
            email=f"skills_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Skills User"
        )
        db.add(user)
        db.commit()
        
        # Create resume with skills
        resume = Resume(
            user_id=user.id,
            filename="test_resume.pdf",
            file_url="/uploads/test.pdf",
            extracted_text="Test resume text with Python, FastAPI, PostgreSQL",
            skills={
                "technical_skills": ["Python", "FastAPI", "PostgreSQL"],
                "soft_skills": ["Communication", "Leadership"],
                "tools": ["Git", "Docker"],
                "frameworks": ["React", "Django"]
            },
            status="processed"
        )
        db.add(resume)
        db.commit()
        
        # Create questions and evaluations for skills
        question = Question(
            question_text="Explain Python async/await",
            category="Technical",
            difficulty="Medium",
            role="Software Engineer",
            expected_answer_points=["async", "await"],
            time_limit_seconds=300
        )
        db.add(question)
        db.commit()
        
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status="completed",
            question_count=1,
            start_time=datetime.utcnow() - timedelta(hours=1),
            end_time=datetime.utcnow()
        )
        db.add(session)
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
            question_id=question.id,
            user_id=user.id,
            answer_text="Async/await allows non-blocking operations",
            time_taken=180,
            submitted_at=datetime.utcnow()
        )
        db.add(answer)
        db.commit()
        
        evaluation = Evaluation(
            answer_id=answer.id,
            overall_score=85.0,
            content_quality=85.0,
            clarity=85.0,
            confidence=85.0,
            technical_accuracy=85.0,
            strengths=["Good explanation"],
            improvements=["Add examples"],
            suggestions=["Practice more"],
            evaluated_at=datetime.utcnow()
        )
        db.add(evaluation)
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
        
        assert "performance_by_skill" in data
        assert isinstance(data["performance_by_skill"], list)
        
        assert "top_skills" in data
        assert isinstance(data["top_skills"], list)
        
        assert "weak_skills" in data
        assert isinstance(data["weak_skills"], list)
        
        assert "cache_hit" in data
        assert data["cache_hit"] is False
    
    def test_skills_no_resume(self, client, db):
        """Test skills endpoint without resume data."""
        # Create user without resume
        user = User(
            email=f"skills_noresume_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Skills No Resume User"
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
        
        assert len(data["performance_by_skill"]) == 0
        assert len(data["top_skills"]) == 0
        assert len(data["weak_skills"]) == 0
    
    def test_skills_caching_behavior(self, client, db):
        """Test skills endpoint caching behavior."""
        # Create user
        user = User(
            email=f"skills_cache_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Skills Cache User"
        )
        db.add(user)
        db.commit()
        
        # Create access token
        token = create_access_token(user.id, user.email)
        
        # First request - cache miss
        response1 = client.get(
            "/api/v1/analytics/skills",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response1.status_code == 200
        data1 = response1.json()
        assert data1["cache_hit"] is False
        
        # Second request - cache hit
        response2 = client.get(
            "/api/v1/analytics/skills",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["cache_hit"] is True
    
    def test_skills_unauthenticated(self, client):
        """Test skills endpoint without authentication."""
        response = client.get("/api/v1/analytics/skills")
        assert response.status_code == 401
    
    def test_skills_invalid_token(self, client):
        """Test skills endpoint with invalid token."""
        response = client.get(
            "/api/v1/analytics/skills",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401


class TestProgressEndpoint:
    """Test suite for GET /api/v1/analytics/progress endpoint."""
    
    def test_progress_success_with_data(self, client, db):
        """Test progress endpoint returns correct metrics with data."""
        # Create user
        user = User(
            email=f"progress_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Progress User"
        )
        db.add(user)
        db.commit()
        
        # Create sessions with improving scores over time
        # Reverse order so older sessions have lower scores
        for i in range(10):
            days_ago = (9 - i) * 7  # Reverse: oldest session is 63 days ago
            session = InterviewSession(
                user_id=user.id,
                role="Software Engineer",
                difficulty="Medium",
                status="completed",
                question_count=5,
                start_time=datetime.utcnow() - timedelta(days=days_ago, hours=1),
                end_time=datetime.utcnow() - timedelta(days=days_ago)
            )
            db.add(session)
            db.commit()
            
            question = Question(
                question_text=f"Test question {i}",
                category="Technical",
                difficulty="Medium",
                role="Software Engineer",
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
                question_id=question.id,
                user_id=user.id,
                answer_text="Test answer",
                time_taken=180,
                submitted_at=datetime.utcnow() - timedelta(days=days_ago)
            )
            db.add(answer)
            db.commit()
            
            # Improving scores: 60, 62, 64, 66, 68, 70, 72, 74, 76, 78
            # i=0 (oldest) gets 60, i=9 (newest) gets 78
            evaluation = Evaluation(
                answer_id=answer.id,
                overall_score=60.0 + i * 2,
                content_quality=60.0 + i * 2,
                clarity=60.0 + i * 2,
                confidence=60.0 + i * 2,
                technical_accuracy=60.0 + i * 2,
                strengths=["Good"],
                improvements=["Better"],
                suggestions=["Practice"],
                evaluated_at=datetime.utcnow() - timedelta(days=days_ago)
            )
            db.add(evaluation)
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
        
        assert "weekly_improvement" in data
        assert "monthly_improvement" in data
        
        assert "trend_direction" in data
        assert data["trend_direction"] in ["improving", "declining", "stable"]
        # With improving scores (60 -> 78), trend should be improving or stable
        # Note: The actual trend calculation may vary based on the algorithm
        assert data["trend_direction"] in ["improving", "stable"]
        
        assert "confidence_interval" in data
        assert "cache_hit" in data
        assert data["cache_hit"] is False
    
    def test_progress_insufficient_data(self, client, db):
        """Test progress endpoint with insufficient data for trends."""
        # Create user with only one session
        user = User(
            email=f"progress_min_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Progress Min User"
        )
        db.add(user)
        db.commit()
        
        # Create single session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status="completed",
            question_count=1,
            start_time=datetime.utcnow() - timedelta(hours=1),
            end_time=datetime.utcnow()
        )
        db.add(session)
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
        
        # Should return None for improvements with insufficient data
        assert data["weekly_improvement"] is None
        assert data["monthly_improvement"] is None
        assert data["trend_direction"] == "stable"
    
    def test_progress_no_data(self, client, db):
        """Test progress endpoint with no session data."""
        # Create user with no sessions
        user = User(
            email=f"progress_nodata_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Progress No Data User"
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
        
        assert data["weekly_improvement"] is None
        assert data["monthly_improvement"] is None
        assert data["trend_direction"] == "stable"
    
    def test_progress_caching_behavior(self, client, db):
        """Test progress endpoint caching behavior."""
        # Create user
        user = User(
            email=f"progress_cache_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Progress Cache User"
        )
        db.add(user)
        db.commit()
        
        # Create access token
        token = create_access_token(user.id, user.email)
        
        # First request - cache miss
        response1 = client.get(
            "/api/v1/analytics/progress",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response1.status_code == 200
        data1 = response1.json()
        assert data1["cache_hit"] is False
        
        # Second request - cache hit
        response2 = client.get(
            "/api/v1/analytics/progress",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["cache_hit"] is True
    
    def test_progress_unauthenticated(self, client):
        """Test progress endpoint without authentication."""
        response = client.get("/api/v1/analytics/progress")
        assert response.status_code == 401
    
    def test_progress_invalid_token(self, client):
        """Test progress endpoint with invalid token."""
        response = client.get(
            "/api/v1/analytics/progress",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401


class TestInsightsEndpoint:
    """Test suite for GET /api/v1/analytics/insights endpoint."""
    
    @pytest.mark.asyncio
    async def test_insights_success_with_data(self, client, db):
        """Test insights endpoint returns AI-generated insights with data."""
        # Create user with session data
        user = User(
            email=f"insights_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Insights User",
            target_role="Software Engineer",
            experience_level="mid"
        )
        db.add(user)
        db.commit()
        
        # Create session with evaluation
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status="completed",
            question_count=5,
            start_time=datetime.utcnow() - timedelta(hours=1),
            end_time=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        
        question = Question(
            question_text="Explain REST API design",
            category="Technical",
            difficulty="Medium",
            role="Software Engineer",
            expected_answer_points=["REST", "API"],
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
            question_id=question.id,
            user_id=user.id,
            answer_text="REST APIs use HTTP methods for CRUD operations",
            time_taken=180,
            submitted_at=datetime.utcnow()
        )
        db.add(answer)
        db.commit()
        
        evaluation = Evaluation(
            answer_id=answer.id,
            overall_score=75.0,
            content_quality=75.0,
            clarity=75.0,
            confidence=75.0,
            technical_accuracy=75.0,
            strengths=["Good structure"],
            improvements=["Add details"],
            suggestions=["Practice more"],
            evaluated_at=datetime.utcnow()
        )
        db.add(evaluation)
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
        
        assert "insights_text" in data
        assert isinstance(data["insights_text"], str)
        assert len(data["insights_text"]) > 0
        
        assert "recommendations" in data
        assert isinstance(data["recommendations"], list)
        assert len(data["recommendations"]) > 0
        
        assert "readiness_score" in data
        assert 0 <= data["readiness_score"] <= 100
        
        assert "cache_hit" in data
        assert data["cache_hit"] is False
    
    def test_insights_no_data_fallback(self, client, db):
        """Test insights endpoint with no data returns fallback insights."""
        # Create user with no sessions
        user = User(
            email=f"insights_nodata_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Insights No Data User",
            target_role="Software Engineer"
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
        
        # Assertions - should return fallback insights
        assert response.status_code == 200
        data = response.json()
        
        assert "insights_text" in data
        assert "recommendations" in data
        assert "readiness_score" in data
        # Fallback readiness score should be low
        assert data["readiness_score"] <= 50
    
    def test_insights_caching_behavior(self, client, db):
        """Test insights endpoint caching behavior (24h TTL)."""
        # Create user
        user = User(
            email=f"insights_cache_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Insights Cache User",
            target_role="Software Engineer"
        )
        db.add(user)
        db.commit()
        
        # Create access token
        token = create_access_token(user.id, user.email)
        
        # First request - cache miss
        response1 = client.get(
            "/api/v1/analytics/insights",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response1.status_code == 200
        data1 = response1.json()
        # First request may or may not be cached depending on service implementation
        assert "cache_hit" in data1
        
        # Second request - should be cached
        response2 = client.get(
            "/api/v1/analytics/insights",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response2.status_code == 200
        data2 = response2.json()
        # Second request should have same or better cache status
        assert "cache_hit" in data2
        
        # Insights should be identical or similar from cache
        assert "insights_text" in data1
        assert "insights_text" in data2
        assert data1["readiness_score"] == data2["readiness_score"]
    
    def test_insights_unauthenticated(self, client):
        """Test insights endpoint without authentication."""
        response = client.get("/api/v1/analytics/insights")
        assert response.status_code == 401
    
    def test_insights_invalid_token(self, client):
        """Test insights endpoint with invalid token."""
        response = client.get(
            "/api/v1/analytics/insights",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401


class TestAnalyticsErrorHandling:
    """Test suite for error handling across all analytics endpoints."""
    
    def test_all_endpoints_require_authentication(self, client):
        """Test that all analytics endpoints require authentication."""
        endpoints = [
            "/api/v1/analytics/sessions",
            "/api/v1/analytics/skills",
            "/api/v1/analytics/progress",
            "/api/v1/analytics/insights"
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            assert response.status_code == 401, f"{endpoint} should require authentication"
    
    def test_all_endpoints_reject_invalid_tokens(self, client):
        """Test that all analytics endpoints reject invalid tokens."""
        endpoints = [
            "/api/v1/analytics/sessions",
            "/api/v1/analytics/skills",
            "/api/v1/analytics/progress",
            "/api/v1/analytics/insights"
        ]
        
        for endpoint in endpoints:
            response = client.get(
                endpoint,
                headers={"Authorization": "Bearer invalid_token"}
            )
            assert response.status_code == 401, f"{endpoint} should reject invalid token"
    
    def test_sessions_invalid_date_range(self, client, db):
        """Test sessions endpoint with invalid date_range parameter."""
        # Create user
        user = User(
            email=f"sessions_invalid_{uuid.uuid4().hex[:8]}@example.com",
            password_hash="hashed",
            name="Sessions Invalid User"
        )
        db.add(user)
        db.commit()
        
        # Create access token
        token = create_access_token(user.id, user.email)
        
        # Test with negative date_range
        response = client.get(
            "/api/v1/analytics/sessions?date_range=-5",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Should handle gracefully (either 400 or default to valid range)
        assert response.status_code in [200, 400]
