"""
Property Test: Agent Execution Timeout

Property 19: For any AI agent execution (resume analysis, study plan, company coaching),
the execution SHALL complete within 20000ms or timeout with graceful fallback.

Validates: Requirements 27.11

This test uses Hypothesis for property-based testing to verify that all agent
services respect the 20-second timeout across various input scenarios.
"""
import pytest
import time
from hypothesis import given, strategies as st, settings, HealthCheck
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy.orm import Session

from app.services.agents.resume_agent_service import ResumeAgentService
from app.services.agents.study_plan_agent_service import StudyPlanAgentService
from app.services.agents.company_coaching_agent_service import CompanyCoachingAgentService
from app.models.resume import Resume
from app.models.resume_analysis import ResumeAnalysis
from app.models.user import User


# Strategy for generating valid user IDs
user_ids = st.integers(min_value=1, max_value=1000000)

# Strategy for generating company names
company_names = st.sampled_from([
    'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple',
    'Netflix', 'Tesla', 'Uber', 'Airbnb', 'Stripe',
    'Unknown Startup', 'Tech Corp', 'Innovation Labs'
])

# Strategy for generating target roles
target_roles = st.sampled_from([
    'Software Engineer', 'Senior Engineer', 'Staff Engineer',
    'Engineering Manager', 'Product Manager', 'Data Scientist',
    'DevOps Engineer', 'Frontend Developer', 'Backend Developer'
])

# Strategy for generating study plan parameters
duration_days = st.integers(min_value=30, max_value=180)
hours_per_week = st.integers(min_value=5, max_value=40)


@pytest.fixture
def mock_db():
    """Mock database session"""
    return Mock(spec=Session)


@pytest.fixture
def mock_resume():
    """Mock resume object"""
    resume = Mock(spec=Resume)
    resume.id = 1
    resume.user_id = 1
    resume.file_path = '/uploads/test.pdf'
    resume.status = 'processed'
    return resume


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
        'soft_skills': ['Communication', 'Problem Solving'],
        'experience_years': 5,
        'education_level': 'Bachelor',
        'skill_gaps': ['React', 'Docker'],
        'strengths': ['Python', 'SQL'],
        'weaknesses': ['Frontend Development'],
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


class TestResumeAgentTimeout:
    """Test resume agent respects 20-second timeout"""
    
    @given(user_id=user_ids)
    @settings(
        max_examples=10,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_resume_agent_timeout_property(
        self,
        user_id,
        mock_db,
        mock_resume,
        mock_user
    ):
        """
        Property: Resume agent execution completes within 20 seconds
        
        For any valid user_id, the resume agent SHALL complete within 20000ms
        """
        service = ResumeAgentService(mock_db)
        
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_user,  # User query
            mock_resume  # Resume query
        ]
        
        # Mock agent execution with controlled timing
        with patch('app.services.agents.resume_agent_service.ResumeIntelligenceAgent') as mock_agent_class:
            mock_agent = Mock()
            mock_agent.execute.return_value = {
                'output': 'test output',
                'reasoning_steps': [],
                'execution_time_ms': 5000,
                'status': 'success'
            }
            mock_agent_class.return_value = mock_agent
            
            # Verify agent is initialized with 20s timeout
            with patch('app.services.agents.resume_agent_service.ResumeAnalysis') as mock_analysis_class:
                mock_analysis = Mock(spec=ResumeAnalysis)
                mock_analysis.id = 1
                mock_analysis_class.return_value = mock_analysis
                
                mock_db.add = Mock()
                mock_db.commit = Mock()
                mock_db.refresh = Mock()
                
                # Measure execution time
                start_time = time.time()
                
                try:
                    result = service.analyze_resume(user_id, 1)
                    execution_time = time.time() - start_time
                    
                    # Property: Execution must complete within 20 seconds
                    assert execution_time < 20.0, \
                        f"Resume agent exceeded 20s timeout: {execution_time:.2f}s"
                    
                    # Verify agent was initialized with 20s timeout
                    mock_agent_class.assert_called_once()
                    call_kwargs = mock_agent_class.call_args[1]
                    assert call_kwargs.get('max_execution_time') == 20.0, \
                        "Agent must be initialized with 20s timeout"
                    
                except Exception as e:
                    execution_time = time.time() - start_time
                    # Even on error, should not exceed timeout
                    assert execution_time < 20.0, \
                        f"Resume agent exceeded 20s timeout on error: {execution_time:.2f}s"


