"""Unit tests for password reset endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User, AccountStatus
from app.models.password_reset_token import PasswordResetToken

# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test and drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def create_user(email="test@example.com", password="SecurePass123!", name="Test User"):
    """Helper function to create a user."""
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "name": name
        }
    )


def test_password_reset_request_success():
    """Test successful password reset request."""
    create_user()
    
    response = client.post(
        "/api/v1/auth/password-reset-request",
        json={"email": "test@example.com"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "email exists" in data["message"].lower()


def test_password_reset_request_nonexistent_email():
    """Test password reset request with non-existent email."""
    response = client.post(
        "/api/v1/auth/password-reset-request",
        json={"email": "nonexistent@example.com"}
    )
    
    # Should return success to prevent email enumeration
    assert response.status_code == 200
    data = response.json()
    assert "email exists" in data["message"].lower()


def test_password_reset_request_creates_token():
    """Test that password reset request creates token in database."""
    create_user()
    
    client.post(
        "/api/v1/auth/password-reset-request",
        json={"email": "test@example.com"}
    )
    
    # Check database for token
    db = TestingSessionLocal()
    token_record = db.query(PasswordResetToken).first()
    assert token_record is not None
    assert token_record.is_used is False
    db.close()


def test_password_reset_success():
    """Test successful password reset."""
    create_user()
    
    # Request password reset
    client.post(
        "/api/v1/auth/password-reset-request",
        json={"email": "test@example.com"}
    )
    
    # Get token from database (in production, user would get this from email)
    db = TestingSessionLocal()
    token_record = db.query(PasswordResetToken).first()
    
    # Generate the actual token (we need to reverse the hash - in real scenario, token is in email)
    # For testing, we'll create a new token with known value
    import secrets
    import hashlib
    reset_token = secrets.token_urlsafe(32)
    token_record.token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
    db.commit()
    db.close()
    
    # Reset password
    response = client.post(
        "/api/v1/auth/password-reset",
        json={
            "token": reset_token,
            "new_password": "NewSecurePass123!"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Password reset successfully"


def test_password_reset_invalid_token():
    """Test password reset with invalid token."""
    response = client.post(
        "/api/v1/auth/password-reset",
        json={
            "token": "invalid_token",
            "new_password": "NewSecurePass123!"
        }
    )
    
    assert response.status_code == 400
    assert "Invalid or expired" in response.json()["detail"]


def test_password_reset_weak_password():
    """Test password reset with weak password."""
    create_user()
    
    # Request password reset
    client.post(
        "/api/v1/auth/password-reset-request",
        json={"email": "test@example.com"}
    )
    
    # Get token
    db = TestingSessionLocal()
    token_record = db.query(PasswordResetToken).first()
    import secrets
    import hashlib
    reset_token = secrets.token_urlsafe(32)
    token_record.token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
    db.commit()
    db.close()
    
    # Try to reset with weak password
    response = client.post(
        "/api/v1/auth/password-reset",
        json={
            "token": reset_token,
            "new_password": "weak"
        }
    )
    
    assert response.status_code == 422


def test_password_reset_token_used_once():
    """Test that password reset token can only be used once."""
    create_user()
    
    # Request password reset
    client.post(
        "/api/v1/auth/password-reset-request",
        json={"email": "test@example.com"}
    )
    
    # Get token
    db = TestingSessionLocal()
    token_record = db.query(PasswordResetToken).first()
    import secrets
    import hashlib
    reset_token = secrets.token_urlsafe(32)
    token_record.token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
    db.commit()
    db.close()
    
    # Reset password first time
    response1 = client.post(
        "/api/v1/auth/password-reset",
        json={
            "token": reset_token,
            "new_password": "NewSecurePass123!"
        }
    )
    
    assert response1.status_code == 200
    
    # Try to use same token again
    response2 = client.post(
        "/api/v1/auth/password-reset",
        json={
            "token": reset_token,
            "new_password": "AnotherPass123!"
        }
    )
    
    assert response2.status_code == 400
    assert "Invalid or expired" in response2.json()["detail"]


def test_password_reset_invalidates_refresh_tokens():
    """Test that password reset invalidates all refresh tokens."""
    create_user()
    
    # Update user to active and login
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "test@example.com").first()
    user.account_status = AccountStatus.ACTIVE
    db.commit()
    db.close()
    
    # Login to get refresh token
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "SecurePass123!"
        }
    )
    
    refresh_token = login_response.json()["refresh_token"]
    
    # Request password reset
    client.post(
        "/api/v1/auth/password-reset-request",
        json={"email": "test@example.com"}
    )
    
    # Get reset token
    db = TestingSessionLocal()
    token_record = db.query(PasswordResetToken).first()
    import secrets
    import hashlib
    reset_token = secrets.token_urlsafe(32)
    token_record.token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
    db.commit()
    db.close()
    
    # Reset password
    client.post(
        "/api/v1/auth/password-reset",
        json={
            "token": reset_token,
            "new_password": "NewSecurePass123!"
        }
    )
    
    # Try to use old refresh token
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    
    assert response.status_code == 401
    assert "revoked" in response.json()["detail"].lower()


def test_password_reset_allows_login_with_new_password():
    """Test that user can login with new password after reset."""
    create_user()
    
    # Update user to active
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "test@example.com").first()
    user.account_status = AccountStatus.ACTIVE
    db.commit()
    db.close()
    
    # Request password reset
    client.post(
        "/api/v1/auth/password-reset-request",
        json={"email": "test@example.com"}
    )
    
    # Get reset token
    db = TestingSessionLocal()
    token_record = db.query(PasswordResetToken).first()
    import secrets
    import hashlib
    reset_token = secrets.token_urlsafe(32)
    token_record.token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
    db.commit()
    db.close()
    
    # Reset password
    client.post(
        "/api/v1/auth/password-reset",
        json={
            "token": reset_token,
            "new_password": "NewSecurePass123!"
        }
    )
    
    # Try to login with new password
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "NewSecurePass123!"
        }
    )
    
    assert response.status_code == 200
    assert "access_token" in response.json()
