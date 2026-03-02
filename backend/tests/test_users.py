"""Unit tests for user profile endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User, AccountStatus

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


def create_and_login_user(email="test@example.com", password="SecurePass123!", name="Test User"):
    """Helper function to create and login a user."""
    # Register user
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "name": name
        }
    )
    
    # Update to active
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == email).first()
    user.account_status = AccountStatus.ACTIVE
    db.commit()
    db.close()
    
    # Login
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": password
        }
    )
    
    return login_response.json()["access_token"]


class TestGetUserProfile:
    """Test GET /api/v1/users/me endpoint."""
    
    def test_get_profile_success(self):
        """Test successful profile retrieval."""
        access_token = create_and_login_user()
        
        response = client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"
        assert data["account_status"] == "active"
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data
        assert "password" not in data
        assert "password_hash" not in data
    
    def test_get_profile_no_auth(self):
        """Test profile retrieval without authentication."""
        response = client.get("/api/v1/users/me")
        
        assert response.status_code == 403  # HTTPBearer returns 403 for missing auth
    
    def test_get_profile_invalid_token(self):
        """Test profile retrieval with invalid token."""
        response = client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer invalid.token.here"}
        )
        
        assert response.status_code == 401
    
    def test_get_profile_expired_token(self):
        """Test profile retrieval with expired token."""
        from datetime import datetime, timedelta
        import jwt
        from app.config import settings
        
        # Create expired token
        now = datetime.utcnow()
        payload = {
            'sub': 999,
            'email': 'test@example.com',
            'role': 'user',
            'exp': now - timedelta(hours=1),
            'iat': now - timedelta(hours=2)
        }
        expired_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        
        response = client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        
        assert response.status_code == 401
        assert "expired" in response.json()["detail"].lower()
    
    def test_get_profile_response_time(self):
        """Test that profile retrieval is fast."""
        import time
        
        access_token = create_and_login_user()
        
        start = time.time()
        response = client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        duration_ms = (time.time() - start) * 1000
        
        assert response.status_code == 200
        assert duration_ms < 200  # Should complete within 200ms


class TestUpdateUserProfile:
    """Test PUT /api/v1/users/me endpoint."""
    
    def test_update_profile_name(self):
        """Test updating user name."""
        access_token = create_and_login_user()
        
        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"name": "Updated Name"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == "Updated Name"
        assert data["email"] == "test@example.com"
    
    def test_update_profile_target_role(self):
        """Test updating target role."""
        access_token = create_and_login_user()
        
        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"target_role": "Software Engineer"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["target_role"] == "Software Engineer"
    
    def test_update_profile_experience_level(self):
        """Test updating experience level."""
        access_token = create_and_login_user()
        
        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"experience_level": "Mid"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["experience_level"] == "Mid"
    
    def test_update_profile_all_fields(self):
        """Test updating all profile fields at once."""
        access_token = create_and_login_user()
        
        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "name": "John Doe",
                "target_role": "Product Manager",
                "experience_level": "Senior"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == "John Doe"
        assert data["target_role"] == "Product Manager"
        assert data["experience_level"] == "Senior"
    
    def test_update_profile_invalid_target_role(self):
        """Test updating with invalid target role."""
        access_token = create_and_login_user()
        
        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"target_role": "Invalid Role"}
        )
        
        assert response.status_code == 422
        assert "Invalid target_role" in str(response.json())
    
    def test_update_profile_invalid_experience_level(self):
        """Test updating with invalid experience level."""
        access_token = create_and_login_user()
        
        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"experience_level": "Invalid"}
        )
        
        assert response.status_code == 422
    
    def test_update_profile_empty_name(self):
        """Test updating with empty name."""
        access_token = create_and_login_user()
        
        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"name": ""}
        )
        
        assert response.status_code == 422
    
    def test_update_profile_whitespace_name(self):
        """Test updating with whitespace-only name."""
        access_token = create_and_login_user()
        
        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"name": "   "}
        )
        
        assert response.status_code == 422
        assert "empty or whitespace" in str(response.json())
    
    def test_update_profile_name_too_short(self):
        """Test updating with name too short."""
        access_token = create_and_login_user()
        
        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"name": "A"}
        )
        
        assert response.status_code == 422
    
    def test_update_profile_no_auth(self):
        """Test profile update without authentication."""
        response = client.put(
            "/api/v1/users/me",
            json={"name": "Updated Name"}
        )
        
        assert response.status_code == 403
    
    def test_update_profile_invalid_token(self):
        """Test profile update with invalid token."""
        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer invalid.token.here"},
            json={"name": "Updated Name"}
        )
        
        assert response.status_code == 401
    
    def test_update_profile_partial_update(self):
        """Test that partial updates work correctly."""
        access_token = create_and_login_user()
        
        # Update only name
        response1 = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"name": "First Update"}
        )
        
        assert response1.status_code == 200
        assert response1.json()["name"] == "First Update"
        assert response1.json()["target_role"] is None
        
        # Update only target_role
        response2 = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"target_role": "Data Scientist"}
        )
        
        assert response2.status_code == 200
        assert response2.json()["name"] == "First Update"  # Name should remain
        assert response2.json()["target_role"] == "Data Scientist"
    
    def test_update_profile_response_time(self):
        """Test that profile update completes quickly."""
        import time
        
        access_token = create_and_login_user()
        
        start = time.time()
        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "name": "Updated Name",
                "target_role": "Software Engineer",
                "experience_level": "Mid"
            }
        )
        duration_ms = (time.time() - start) * 1000
        
        assert response.status_code == 200
        assert duration_ms < 200  # Should complete within 200ms
    
    def test_update_profile_all_valid_roles(self):
        """Test that all predefined roles are accepted."""
        from app.schemas.user import VALID_TARGET_ROLES
        
        access_token = create_and_login_user()
        
        # Test a few roles from the list
        test_roles = [
            "Software Engineer",
            "Product Manager",
            "Data Scientist",
            "DevOps Engineer"
        ]
        
        for role in test_roles:
            response = client.put(
                "/api/v1/users/me",
                headers={"Authorization": f"Bearer {access_token}"},
                json={"target_role": role}
            )
            
            assert response.status_code == 200
            assert response.json()["target_role"] == role
    
    def test_update_profile_all_experience_levels(self):
        """Test that all experience levels are accepted."""
        access_token = create_and_login_user()
        
        experience_levels = ["Entry", "Mid", "Senior", "Staff", "Principal"]
        
        for level in experience_levels:
            response = client.put(
                "/api/v1/users/me",
                headers={"Authorization": f"Bearer {access_token}"},
                json={"experience_level": level}
            )
            
            assert response.status_code == 200
            assert response.json()["experience_level"] == level
