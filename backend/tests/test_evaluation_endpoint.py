"""
Tests for Evaluation Endpoints

This module tests the evaluation API endpoints.

Requirements: 18.1-18.14
"""
import pytest
import uuid
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime

from app.main import app
from app.database import get_db
from app.models.user import User, AccountStatus
from app.models.question import Question
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.models.interview_session import InterviewSession, SessionStatus
from app.models.session_question import SessionQuestion
from app.models.answer_draft import AnswerDraft
from app.models.session_summary import SessionSummary
from app.utils.jwt import create_access_token

client = TestClient(app)


class TestEvaluationEndpoints:
    """Test evaluation endpoints"""
    
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
    
    def test_evaluate_answer_success(self, db: Session):
        """Test successful answer evaluation"""
        # Create user
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        user = User(
            email=unique_email,
            password_hash="hashed_password",
            name="Test User",
            target_role="Software Engineer",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create interview session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.IN_PROGRESS,
            question_count=5
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Create question
        question = Question(
            question_text="Explain REST API principles",
            category="Technical",
            difficulty="Medium",
            role="Software Engineer",
            expected_answer_points=[
                "Stateless communication",
                "Resource-based URLs",
                "HTTP methods (GET, POST, PUT, DELETE)"
            ],
            time_limit_seconds=300
        )
        db.add(question)
        db.commit()
        
        # Create answer
        answer = Answer(
            session_id=session.id,
            question_id=question.id,
            user_id=user.id,
            answer_text="REST APIs use stateless communication, resource-based URLs, and standard HTTP methods.",
            time_taken=120,
            submitted_at=datetime.utcnow()
        )
        db.add(answer)
        db.commit()
        db.refresh(answer)
        
        token = create_access_token(user_id=user.id, email=user.email)
        
        # Mock AI response
        mock_ai_response = """{
            "content_quality": 80,
            "clarity": 85,
            "confidence": 75,
            "technical_accuracy": 90,
            "strengths": ["Covered key principles", "Clear explanation", "Concise"],
            "improvements": ["Could add more details", "Could provide examples"],
            "suggestions": ["Add examples of REST endpoints", "Explain benefits of statelessness"],
            "example_answer": "REST APIs follow principles like..."
        }"""
        
        # Mock evaluation service
        with patch('app.routes.evaluations.EvaluationService') as MockService:
            mock_service = Mock()
            MockService.return_value = mock_service
            mock_service.evaluate_answer.return_value = {
                'evaluation_id': 1,
                'answer_id': answer.id,
                'scores': {
                    'content_quality': 80.0,
                    'clarity': 85.0,
                    'confidence': 75.0,
                    'technical_accuracy': 90.0,
                    'overall_score': 82.0
                },
                'feedback': {
                    'strengths': ["Covered key principles", "Clear explanation", "Concise"],
                    'improvements': ["Could add more details", "Could provide examples"],
                    'suggestions': ["Add examples of REST endpoints", "Explain benefits of statelessness"],
                    'example_answer': "REST APIs follow principles like..."
                },
                'evaluated_at': datetime.utcnow().isoformat()
            }
            
            # Evaluate answer
            response = client.post(
                "/api/v1/evaluations/evaluate",
                headers={"Authorization": f"Bearer {token}"},
                json={"answer_id": answer.id}
            )
            
            # Assertions
            assert response.status_code == 200
            data = response.json()
            assert data['answer_id'] == answer.id
            assert data['scores']['overall_score'] == 82.0
            assert len(data['feedback']['strengths']) == 3
            assert len(data['feedback']['improvements']) == 2
    
    def test_evaluate_answer_without_auth(self, db: Session):
        """Test evaluation without authentication"""
        response = client.post(
            "/api/v1/evaluations/evaluate",
            json={"answer_id": 1}
        )
        
        assert response.status_code == 403
    
    def test_evaluate_answer_not_found(self, db: Session):
        """Test evaluation with non-existent answer"""
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
            "/api/v1/evaluations/evaluate",
            headers={"Authorization": f"Bearer {token}"},
            json={"answer_id": 99999}
        )
        
        assert response.status_code == 404
    
    def test_evaluate_answer_access_denied(self, db: Session):
        """Test evaluation of another user's answer"""
        # Create two users
        unique_email1 = f"test_{uuid.uuid4().hex[:8]}@example.com"
        user1 = User(
            email=unique_email1,
            password_hash="hashed_password",
            name="User 1",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user1)
        
        unique_email2 = f"test_{uuid.uuid4().hex[:8]}@example.com"
        user2 = User(
            email=unique_email2,
            password_hash="hashed_password",
            name="User 2",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user2)
        db.commit()
        db.refresh(user1)
        db.refresh(user2)
        
        # Create interview session for user1
        session = InterviewSession(
            user_id=user1.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.IN_PROGRESS,
            question_count=5
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
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
        
        # Create answer for user1
        answer = Answer(
            session_id=session.id,
            question_id=question.id,
            user_id=user1.id,
            answer_text="Test answer",
            time_taken=120,
            submitted_at=datetime.utcnow()
        )
        db.add(answer)
        db.commit()
        db.refresh(answer)
        
        # Try to evaluate with user2's token
        token = create_access_token(user_id=user2.id, email=user2.email)
        
        response = client.post(
            "/api/v1/evaluations/evaluate",
            headers={"Authorization": f"Bearer {token}"},
            json={"answer_id": answer.id}
        )
        
        assert response.status_code == 403
    
    def test_evaluate_already_evaluated_answer(self, db: Session):
        """Test evaluation of already evaluated answer"""
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
        
        # Create interview session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.IN_PROGRESS,
            question_count=5
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
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
        
        # Create answer
        answer = Answer(
            session_id=session.id,
            question_id=question.id,
            user_id=user.id,
            answer_text="Test answer",
            time_taken=120,
            submitted_at=datetime.utcnow()
        )
        db.add(answer)
        db.flush()
        
        # Create evaluation
        evaluation = Evaluation(
            answer_id=answer.id,
            content_quality=80.0,
            clarity=85.0,
            confidence=75.0,
            technical_accuracy=90.0,
            overall_score=82.0,
            strengths=["Good answer"],
            improvements=["Could be better"],
            suggestions=["Practice more"]
        )
        db.add(evaluation)
        db.commit()
        db.refresh(answer)
        
        token = create_access_token(user_id=user.id, email=user.email)
        
        response = client.post(
            "/api/v1/evaluations/evaluate",
            headers={"Authorization": f"Bearer {token}"},
            json={"answer_id": answer.id}
        )
        
        assert response.status_code == 400
        assert "already evaluated" in response.json()['detail'].lower()
    
    def test_get_evaluation_success(self, db: Session):
        """Test successful evaluation retrieval"""
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
        
        # Create interview session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.IN_PROGRESS,
            question_count=5
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
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
        
        # Create answer
        answer = Answer(
            session_id=session.id,
            question_id=question.id,
            user_id=user.id,
            answer_text="Test answer",
            time_taken=120,
            submitted_at=datetime.utcnow()
        )
        db.add(answer)
        db.flush()
        
        # Create evaluation
        evaluation = Evaluation(
            answer_id=answer.id,
            content_quality=80.0,
            clarity=85.0,
            confidence=75.0,
            technical_accuracy=90.0,
            overall_score=82.0,
            strengths=["Good answer"],
            improvements=["Could be better"],
            suggestions=["Practice more"]
        )
        db.add(evaluation)
        db.commit()
        db.refresh(answer)
        db.refresh(evaluation)
        
        token = create_access_token(user_id=user.id, email=user.email)
        
        # Get evaluation
        response = client.get(
            f"/api/v1/evaluations/{answer.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data['answer_id'] == answer.id
        assert data['scores']['overall_score'] == 82.0
        assert len(data['feedback']['strengths']) == 1
    
    def test_get_evaluation_not_yet_evaluated(self, db: Session):
        """Test getting evaluation for unevaluated answer"""
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
        
        # Create interview session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.IN_PROGRESS,
            question_count=5
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
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
        
        # Create answer without evaluation
        answer = Answer(
            session_id=session.id,
            question_id=question.id,
            user_id=user.id,
            answer_text="Test answer",
            time_taken=120,
            submitted_at=datetime.utcnow()
        )
        db.add(answer)
        db.commit()
        db.refresh(answer)
        
        token = create_access_token(user_id=user.id, email=user.email)
        
        response = client.get(
            f"/api/v1/evaluations/{answer.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404
        assert "not yet evaluated" in response.json()['detail'].lower()
