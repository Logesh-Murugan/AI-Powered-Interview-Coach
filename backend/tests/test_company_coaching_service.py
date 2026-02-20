"""
Tests for Company Coaching Agent Service

Tests the company coaching service including validation,
agent execution, and rate limiting.

Requirements: 29.1-29.11
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy.orm import Session

from app.services.agents.company_coaching_agent_service import CompanyCoachingAgentService
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
    
    def test_rate_limit_under_limit(self, service, mock_db, mock_user):
        """Test rate limit check passes when under limit"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        mock_db.query.return_value.filter.return_value.scalar.return_value = 2  # 2 sessions this month
        
        # Should not raise
        service._check_rate_limit(1)
    
    def test_rate_limit_at_limit(self, service, mock_db, mock_user):
        """Test rate limit check fails when at limit"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        mock_db.query.return_value.filter.return_value.scalar.return_value = 3  # 3 sessions (limit)
        
        with pytest.raises(ValueError, match="Free tier limit reached"):
            service._check_rate_limit(1)
    
    def test_rate_limit_over_limit(self, service, mock_db, mock_user):
        """Test rate limit check fails when over limit"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        mock_db.query.return_value.filter.return_value.scalar.return_value = 5  # Over limit
        
        with pytest.raises(ValueError, match="Free tier limit reached"):
            service._check_rate_limit(1)


class TestAgentInputPreparation:
    """Test agent input preparation (Req 29.2)"""
    
    def test_prepare_agent_input(self, service, mock_db, mock_resume_analysis):
        """Test preparing input prompt for agent"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_resume_analysis
        
        prompt = service._prepare_agent_input(
            user_id=1,
            company_name='Google',
            target_role='Software Engineer'
        )
        
        assert 'Google' in prompt
        assert 'Software Engineer' in prompt
        assert 'Python' in prompt  # From skills
        assert '5 years' in prompt  # From experience
    
    def test_input_without_target_role(self, service, mock_db, mock_resume_analysis):
        """Test input preparation without target role"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_resume_analysis
        
        prompt = service._prepare_agent_input(
            user_id=1,
            company_name='Amazon',
            target_role=None
        )
        
        assert 'Amazon' in prompt
        assert 'User ID: 1' in prompt


class TestOutputParsing:
    """Test agent output parsing (Req 29.8)"""
    
    def test_parse_json_in_code_fence(self, service):
        """Test parsing JSON from markdown code fence"""
        output = """
Here's your coaching:

```json
{
  "company_overview": {"culture": "test", "values": [], "interview_style": "test", "hiring_process": "test"},
  "predicted_questions": [],
  "star_examples": [],
  "confidence_tips": [],
  "pre_interview_checklist": []
}
```
"""
        
        coaching_data = service._parse_agent_output(output)
        
        assert 'company_overview' in coaching_data
        assert 'predicted_questions' in coaching_data
    
    def test_parse_raw_json(self, service):
        """Test parsing raw JSON without code fence"""
        output = '{"company_overview": {}, "predicted_questions": [], "star_examples": [], "confidence_tips": [], "pre_interview_checklist": []}'
        
        coaching_data = service._parse_agent_output(output)
        
        assert isinstance(coaching_data, dict)
        assert 'company_overview' in coaching_data
    
    def test_parse_invalid_json_raises_error(self, service):
        """Test parsing invalid JSON raises error"""
        output = "This is not JSON"
        
        with pytest.raises(ValueError, match="Could not extract JSON"):
            service._parse_agent_output(output)


class TestCoachingValidation:
    """Test coaching structure validation (Req 29.8)"""
    
    def test_validate_complete_coaching(self, service):
        """Test validation passes for complete coaching"""
        coaching_data = {
            'company_overview': {
                'culture': 'test',
                'values': ['value1'],
                'interview_style': 'test',
                'hiring_process': 'test'
            },
            'predicted_questions': [
                {'question': 'Q1', 'category': 'Technical'},
                {'question': 'Q2', 'category': 'Behavioral'},
                {'question': 'Q3', 'category': 'Technical'},
                {'question': 'Q4', 'category': 'Behavioral'},
                {'question': 'Q5', 'category': 'Technical'}
            ],
            'star_examples': [
                {'situation': 'S', 'task': 'T', 'action': 'A', 'result': 'R', 'relevant_to': 'test'},
                {'situation': 'S', 'task': 'T', 'action': 'A', 'result': 'R', 'relevant_to': 'test'},
                {'situation': 'S', 'task': 'T', 'action': 'A', 'result': 'R', 'relevant_to': 'test'}
            ],
            'confidence_tips': ['tip1', 'tip2'],
            'pre_interview_checklist': ['item1', 'item2']
        }
        
        # Should not raise
        service._validate_coaching_structure(coaching_data)
    
    def test_validate_missing_required_field(self, service):
        """Test validation fails for missing required field"""
        coaching_data = {
            'company_overview': {},
            'predicted_questions': []
            # Missing other fields
        }
        
        with pytest.raises(ValueError, match="missing required field"):
            service._validate_coaching_structure(coaching_data)
    
    def test_validate_invalid_field_type(self, service):
        """Test validation fails for invalid field types"""
        coaching_data = {
            'company_overview': "not a dict",  # Should be dict
            'predicted_questions': [],
            'star_examples': [],
            'confidence_tips': [],
            'pre_interview_checklist': []
        }
        
        with pytest.raises(ValueError, match="must be a dictionary"):
            service._validate_coaching_structure(coaching_data)
    
    def test_validate_insufficient_questions(self, service):
        """Test validation fails with too few questions"""
        coaching_data = {
            'company_overview': {},
            'predicted_questions': [{'question': 'Q1'}],  # Only 1, need 5
            'star_examples': [{'s': 'S'}, {'s': 'S'}, {'s': 'S'}],
            'confidence_tips': [],
            'pre_interview_checklist': []
        }
        
        with pytest.raises(ValueError, match="at least 5 predicted questions"):
            service._validate_coaching_structure(coaching_data)
    
    def test_validate_insufficient_star_examples(self, service):
        """Test validation fails with too few STAR examples"""
        coaching_data = {
            'company_overview': {},
            'predicted_questions': [{'q': f'Q{i}'} for i in range(5)],
            'star_examples': [{'s': 'S'}],  # Only 1, need 3
            'confidence_tips': [],
            'pre_interview_checklist': []
        }
        
        with pytest.raises(ValueError, match="at least 3 STAR examples"):
            service._validate_coaching_structure(coaching_data)


