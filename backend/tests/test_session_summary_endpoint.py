"""
Tests for Session Summary Endpoint

Requirements: 19.1-19.12
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.user import User
from app.models.interview_session import InterviewSession, SessionStatus
from app.models.question import Question
from app.models.session_question import SessionQuestion
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.database import get_db


@pytest.fixture
def client(db: Session):
    """Create test client with database override"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(db: Session):
    """Create authenticated user and return auth headers"""
    import uuid
    from app.utils.jwt import create_access_token
    
    user = User(
        email=f"test-{uuid.uuid4()}@example.com",
        password_hash="hashed",
        name="Test User",
        target_role="Software Engineer"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token(user.id, user.email)
    return {"Authorization": f"Bearer {token}"}, user


class TestSessionSummaryEndpoint:
    """Test session summary endpoint"""
    
    def test_get_session_summary_success(self, client, db: Session, auth_headers):
        """
        Test successful session summary retrieval.
        
        **Feature: interview-master-ai, Test 1: Get summary success**
        **Validates: Requirements 19.1-19.12**
        """
        headers, user = auth_headers
        
        # Create completed session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.COMPLETED,
            question_count=2
        )
        db.add(session)
        db.flush()
        
        # Create questions and evaluations
        for i in range(2):
            question = Question(
                question_text=f"Question {i+1}",
                category="Technical",
                difficulty="Medium",
                role="Software Engineer",
                expected_answer_points=["Point 1", "Point 2", "Point 3"],
                time_limit_seconds=300
            )
            db.add(question)
            db.flush()
            
            sq = SessionQuestion(
                session_id=session.id,
                question_id=question.id,
                display_order=i+1,
                status="answered"
            )
            db.add(sq)
            db.flush()
            
            answer = Answer(
                session_id=session.id,
                question_id=question.id,
                user_id=user.id,
                answer_text=f"Answer {i+1}",
                time_taken=300
            )
            db.add(answer)
            db.flush()
            
            evaluation = Evaluation(
                answer_id=answer.id,
                content_quality=80.0,
                clarity=75.0,
                confidence=82.0,
                technical_accuracy=77.0,
                overall_score=78.5,
                strengths=["Clear", "Detailed"],
                improvements=["More examples", "Better structure"],
                suggestions=["Practice", "Review"]
            )
            db.add(evaluation)
            db.flush()
        
        db.commit()
        
        # Get summary
        response = client.get(
            f"/api/v1/interviews/{session.id}/summary",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data['session_id'] == session.id
        assert 'overall_session_score' in data
        assert data['overall_session_score'] == 78.5
        assert 'avg_content_quality' in data
        assert data['avg_content_quality'] == 80.0
        assert 'avg_clarity' in data
        assert 'avg_confidence' in data
        assert 'avg_technical_accuracy' in data
        assert 'top_strengths' in data
        assert len(data['top_strengths']) > 0
        assert 'top_improvements' in data
        assert len(data['top_improvements']) > 0
        assert 'category_performance' in data
        assert 'Technical' in data['category_performance']
        assert data['total_questions'] == 2
        assert data['total_time_seconds'] == 600
        assert 'radar_chart_data' in data
        assert 'line_chart_data' in data
    
    def test_get_session_summary_not_found(self, client, auth_headers):
        """
        Test summary retrieval for non-existent session.
        
        **Feature: interview-master-ai, Test 2: Session not found**
        **Validates: Requirements 19.1**
        """
        headers, user = auth_headers
        
        response = client.get(
            "/api/v1/interviews/999/summary",
            headers=headers
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()['detail'].lower()
    
    def test_get_session_summary_not_completed(self, client, db: Session, auth_headers):
        """
        Test summary retrieval for incomplete session.
        
        **Feature: interview-master-ai, Test 3: Session not completed**
        **Validates: Requirements 19.1**
        """
        headers, user = auth_headers
        
        # Create in-progress session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.IN_PROGRESS,
            question_count=2
        )
        db.add(session)
        db.commit()
        
        response = client.get(
            f"/api/v1/interviews/{session.id}/summary",
            headers=headers
        )
        
        assert response.status_code == 400
        assert "not completed" in response.json()['detail'].lower()
    
    def test_get_session_summary_unauthorized(self, client, db: Session, auth_headers):
        """
        Test summary retrieval for session owned by another user.
        
        **Feature: interview-master-ai, Test 4: Unauthorized access**
        **Validates: Requirements 19.1**
        """
        headers, user = auth_headers
        
        # Create another user
        other_user = User(
            email="other@example.com",
            password_hash="hashed",
            name="Other User"
        )
        db.add(other_user)
        db.flush()
        
        # Create session for other user
        session = InterviewSession(
            user_id=other_user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.COMPLETED,
            question_count=1
        )
        db.add(session)
        db.commit()
        
        # Try to access with first user's token
        response = client.get(
            f"/api/v1/interviews/{session.id}/summary",
            headers=headers
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()['detail'].lower()
    
    def test_get_session_summary_no_auth(self, client, db: Session):
        """
        Test summary retrieval without authentication.
        
        **Feature: interview-master-ai, Test 5: No authentication**
        **Validates: Requirements 19.1**
        """
        response = client.get("/api/v1/interviews/1/summary")
        
        assert response.status_code in [401, 403]  # Either is acceptable for no auth
    
    def test_get_session_summary_with_visualization_data(self, client, db: Session, auth_headers):
        """
        Test that summary includes visualization data.
        
        **Feature: interview-master-ai, Test 6: Visualization data**
        **Validates: Requirements 19.12**
        """
        headers, user = auth_headers
        
        # Create completed session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.COMPLETED,
            question_count=1
        )
        db.add(session)
        db.flush()
        
        # Create question and evaluation
        question = Question(
            question_text="Test question",
            category="Technical",
            difficulty="Medium",
            role="Software Engineer",
            expected_answer_points=["Point 1", "Point 2", "Point 3"],
            time_limit_seconds=300
        )
        db.add(question)
        db.flush()
        
        sq = SessionQuestion(
            session_id=session.id,
            question_id=question.id,
            display_order=1,
            status="answered"
        )
        db.add(sq)
        db.flush()
        
        answer = Answer(
            session_id=session.id,
            question_id=question.id,
            user_id=user.id,
            answer_text="Test answer",
            time_taken=300
        )
        db.add(answer)
        db.flush()
        
        evaluation = Evaluation(
            answer_id=answer.id,
            content_quality=85.0,
            clarity=80.0,
            confidence=90.0,
            technical_accuracy=82.0,
            overall_score=84.5,
            strengths=["Excellent"],
            improvements=["Minor tweaks"],
            suggestions=["Keep it up"]
        )
        db.add(evaluation)
        db.flush()
        
        db.commit()
        
        # Get summary
        response = client.get(
            f"/api/v1/interviews/{session.id}/summary",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check radar chart data
        assert 'radar_chart_data' in data
        assert data['radar_chart_data'] is not None
        assert 'labels' in data['radar_chart_data']
        assert 'values' in data['radar_chart_data']
        assert len(data['radar_chart_data']['labels']) == 4
        assert len(data['radar_chart_data']['values']) == 4
        
        # Check line chart data
        assert 'line_chart_data' in data
        assert data['line_chart_data'] is not None
        assert 'labels' in data['line_chart_data']
        assert 'scores' in data['line_chart_data']
