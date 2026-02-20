"""
Tests for Resume Analysis API endpoints

Requirements: 27.1-27.13
"""
import pytest
from datetime import datetime
from unittest.mock import Mock, patch
from fastapi import status

from app.models.user import User


@pytest.fixture
def mock_service():
    """Mock resume agent service"""
    with patch('app.routes.resume_analysis.ResumeAgentService') as mock:
        yield mock


class TestAnalyzeResumeEndpoint:
    """Test POST /api/v1/resume-analysis/{resume_id}"""
    
    def test_analyze_resume_success(self, client, auth_headers, mock_service):
        """Test successful resume analysis"""
        mock_service_instance = Mock()
        mock_service.return_value = mock_service_instance
        
        mock_service_instance.analyze_resume.return_value = {
            'analysis_id': 1,
            'resume_id': 1,
            'analysis_data': {
                'skill_inventory': {},
                'experience_timeline': {},
                'skill_gaps': {},
                'improvement_roadmap': {}
            },
            'agent_reasoning': [],
            'execution_time_ms': 15000,
            'status': 'success',
            'analyzed_at': datetime.utcnow().isoformat(),
            'from_cache': False,
            'cache_age_days': 0
        }
        
        response = client.post(
            "/api/v1/resume-analysis/1",
            json={'target_role': 'Software Engineer'},
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['analysis_id'] == 1
        assert data['status'] == 'success'
    
    def test_analyze_resume_with_force_refresh(self, client, auth_headers, mock_service):
        """Test analysis with force refresh"""
        mock_service_instance = Mock()
        mock_service.return_value = mock_service_instance
        
        mock_service_instance.analyze_resume.return_value = {
            'analysis_id': 2,
            'resume_id': 1,
            'analysis_data': {},
            'agent_reasoning': [],
            'execution_time_ms': 15000,
            'status': 'success',
            'analyzed_at': datetime.utcnow().isoformat(),
            'from_cache': False,
            'cache_age_days': 0
        }
        
        response = client.post(
            "/api/v1/resume-analysis/1",
            json={
                'target_role': 'Data Scientist',
                'force_refresh': True
            },
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify force_refresh was passed
        mock_service_instance.analyze_resume.assert_called_once()
        call_kwargs = mock_service_instance.analyze_resume.call_args[1]
        assert call_kwargs['force_refresh'] is True
    
    def test_analyze_resume_not_found(self, client, auth_headers, mock_service):
        """Test analysis of nonexistent resume"""
        mock_service_instance = Mock()
        mock_service.return_value = mock_service_instance
        
        mock_service_instance.analyze_resume.side_effect = ValueError("Resume 999 not found")
        
        response = client.post(
            "/api/v1/resume-analysis/999",
            json={'target_role': 'Software Engineer'},
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_analyze_resume_not_ready(self, client, auth_headers, mock_service):
        """Test analysis of resume not ready"""
        mock_service_instance = Mock()
        mock_service.return_value = mock_service_instance
        
        mock_service_instance.analyze_resume.side_effect = ValueError("Resume not ready")
        
        response = client.post(
            "/api/v1/resume-analysis/1",
            json={'target_role': 'Software Engineer'},
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_analyze_resume_unauthorized(self, client):
        """Test analysis without authentication"""
        response = client.post(
            "/api/v1/resume-analysis/1",
            json={'target_role': 'Software Engineer'}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_analyze_resume_default_target_role(self, client, auth_headers, mock_service):
        """Test analysis uses default target role"""
        mock_service_instance = Mock()
        mock_service.return_value = mock_service_instance
        
        mock_service_instance.analyze_resume.return_value = {
            'analysis_id': 1,
            'resume_id': 1,
            'analysis_data': {},
            'agent_reasoning': [],
            'execution_time_ms': 15000,
            'status': 'success',
            'analyzed_at': datetime.utcnow().isoformat(),
            'from_cache': False,
            'cache_age_days': 0
        }
        
        response = client.post(
            "/api/v1/resume-analysis/1",
            json={},
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify default target_role was used
        call_kwargs = mock_service_instance.analyze_resume.call_args[1]
        assert call_kwargs['target_role'] == 'Software Engineer'


class TestGetResumeAnalysisEndpoint:
    """Test GET /api/v1/resume-analysis/{resume_id}"""
    
    def test_get_analysis_success(self, client, auth_headers, mock_service):
        """Test getting existing analysis"""
        mock_service_instance = Mock()
        mock_service.return_value = mock_service_instance
        
        mock_cached = Mock()
        mock_cached.user_id = 1
        mock_service_instance._get_cached_analysis.return_value = mock_cached
        
        mock_service_instance._format_analysis_response.return_value = {
            'analysis_id': 1,
            'resume_id': 1,
            'analysis_data': {},
            'agent_reasoning': [],
            'execution_time_ms': 15000,
            'status': 'success',
            'analyzed_at': datetime.utcnow().isoformat(),
            'from_cache': True,
            'cache_age_days': 5
        }
        
        response = client.get(
            "/api/v1/resume-analysis/1",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['from_cache'] is True
    
    def test_get_analysis_not_found(self, client, auth_headers, mock_service):
        """Test getting nonexistent analysis"""
        mock_service_instance = Mock()
        mock_service.return_value = mock_service_instance
        
        mock_service_instance._get_cached_analysis.return_value = None
        
        response = client.get(
            "/api/v1/resume-analysis/999",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_get_analysis_wrong_user(self, client, auth_headers, mock_service):
        """Test getting analysis for wrong user"""
        mock_service_instance = Mock()
        mock_service.return_value = mock_service_instance
        
        mock_cached = Mock()
        mock_cached.user_id = 999  # Different user
        mock_service_instance._get_cached_analysis.return_value = mock_cached
        
        response = client.get(
            "/api/v1/resume-analysis/1",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_analysis_unauthorized(self, client):
        """Test getting analysis without authentication"""
        response = client.get("/api/v1/resume-analysis/1")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestGetAnalysisHistoryEndpoint:
    """Test GET /api/v1/resume-analysis/{resume_id}/history"""
    
    def test_get_history_success(self, client, auth_headers, mock_service):
        """Test getting analysis history"""
        mock_service_instance = Mock()
        mock_service.return_value = mock_service_instance
        
        mock_service_instance.get_analysis_history.return_value = [
            {
                'analysis_id': 1,
                'resume_id': 1,
                'analysis_data': {},
                'agent_reasoning': [],
                'execution_time_ms': 15000,
                'status': 'success',
                'analyzed_at': datetime.utcnow().isoformat(),
                'from_cache': False,
                'cache_age_days': 0
            },
            {
                'analysis_id': 2,
                'resume_id': 1,
                'analysis_data': {},
                'agent_reasoning': [],
                'execution_time_ms': 16000,
                'status': 'success',
                'analyzed_at': datetime.utcnow().isoformat(),
                'from_cache': False,
                'cache_age_days': 0
            }
        ]
        
        response = client.get(
            "/api/v1/resume-analysis/1/history",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['total'] == 2
        assert len(data['analyses']) == 2
    
    def test_get_history_with_limit(self, client, auth_headers, mock_service):
        """Test getting history with limit"""
        mock_service_instance = Mock()
        mock_service.return_value = mock_service_instance
        
        mock_service_instance.get_analysis_history.return_value = []
        
        response = client.get(
            "/api/v1/resume-analysis/1/history?limit=5",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify limit was passed
        call_kwargs = mock_service_instance.get_analysis_history.call_args[1]
        assert call_kwargs['limit'] == 5
    
    def test_get_history_caps_limit(self, client, auth_headers, mock_service):
        """Test history limit is capped at 50"""
        mock_service_instance = Mock()
        mock_service.return_value = mock_service_instance
        
        mock_service_instance.get_analysis_history.return_value = []
        
        response = client.get(
            "/api/v1/resume-analysis/1/history?limit=100",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify limit was capped
        call_kwargs = mock_service_instance.get_analysis_history.call_args[1]
        assert call_kwargs['limit'] == 50
    
    def test_get_history_resume_not_found(self, client, auth_headers, mock_service):
        """Test history for nonexistent resume"""
        mock_service_instance = Mock()
        mock_service.return_value = mock_service_instance
        
        mock_service_instance.get_analysis_history.side_effect = ValueError("Resume not found")
        
        response = client.get(
            "/api/v1/resume-analysis/999/history",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_get_history_unauthorized(self, client):
        """Test getting history without authentication"""
        response = client.get("/api/v1/resume-analysis/1/history")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