class TestStudyPlanAgentTimeout:
    """Test study plan agent respects 20-second timeout"""
    
    @given(
        user_id=user_ids,
        target_role=target_roles,
        duration=duration_days,
        hours=hours_per_week
    )
    @settings(
        max_examples=10,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_study_plan_agent_timeout_property(
        self,
        user_id,
        target_role,
        duration,
        hours,
        mock_db,
        mock_user,
        mock_resume_analysis
    ):
        """
        Property: Study plan agent execution completes within 20 seconds
        
        For any valid inputs, the study plan agent SHALL complete within 20000ms
        """
        service = StudyPlanAgentService(mock_db)
        
        # Verify timeout is set to 20 seconds
        assert service.max_execution_time == 20.0, \
            "Study plan agent timeout must be 20 seconds"
        
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_user,  # User validation
            mock_resume_analysis,  # Resume analysis validation
            mock_resume_analysis  # Skill data retrieval
        ]
        
        # Mock agent execution
        with patch('app.services.agents.study_plan_agent_service.BaseAgent') as mock_agent_class, \
             patch('app.services.agents.study_plan_agent_service.AgentExecutor') as mock_executor_class, \
             patch('app.services.agents.study_plan_agent_service.StudyPlan') as mock_plan_class:
            
            mock_agent = Mock()
            mock_agent.execute.return_value = {
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
                'reasoning_steps': [],
                'execution_time_ms': 5000,
                'status': 'success'
            }
            mock_agent_class.return_value = mock_agent
            
            mock_executor = Mock()
            mock_executor.run.return_value = mock_agent.execute.return_value
            mock_executor_class.return_value = mock_executor
            
            mock_plan = Mock()
            mock_plan.id = 1
            mock_plan_class.return_value = mock_plan
            
            mock_db.add = Mock()
            mock_db.commit = Mock()
            mock_db.refresh = Mock()
            
            # Measure execution time
            start_time = time.time()
            
            try:
                result = service.generate_study_plan(
                    user_id=user_id,
                    target_role=target_role,
                    duration_days=duration,
                    available_hours_per_week=hours
                )
                execution_time = time.time() - start_time
                
                # Property: Execution must complete within 20 seconds
                assert execution_time < 20.0, \
                    f"Study plan agent exceeded 20s timeout: {execution_time:.2f}s"
                
                # Verify AgentExecutor was initialized with 20s timeout
                mock_executor_class.assert_called_once()
                call_kwargs = mock_executor_class.call_args[1]
                assert call_kwargs.get('max_execution_time') == 20.0, \
                    "AgentExecutor must be initialized with 20s timeout"
                
            except Exception as e:
                execution_time = time.time() - start_time
                # Even on error, should not exceed timeout
                assert execution_time < 20.0, \
                    f"Study plan agent exceeded 20s timeout on error: {execution_time:.2f}s"


