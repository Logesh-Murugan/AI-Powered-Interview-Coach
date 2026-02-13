"""
Tests for Answer Submission Endpoint

This module tests the answer submission endpoint for interview sessions.

Requirements: 16.1-16.10
"""
import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

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


class TestAnswerSubmissionEndpoint:
    """Test answer submission endpoint"""
    
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
    
    def test_submit_answer_success(self, db: Session):
        """Test successful answer submission"""
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
            question_text="Describe a challenging project you worked on.",
            category="Behavioral",
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
            status='pending',
            question_displayed_at=datetime.utcnow() - timedelta(seconds=120)
        )
        db.add(sq)
        db.commit()
        
        # Create access token
        token = create_access_token(user_id=user.id, email=user.email)
        
        # Submit answer
        answer_text = "I worked on a microservices migration project that required careful planning and execution."
        response = client.post(
            f"/api/v1/interviews/{session.id}/answers?question_id={question.id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"answer_text": answer_text}
        )
        
        # Assertions
        assert response.status_code == 201
        data = response.json()
        assert data["answer_id"] > 0
        assert data["session_id"] == session.id
        assert data["question_id"] == question.id
        assert data["time_taken"] >= 120  # At least 120 seconds
        assert data["status"] == "submitted"
        assert data["all_questions_answered"] is True
        assert data["session_completed"] is True
        
        # Verify answer in database
        answer = db.query(Answer).filter(Answer.id == data["answer_id"]).first()
        assert answer is not None
        assert answer.answer_text == answer_text
        assert answer.time_taken >= 120
        
        # Verify session_question updated
        sq = db.query(SessionQuestion).filter(
            SessionQuestion.session_id == session.id,
            SessionQuestion.question_id == question.id
        ).first()
        assert sq.answer_id == answer.id
        assert sq.status == 'answered'
        
        # Verify session completed
        session = db.query(InterviewSession).filter(InterviewSession.id == session.id).first()
        assert session.status == SessionStatus.COMPLETED
        assert session.end_time is not None
    
    def test_submit_answer_without_auth(self, db: Session):
        """Test answer submission without authentication"""
        response = client.post(
            "/api/v1/interviews/1/answers?question_id=1",
            json={"answer_text": "Test answer"}
        )
        
        assert response.status_code == 403
    
    def test_submit_answer_session_not_found(self, db: Session):
        """Test answer submission with non-existent session"""
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
            "/api/v1/interviews/99999/answers?question_id=1",
            headers={"Authorization": f"Bearer {token}"},
            json={"answer_text": "Test answer"}
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_submit_answer_wrong_user(self, db: Session):
        """Test answer submission from another user's session"""
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
        
        # Try to submit answer with user2's token
        token = create_access_token(user_id=user2.id, email=user2.email)
        
        response = client.post(
            f"/api/v1/interviews/{session.id}/answers?question_id={question.id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"answer_text": "Test answer"}
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_submit_answer_question_not_in_session(self, db: Session):
        """Test answer submission for question not in session"""
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
        question1 = Question(
            question_text="Question 1",
            category="Technical",
            difficulty="Medium",
            role="Software Engineer",
            expected_answer_points=["Point 1", "Point 2", "Point 3"],
            time_limit_seconds=300
        )
        question2 = Question(
            question_text="Question 2",
            category="Technical",
            difficulty="Medium",
            role="Software Engineer",
            expected_answer_points=["Point 1", "Point 2", "Point 3"],
            time_limit_seconds=300
        )
        db.add_all([question1, question2])
        db.commit()
        
        # Create session with only question1
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
        
        # Add only question1 to session
        sq = SessionQuestion(
            session_id=session.id,
            question_id=question1.id,
            display_order=1,
            status='pending'
        )
        db.add(sq)
        db.commit()
        
        token = create_access_token(user_id=user.id, email=user.email)
        
        # Try to submit answer for question2 (not in session)
        response = client.post(
            f"/api/v1/interviews/{session.id}/answers?question_id={question2.id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"answer_text": "Test answer"}
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_submit_answer_too_short(self, db: Session):
        """Test answer submission with text too short"""
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
        
        # Submit answer with text too short (< 10 characters)
        response = client.post(
            f"/api/v1/interviews/{session.id}/answers?question_id={question.id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"answer_text": "Short"}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_submit_answer_already_answered(self, db: Session):
        """Test submitting answer to already answered question"""
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
        
        # Create answer
        answer = Answer(
            session_id=session.id,
            question_id=question.id,
            user_id=user.id,
            answer_text="First answer",
            time_taken=120,
            submitted_at=datetime.utcnow()
        )
        db.add(answer)
        db.commit()
        
        # Create session question with answer already linked
        sq = SessionQuestion(
            session_id=session.id,
            question_id=question.id,
            display_order=1,
            status='answered',
            answer_id=answer.id
        )
        db.add(sq)
        db.commit()
        
        token = create_access_token(user_id=user.id, email=user.email)
        
        # Try to submit another answer
        response = client.post(
            f"/api/v1/interviews/{session.id}/answers?question_id={question.id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"answer_text": "Second answer attempt"}
        )
        
        assert response.status_code == 400
        assert "already answered" in response.json()["detail"].lower()
    
    def test_submit_answer_multiple_questions_partial(self, db: Session):
        """Test submitting answer when not all questions are answered"""
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
                question_text=f"Question {i+1}",
                category="Technical",
                difficulty="Medium",
                role="Software Engineer",
                expected_answer_points=["Point 1", "Point 2", "Point 3"],
                time_limit_seconds=300
            )
            db.add(question)
            questions.append(question)
        db.commit()
        
        # Create session
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
        
        token = create_access_token(user_id=user.id, email=user.email)
        
        # Submit answer for first question only
        response = client.post(
            f"/api/v1/interviews/{session.id}/answers?question_id={questions[0].id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"answer_text": "Answer to first question"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["all_questions_answered"] is False
        assert data["session_completed"] is False
        
        # Verify session still in progress
        session = db.query(InterviewSession).filter(InterviewSession.id == session.id).first()
        assert session.status == SessionStatus.IN_PROGRESS
        assert session.end_time is None
    
    def test_submit_answer_time_calculation(self, db: Session):
        """Test time_taken calculation"""
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
        
        # Create session question with specific display time
        display_time = datetime.utcnow() - timedelta(seconds=180)  # 3 minutes ago
        sq = SessionQuestion(
            session_id=session.id,
            question_id=question.id,
            display_order=1,
            status='pending',
            question_displayed_at=display_time
        )
        db.add(sq)
        db.commit()
        
        token = create_access_token(user_id=user.id, email=user.email)
        
        # Submit answer
        response = client.post(
            f"/api/v1/interviews/{session.id}/answers?question_id={question.id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"answer_text": "Test answer with time calculation"}
        )
        
        assert response.status_code == 201
        data = response.json()
        # Time should be approximately 180 seconds (allow some variance)
        assert 175 <= data["time_taken"] <= 185
