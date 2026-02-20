"""Unit tests for password reset endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import uuid

from app.main import app
from app.database import get_db
from app.models.user import User, AccountStatus
from app.models.password_reset_token import PasswordResetToken

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup(db: Session):
    """Override get_db dependency to use test database session"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()




def create_user(db, email=None, password="SecurePass123!", name="Test User"):
    """Helper function to create a user."""
    if email is None:
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "name": name
        }
    )


def test_password_reset_request_success(db: Session):
    """Test successful password reset request."""
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    create_user(db, email=unique_email)
    
    response = client.post(
        "/api/v1/auth/password-reset-request",
        json={"email": unique_email}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "email exists" in data["message"].lower()


def test_password_reset_request_nonexistent_email(db: Session):
    """Test password reset request with non-existent email."""
    response = client.post(
        "/api/v1/auth/password-reset-request",
        json={"email": "nonexistent@example.com"}
    )
    
    # Should return success to prevent email enumeration
    assert response.status_code == 200
    data = response.json()
    assert "email exists" in data["message"].lower()


def test_password_reset_request_creates_token(db: Session):
    """Test that password reset request creates token in database."""
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    create_user(db, email=unique_email)
    
    client.post(
        "/api/v1/auth/password-reset-request",
        json={"email": unique_email}
    )
    
    # Check database for token
    pass  # Using db fixture
    token_record = db.query(PasswordResetToken).first()
    assert token_record is not None
    assert token_record.is_used is False
    pass  # Using db fixture


def test_password_reset_success(db: Session):
    """Test successful password reset."""
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    create_user(db, email=unique_email)
    
    # Request password reset
    client.post(
        "/api/v1/auth/password-reset-request",
        json={"email": unique_email}
    )
    
    # Get token from database (in production, user would get this from email)
    pass  # Using db fixture
    user = db.query(User).filter(User.email == unique_email).first()
    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id
    ).order_by(PasswordResetToken.created_at.desc()).first()
    
    # Generate the actual token (we need to reverse the hash - in real scenario, token is in email)
    # For testing, we'll create a new token with known value
    import secrets
    import hashlib
    from datetime import datetime, timedelta
    reset_token = secrets.token_urlsafe(32)
    token_record.token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
    token_record.expires_at = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    token_record.is_used = False
    db.commit()
    pass  # Using db fixture
    
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


def test_password_reset_invalid_token(db: Session):
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


def test_password_reset_weak_password(db: Session):
    """Test password reset with weak password."""
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    create_user(db, email=unique_email)
    
    # Request password reset
    client.post(
        "/api/v1/auth/password-reset-request",
        json={"email": unique_email}
    )
    
    # Get token
    pass  # Using db fixture
    user = db.query(User).filter(User.email == unique_email).first()
    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id
    ).order_by(PasswordResetToken.created_at.desc()).first()
    import secrets
    import hashlib
    from datetime import datetime, timedelta
    reset_token = secrets.token_urlsafe(32)
    token_record.token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
    token_record.expires_at = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    token_record.is_used = False
    db.commit()
    pass  # Using db fixture
    
    # Try to reset with weak password
    response = client.post(
        "/api/v1/auth/password-reset",
        json={
            "token": reset_token,
            "new_password": "weak"
        }
    )
    
    assert response.status_code == 422


def test_password_reset_token_used_once(db: Session):
    """Test that password reset token can only be used once."""
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    create_user(db, email=unique_email)
    
    # Request password reset
    client.post(
        "/api/v1/auth/password-reset-request",
        json={"email": unique_email}
    )
    
    # Get token
    pass  # Using db fixture
    user = db.query(User).filter(User.email == unique_email).first()
    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id
    ).order_by(PasswordResetToken.created_at.desc()).first()
    import secrets
    import hashlib
    from datetime import datetime, timedelta
    reset_token = secrets.token_urlsafe(32)
    token_record.token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
    token_record.expires_at = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    token_record.is_used = False
    db.commit()
    pass  # Using db fixture
    
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


def test_password_reset_invalidates_refresh_tokens(db: Session):
    """Test that password reset invalidates all refresh tokens."""
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    create_user(db, email=unique_email)
    
    # Update user to active and login
    pass  # Using db fixture
    user = db.query(User).filter(User.email == unique_email).first()
    user.account_status = AccountStatus.ACTIVE
    db.commit()
    pass  # Using db fixture
    
    # Login to get refresh token
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": unique_email,
            "password": "SecurePass123!"
        }
    )
    
    refresh_token = login_response.json()["refresh_token"]
    
    # Request password reset
    client.post(
        "/api/v1/auth/password-reset-request",
        json={"email": unique_email}
    )
    
    # Get reset token
    pass  # Using db fixture
    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id
    ).order_by(PasswordResetToken.created_at.desc()).first()
    import secrets
    import hashlib
    from datetime import datetime, timedelta
    reset_token = secrets.token_urlsafe(32)
    token_record.token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
    token_record.expires_at = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    token_record.is_used = False
    db.commit()
    pass  # Using db fixture
    
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


def test_password_reset_allows_login_with_new_password(db: Session):
    """Test that user can login with new password after reset."""
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    create_user(db, email=unique_email)
    
    # Update user to active
    pass  # Using db fixture
    user = db.query(User).filter(User.email == unique_email).first()
    user.account_status = AccountStatus.ACTIVE
    db.commit()
    pass  # Using db fixture
    
    # Request password reset
    client.post(
        "/api/v1/auth/password-reset-request",
        json={"email": unique_email}
    )
    
    # Get reset token
    pass  # Using db fixture
    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id
    ).order_by(PasswordResetToken.created_at.desc()).first()
    import secrets
    import hashlib
    from datetime import datetime, timedelta
    reset_token = secrets.token_urlsafe(32)
    token_record.token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
    token_record.expires_at = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    token_record.is_used = False
    db.commit()
    pass  # Using db fixture
    
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
            "email": unique_email,
            "password": "NewSecurePass123!"
        }
    )
    
    assert response.status_code == 200
    assert "access_token" in response.json()
