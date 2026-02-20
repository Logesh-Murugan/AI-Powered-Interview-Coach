"""
Tests for Resume Agent Service

Requirements: 27.1-27.13
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy.orm import Session

from app.services.agents.resume_agent_service import ResumeAgentService
from app.models.resume import Resume, ResumeStatus
from app.models.resume_analysis import ResumeAnalysis


@pytest.fixture
def mock_db():
    """Mock database session"""
    return Mock(spec=Session)


@pytest.fixture
def service(mock_db):
    """Resume agent service instance"""
    return ResumeAgentService(mock_db)


@pytest.fixture
def mock_resume():
    """Mock resume object"""
    resume = Mock(spec=Resume)
    resume.id = 1
    resume.user_id = 1
    resume.filename = "test.pdf"
    resume.extracted_text = "Test resume with Python and JavaScript skills"
    resume.skills = {
        'technical_skills': ['Python', 'JavaScript'],
        'soft_skills': ['Leadership']
    }
    resume.experience = {'entries': []}
    resume.education = {'entries': []}
    resume.status = ResumeStatus.SKILLS_EXTRACTED.value
    resume.total_experience_months = 60
    resume.seniority_level = 'Mid'
    resume.deleted_at = None
    return resume


class TestResumeValidation:
    """Test resume validation (Req 27.1)"""
    
    def test_validate_existing_resume(self, service, mock_db, mock_resume):
        """Test validation of existing resume"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_resume
        
        result = service._validate_resume(1, 1)
        
        assert result == mock_resume
    
    def test_validate_nonexistent_resume(self, service, mock_db):
        """Test validation fails for nonexistent resume"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="not found"):
            service._validate_resume(999, 1)
    
    def test_validate_wrong_user(self, service, mock_db):
        """Test validation fails for wrong user"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="not found"):
            service._validate_resume(1, 999)
    
    def test_validate_resume_not_ready(self, service, mock_db, mock_resume):
        """Test validation fails if resume not ready"""
        mock_resume.status = ResumeStatus.UPLOADED.value
        mock_db.query.return_value.filter.return_value.first.return_value = mock_resume
        
        with pytest.raises(ValueError, match="not ready"):
            service._validate_resume(1, 1)
    
    def test_validate_resume_no_text(self, service, mock_db, mock_resume):
        """Test validation fails if no extracted text"""
        mock_resume.extracted_text = None
        mock_db.query.return_value.filter.return_value.first.return_value = mock_resume
        
        with pytest.raises(ValueError, match="no extracted text"):
            service._validate_resume(1, 1)


class TestCaching:
    """Test caching logic (Req 27.2, 27.3)"""
    
    def test_get_cached_analysis_recent(self, service, mock_db):
        """Test getting recent cached analysis"""
        mock_analysis = Mock(spec=ResumeAnalysis)
        mock_analysis.id = 1
        mock_analysis.resume_id = 1
        mock_analysis.status = 'success'
        mock_analysis.created_at = datetime.utcnow() - timedelta(days=10)
        mock_analysis.deleted_at = None
        
        mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = mock_analysis
        
        result = service._get_cached_analysis(1)
        
        assert result == mock_analysis
    
    def test_get_cached_analysis_expired(self, service, mock_db):
        """Test expired cache returns None"""
        mock_analysis = Mock(spec=ResumeAnalysis)
        mock_analysis.created_at = datetime.utcnow() - timedelta(days=31)
        
        mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
        
        result = service._get_cached_analysis(1)
        
        assert result is None
    
    def test_cache_ttl_is_30_days(self, service):
        """Test cache TTL is 30 days"""
        assert service.CACHE_TTL_DAYS == 30


class TestFallbackAnalysis:
    """Test fallback to NLP (Req 27.13)"""
    
    def test_fallback_analysis_structure(self, service, mock_resume):
        """Test fallback returns correct structure"""
        result = service._fallback_analysis(mock_resume, "Software Engineer")
        
        assert 'skill_inventory' in result
        assert 'experience_timeline' in result
        assert 'skill_gaps' in result
        assert 'improvement_roadmap' in result
        assert result['fallback_used'] is True
    
    def test_fallback_uses_resume_data(self, service, mock_resume):
        """Test fallback uses existing resume data"""
        result = service._fallback_analysis(mock_resume, "Software Engineer")
        
        assert result['skill_inventory'] == mock_resume.skills
        assert result['experience_timeline']['total_years'] == 5.0
        assert result['experience_timeline']['seniority_level'] == 'Mid'


class TestAnalysisStorage:
    """Test analysis storage (Req 27.9)"""
    
    def test_store_analysis(self, service, mock_db):
        """Test storing analysis in database"""
        analysis_data = {
            'skill_inventory': {},
            'experience_timeline': {},
            'skill_gaps': {},
            'improvement_roadmap': {}
        }
        
        mock_analysis = Mock(spec=ResumeAnalysis)
        mock_analysis.id = 1
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock(side_effect=lambda x: setattr(x, 'id', 1))
        
        with patch('app.services.agents.resume_agent_service.ResumeAnalysis', return_value=mock_analysis):
            result = service._store_analysis(
                resume_id=1,
                user_id=1,
                analysis_data=analysis_data,
                agent_reasoning=[],
                execution_time_ms=15000,
                status='success'
            )
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        assert result == mock_analysis


