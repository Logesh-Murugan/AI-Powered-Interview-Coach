"""
Tests for Study Plan Agent Service

Tests the study plan generation service including validation,
agent execution, and progress tracking.

Requirements: 28.1-28.11
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy.orm import Session

from app.services.agents.study_plan_agent_service import StudyPlanAgentService
from app.models.study_plan import StudyPlan
from app.models.resume_analysis import ResumeAnalysis
from app.models.user import User


@pytest.fixture
def mock_db():
    """Mock database session"""
    return Mock(spec=Session)


@pytest.fixture
def service(mock_db):
    """Study plan agent service instance"""
    return StudyPlanAgentService(mock_db)


@pytest.fixture
def mock_user():
    """Mock user object"""
    user = Mock(spec=User)
    user.id = 1
    user.email = "test@example.com"
    user.full_name = "Test User"
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
        'soft_skills': ['Communication', 'Problem Solving'],
        'experience_years': 3,
        'education_level': 'Bachelor',
        'skill_gaps': ['React', 'Docker', 'Kubernetes'],
        'strengths': ['Python', 'SQL'],
        'weaknesses': ['Frontend Development', 'DevOps']
    }
    return analysis


class TestUserValidation:
    """Test user prerequisite validation (Req 28.1)"""
    
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
        """Test validation fails without resume analysis (Req 28.1)"""
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_user,  # User exists
            None  # No resume analysis
        ]
        
        with pytest.raises(ValueError, match="must have a completed resume analysis"):
            service._validate_user_prerequisites(1)


class TestSkillDataRetrieval:
    """Test skill data retrieval (Req 28.2)"""
    
    def test_retrieve_skill_data(self, service, mock_db, mock_resume_analysis):
        """Test retrieving skill data from resume analysis"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_resume_analysis
        
        skill_data = service._retrieve_skill_data(1)
        
        assert 'technical_skills' in skill_data
        assert 'soft_skills' in skill_data
        assert 'experience_years' in skill_data
        assert 'skill_gaps' in skill_data
        assert skill_data['technical_skills'] == ['Python', 'JavaScript', 'SQL']
        assert skill_data['experience_years'] == 3
    
    def test_retrieve_skill_data_handles_missing_fields(self, service, mock_db):
        """Test skill data retrieval handles missing fields gracefully"""
        analysis = Mock(spec=ResumeAnalysis)
        analysis.analysis_data = {}  # Empty data
        
        mock_db.query.return_value.filter.return_value.first.return_value = analysis
        
        skill_data = service._retrieve_skill_data(1)
        
        # Should have default values
        assert skill_data['technical_skills'] == []
        assert skill_data['experience_years'] == 0
        assert skill_data['education_level'] == 'unknown'


class TestAgentInitialization:
    """Test agent initialization (Req 28.3)"""
    
    def test_initialize_agent_with_5_tools(self, service):
        """Test agent is initialized with 5 custom tools"""
        agent = service._initialize_agent()
        
        # Should have 5 tools
        assert len(agent.tools) == 5
        
        # Verify tool names
        tool_names = [tool.name for tool in agent.tools]
        assert 'skill_assessment' in tool_names
        assert 'job_market_research' in tool_names
        assert 'learning_resources' in tool_names
        assert 'progress_tracker' in tool_names
        assert 'scheduler' in tool_names
    
    def test_agent_has_system_message(self, service):
        """Test agent has appropriate system message"""
        agent = service._initialize_agent()
        
        assert agent.system_message is not None
        assert 'study plan' in agent.system_message.lower()


class TestAgentInputPreparation:
    """Test agent input preparation (Req 28.4)"""
    
    def test_prepare_agent_input(self, service):
        """Test preparing input prompt for agent"""
        skill_data = {
            'technical_skills': ['Python', 'JavaScript'],
            'experience_years': 3,
            'strengths': ['Python'],
            'skill_gaps': ['React', 'Docker']
        }
        
        prompt = service._prepare_agent_input(
            user_id=1,
            target_role='Software Engineer',
            duration_days=90,
            available_hours_per_week=15,
            skill_data=skill_data
        )
        
        assert 'Software Engineer' in prompt
        assert '90' in prompt
        assert '15' in prompt
        assert 'Python' in prompt
        assert 'React' in prompt
    
    def test_input_includes_all_requirements(self, service):
        """Test input prompt includes all required information"""
        skill_data = {
            'technical_skills': ['Python'],
            'experience_years': 2,
            'strengths': [],
            'skill_gaps': []
        }
        
        prompt = service._prepare_agent_input(
            user_id=1,
            target_role='Data Scientist',
            duration_days=60,
            available_hours_per_week=20,
            skill_data=skill_data
        )
        
        # Should mention all tools
        assert 'SkillAssessmentTool' in prompt
        assert 'JobMarketTool' in prompt
        assert 'LearningResourceTool' in prompt
        assert 'ProgressTrackerTool' in prompt
        assert 'SchedulerTool' in prompt


