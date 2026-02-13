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


import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
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
