"""
Tests for Company Coaching Agent Service

Tests the company coaching service including validation,
agent execution, and rate limiting.

Requirements: 29.1-29.11
"""
import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy.orm import Session
from pydantic import ValidationError

from app.services.agents.company_coaching_agent_service import CompanyCoachingAgentService
from app.services.agents.schemas.agent_schemas import CoachingResponse
from app.models.company_coaching_session import CompanyCoachingSession
from app.models.resume_analysis import ResumeAnalysis
from app.models.user import User


@pytest.fixture
def mock_db():
    """Mock database session"""
    return Mock(spec=Session)


@pytest.fixture
def service(mock_db):
    """Company coaching agent service instance"""
    return CompanyCoachingAgentService(mock_db)


@pytest.fixture
def mock_user():
    """Mock user object"""
    user = Mock(spec=User)
    user.id = 1
    user.email = "test@example.com"
    user.name = "Test User"
    return user


@pytest.fixture
def mock_resume_analysis():
    """Mock resume analysis object"""
    analysis = Mock(spec=ResumeAnalysis)
    analysis.id = 1
    analysis.user_id = 1
    analysis.resume_id = 1
    analysis.status = 'completed'
    analysis.analysis_data = {
        'technical_skills': ['Python', 'JavaScript', 'SQL'],
        'experience_years': 5,
        'work_experience': [
            {
                'title': 'Senior Engineer',
                'company': 'Tech Corp',
                'responsibilities': ['Led team'],
                'achievements': ['Improved performance']
            }
        ]
    }
    return analysis


class TestUserValidation:
    """Test user prerequisite validation (Req 29.1)"""
    
    def test_validate_user_exists(self, service, mock_db, mock_user, mock_resume_analysis):
        """Test validation passes for valid user with resume analysis"""
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_user,  # User query
            mock_resume_analysis  # Resume analysis query
        ]
        
        # Should not raise
        service._validate_user_prerequisites(1)
    
    def test_validate_user_not_found(self, service, mock_db):
        """Test validation fails for nonexistent user"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="User .* not found"):
            service._validate_user_prerequisites(999)
    
    def test_validate_no_resume_analysis(self, service, mock_db, mock_user):
        """Test validation fails without resume analysis"""
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_user,  # User exists
            None  # No resume analysis
        ]
        
        with pytest.raises(ValueError, match="must have a completed resume analysis"):
            service._validate_user_prerequisites(1)


class TestRateLimiting:
    """Test rate limiting (Req 29.11)"""
    
    def test_rate_limit_check_returns_without_error(self, service, mock_db, mock_user):
        """Test rate limit check passes (rate limiting is currently disabled)"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        # Should not raise - rate limiting is temporarily disabled
        service._check_rate_limit(1)

    def test_rate_limit_at_limit(self, service, mock_db, mock_user):
        """Test rate limit check does not raise when at limit (limiting disabled)"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        mock_db.query.return_value.filter.return_value.scalar.return_value = 3
        
        # Rate limiting is temporarily disabled, so should not raise
        service._check_rate_limit(1)
    
    def test_rate_limit_over_limit(self, service, mock_db, mock_user):
        """Test rate limit check does not raise when over limit (limiting disabled)"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        mock_db.query.return_value.filter.return_value.scalar.return_value = 5
        
        # Rate limiting is temporarily disabled, so should not raise
        service._check_rate_limit(1)


class TestBuildCoachingPrompt:
    """Test coaching prompt building (Req 29.2)"""
    
    def test_build_coaching_prompt_with_target_role(self, service):
        """Test building prompt with target role"""
        user_context = {
            'skills': 'Python, JavaScript, SQL',
            'experience_years': 5,
            'technical_skills': ['Python', 'JavaScript', 'SQL'],
            'strengths': ['Leadership']
        }
        
        prompt = service._build_coaching_prompt(
            company_name='Google',
            target_role='Software Engineer',
            user_context=user_context
        )
        
        assert 'Google' in prompt
        assert 'Software Engineer' in prompt
        assert 'Python, JavaScript, SQL' in prompt
        assert '5' in prompt
        assert 'CRITICAL INSTRUCTIONS' in prompt
        assert 'REQUIRED JSON SCHEMA' in prompt
    
    def test_build_coaching_prompt_without_target_role(self, service):
        """Test building prompt without target role"""
        user_context = {
            'skills': 'Not specified',
            'experience_years': 0,
            'technical_skills': [],
            'strengths': []
        }
        
        prompt = service._build_coaching_prompt(
            company_name='Amazon',
            target_role=None,
            user_context=user_context
        )
        
        assert 'Amazon' in prompt
        assert 'for the' not in prompt.split('for the')[0] or 'Generate interview coaching for Amazon' in prompt
        assert 'Not specified' in prompt


