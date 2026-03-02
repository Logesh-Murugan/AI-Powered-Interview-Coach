"""
Tests for Study Plan API Endpoints

Tests the REST API endpoints for study plan generation and management.

Requirements: 28.1-28.11
"""
import pytest
from datetime import datetime
from unittest.mock import Mock, patch
from fastapi import status

from app.models.user import User
from app.models.study_plan import StudyPlan


@pytest.fixture
def mock_service():
    """Mock study plan service"""
    with patch('app.routes.study_plans.StudyPlanAgentService') as mock:
        yield mock.return_value


@pytest.fixture
def mock_study_plan():
    """Mock study plan object"""
    plan = Mock(spec=StudyPlan)
    plan.id = 1
    plan.user_id = 1
    plan.target_role = 'Software Engineer'
    plan.duration_days = 90
    plan.available_hours_per_week = 15
    plan.plan_data = {
        'daily_tasks': [],
        'weekly_milestones': [],
        'resource_links': {},
        'time_estimates': {
            'total_hours': 180,
            'hours_per_week': 15,
            'completion_date': '2026-05-15'
        }
    }
    plan.status = 'active'
    plan.total_tasks = 10
    plan.completed_tasks = 0
    plan.progress_percentage = 0.0
    plan.created_at = datetime.utcnow()
    plan.updated_at = datetime.utcnow()
    return plan


