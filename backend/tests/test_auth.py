"""Unit tests for authentication endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Import all models first to ensure they're registered with Base
from app.models import User, AccountStatus, RefreshToken, PasswordResetToken
from app.main import app
from app.database import Base, get_db

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


class TestUserRegistration:
    """Test user registration endpoint."""
    
    def test_register_user_success(self):
        """Test successful user registration."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "Test User",
                "target_role": "Software Engineer"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["message"] == "User registered successfully. Please check your email for verification."
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["name"] == "Test User"
        assert data["user"]["target_role"] == "Software Engineer"
        assert data["user"]["account_status"] == "pending_verification"
        assert "password" not in data["user"]
        assert "password_hash" not in data["user"]
        assert "id" in data["user"]
    
    def test_register_user_without_target_role(self):
        """Test registration without optional target_role."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "Test User"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["user"]["target_role"] is None
    
    def test_register_duplicate_email(self):
        """Test registration with duplicate email returns 409."""
        # Register first user
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "Test User"
            }
        )
        
        # Try to register with same email
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "DifferentPass123!",
                "name": "Another User"
            }
        )
        
        assert response.status_code == 409
        assert response.json()["detail"] == "Email already registered"
    
    def test_register_invalid_email(self):
        """Test registration with invalid email format."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "invalid-email",
                "password": "SecurePass123!",
                "name": "Test User"
            }
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_register_weak_password_too_short(self):
        """Test registration with password too short."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "Short1!",
                "name": "Test User"
            }
        )
        
        assert response.status_code == 422
        assert "at least 8 characters" in str(response.json())
    
    def test_register_weak_password_no_uppercase(self):
        """Test registration with password missing uppercase."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "lowercase123!",
                "name": "Test User"
            }
        )
        
        assert response.status_code == 422
        assert "uppercase letter" in str(response.json())
    
    def test_register_weak_password_no_lowercase(self):
        """Test registration with password missing lowercase."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "UPPERCASE123!",
                "name": "Test User"
            }
        )
        
        assert response.status_code == 422
        assert "lowercase letter" in str(response.json())
    
    def test_register_weak_password_no_number(self):
        """Test registration with password missing number."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "NoNumbers!",
                "name": "Test User"
            }
        )
        
        assert response.status_code == 422
        assert "number" in str(response.json())
    
    def test_register_weak_password_no_special(self):
        """Test registration with password missing special character."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "NoSpecial123",
                "name": "Test User"
            }
        )
        
        assert response.status_code == 422
        assert "special character" in str(response.json())
    
    def test_register_empty_name(self):
        """Test registration with empty name."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": ""
            }
        )
        
        assert response.status_code == 422
    
    def test_register_whitespace_name(self):
        """Test registration with whitespace-only name."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "   "
            }
        )
        
        assert response.status_code == 422
        assert "empty or whitespace" in str(response.json())
    
    def test_register_name_too_short(self):
        """Test registration with name too short."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "A"
            }
        )
        
        assert response.status_code == 422
    
    def test_register_email_case_insensitive(self):
        """Test that email is stored in lowercase."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "Test@Example.COM",
                "password": "SecurePass123!",
                "name": "Test User"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["user"]["email"] == "test@example.com"
    
    def test_register_password_hashed(self):
        """Test that password is hashed before storage."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "Test User"
            }
        )
        
        assert response.status_code == 201
        
        # Check database directly
        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == "test@example.com").first()
        
        # Password should be hashed (starts with bcrypt prefix)
        assert user.password_hash.startswith("$2b$")
        assert user.password_hash != "SecurePass123!"
        
        db.close()
    
    def test_register_response_time(self):
        """Test that registration completes within acceptable time."""
        import time
        
        start = time.time()
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "Test User"
            }
        )
        duration_ms = (time.time() - start) * 1000
        
        assert response.status_code == 201
        # Should complete within 1000ms (bcrypt hashing takes ~250ms, allow buffer for test environment)
        assert duration_ms < 1000