class TestOutputParsing:
    """Test agent output parsing (Req 28.7)"""
    
    def test_parse_json_in_code_fence(self, service):
        """Test parsing JSON from markdown code fence"""
        output = """
Here's your study plan:

```json
{
  "daily_tasks": [],
  "weekly_milestones": [],
  "resource_links": {},
  "time_estimates": {
    "total_hours": 180,
    "hours_per_week": 15,
    "completion_date": "2026-05-15"
  }
}
```
"""
        
        plan_data = service._parse_agent_output(output)
        
        assert 'daily_tasks' in plan_data
        assert 'weekly_milestones' in plan_data
        assert 'resource_links' in plan_data
        assert 'time_estimates' in plan_data
    
    def test_parse_raw_json(self, service):
        """Test parsing raw JSON without code fence"""
        output = '{"daily_tasks": [], "weekly_milestones": [], "resource_links": {}, "time_estimates": {}}'
        
        plan_data = service._parse_agent_output(output)
        
        assert isinstance(plan_data, dict)
        assert 'daily_tasks' in plan_data
    
    def test_parse_invalid_json_raises_error(self, service):
        """Test parsing invalid JSON raises error"""
        output = "This is not JSON"
        
        with pytest.raises(ValueError, match="Could not extract JSON"):
            service._parse_agent_output(output)


class TestPlanValidation:
    """Test plan structure validation (Req 28.7)"""
    
    def test_validate_complete_plan(self, service):
        """Test validation passes for complete plan"""
        plan_data = {
            'daily_tasks': [
                {
                    'day': 1,
                    'date': '2026-02-16',
                    'tasks': []
                }
            ],
            'weekly_milestones': [
                {
                    'week': 1,
                    'milestone': 'Complete basics',
                    'skills_covered': ['Python'],
                    'assessment': 'Quiz',
                    'completed': False
                }
            ],
            'resource_links': {
                'Python': ['https://example.com']
            },
            'time_estimates': {
                'total_hours': 180,
                'hours_per_week': 15,
                'completion_date': '2026-05-15'
            }
        }
        
        # Should not raise
        service._validate_plan_structure(plan_data)
    
    def test_validate_missing_required_field(self, service):
        """Test validation fails for missing required field"""
        plan_data = {
            'daily_tasks': [],
            'weekly_milestones': []
            # Missing resource_links and time_estimates
        }
        
        with pytest.raises(ValueError, match="missing required field"):
            service._validate_plan_structure(plan_data)
    
    def test_validate_invalid_field_type(self, service):
        """Test validation fails for invalid field types"""
        plan_data = {
            'daily_tasks': "not a list",  # Should be list
            'weekly_milestones': [],
            'resource_links': {},
            'time_estimates': {}
        }
        
        with pytest.raises(ValueError, match="must be a list"):
            service._validate_plan_structure(plan_data)
    
    def test_validate_time_estimates_structure(self, service):
        """Test validation of time_estimates structure"""
        plan_data = {
            'daily_tasks': [],
            'weekly_milestones': [],
            'resource_links': {},
            'time_estimates': {
                'total_hours': 180
                # Missing hours_per_week and completion_date
            }
        }
        
        with pytest.raises(ValueError, match="time_estimates missing required field"):
            service._validate_plan_structure(plan_data)


class TestPlanStorage:
    """Test plan storage in database (Req 28.8)"""
    
    def test_create_study_plan_record(self, service, mock_db):
        """Test creating study plan record"""
        plan_data = {
            'daily_tasks': [],
            'weekly_milestones': [],
            'resource_links': {},
            'time_estimates': {}
        }
        
        mock_plan = Mock(spec=StudyPlan)
        mock_plan.id = 1
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        with patch('app.services.agents.study_plan_agent_service.StudyPlan', return_value=mock_plan):
            result = service._create_study_plan_record(
                user_id=1,
                target_role='Software Engineer',
                duration_days=90,
                available_hours_per_week=15,
                plan_data=plan_data,
                agent_reasoning=[],
                execution_time_ms=15000
            )
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        assert result == mock_plan