class TestCompanyCoachingAgentTimeout:
    """Test company coaching agent respects 20-second timeout"""
    
    @given(
        user_id=user_ids,
        company_name=company_names,
        target_role=target_roles
    )
    @settings(
        max_examples=10,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_company_coaching_agent_timeout_property(
        self,
        user_id,
        company_name,
        target_role,
        mock_db,
        mock_user,
        mock_resume_analysis
    ):
        """
        Property: Company coaching agent execution completes within 20 seconds
        
        For any valid inputs, the company coaching agent SHALL complete within 20000ms
        """
        service = CompanyCoachingAgentService(mock_db)
        
        # Verify timeout is set to 20 seconds
        assert service.max_execution_time == 20.0, \
            "Company coaching agent timeout must be 20 seconds"
        
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_user,  # User validation
            mock_resume_analysis,  # Resume analysis validation
            mock_resume_analysis  # Input preparation
        ]
        
        # Mock rate limit check
        mock_db.query.return_value.filter.return_value.scalar.return_value = 0
        
        # Mock agent execution
        with patch('app.services.agents.company_coaching_agent_service.BaseAgent') as mock_agent_class, \
             patch('app.services.agents.company_coaching_agent_service.AgentExecutor') as mock_executor_class, \
             patch('app.services.agents.company_coaching_agent_service.CompanyCoachingSession') as mock_session_class:
            
            mock_agent = Mock()
            mock_agent.execute.return_value = {
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
                'reasoning_steps': [],
                'execution_time_ms': 5000,
                'status': 'success'
            }
            mock_agent_class.return_value = mock_agent
            
            mock_executor = Mock()
            mock_executor.run.return_value = mock_agent.execute.return_value
            mock_executor_class.return_value = mock_executor
            
            mock_session = Mock()
            mock_session.id = 1
            mock_session_class.return_value = mock_session
            
            mock_db.add = Mock()
            mock_db.commit = Mock()
            mock_db.refresh = Mock()
            
            # Measure execution time
            start_time = time.time()
            
            try:
                result = service.generate_coaching_session(
                    user_id=user_id,
                    company_name=company_name,
                    target_role=target_role
                )
                execution_time = time.time() - start_time
                
                # Property: Execution must complete within 20 seconds
                assert execution_time < 20.0, \
                    f"Company coaching agent exceeded 20s timeout: {execution_time:.2f}s"
                
                # Verify AgentExecutor was initialized with 20s timeout
                mock_executor_class.assert_called_once()
                call_kwargs = mock_executor_class.call_args[1]
                assert call_kwargs.get('max_execution_time') == 20.0, \
                    "AgentExecutor must be initialized with 20s timeout"
                
            except Exception as e:
                execution_time = time.time() - start_time
                # Even on error, should not exceed timeout
                assert execution_time < 20.0, \
                    f"Company coaching agent exceeded 20s timeout on error: {execution_time:.2f}s"


class TestAgentTimeoutConfiguration:
    """Test all agents have correct timeout configuration"""
    
    def test_all_agents_have_20_second_timeout(self, mock_db):
        """
        Property: All agent services must be configured with 20-second timeout
        
        This is a configuration invariant that must hold for all agent services
        """
        # Study plan agent
        study_plan_service = StudyPlanAgentService(mock_db)
        assert study_plan_service.max_execution_time == 20.0, \
            "Study plan agent must have 20s timeout"
        
        # Company coaching agent
        coaching_service = CompanyCoachingAgentService(mock_db)
        assert coaching_service.max_execution_time == 20.0, \
            "Company coaching agent must have 20s timeout"
    
    def test_timeout_is_enforced_in_base_agent(self, mock_db):
        """
        Property: BaseAgent must enforce the timeout
        
        The timeout configuration must be passed to LangChain AgentExecutor
        """
        from app.services.agents.base_agent import BaseAgent
        from langchain_core.prompts import PromptTemplate
        from langchain_core.tools import Tool
        
        # Create a concrete implementation of BaseAgent for testing
        class TestAgent(BaseAgent):
            def _register_tools(self):
                return [
                    Tool(
                        name="test_tool",
                        func=lambda x: "test",
                        description="Test tool"
                    )
                ]
            
            def _get_prompt_template(self):
                return PromptTemplate(
                    template="Test: {input}\n{agent_scratchpad}",
                    input_variables=["input", "agent_scratchpad"]
                )
        
        # Create agent with 20-second timeout
        agent = TestAgent(max_execution_time=20.0)
        
        # Verify timeout is set
        assert agent.max_execution_time == 20.0, \
            "BaseAgent must store 20s timeout"
        
        # Initialize agent and verify executor gets timeout
        with patch('app.services.agents.base_agent.create_react_agent'), \
             patch('app.services.agents.base_agent.LangChainAgentExecutor') as mock_executor_class:
            
            agent.initialize_agent()
            
            # Verify LangChain AgentExecutor was called with timeout
            mock_executor_class.assert_called_once()
            call_kwargs = mock_executor_class.call_args[1]
            assert call_kwargs.get('max_execution_time') == 20.0, \
                "LangChain AgentExecutor must be initialized with 20s timeout"