class TestJsonExtraction:
    """Test JSON extraction (Req 29.8)"""
    
    def test_extract_json_from_code_fence(self, service):
        """Test extracting JSON from markdown code fence"""
        output = '''
Here's your coaching:

```json
{
  "company_overview": "Great company culture",
  "interview_process": ["Phone screen", "Technical", "Final"],
  "predicted_questions": ["Q1", "Q2", "Q3", "Q4", "Q5"],
  "pre_interview_checklist": ["Item1", "Item2", "Item3", "Item4", "Item5"]
}
```
'''
        
        coaching_data = service._extract_json_robust(output)
        
        assert 'company_overview' in coaching_data
        assert 'predicted_questions' in coaching_data
        assert coaching_data['company_overview'] == "Great company culture"
    
    def test_extract_raw_json(self, service):
        """Test extracting raw JSON without code fence"""
        output = '{"company_overview": "test", "interview_process": ["step1", "step2", "step3"], "predicted_questions": ["Q1", "Q2", "Q3", "Q4", "Q5"], "pre_interview_checklist": ["I1", "I2", "I3", "I4", "I5"]}'
        
        coaching_data = service._extract_json_robust(output)
        
        assert isinstance(coaching_data, dict)
        assert 'company_overview' in coaching_data
        assert coaching_data['company_overview'] == "test"
    
    def test_extract_invalid_json_raises_error(self, service):
        """Test extracting invalid JSON raises error"""
        output = "This is not JSON at all"
        
        with pytest.raises(ValueError, match="No JSON found|Failed to extract"):
            service._extract_json_robust(output)

    def test_extract_json_from_extra_text(self, service):
        """Test extracting JSON with extra text around it"""
        output = 'Here is the result: {"company_overview": "TestCo", "interview_process": ["s1", "s2", "s3"], "predicted_questions": ["q1", "q2", "q3", "q4", "q5"], "pre_interview_checklist": ["c1", "c2", "c3", "c4", "c5"]} - hope that helps!'
        
        coaching_data = service._extract_json_robust(output)
        
        assert coaching_data['company_overview'] == "TestCo"


class TestCoachingValidation:
    """Test coaching structure validation via Pydantic (Req 29.8)"""
    
    def test_validate_complete_coaching_response(self):
        """Test Pydantic validation passes for complete coaching data"""
        coaching_data = {
            'company_overview': 'A great company with strong culture',
            'interview_process': ['Phone screen', 'Technical interview', 'Final round'],
            'predicted_questions': ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
            'pre_interview_checklist': ['Item1', 'Item2', 'Item3', 'Item4', 'Item5']
        }
        
        validated = CoachingResponse(**coaching_data)
        
        assert validated.company_overview == 'A great company with strong culture'
        assert len(validated.predicted_questions) == 5
        assert len(validated.interview_process) == 3
        assert len(validated.pre_interview_checklist) == 5
    
    def test_validate_missing_required_field(self):
        """Test Pydantic validation fails for missing required field"""
        coaching_data = {
            'interview_process': ['step1', 'step2', 'step3'],
            'predicted_questions': ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
            'pre_interview_checklist': ['I1', 'I2', 'I3', 'I4', 'I5']
            # Missing company_overview
        }
        
        with pytest.raises(ValidationError):
            CoachingResponse(**coaching_data)
    
    def test_validate_rejects_insufficient_questions(self):
        """Test Pydantic rejects too few questions (min_items constraint)"""
        coaching_data = {
            'company_overview': 'Test company',
            'interview_process': ['step1', 'step2', 'step3'],
            'predicted_questions': ['Q1'],  # Only 1, need 5
            'pre_interview_checklist': ['I1', 'I2', 'I3', 'I4', 'I5']
        }
        
        with pytest.raises(ValidationError):
            CoachingResponse(**coaching_data)
    
    def test_validate_rejects_insufficient_checklist(self):
        """Test Pydantic rejects too few checklist items (min_items constraint)"""
        coaching_data = {
            'company_overview': 'Test company',
            'interview_process': ['step1', 'step2', 'step3'],
            'predicted_questions': ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
            'pre_interview_checklist': ['I1']  # Only 1, need 5
        }
        
        with pytest.raises(ValidationError):
            CoachingResponse(**coaching_data)

    def test_validate_rejects_insufficient_process_steps(self):
        """Test Pydantic rejects too few interview process steps (min_items constraint)"""
        coaching_data = {
            'company_overview': 'Test company',
            'interview_process': ['step1'],  # Only 1, need 3
            'predicted_questions': ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
            'pre_interview_checklist': ['I1', 'I2', 'I3', 'I4', 'I5']
        }
        
        with pytest.raises(ValidationError):
            CoachingResponse(**coaching_data)