class TestGenerateStudyPlan:
    """Test POST /api/v1/study-plans endpoint (Req 28.1-28.8)"""
    
    def test_generate_study_plan_success(self, client, auth_headers, mock_service, mock_study_plan):
        """Test successful study plan generation"""
        mock_service.generate_study_plan.return_value = mock_study_plan
        
        response = client.post(
            '/api/v1/study-plans',
            json={
                'target_role': 'Software Engineer',
                'duration_days': 90,
                'available_hours_per_week': 15
            },
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data['id'] == 1
        assert data['target_role'] == 'Software Engineer'
        assert data['status'] == 'active'
        assert 'plan_data' in data
    
    def test_generate_requires_authentication(self, client):
        """Test endpoint requires authentication"""
        response = client.post(
            '/api/v1/study-plans',
            json={
                'target_role': 'Software Engineer',
                'duration_days': 90,
                'available_hours_per_week': 15
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_generate_validates_target_role(self, client, auth_headers):
        """Test validation of target_role field"""
        response = client.post(
            '/api/v1/study-plans',
            json={
                'duration_days': 90,
                'available_hours_per_week': 15
            },
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_generate_validates_duration_days(self, client, auth_headers):
        """Test validation of duration_days (30-180 days)"""
        # Too short
        response = client.post(
            '/api/v1/study-plans',
            json={
                'target_role': 'Software Engineer',
                'duration_days': 20,
                'available_hours_per_week': 15
            },
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        # Too long
        response = client.post(
            '/api/v1/study-plans',
            json={
                'target_role': 'Software Engineer',
                'duration_days': 200,
                'available_hours_per_week': 15
            },
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_generate_validates_available_hours(self, client, auth_headers):
        """Test validation of available_hours_per_week (5-40 hours)"""
        # Too few
        response = client.post(
            '/api/v1/study-plans',
            json={
                'target_role': 'Software Engineer',
                'duration_days': 90,
                'available_hours_per_week': 3
            },
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        # Too many
        response = client.post(
            '/api/v1/study-plans',
            json={
                'target_role': 'Software Engineer',
                'duration_days': 90,
                'available_hours_per_week': 50
            },
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_generate_handles_service_error(self, client, auth_headers, mock_service):
        """Test handling of service errors"""
        mock_service.generate_study_plan.side_effect = ValueError("No resume analysis found")
        
        response = client.post(
            '/api/v1/study-plans',
            json={
                'target_role': 'Software Engineer',
                'duration_days': 90,
                'available_hours_per_week': 15
            },
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'resume analysis' in response.json()['detail'].lower()


class TestGetStudyPlan:
    """Test GET /api/v1/study-plans/{plan_id} endpoint (Req 28.9)"""
    
    def test_get_study_plan_success(self, client, auth_headers, mock_service, mock_study_plan):
        """Test successful study plan retrieval"""
        mock_service.get_study_plan.return_value = mock_study_plan
        
        response = client.get(
            '/api/v1/study-plans/1',
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['id'] == 1
        assert data['target_role'] == 'Software Engineer'
        assert 'plan_data' in data
    
    def test_get_requires_authentication(self, client):
        """Test endpoint requires authentication"""
        response = client.get('/api/v1/study-plans/1')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_plan_not_found(self, client, auth_headers, mock_service):
        """Test 404 for nonexistent plan"""
        mock_service.get_study_plan.return_value = None
        
        response = client.get(
            '/api/v1/study-plans/999',
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_get_plan_wrong_user(self, client, auth_headers, mock_service):
        """Test user can only access their own plans"""
        mock_service.get_study_plan.side_effect = ValueError("Plan not found")
        
        response = client.get(
            '/api/v1/study-plans/1',
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestUpdateProgress:
    """Test PATCH /api/v1/study-plans/{plan_id}/progress endpoint (Req 28.11)"""
    
    def test_update_progress_success(self, client, auth_headers, mock_service, mock_study_plan):
        """Test successful progress update"""
        mock_study_plan.completed_tasks = 3
        mock_study_plan.progress_percentage = 30.0
        mock_service.update_progress.return_value = mock_study_plan
        
        response = client.patch(
            '/api/v1/study-plans/1/progress',
            json={
                'task_updates': {
                    '1_0': True,
                    '1_1': True,
                    'milestone_1': True
                }
            },
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['completed_tasks'] == 3
        assert data['progress_percentage'] == 30.0
    
    def test_update_requires_authentication(self, client):
        """Test endpoint requires authentication"""
        response = client.patch(
            '/api/v1/study-plans/1/progress',
            json={'task_updates': {}}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_update_validates_task_updates(self, client, auth_headers):
        """Test validation of task_updates field"""
        response = client.patch(
            '/api/v1/study-plans/1/progress',
            json={},
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_update_plan_not_found(self, client, auth_headers, mock_service):
        """Test 404 for nonexistent plan"""
        mock_service.update_progress.side_effect = ValueError("Plan not found")
        
        response = client.patch(
            '/api/v1/study-plans/999/progress',
            json={'task_updates': {'1_0': True}},
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestGetActivePlan:
    """Test GET /api/v1/study-plans/active endpoint"""
    
    def test_get_active_plan_success(self, client, auth_headers, mock_service, mock_study_plan):
        """Test getting active study plan"""
        mock_service.get_active_plan.return_value = mock_study_plan
        
        response = client.get(
            '/api/v1/study-plans/active',
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['id'] == 1
        assert data['status'] == 'active'
    
    def test_get_active_plan_none(self, client, auth_headers, mock_service):
        """Test when no active plan exists"""
        mock_service.get_active_plan.return_value = None
        
        response = client.get(
            '/api/v1/study-plans/active',
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestAbandonPlan:
    """Test POST /api/v1/study-plans/{plan_id}/abandon endpoint"""
    
    def test_abandon_plan_success(self, client, auth_headers, mock_service, mock_study_plan):
        """Test abandoning a study plan"""
        mock_study_plan.status = 'abandoned'
        mock_service.abandon_plan.return_value = mock_study_plan
        
        response = client.post(
            '/api/v1/study-plans/1/abandon',
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['status'] == 'abandoned'
    
    def test_abandon_requires_authentication(self, client):
        """Test endpoint requires authentication"""
        response = client.post('/api/v1/study-plans/1/abandon')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_abandon_plan_not_found(self, client, auth_headers, mock_service):
        """Test 404 for nonexistent plan"""
        mock_service.abandon_plan.side_effect = ValueError("Plan not found")
        
        response = client.post(
            '/api/v1/study-plans/999/abandon',
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestResponseTime:
    """Test response time requirements (Req 28.9)"""
    
    def test_get_plan_response_time(self, client, auth_headers, mock_service, mock_study_plan):
        """Test GET plan returns within 200ms"""
        import time
        
        mock_service.get_study_plan.return_value = mock_study_plan
        
        start = time.time()
        response = client.get(
            '/api/v1/study-plans/1',
            headers=auth_headers
        )
        duration = (time.time() - start) * 1000
        
        assert response.status_code == status.HTTP_200_OK
        assert duration < 200  # Should be under 200ms
    
    def test_update_progress_response_time(self, client, auth_headers, mock_service, mock_study_plan):
        """Test PATCH progress returns within 300ms"""
        import time
        
        mock_service.update_progress.return_value = mock_study_plan
        
        start = time.time()
        response = client.patch(
            '/api/v1/study-plans/1/progress',
            json={'task_updates': {'1_0': True}},
            headers=auth_headers
        )
        duration = (time.time() - start) * 1000
        
        assert response.status_code == status.HTTP_200_OK
        assert duration < 300  # Should be under 300ms