class TestCoachingStorage:
    """Test coaching storage in database (Req 29.9)"""
    
    def test_create_coaching_session_record(self, service, mock_db):
        """Test creating coaching session record"""
        coaching_data = {
            'company_overview': {},
            'predicted_questions': [],
            'star_examples': [],
            'confidence_tips': [],
            'pre_interview_checklist': []
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
                agent_reasoning=[],
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
    
    @patch('app.services.agents.company_coaching_agent_service.ConfidenceTool')
    @patch('app.services.agents.company_coaching_agent_service.STARMethodTool')
    @patch('app.services.agents.company_coaching_agent_service.InterviewPatternTool')
    @patch('app.services.agents.company_coaching_agent_service.CompanyResearchTool')
    @patch('app.services.agents.company_coaching_agent_service.AgentExecutor')
    @patch('app.services.agents.company_coaching_agent_service.BaseAgent')
    @patch('app.services.agents.company_coaching_agent_service.CompanyCoachingSession')
    def test_generate_coaching_session_success(
        self,
        mock_session_class,
        mock_agent_class,
        mock_executor_class,
        mock_research_tool,
        mock_pattern_tool,
        mock_star_tool,
        mock_confidence_tool,
        mock_db,
        mock_user,
        mock_resume_analysis
    ):
        """Test successful coaching session generation"""
        # Create service AFTER patches are applied
        service = CompanyCoachingAgentService(mock_db)
        
        # Setup tool mocks
        mock_research_tool.return_value = Mock(name='company_research')
        mock_pattern_tool.return_value = Mock(name='interview_patterns')
        mock_star_tool.return_value = Mock(name='star_examples')
        mock_confidence_tool.return_value = Mock(name='confidence_tips')
        
        # Setup mocks
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_user,  # User validation
            mock_resume_analysis,  # Resume analysis validation
            mock_resume_analysis  # Input preparation
        ]
        
        # Mock rate limit check by patching the method
        with patch.object(service, '_check_rate_limit'):
            mock_agent = Mock()
            mock_agent.tools = [Mock() for _ in range(4)]
            mock_agent.system_message = "Test message"
            mock_agent_class.return_value = mock_agent
            
            mock_executor = Mock()
            mock_executor.run.return_value = {
                'output': '''```json
{
  "company_overview": {"culture": "test", "values": ["v1"], "interview_style": "test", "hiring_process": "test"},
  "predicted_questions": [
    {"question": "Q1"}, {"question": "Q2"}, {"question": "Q3"},
    {"question": "Q4"}, {"question": "Q5"}
  ],
  "star_examples": [
    {"situation": "S", "task": "T", "action": "A", "result": "R", "relevant_to": "test"},
    {"situation": "S", "task": "T", "action": "A", "result": "R", "relevant_to": "test"},
    {"situation": "S", "task": "T", "action": "A", "result": "R", "relevant_to": "test"}
  ],
  "confidence_tips": ["tip1"],
  "pre_interview_checklist": ["item1"]
}
```''',
                'reasoning_steps': []
            }
            mock_executor_class.return_value = mock_executor
            
            mock_session = Mock(spec=CompanyCoachingSession)
            mock_session.id = 1
            mock_session_class.return_value = mock_session
            
            mock_db.add = Mock()
            mock_db.commit = Mock()
            mock_db.refresh = Mock()
            
            result = service.generate_coaching_session(
                user_id=1,
                company_name='Google',
                target_role='Software Engineer'
            )
            
            # Verify executor was called (agent was used)
            mock_executor_class.assert_called_once()
            
            # Verify session was stored
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
            
            assert result == mock_session
    
    def test_generate_session_validates_user(self, service, mock_db):
        """Test generation validates user prerequisites"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="not found"):
            service.generate_coaching_session(
                user_id=999,
                company_name='Google'
            )
