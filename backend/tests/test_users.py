"""Unit tests for user profile endpoints."""

import time
import uuid
from datetime import datetime, timedelta

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import AccountStatus, User
from app.utils.jwt import create_access_token


def create_and_login_user(
    client: TestClient,
    db: Session,
    email: str | None = None,
    password: str = "SecurePass123!",
    name: str = "Test User",
) -> tuple[str, str]:
    """Helper to register, activate, and log in a user."""
    user_email = email or f"test_{uuid.uuid4().hex[:8]}@example.com"

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": user_email,
            "password": password,
            "name": name,
        },
    )
    assert register_response.status_code == 201

    user = db.query(User).filter(User.email == user_email).first()
    assert user is not None
    user.account_status = AccountStatus.ACTIVE
    db.commit()

    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": user_email,
            "password": password,
        },
    )
    assert login_response.status_code == 200

    return login_response.json()["access_token"], user_email


class TestGetUserProfile:
    """Test GET /api/v1/users/me endpoint."""

    def test_get_profile_success(self, client: TestClient, db: Session):
        access_token, email = create_and_login_user(client, db)

        response = client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == email
        assert data["name"] == "Test User"
        assert data["account_status"] == "active"
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data
        assert "password" not in data
        assert "password_hash" not in data

    def test_get_profile_no_auth(self, client: TestClient):
        response = client.get("/api/v1/users/me")
        assert response.status_code == 401

    def test_get_profile_invalid_token(self, client: TestClient):
        response = client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert response.status_code == 401

    def test_get_profile_expired_token(self, client: TestClient):
        now = datetime.utcnow()
        payload = {
            "sub": 999,
            "email": "test@example.com",
            "role": "user",
            "type": "access",
            "exp": now - timedelta(hours=1),
            "iat": now - timedelta(hours=2),
        }
        expired_token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

        response = client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )

        assert response.status_code == 401

    def test_get_profile_response_time(self, client: TestClient, db: Session):
        access_token, _ = create_and_login_user(client, db)

        start = time.time()
        response = client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        duration_ms = (time.time() - start) * 1000

        assert response.status_code == 200
        assert duration_ms < 500


class TestUpdateUserProfile:
    """Test PUT /api/v1/users/me endpoint."""

    def test_update_profile_name(self, client: TestClient, db: Session):
        access_token, email = create_and_login_user(client, db)

        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"name": "Updated Name"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["email"] == email

    def test_update_profile_target_role(self, client: TestClient, db: Session):
        access_token, _ = create_and_login_user(client, db)

        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"target_role": "Software Engineer"},
        )

        assert response.status_code == 200
        assert response.json()["target_role"] == "Software Engineer"

    def test_update_profile_experience_level(self, client: TestClient, db: Session):
        access_token, _ = create_and_login_user(client, db)

        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"experience_level": "Mid"},
        )

        assert response.status_code == 200
        assert response.json()["experience_level"] == "mid"

    def test_update_profile_all_fields(self, client: TestClient, db: Session):
        access_token, _ = create_and_login_user(client, db)

        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "name": "John Doe",
                "target_role": "Product Manager",
                "experience_level": "Senior",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "John Doe"
        assert data["target_role"] == "Product Manager"
        assert data["experience_level"] == "senior"

    def test_update_profile_invalid_target_role(self, client: TestClient, db: Session):
        access_token, _ = create_and_login_user(client, db)

        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"target_role": "Invalid Role"},
        )

        assert response.status_code == 422

    def test_update_profile_invalid_experience_level(self, client: TestClient, db: Session):
        access_token, _ = create_and_login_user(client, db)

        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"experience_level": "Invalid"},
        )

        assert response.status_code == 422

    def test_update_profile_empty_name(self, client: TestClient, db: Session):
        access_token, _ = create_and_login_user(client, db)

        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"name": ""},
        )

        assert response.status_code == 422

    def test_update_profile_whitespace_name(self, client: TestClient, db: Session):
        access_token, _ = create_and_login_user(client, db)

        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"name": "   "},
        )

        assert response.status_code == 422

    def test_update_profile_name_too_short(self, client: TestClient, db: Session):
        access_token, _ = create_and_login_user(client, db)

        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"name": "A"},
        )

        assert response.status_code == 422

    def test_update_profile_no_auth(self, client: TestClient):
        response = client.put("/api/v1/users/me", json={"name": "Updated Name"})
        assert response.status_code == 401

    def test_update_profile_invalid_token(self, client: TestClient):
        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer invalid.token.here"},
            json={"name": "Updated Name"},
        )
        assert response.status_code == 401

    def test_update_profile_partial_update(self, client: TestClient, db: Session):
        access_token, _ = create_and_login_user(client, db)

        response1 = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"name": "First Update"},
        )
        assert response1.status_code == 200
        assert response1.json()["name"] == "First Update"
        assert response1.json()["target_role"] is None

        response2 = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"target_role": "Data Scientist"},
        )
        assert response2.status_code == 200
        assert response2.json()["name"] == "First Update"
        assert response2.json()["target_role"] == "Data Scientist"

    def test_update_profile_response_time(self, client: TestClient, db: Session):
        access_token, _ = create_and_login_user(client, db)

        start = time.time()
        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "name": "Updated Name",
                "target_role": "Software Engineer",
                "experience_level": "Mid",
            },
        )
        duration_ms = (time.time() - start) * 1000

        assert response.status_code == 200
        assert duration_ms < 500

    def test_update_profile_all_valid_roles(self, client: TestClient, db: Session):
        access_token, _ = create_and_login_user(client, db)

        for role in [
            "Software Engineer",
            "Product Manager",
            "Data Scientist",
            "DevOps Engineer",
        ]:
            response = client.put(
                "/api/v1/users/me",
                headers={"Authorization": f"Bearer {access_token}"},
                json={"target_role": role},
            )
            assert response.status_code == 200
            assert response.json()["target_role"] == role

    def test_update_profile_all_experience_levels(self, client: TestClient, db: Session):
        access_token, _ = create_and_login_user(client, db)

        expected_levels = {
            "Entry": "entry",
            "Mid": "mid",
            "Senior": "senior",
            "Staff": "staff",
            "Principal": "principal",
        }

        for level, expected in expected_levels.items():
            response = client.put(
                "/api/v1/users/me",
                headers={"Authorization": f"Bearer {access_token}"},
                json={"experience_level": level},
            )
            assert response.status_code == 200
            assert response.json()["experience_level"] == expected





