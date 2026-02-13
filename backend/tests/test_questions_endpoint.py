"""
Tests for Question Generation Endpoint

Requirements: 12.1-12.15
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.user import User
from app.models.question import Question
from app.utils.jwt import create_access_token

client = TestClient(app)


@pytest.fixture
def auth_headers(db: Session):
    """Create authenticated user and return auth headers"""
    from app.models.user import AccountStatus
    import uuid
    
    # Create test user with unique email
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    user = User(
        email=unique_email,
        name="Test User",
        password_hash="dummy_hash",
        account_status=AccountStatus.ACTIVE
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create access token with correct parameters
    token = create_access_token(user.id, user.email)
    
    return {"Authorization": f"Bearer {token}"}


class TestQuestionGenerationEndpoint:
    """Test suite for question generation endpoint"""
    
    def test_generate_questions_success(self, db: Session, auth_headers, mocker):
        """
        Test successful question generation.
        
        Requirements: 12.1-12.15
        """
        # Mock QuestionService to return questions
        mock_service = mocker.patch('app.routes.questions.QuestionService')
        mock_instance = mock_service.return_value
        mock_instance.generate.return_value = [
            {
                'id': 1,
                'question_text': 'Describe your experience with Python',
                'category': 'Technical',
                'difficulty': 'Medium',
                'role': 'Software Engineer',
                'expected_answer_points': ['Point 1', 'Point 2', 'Point 3'],
                'time_limit_seconds': 300,
                'usage_count': 0,
                'created_at': '2026-02-12T19:00:00'
            }
        ]
        mock_instance._construct_cache_key.return_value = "test_key"
        mock_instance._get_from_cache.return_value = None  # Cache miss
        
        # Make request
        response = client.post(
            "/api/v1/questions/generate",
            json={
                "role": "Software Engineer",
                "difficulty": "Medium",
                "question_count": 1
            },
            headers=auth_headers
        )
        
        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['count'] == 1
        assert len(data['questions']) == 1
        assert data['questions'][0]['question_text'] == 'Describe your experience with Python'
        assert 'response_time_ms' in data
        assert 'cache_hit' in data
    
    def test_generate_questions_invalid_difficulty(self, auth_headers):
        """
        Test validation of invalid difficulty.
        """
        response = client.post(
            "/api/v1/questions/generate",
            json={
                "role": "Software Engineer",
                "difficulty": "InvalidDifficulty",
                "question_count": 1
            },
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_generate_questions_invalid_count(self, auth_headers):
        """
        Test validation of invalid question count.
        """
        response = client.post(
            "/api/v1/questions/generate",
            json={
                "role": "Software Engineer",
                "difficulty": "Medium",
                "question_count": 25  # Exceeds max of 20
            },
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_generate_questions_invalid_categories(self, auth_headers):
        """
        Test validation of invalid categories.
        """
        response = client.post(
            "/api/v1/questions/generate",
            json={
                "role": "Software Engineer",
                "difficulty": "Medium",
                "question_count": 1,
                "categories": ["InvalidCategory"]
            },
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_generate_questions_requires_auth(self):
        """
        Test that endpoint requires authentication.
        """
        response = client.post(
            "/api/v1/questions/generate",
            json={
                "role": "Software Engineer",
                "difficulty": "Medium",
                "question_count": 1
            }
        )
        
        assert response.status_code == 403  # Forbidden (no auth header)
    
    def test_generate_questions_with_categories(self, db: Session, auth_headers, mocker):
        """
        Test question generation with specific categories.
        """
        # Mock QuestionService
        mock_service = mocker.patch('app.routes.questions.QuestionService')
        mock_instance = mock_service.return_value
        mock_instance.generate.return_value = [
            {
                'id': 1,
                'question_text': 'Test question',
                'category': 'Technical',
                'difficulty': 'Medium',
                'role': 'Software Engineer',
                'expected_answer_points': ['Point 1', 'Point 2', 'Point 3'],
                'time_limit_seconds': 300,
                'usage_count': 0,
                'created_at': '2026-02-12T19:00:00'
            }
        ]
        mock_instance._construct_cache_key.return_value = "test_key"
        mock_instance._get_from_cache.return_value = None
        
        # Make request with categories
        response = client.post(
            "/api/v1/questions/generate",
            json={
                "role": "Software Engineer",
                "difficulty": "Medium",
                "question_count": 1,
                "categories": ["Technical", "Behavioral"]
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        
        # Verify service was called with categories
        mock_instance.generate.assert_called_once()
        call_kwargs = mock_instance.generate.call_args[1]
        assert call_kwargs['categories'] == ["Technical", "Behavioral"]
    
    def test_health_check(self):
        """
        Test health check endpoint.
        """
        response = client.get("/api/v1/questions/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
        assert data['service'] == 'questions'
        assert 'timestamp' in data
