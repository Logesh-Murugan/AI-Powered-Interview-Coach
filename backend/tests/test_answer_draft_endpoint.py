"""
Tests for Answer Draft Auto-Save Endpoints

This module tests the answer draft auto-save functionality.

Requirements: 17.1-17.7
"""
import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime

from app.main import app
from app.database import get_db
from app.models.user import User, AccountStatus
from app.models.question import Question
from app.models.interview_session import InterviewSession, SessionStatus
from app.models.session_question import SessionQuestion
from app.models.answer_draft import AnswerDraft
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.models.session_summary import SessionSummary
from app.utils.jwt import create_access_token

client = TestClient(app)


class TestAnswerDraftEndpoints:
    """Test answer draft auto-save endpoints"""
    
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
    
    def test_save_draft_success(self, db: Session):
        """Test successful draft save"""
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
        
        # Save draft
        draft_text = "This is a draft answer"
        response = client.post(
            f"/api/v1/interviews/{session.id}/drafts?question_id={question.id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"draft_text": draft_text}
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["draft_id"] > 0
        assert data["session_id"] == session.id
        assert data["question_id"] == question.id
        assert data["draft_text"] == draft_text
        assert "last_saved_at" in data
        
        # Verify draft in database
        draft = db.query(AnswerDraft).filter(AnswerDraft.id == data["draft_id"]).first()
        assert draft is not None
        assert draft.draft_text == draft_text
    
    def test_update_existing_draft(self, db: Session):
        """Test updating an existing draft"""
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
        
        # Create initial draft
        initial_draft = AnswerDraft(
            session_id=session.id,
            question_id=question.id,
            user_id=user.id,
            draft_text="Initial draft",
            last_saved_at=datetime.utcnow()
        )
        db.add(initial_draft)
        db.commit()
        initial_draft_id = initial_draft.id
        
        token = create_access_token(user_id=user.id, email=user.email)
        
        # Update draft
        updated_text = "Updated draft text"
        response = client.post(
            f"/api/v1/interviews/{session.id}/drafts?question_id={question.id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"draft_text": updated_text}
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["draft_id"] == initial_draft_id  # Same draft ID
        assert data["draft_text"] == updated_text
        
        # Verify only one draft exists
        draft_count = db.query(AnswerDraft).filter(
            AnswerDraft.session_id == session.id,
            AnswerDraft.question_id == question.id
        ).count()
        assert draft_count == 1
    
    def test_save_draft_without_auth(self, db: Session):
        """Test draft save without authentication"""
        response = client.post(
            "/api/v1/interviews/1/drafts?question_id=1",
            json={"draft_text": "Test draft"}
        )
        
        assert response.status_code == 403
    
    def test_save_draft_session_not_found(self, db: Session):
        """Test draft save with non-existent session"""
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
            "/api/v1/interviews/99999/drafts?question_id=1",
            headers={"Authorization": f"Bearer {token}"},
            json={"draft_text": "Test draft"}
        )
        
        assert response.status_code == 404
    
    def test_get_draft_success(self, db: Session):
        """Test successful draft retrieval"""
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
        
        # Create draft
        draft_text = "Saved draft text"
        draft = AnswerDraft(
            session_id=session.id,
            question_id=question.id,
            user_id=user.id,
            draft_text=draft_text,
            last_saved_at=datetime.utcnow()
        )
        db.add(draft)
        db.commit()
        
        token = create_access_token(user_id=user.id, email=user.email)
        
        # Retrieve draft
        response = client.get(
            f"/api/v1/interviews/{session.id}/drafts/{question.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["draft_text"] == draft_text
        assert "last_saved_at" in data
    
    def test_get_draft_not_found(self, db: Session):
        """Test draft retrieval when no draft exists"""
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
        
        token = create_access_token(user_id=user.id, email=user.email)
        
        # Try to retrieve non-existent draft
        response = client.get(
            f"/api/v1/interviews/{session.id}/drafts/{question.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404
    
    def test_delete_draft_success(self, db: Session):
        """Test successful draft deletion"""
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
        
        # Create draft
        draft = AnswerDraft(
            session_id=session.id,
            question_id=question.id,
            user_id=user.id,
            draft_text="Draft to delete",
            last_saved_at=datetime.utcnow()
        )
        db.add(draft)
        db.commit()
        draft_id = draft.id
        
        token = create_access_token(user_id=user.id, email=user.email)
        
        # Delete draft
        response = client.delete(
            f"/api/v1/interviews/{session.id}/drafts/{question.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Assertions
        assert response.status_code == 204
        
        # Verify draft deleted
        draft = db.query(AnswerDraft).filter(AnswerDraft.id == draft_id).first()
        assert draft is None
    
    def test_delete_draft_not_found(self, db: Session):
        """Test draft deletion when no draft exists (should succeed)"""
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
        
        token = create_access_token(user_id=user.id, email=user.email)
        
        # Try to delete non-existent draft (should succeed)
        response = client.delete(
            f"/api/v1/interviews/{session.id}/drafts/{question.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 204
    
    def test_draft_deleted_on_answer_submission(self, db: Session):
        """Test that draft is automatically deleted when answer is submitted"""
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
        
        # Create draft
        draft = AnswerDraft(
            session_id=session.id,
            question_id=question.id,
            user_id=user.id,
            draft_text="Draft that should be deleted",
            last_saved_at=datetime.utcnow()
        )
        db.add(draft)
        db.commit()
        draft_id = draft.id
        
        token = create_access_token(user_id=user.id, email=user.email)
        
        # Submit answer
        response = client.post(
            f"/api/v1/interviews/{session.id}/answers?question_id={question.id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"answer_text": "Final answer submission"}
        )
        
        # Assertions
        assert response.status_code == 201
        
        # Verify draft was deleted
        draft = db.query(AnswerDraft).filter(AnswerDraft.id == draft_id).first()
        assert draft is None
