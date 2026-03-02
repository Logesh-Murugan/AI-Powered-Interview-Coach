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
from fastapi import Depends
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
    from app.middleware.auth import get_current_user, security
    from app.models.user import User
    from fastapi import HTTPException, status
    import jwt
    
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    async def override_get_current_user(credentials = Depends(security)):
        """Override get_current_user to use test database session"""
        from app.utils.jwt import verify_access_token
        
        token = credentials.credentials
        
        try:
            payload = verify_access_token(token)
            if payload is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            
            # Fetch user from test database session
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            return user
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"}
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"}
            )
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
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
