"""
Tests for main application endpoints
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """
    Test health check endpoint returns 200 OK.
    """
    response = client.get("/health")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "environment" in data


def test_root_endpoint():
    """
    Test root endpoint returns API information.
    """
    response = client.get("/")
    assert response.status_code == 200
    
    data = response.json()
    assert "name" in data
    assert "version" in data
    assert data["name"] == "InterviewMaster AI"


def test_request_id_header():
    """
    Test that all responses include X-Request-ID header.
    """
    response = client.get("/health")
    assert "X-Request-ID" in response.headers
    assert len(response.headers["X-Request-ID"]) > 0


def test_cors_headers():
    """
    Test CORS headers are present.
    """
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        }
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers
