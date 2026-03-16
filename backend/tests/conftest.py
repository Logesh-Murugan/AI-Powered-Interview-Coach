"""
Pytest configuration and fixtures for all tests.
This file ensures models are properly imported before tests run.
"""

from app.models import (  # noqa: F401
    AccountStatus,
    ExperienceLevel,
    PasswordResetToken,
    RefreshToken,
    Resume,
    ResumeStatus,
    User,
)
from app.models.ai_provider_usage import AIProviderUsage  # noqa: F401
from app.models.answer import Answer  # noqa: F401
from app.models.answer_draft import AnswerDraft  # noqa: F401
from app.models.evaluation import Evaluation  # noqa: F401
from app.models.interview_session import InterviewSession, SessionStatus  # noqa: F401
from app.models.question import Question  # noqa: F401
from app.models.resume_analysis import ResumeAnalysis  # noqa: F401
from app.models.session_question import SessionQuestion  # noqa: F401
from app.models.session_summary import SessionSummary  # noqa: F401
from app.models.study_plan import StudyPlan  # noqa: F401

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session


@pytest.fixture(scope='function')
def db():
    """Create a clean database session for each test."""
    from app.database import Base, SessionLocal, engine

    connection = engine.connect()
    session = SessionLocal(bind=connection)

    for table in reversed(Base.metadata.sorted_tables):
        connection.execute(text(f"DELETE FROM {table.fullname}"))
    connection.commit()

    try:
        yield session
    finally:
        session.rollback()
        session.close()
        connection.close()


@pytest.fixture
def client():
    """Create a test client with an isolated per-request database session."""
    from app.database import SessionLocal, get_db
    from app.main import app

    app.dependency_overrides.clear()

    def override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    try:
        yield test_client
    finally:
        test_client.close()
        app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(db: Session):
    """Create authenticated headers for a test user."""
    import uuid

    from app.utils.jwt import create_access_token

    user = User(
        email=f'test-{uuid.uuid4()}@example.com',
        password_hash='hashed',
        name='Test User',
        target_role='Software Engineer',
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.email)
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture
def test_user(db: Session):
    """Create a test user."""
    import uuid

    user = User(
        email=f'test-{uuid.uuid4()}@example.com',
        password_hash='hashed',
        name='Test User',
        target_role='Software Engineer',
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
