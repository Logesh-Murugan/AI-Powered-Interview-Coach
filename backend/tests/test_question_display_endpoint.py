"""
Tests for Question Display Endpoint

This module tests the question retrieval endpoint during interview sessions.

Requirements: 15.1-15.7
"""
import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime

from app.main import app
from app.database import get_db
from app.models.user import User, AccountStatus, ExperienceLevel
from app.models.question import Question
from app.models.interview_session import InterviewSession, SessionStatus
from app.models.session_question import SessionQuestion
from app.models.answer import Answer
from app.models.answer_draft import AnswerDraft
from app.models.evaluation import Evaluation
from app.models.session_summary import SessionSummary
from app.utils.jwt import create_access_token

client = TestClient(app)


class TestQuestionDisplayEndpoint:
    """Test question display endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self, db: Session):
        """Override get_db dependency to use test database session"""
        def override_get_db():
            try:
                yield db
            finally:
                pass
        
        app.dependency_overrides[get_db] = override_get_db
        yield
        app.dependency_overrides.clear()
    
    def test_get_question_success(self, db: Session):
        """Test successful question retrieval"""
        # Create user
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        user = User(
            email=unique_email,
            password_hash="hashed_password",
            name="Test User",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create questions
        questions = []
        for i in range(3):
            question = Question(
                question_text=f"Test question {i+1}",
                category="Technical",
                difficulty="Medium",
                role="Software Engineer",
                expected_answer_points=["Point 1", "Point 2", "Point 3"],
                time_limit_seconds=300
            )
            db.add(question)
            questions.append(question)
        db.commit()
        
        # Create interview session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.IN_PROGRESS,
            question_count=3,
            start_time=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Create session questions
        for idx, question in enumerate(questions, start=1):
            sq = SessionQuestion(
                session_id=session.id,
                question_id=question.id,
                display_order=idx,
                status='pending'
            )
            db.add(sq)
        db.commit()
        
        # Create access token
        token = create_access_token(user_id=user.id, email=user.email)
        
        # Make request
        response = client.get(
            f"/api/v1/interviews/{session.id}/questions/1",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["question_text"] == "Test question 1"
        assert data["category"] == "Technical"
        assert data["difficulty"] == "Medium"
        assert data["time_limit_seconds"] == 300
        assert data["question_number"] == 1
        
        # Verify question_displayed_at was recorded
        sq = db.query(SessionQuestion).filter(
            SessionQuestion.session_id == session.id,
            SessionQuestion.display_order == 1
        ).first()
        assert sq.question_displayed_at is not None
    
    def test_get_question_without_auth(self, db: Session):
        """Test question retrieval without authentication"""
        response = client.get("/api/v1/interviews/1/questions/1")
        
        # Auth middleware returns 403 when no token provided
        assert response.status_code == 403
    
    def test_get_question_session_not_found(self, db: Session):
        """Test question retrieval with non-existent session"""
        # Create user
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        user = User(
            email=unique_email,
            password_hash="hashed_password",
            name="Test User",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        token = create_access_token(user_id=user.id, email=user.email)
        
        response = client.get(
            "/api/v1/interviews/99999/questions/1",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_get_question_wrong_user(self, db: Session):
        """Test question retrieval from another user's session"""
        # Create first user and session
        user1_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        user1 = User(
            email=user1_email,
            password_hash="hashed_password",
            name="User 1",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user1)
        db.commit()
        db.refresh(user1)
        
        # Create question
        question = Question(
            question_text="Test question",
            category="Technical",
            difficulty="Medium",
            role="Software Engineer",
            expected_answer_points=["Point 1", "Point 2", "Point 3"],
            time_limit_seconds=300
        )
        db.add(question)
        db.commit()
        
        # Create session for user1
        session = InterviewSession(
            user_id=user1.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.IN_PROGRESS,
            question_count=1,
            start_time=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Create session question
        sq = SessionQuestion(
            session_id=session.id,
            question_id=question.id,
            display_order=1,
            status='pending'
        )
        db.add(sq)
        db.commit()
        
        # Create second user
        user2_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        user2 = User(
            email=user2_email,
            password_hash="hashed_password",
            name="User 2",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user2)
        db.commit()
        db.refresh(user2)
        
        # Try to access user1's session with user2's token
        token = create_access_token(user_id=user2.id, email=user2.email)
        
        response = client.get(
            f"/api/v1/interviews/{session.id}/questions/1",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_get_question_invalid_question_number(self, db: Session):
        """Test question retrieval with invalid question number"""
        # Create user
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        user = User(
            email=unique_email,
            password_hash="hashed_password",
            name="Test User",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create question
        question = Question(
            question_text="Test question",
            category="Technical",
            difficulty="Medium",
            role="Software Engineer",
            expected_answer_points=["Point 1", "Point 2", "Point 3"],
            time_limit_seconds=300
        )
        db.add(question)
        db.commit()
        
        # Create session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.IN_PROGRESS,
            question_count=1,
            start_time=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Create session question
        sq = SessionQuestion(
            session_id=session.id,
            question_id=question.id,
            display_order=1,
            status='pending'
        )
        db.add(sq)
        db.commit()
        
        token = create_access_token(user_id=user.id, email=user.email)
        
        # Try to get question 2 when only question 1 exists
        response = client.get(
            f"/api/v1/interviews/{session.id}/questions/2",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_get_question_timestamp_recorded_once(self, db: Session):
        """Test that question_displayed_at is only recorded on first view"""
        # Create user
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        user = User(
            email=unique_email,
            password_hash="hashed_password",
            name="Test User",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create question
        question = Question(
            question_text="Test question",
            category="Technical",
            difficulty="Medium",
            role="Software Engineer",
            expected_answer_points=["Point 1", "Point 2", "Point 3"],
            time_limit_seconds=300
        )
        db.add(question)
        db.commit()
        
        # Create session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.IN_PROGRESS,
            question_count=1,
            start_time=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Create session question
        sq = SessionQuestion(
            session_id=session.id,
            question_id=question.id,
            display_order=1,
            status='pending'
        )
        db.add(sq)
        db.commit()
        
        token = create_access_token(user_id=user.id, email=user.email)
        
        # First request
        response1 = client.get(
            f"/api/v1/interviews/{session.id}/questions/1",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response1.status_code == 200
        
        # Get timestamp from first request
        sq = db.query(SessionQuestion).filter(
            SessionQuestion.session_id == session.id,
            SessionQuestion.display_order == 1
        ).first()
        first_timestamp = sq.question_displayed_at
        assert first_timestamp is not None
        
        # Second request (should not update timestamp)
        response2 = client.get(
            f"/api/v1/interviews/{session.id}/questions/1",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response2.status_code == 200
        
        # Verify timestamp hasn't changed
        db.refresh(sq)
        assert sq.question_displayed_at == first_timestamp