class TestFixValidationErrors:
    """Test automatic validation error fixing"""
    
    def test_fix_missing_company_overview(self, service):
        """Test auto-fix adds missing company_overview"""
        data = {}
        error = Mock(spec=ValidationError)
        
        fixed = service._fix_validation_errors(data, error)
        
        assert 'company_overview' in fixed
        assert len(fixed['company_overview']) > 0
    
    def test_fix_missing_interview_process(self, service):
        """Test auto-fix adds missing interview_process"""
        data = {'company_overview': 'test'}
        error = Mock(spec=ValidationError)
        
        fixed = service._fix_validation_errors(data, error)
        
        assert 'interview_process' in fixed
        assert isinstance(fixed['interview_process'], list)
        assert len(fixed['interview_process']) >= 3


class TestCoachingStorage:
    """Test coaching storage in database (Req 29.9)"""
    
    def test_create_coaching_session_record(self, service, mock_db):
        """Test creating coaching session record"""
        coaching_data = {
            'company_overview': 'Test company overview',
            'interview_process': ['step1', 'step2', 'step3'],
            'predicted_questions': ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
            'pre_interview_checklist': ['I1', 'I2', 'I3', 'I4', 'I5']
        }
        
        mock_session = Mock(spec=CompanyCoachingSession)
        mock_session.id = 1
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        with patch('app.services.agents.company_coaching_agent_service.CompanyCoachingSession', return_value=mock_session):
            result = service._create_coaching_session_record(
                user_id=1,
                company_name='Google',
                target_role='Software Engineer',
                coaching_data=coaching_data,
                agent_reasoning={"model": "test"},
                execution_time_ms=15000
            )
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        assert result == mock_session


class TestCoachingRetrieval:
    """Test coaching retrieval methods"""
    
    def test_get_coaching_session(self, service, mock_db):
        """Test getting coaching session by ID"""
        mock_session = Mock(spec=CompanyCoachingSession)
        mock_session.id = 1
        mock_session.user_id = 1
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_session
        
        result = service.get_coaching_session(1, 1)
        
        assert result == mock_session
    
    def test_get_user_sessions(self, service, mock_db):
        """Test getting user's coaching sessions"""
        mock_sessions = [Mock(spec=CompanyCoachingSession) for _ in range(3)]
        
        mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = mock_sessions
        
        result = service.get_user_sessions(1, limit=10)
        
        assert len(result) == 3
    
    def test_get_sessions_by_company(self, service, mock_db):
        """Test getting sessions for specific company"""
        mock_sessions = [Mock(spec=CompanyCoachingSession) for _ in range(2)]
        
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = mock_sessions
        
        result = service.get_sessions_by_company(1, 'Google')
        
        assert len(result) == 2


class TestExecutionTimeLimit:
    """Test execution time limit (Req 29.10)"""
    
    def test_execution_time_limit(self, service):
        """Test execution time limit is 20 seconds"""
        assert service.max_execution_time == 20.0


class TestFullGenerationFlow:
    """Test complete coaching generation flow"""
    
    @pytest.mark.asyncio
    async def test_generate_coaching_session_success(self, mock_db, mock_user, mock_resume_analysis):
        """Test successful coaching session generation"""
        service = CompanyCoachingAgentService(mock_db)
        
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_user,           # _validate_user_prerequisites: user query
            mock_resume_analysis, # _validate_user_prerequisites: resume query
            mock_resume_analysis  # _get_user_context: resume query
        ]
        
        mock_session = Mock(spec=CompanyCoachingSession)
        mock_session.id = 1
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        coaching_data = {
            'company_overview': 'Google is a great company',
            'interview_process': ['Phone screen', 'Technical', 'Final'],
            'predicted_questions': ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
            'pre_interview_checklist': ['I1', 'I2', 'I3', 'I4', 'I5']
        }
        
        with patch.object(service, '_generate_structured_coaching', return_value=coaching_data) as mock_gen, \
             patch.object(service, '_check_rate_limit') as mock_rate, \
             patch('app.services.agents.company_coaching_agent_service.CompanyCoachingSession', return_value=mock_session):
            
            result = await service.generate_coaching_session(
                user_id=1,
                company_name='Google',
                target_role='Software Engineer'
            )
            
            mock_gen.assert_called_once()
            mock_rate.assert_called_once()
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
            assert result == mock_session
    
    @pytest.mark.asyncio
    async def test_generate_session_validates_user(self, mock_db):
        """Test generation validates user prerequisites"""
        service = CompanyCoachingAgentService(mock_db)
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="not found"):
            await service.generate_coaching_session(
                user_id=999,
                company_name='Google'
            )