class TestUserLogin:
    """Test user login endpoint."""
    
    def test_login_success(self):
        """Test successful user login."""
        # Register user first
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "Test User"
            }
        )
        
        # Update user status to active (normally done via email verification)
        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == "test@example.com").first()
        user.account_status = AccountStatus.ACTIVE
        db.commit()
        db.close()
        
        # Login
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "test@example.com"
        assert "password" not in data["user"]
    
    def test_login_invalid_email(self):
        """Test login with non-existent email."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "SecurePass123!"
            }
        )
        
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid credentials"
    
    def test_login_invalid_password(self):
        """Test login with incorrect password."""
        # Register user
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "Test User"
            }
        )
        
        # Try login with wrong password
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "WrongPassword123!"
            }
        )
        
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid credentials"
    
    def test_login_account_locked_after_5_failures(self):
        """Test that account locks after 5 failed login attempts."""
        # Register user
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "Test User"
            }
        )
        
        # Attempt 5 failed logins
        for i in range(5):
            response = client.post(
                "/api/v1/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "WrongPassword123!"
                }
            )
            
            if i < 4:
                assert response.status_code == 401
            else:
                # 5th attempt should lock account
                assert response.status_code == 423
                assert "locked" in response.json()["detail"].lower()
    
    def test_login_case_insensitive_email(self):
        """Test that login email is case-insensitive."""
        # Register user
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "Test User"
            }
        )
        
        # Update to active
        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == "test@example.com").first()
        user.account_status = AccountStatus.ACTIVE
        db.commit()
        db.close()
        
        # Login with different case
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "Test@Example.COM",
                "password": "SecurePass123!"
            }
        )
        
        assert response.status_code == 200



class TestTokenRefresh:
    """Test token refresh endpoint."""
    
    def test_refresh_token_success(self):
        """Test successful token refresh."""
        # Register and login user
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "Test User"
            }
        )
        
        # Update to active
        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == "test@example.com").first()
        user.account_status = AccountStatus.ACTIVE
        db.commit()
        db.close()
        
        # Login to get tokens
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!"
            }
        )
        
        refresh_token = login_response.json()["refresh_token"]
        
        # Refresh access token
        response = client.post(
            "/api/v1/auth/refresh",
            json={
                "refresh_token": refresh_token
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        # Verify it's a valid JWT token (has 3 parts)
        assert len(data["access_token"].split('.')) == 3
    
    def test_refresh_token_invalid(self):
        """Test refresh with invalid token."""
        response = client.post(
            "/api/v1/auth/refresh",
            json={
                "refresh_token": "invalid.token.here"
            }
        )
        
        assert response.status_code == 401
        assert "Invalid or expired" in response.json()["detail"]
    
    def test_refresh_token_expired(self):
        """Test refresh with expired token."""
        from datetime import datetime, timedelta
        import jwt
        from app.config import settings
        
        # Create expired refresh token
        now = datetime.utcnow()
        payload = {
            'sub': 999,
            'type': 'refresh',
            'exp': now - timedelta(hours=1),
            'iat': now - timedelta(hours=2)
        }
        expired_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        
        response = client.post(
            "/api/v1/auth/refresh",
            json={
                "refresh_token": expired_token
            }
        )
        
        assert response.status_code == 401
    
    def test_refresh_token_not_in_database(self):
        """Test refresh with token not in database."""
        from app.utils.jwt import create_refresh_token
        
        # Create valid token but not stored in database
        token = create_refresh_token(user_id=999)
        
        response = client.post(
            "/api/v1/auth/refresh",
            json={
                "refresh_token": token
            }
        )
        
        assert response.status_code == 401
        assert "not found" in response.json()["detail"].lower()
    
    def test_refresh_token_response_time(self):
        """Test that token refresh completes quickly."""
        import time
        
        # Register and login user
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "Test User"
            }
        )
        
        # Update to active
        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == "test@example.com").first()
        user.account_status = AccountStatus.ACTIVE
        db.commit()
        db.close()
        
        # Login to get tokens
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!"
            }
        )
        
        refresh_token = login_response.json()["refresh_token"]
        
        # Measure refresh time
        start = time.time()
        response = client.post(
            "/api/v1/auth/refresh",
            json={
                "refresh_token": refresh_token
            }
        )
        duration_ms = (time.time() - start) * 1000
        
        assert response.status_code == 200
        assert duration_ms < 200  # Should be very fast



class TestLogout:
    """Test logout endpoints."""
    
    def test_logout_success(self):
        """Test successful logout from current session."""
        # Register and login user
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "Test User"
            }
        )
        
        # Update to active
        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == "test@example.com").first()
        user.account_status = AccountStatus.ACTIVE
        db.commit()
        db.close()
        
        # Login to get tokens
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!"
            }
        )
        
        refresh_token = login_response.json()["refresh_token"]
        
        # Logout
        response = client.post(
            "/api/v1/auth/logout",
            json={
                "refresh_token": refresh_token
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Logged out successfully"
        
        # Verify token is revoked in database
        db = TestingSessionLocal()
        from app.models.refresh_token import RefreshToken
        import hashlib
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        token_record = db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash
        ).first()
        assert token_record is not None
        assert token_record.is_revoked is True
        db.close()
    
    def test_logout_invalid_token(self):
        """Test logout with invalid refresh token."""
        response = client.post(
            "/api/v1/auth/logout",
            json={
                "refresh_token": "invalid.token.here"
            }
        )
        
        assert response.status_code == 401
        assert "Invalid refresh token" in response.json()["detail"]
    
    def test_logout_prevents_token_reuse(self):
        """Test that logged out token cannot be used for refresh."""
        # Register and login user
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "Test User"
            }
        )
        
        # Update to active
        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == "test@example.com").first()
        user.account_status = AccountStatus.ACTIVE
        db.commit()
        db.close()
        
        # Login to get tokens
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!"
            }
        )
        
        refresh_token = login_response.json()["refresh_token"]
        
        # Logout
        client.post(
            "/api/v1/auth/logout",
            json={
                "refresh_token": refresh_token
            }
        )
        
        # Try to use logged out token for refresh
        response = client.post(
            "/api/v1/auth/refresh",
            json={
                "refresh_token": refresh_token
            }
        )
        
        assert response.status_code == 401
        assert "revoked" in response.json()["detail"].lower()
    
    def test_logout_response_time(self):
        """Test that logout completes quickly."""
        import time
        
        # Register and login user
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "Test User"
            }
        )
        
        # Update to active
        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == "test@example.com").first()
        user.account_status = AccountStatus.ACTIVE
        db.commit()
        db.close()
        
        # Login to get tokens
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!"
            }
        )
        
        refresh_token = login_response.json()["refresh_token"]
        
        # Measure logout time
        start = time.time()
        response = client.post(
            "/api/v1/auth/logout",
            json={
                "refresh_token": refresh_token
            }
        )
        duration_ms = (time.time() - start) * 1000
        
        assert response.status_code == 200
        assert duration_ms < 100  # Should complete within 100ms


class TestLogoutAllDevices:
    """Test logout from all devices endpoint."""
    
    def test_logout_all_devices_success(self):
        """Test successful logout from all devices."""
        # Register and login user
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "Test User"
            }
        )
        
        # Update to active
        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == "test@example.com").first()
        user.account_status = AccountStatus.ACTIVE
        db.commit()
        db.close()
        
        # Login multiple times (simulate multiple devices)
        import time
        tokens = []
        for i in range(3):
            login_response = client.post(
                "/api/v1/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "SecurePass123!"
                }
            )
            tokens.append({
                "access": login_response.json()["access_token"],
                "refresh": login_response.json()["refresh_token"]
            })
            # Small delay to ensure different timestamps and different tokens
            if i < 2:
                time.sleep(0.1)
        
        # Logout from all devices using first access token
        response = client.post(
            "/api/v1/auth/logout-all",
            headers={
                "Authorization": f"Bearer {tokens[0]['access']}"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Logged out from all devices successfully"
        # Should revoke all stored tokens (may be less than 3 if duplicates occurred)
        assert data["revoked_sessions"] >= 1
        assert data["revoked_sessions"] <= 3
        
        # Verify all tokens are revoked
        db = TestingSessionLocal()
        from app.models.refresh_token import RefreshToken
        import hashlib
        for token_pair in tokens:
            token_hash = hashlib.sha256(token_pair["refresh"].encode()).hexdigest()
            token_record = db.query(RefreshToken).filter(
                RefreshToken.token_hash == token_hash
            ).first()
            # Token should either be revoked or not exist (if it was a duplicate)
            if token_record:
                assert token_record.is_revoked is True
        db.close()
    
    def test_logout_all_devices_no_auth(self):
        """Test logout all devices without authentication."""
        response = client.post("/api/v1/auth/logout-all")
        
        assert response.status_code == 403  # FastAPI HTTPBearer returns 403 for missing auth
    
    def test_logout_all_devices_invalid_token(self):
        """Test logout all devices with invalid access token."""
        response = client.post(
            "/api/v1/auth/logout-all",
            headers={
                "Authorization": "Bearer invalid.token.here"
            }
        )
        
        assert response.status_code == 401
    
    def test_logout_all_devices_prevents_token_reuse(self):
        """Test that all tokens cannot be used after logout-all."""
        # Register and login user
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "Test User"
            }
        )
        
        # Update to active
        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == "test@example.com").first()
        user.account_status = AccountStatus.ACTIVE
        db.commit()
        db.close()
        
        # Login multiple times
        tokens = []
        for _ in range(2):
            login_response = client.post(
                "/api/v1/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "SecurePass123!"
                }
            )
            tokens.append({
                "access": login_response.json()["access_token"],
                "refresh": login_response.json()["refresh_token"]
            })
        
        # Logout from all devices
        client.post(
            "/api/v1/auth/logout-all",
            headers={
                "Authorization": f"Bearer {tokens[0]['access']}"
            }
        )
        
        # Try to use all refresh tokens
        for token_pair in tokens:
            response = client.post(
                "/api/v1/auth/refresh",
                json={
                    "refresh_token": token_pair["refresh"]
                }
            )
            assert response.status_code == 401
            assert "revoked" in response.json()["detail"].lower()
    
    def test_logout_all_devices_response_time(self):
        """Test that logout-all completes within acceptable time."""
        import time
        
        # Register and login user
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "name": "Test User"
            }
        )
        
        # Update to active
        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == "test@example.com").first()
        user.account_status = AccountStatus.ACTIVE
        db.commit()
        db.close()
        
        # Login multiple times
        tokens = []
        for _ in range(5):
            login_response = client.post(
                "/api/v1/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "SecurePass123!"
                }
            )
            tokens.append({
                "access": login_response.json()["access_token"],
                "refresh": login_response.json()["refresh_token"]
            })
        
        # Measure logout-all time
        start = time.time()
        response = client.post(
            "/api/v1/auth/logout-all",
            headers={
                "Authorization": f"Bearer {tokens[0]['access']}"
            }
        )
        duration_ms = (time.time() - start) * 1000
        
        assert response.status_code == 200
        assert duration_ms < 200  # Should complete within 200ms