class TestAnalysisFormatting:
    """Test analysis response formatting (Req 27.10)"""
    
    def test_format_analysis_response(self, service):
        """Test formatting analysis for API response"""
        mock_analysis = Mock(spec=ResumeAnalysis)
        mock_analysis.id = 1
        mock_analysis.resume_id = 1
        mock_analysis.analysis_data = {'test': 'data'}
        mock_analysis.agent_reasoning = [{'step': 1}]
        mock_analysis.has_reasoning = True
        mock_analysis.execution_time_ms = 15000
        mock_analysis.status = 'success'
        mock_analysis.created_at = datetime.utcnow()
        
        result = service._format_analysis_response(mock_analysis, from_cache=True)
        
        assert result['analysis_id'] == 1
        assert result['resume_id'] == 1
        assert result['analysis_data'] == {'test': 'data'}
        assert result['agent_reasoning'] == [{'step': 1}]
        assert result['from_cache'] is True
        assert 'analyzed_at' in result
    
    def test_format_without_reasoning(self, service):
        """Test formatting when no reasoning available"""
        mock_analysis = Mock(spec=ResumeAnalysis)
        mock_analysis.id = 1
        mock_analysis.resume_id = 1
        mock_analysis.analysis_data = {}
        mock_analysis.agent_reasoning = []
        mock_analysis.has_reasoning = False
        mock_analysis.execution_time_ms = 0
        mock_analysis.status = 'fallback'
        mock_analysis.created_at = datetime.utcnow()
        
        result = service._format_analysis_response(mock_analysis, from_cache=False)
        
        assert result['agent_reasoning'] is None


class TestAnalysisHistory:
    """Test analysis history retrieval"""
    
    def test_get_analysis_history(self, service, mock_db, mock_resume):
        """Test getting analysis history"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_resume
        
        mock_analyses = [
            Mock(spec=ResumeAnalysis, id=1, resume_id=1, created_at=datetime.utcnow()),
            Mock(spec=ResumeAnalysis, id=2, resume_id=1, created_at=datetime.utcnow())
        ]
        
        for analysis in mock_analyses:
            analysis.analysis_data = {}
            analysis.agent_reasoning = []
            analysis.has_reasoning = False
            analysis.execution_time_ms = 0
            analysis.status = 'success'
        
        mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = mock_analyses
        
        result = service.get_analysis_history(1, 1, limit=10)
        
        assert len(result) == 2
    
    def test_get_history_wrong_user(self, service, mock_db):
        """Test history fails for wrong user"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="not found"):
            service.get_analysis_history(1, 999)


class TestFullAnalysisFlow:
    """Test complete analysis flow"""
    
    @patch('app.services.agents.resume_agent_service.ResumeIntelligenceAgent')
    @patch('app.services.agents.resume_agent_service.AgentExecutor')
    def test_analyze_resume_with_cache_hit(self, mock_executor_class, mock_agent_class, service, mock_db, mock_resume):
        """Test analysis returns cached result"""
        # Setup mocks
        mock_db.query.return_value.filter.return_value.first.return_value = mock_resume
        
        mock_cached = Mock(spec=ResumeAnalysis)
        mock_cached.id = 1
        mock_cached.resume_id = 1
        mock_cached.analysis_data = {'cached': True}
        mock_cached.agent_reasoning = []
        mock_cached.has_reasoning = False
        mock_cached.execution_time_ms = 0
        mock_cached.status = 'success'
        mock_cached.created_at = datetime.utcnow() - timedelta(days=5)
        
        mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = mock_cached
        
        result = service.analyze_resume(1, 1)
        
        assert result['from_cache'] is True
        assert result['analysis_data'] == {'cached': True}
        
        # Agent should not be called
        mock_agent_class.assert_not_called()
    
    @patch('app.services.agents.resume_agent_service.ResumeIntelligenceAgent')
    @patch('app.services.agents.resume_agent_service.AgentExecutor')
    @patch('app.services.agents.resume_agent_service.ResumeAnalysis')
    def test_analyze_resume_with_cache_miss(self, mock_analysis_class, mock_executor_class, mock_agent_class, service, mock_db, mock_resume):
        """Test analysis executes agent on cache miss"""
        # Setup mocks
        mock_db.query.return_value.filter.return_value.first.return_value = mock_resume
        mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
        
        mock_agent = Mock()
        mock_agent_class.return_value = mock_agent
        
        mock_executor = Mock()
        mock_executor.execute_with_fallback.return_value = {
            'output': {'skill_inventory': {}},
            'reasoning_steps': [],
            'execution_time_ms': 15000,
            'status': 'success'
        }
        mock_executor_class.return_value = mock_executor
        
        mock_stored_analysis = Mock(spec=ResumeAnalysis)
        mock_stored_analysis.id = 1
        mock_stored_analysis.resume_id = 1
        mock_stored_analysis.analysis_data = {}
        mock_stored_analysis.agent_reasoning = []
        mock_stored_analysis.has_reasoning = False
        mock_stored_analysis.execution_time_ms = 15000
        mock_stored_analysis.status = 'success'
        mock_stored_analysis.created_at = datetime.utcnow()
        
        mock_analysis_class.return_value = mock_stored_analysis
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        result = service.analyze_resume(1, 1, force_refresh=True)
        
        # Agent should be called
        mock_agent_class.assert_called_once()
        mock_executor_class.assert_called_once()
