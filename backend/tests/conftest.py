"""
Pytest configuration and fixtures for all tests.
This file ensures models are properly imported before tests run.
"""

# Import all models to ensure they're registered with SQLAlchemy Base
# This must happen before any test creates tables
from app.models import (  # noqa: F401
    User,
    AccountStatus,
    ExperienceLevel,
    RefreshToken,
    PasswordResetToken,
    Resume,
    ResumeStatus,
)

# Import additional models
from app.models.question import Question  # noqa: F401
from app.models.interview_session import InterviewSession, SessionStatus  # noqa: F401
from app.models.session_question import SessionQuestion  # noqa: F401
from app.models.answer import Answer  # noqa: F401
from app.models.answer_draft import AnswerDraft  # noqa: F401
from app.models.evaluation import Evaluation  # noqa: F401
from app.models.session_summary import SessionSummary  # noqa: F401
from app.models.ai_provider_usage import AIProviderUsage  # noqa: F401
from app.models.study_plan import StudyPlan  # noqa: F401
from app.models.resume_analysis import ResumeAnalysis  # noqa: F401


import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.models.base import Base


@pytest.fixture(scope="function")
def db():
    """
    Create a test database session for each test.
    
    This fixture uses the actual PostgreSQL database but rolls back
    all changes after each test to ensure isolation.
    """
    from app.database import engine, SessionLocal
    
    # Create a connection
    connection = engine.connect()
    
    # Begin a transaction
    transaction = connection.begin()
    
    # Create session bound to the connection
    session = SessionLocal(bind=connection)
    
    try:
        yield session
    finally:
        session.close()
        # Rollback the transaction to undo all changes
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db: Session):
    """Create test client with database override"""
    from app.main import app
    from app.database import get_db
    
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


@pytest.fixture
def test_user(db: Session):
    """Create a test user"""
    import uuid
    
    user = User(
        email=f"test-{uuid.uuid4()}@example.com",
        password_hash="hashed",
        name="Test User",
        target_role="Software Engineer"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
