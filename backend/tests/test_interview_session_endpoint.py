"""
Tests for Interview Session Endpoint

This module tests the interview session creation endpoint.

Requirements: 14.1-14.10
"""
import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import get_db
from app.models.user import User, AccountStatus, ExperienceLevel
from app.models.question import Question
from app.models.answer import Answer  # Import to ensure model is registered
from app.models.interview_session import InterviewSession  # Import to ensure model is registered
from app.models.session_question import SessionQuestion  # Import to ensure model is registered
from app.models.session_summary import SessionSummary  # Import to ensure model is registered
from app.models.evaluation import Evaluation  # Import to ensure model is registered
from app.utils.jwt import create_access_token

client = TestClient(app)


class TestInterviewSessionEndpoint:
    """Test interview session creation endpoint"""
    
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
    
    def test_create_session_success(self, db: Session, mocker):
        """Test successful session creation"""
        # Create user
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        user = User(
            email=unique_email,
            password_hash="hashed_password",
            name="Test User",
            target_role="Software Engineer",
            experience_level=ExperienceLevel.MID,
            account_status=AccountStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create test questions
        for i in range(5):
            question = Question(
                question_text=f"Test question {i+1}",
                category="Technical",
                difficulty="Medium",
                role="Software Engineer",
                expected_answer_points=["Point 1", "Point 2", "Point 3"],
                time_limit_seconds=300
            )
            db.add(question)
        db.commit()
        
        # Mock question service to return test questions
        def mock_generate(role, difficulty, question_count, categories=None):
            questions = db.query(Question).limit(question_count).all()
            return [q.to_dict() for q in questions]
        
        mocker.patch(
            'app.services.interview_session_service.QuestionService.generate',
            side_effect=mock_generate
        )
        
        # Create access token
        token = create_access_token(user_id=user.id, email=user.email)
        
        # Make request
        response = client.post(
            "/api/v1/interviews",
            json={
                "role": "Software Engineer",
                "difficulty": "Medium",
                "question_count": 5,
                "categories": ["Technical", "Behavioral"]
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assertions
        assert response.status_code == 201
        data = response.json()
        assert "session_id" in data
        assert data["role"] == "Software Engineer"
        assert data["difficulty"] == "Medium"
        assert data["status"] == "in_progress"
        assert data["question_count"] == 5
        assert data["categories"] == ["Technical", "Behavioral"]
        assert "first_question" in data
        assert data["first_question"]["question_number"] == 1
    
    def test_create_session_without_auth(self, db: Session):
        """Test session creation without authentication"""
        response = client.post(
            "/api/v1/interviews",
            json={
                "role": "Software Engineer",
                "difficulty": "Medium",
                "question_count": 5
            }
        )
        
        # Auth middleware returns 403 when no token provided
        assert response.status_code == 403
    
    def test_create_session_invalid_difficulty(self, db: Session):
        """Test session creation with invalid difficulty"""
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
        
        response = client.post(
            "/api/v1/interviews",
            json={
                "role": "Software Engineer",
                "difficulty": "Invalid",
                "question_count": 5
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_create_session_invalid_question_count(self, db: Session):
        """Test session creation with invalid question count"""
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
        
        # Test question_count < 1
        response = client.post(
            "/api/v1/interviews",
            json={
                "role": "Software Engineer",
                "difficulty": "Medium",
                "question_count": 0
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 422
        
        # Test question_count > 20
        response = client.post(
            "/api/v1/interviews",
            json={
                "role": "Software Engineer",
                "difficulty": "Medium",
                "question_count": 21
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 422
    
    def test_create_session_invalid_categories(self, db: Session):
        """Test session creation with invalid categories"""
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
        
        response = client.post(
            "/api/v1/interviews",
            json={
                "role": "Software Engineer",
                "difficulty": "Medium",
                "question_count": 5,
                "categories": ["Invalid_Category"]
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 422
    
    def test_create_session_without_categories(self, db: Session, mocker):
        """Test session creation without categories (optional field)"""
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
        
        # Create test questions
        for i in range(3):
            question = Question(
                question_text=f"Test question {i+1}",
                category="Technical",
                difficulty="Easy",
                role="Software Engineer",
                expected_answer_points=["Point 1", "Point 2", "Point 3"],
                time_limit_seconds=300
            )
            db.add(question)
        db.commit()
        
        # Mock question service
        def mock_generate(role, difficulty, question_count, categories=None):
            questions = db.query(Question).limit(question_count).all()
            return [q.to_dict() for q in questions]
        
        mocker.patch(
            'app.services.interview_session_service.QuestionService.generate',
            side_effect=mock_generate
        )
        
        token = create_access_token(user_id=user.id, email=user.email)
        
        response = client.post(
            "/api/v1/interviews",
            json={
                "role": "Software Engineer",
                "difficulty": "Easy",
                "question_count": 3
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["categories"] is None
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/api/v1/interviews/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "interview_sessions"