class TestProgressTracking:
    """Test progress tracking (Req 28.11)"""
    
    def test_update_progress(self, service, mock_db):
        """Test updating study plan progress"""
        mock_plan = Mock(spec=StudyPlan)
        mock_plan.id = 1
        mock_plan.user_id = 1
        mock_plan.plan_data = {
            'daily_tasks': [
                {
                    'day': 1,
                    'tasks': [
                        {'skill': 'Python', 'completed': False},
                        {'skill': 'JavaScript', 'completed': False}
                    ]
                }
            ],
            'weekly_milestones': [
                {'week': 1, 'completed': False}
            ]
        }
        mock_plan.total_tasks = 2
        mock_plan.completed_tasks = 0
        mock_plan.progress_percentage = 0.0
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_plan
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        task_updates = {
            '1_0': True,  # Complete first task
            'milestone_1': True  # Complete first milestone
        }
        
        result = service.update_progress(1, 1, task_updates)
        
        mock_db.commit.assert_called_once()
        assert result == mock_plan
    
    def test_update_progress_plan_not_found(self, service, mock_db):
        """Test update fails for nonexistent plan"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="not found"):
            service.update_progress(999, 1, {})


class TestPlanRetrieval:
    """Test plan retrieval methods"""
    
    def test_get_study_plan(self, service, mock_db):
        """Test getting study plan by ID"""
        mock_plan = Mock(spec=StudyPlan)
        mock_plan.id = 1
        mock_plan.user_id = 1
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_plan
        
        result = service.get_study_plan(1, 1)
        
        assert result == mock_plan
    
    def test_get_active_plan(self, service, mock_db):
        """Test getting active study plan"""
        mock_plan = Mock(spec=StudyPlan)
        mock_plan.id = 1
        mock_plan.user_id = 1
        mock_plan.status = 'active'
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_plan
        
        result = service.get_active_plan(1)
        
        assert result == mock_plan
    
    def test_abandon_plan(self, service, mock_db):
        """Test abandoning a study plan"""
        mock_plan = Mock(spec=StudyPlan)
        mock_plan.id = 1
        mock_plan.user_id = 1
        mock_plan.status = 'active'
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_plan
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        result = service.abandon_plan(1, 1)
        
        assert mock_plan.status == 'abandoned'
        mock_db.commit.assert_called_once()


class TestFullGenerationFlow:
    """Test complete study plan generation flow"""
    
    @patch('app.services.agents.study_plan_agent_service.SchedulerTool')
    @patch('app.services.agents.study_plan_agent_service.ProgressTrackerTool')
    @patch('app.services.agents.study_plan_agent_service.LearningResourceTool')
    @patch('app.services.agents.study_plan_agent_service.JobMarketTool')
    @patch('app.services.agents.study_plan_agent_service.SkillAssessmentTool')
    @patch('app.services.agents.study_plan_agent_service.AgentExecutor')
    @patch('app.services.agents.study_plan_agent_service.BaseAgent')
    @patch('app.services.agents.study_plan_agent_service.StudyPlan')
    def test_generate_study_plan_success(
        self,
        mock_plan_class,
        mock_agent_class,
        mock_executor_class,
        mock_skill_tool,
        mock_job_tool,
        mock_resource_tool,
        mock_progress_tool,
        mock_scheduler_tool,
        mock_db,
        mock_user,
        mock_resume_analysis
    ):
        """Test successful study plan generation"""
        # Create service AFTER patches are applied
        service = StudyPlanAgentService(mock_db)
        
        # Setup tool mocks
        mock_skill_tool.return_value = Mock(name='skill_assessment')
        mock_job_tool.return_value = Mock(name='job_market_research')
        mock_resource_tool.return_value = Mock(name='learning_resources')
        mock_progress_tool.return_value = Mock(name='progress_tracker')
        mock_scheduler_tool.return_value = Mock(name='scheduler')
        
        # Setup mocks
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_user,  # User validation
            mock_resume_analysis,  # Resume analysis validation
            mock_resume_analysis  # Skill data retrieval
        ]
        
        mock_agent = Mock()
        mock_agent.tools = [Mock() for _ in range(5)]
        mock_agent.system_message = "Test message"
        mock_agent_class.return_value = mock_agent
        
        mock_executor = Mock()
        mock_executor.run.return_value = {
            'output': '''```json
{
  "daily_tasks": [],
  "weekly_milestones": [],
  "resource_links": {},
  "time_estimates": {
    "total_hours": 180,
    "hours_per_week": 15,
    "completion_date": "2026-05-15"
  }
}
```''',
            'reasoning_steps': []
        }
        mock_executor_class.return_value = mock_executor
        
        mock_plan = Mock(spec=StudyPlan)
        mock_plan.id = 1
        mock_plan_class.return_value = mock_plan
        
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        result = service.generate_study_plan(
            user_id=1,
            target_role='Software Engineer',
            duration_days=90,
            available_hours_per_week=15
        )
        
        # Verify executor was called (agent was used)
        mock_executor_class.assert_called_once()
        
        # Verify plan was stored
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        
        assert result == mock_plan
    
    def test_generate_plan_validates_user(self, service, mock_db):
        """Test generation validates user prerequisites"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="not found"):
            service.generate_study_plan(
                user_id=999,
                target_role='Software Engineer',
                duration_days=90,
                available_hours_per_week=15
            )
    
    def test_execution_time_limit(self, service):
        """Test execution time limit is 20 seconds (Req 28.10)"""
        assert service.max_execution_time == 20.0
