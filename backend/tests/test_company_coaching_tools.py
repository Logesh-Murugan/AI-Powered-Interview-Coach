"""
Tests for Company Coaching Tools

Tests the 4 custom tools for company coaching.

Requirements: 29.1, 29.3-29.7
"""
import pytest
from unittest.mock import Mock
from sqlalchemy.orm import Session

from app.services.agents.tools.company_coaching_tools import (
    CompanyResearchTool,
    InterviewPatternTool,
    STARMethodTool,
    ConfidenceTool
)
from app.models.resume_analysis import ResumeAnalysis


@pytest.fixture
def mock_db():
    """Mock database session"""
    return Mock(spec=Session)


class TestCompanyResearchTool:
    """Test CompanyResearchTool (Req 29.3)"""
    
    def test_company_research_tool_initialization(self):
        """Test tool initialization"""
        tool = CompanyResearchTool()
        assert tool.name == "company_research"
        assert "company" in tool.description.lower()
    
    def test_research_known_company(self):
        """Test researching a known company"""
        tool = CompanyResearchTool()
        result = tool._run("Google")
        
        assert isinstance(result, dict)
        assert 'culture' in result
        assert 'values' in result
        assert 'interview_style' in result
        assert 'hiring_process' in result
        assert isinstance(result['values'], list)
        assert len(result['values']) > 0
    
    def test_research_unknown_company(self):
        """Test researching an unknown company returns generic template"""
        tool = CompanyResearchTool()
        result = tool._run("Unknown Startup Inc")
        
        assert isinstance(result, dict)
        assert 'culture' in result
        assert 'values' in result
        assert 'Unknown Startup Inc' in result['culture']
    
    def test_research_case_insensitive(self):
        """Test company name is case-insensitive"""
        tool = CompanyResearchTool()
        result1 = tool._run("google")
        result2 = tool._run("GOOGLE")
        result3 = tool._run("Google")
        
        assert result1 == result2 == result3


class TestInterviewPatternTool:
    """Test InterviewPatternTool (Req 29.4)"""
    
    def test_interview_pattern_tool_initialization(self, mock_db):
        """Test tool initialization"""
        tool = InterviewPatternTool(db=mock_db)
        assert tool.name == "interview_patterns"
        assert "pattern" in tool.description.lower()
    
    def test_analyze_known_company_patterns(self, mock_db):
        """Test analyzing patterns for known company"""
        tool = InterviewPatternTool(db=mock_db)
        result = tool._run("Amazon")
        
        assert isinstance(result, dict)
        assert 'common_categories' in result
        assert 'difficulty_distribution' in result
        assert 'typical_questions' in result
        assert isinstance(result['common_categories'], list)
        assert isinstance(result['typical_questions'], list)
        assert len(result['typical_questions']) > 0
    
    def test_analyze_unknown_company_patterns(self, mock_db):
        """Test analyzing patterns for unknown company returns generic"""
        tool = InterviewPatternTool(db=mock_db)
        result = tool._run("Unknown Company")
        
        assert isinstance(result, dict)
        assert 'common_categories' in result
        assert 'Algorithms' in result['common_categories']
    
    def test_difficulty_distribution_structure(self, mock_db):
        """Test difficulty distribution has correct structure"""
        tool = InterviewPatternTool(db=mock_db)
        result = tool._run("Microsoft")
        
        assert 'difficulty_distribution' in result
        dist = result['difficulty_distribution']
        assert 'Easy' in dist
        assert 'Medium' in dist
        assert 'Hard' in dist
        assert isinstance(dist['Easy'], int)


class TestSTARMethodTool:
    """Test STARMethodTool (Req 29.6)"""
    
    def test_star_tool_initialization(self, mock_db):
        """Test tool initialization"""
        tool = STARMethodTool(db=mock_db)
        assert tool.name == "star_examples"
        assert "star" in tool.description.lower()
    
    def test_extract_star_examples_with_resume(self, mock_db):
        """Test extracting STAR examples from resume"""
        # Mock resume analysis
        mock_resume = Mock(spec=ResumeAnalysis)
        mock_resume.status = 'completed'
        mock_resume.analysis_data = {
            'work_experience': [
                {
                    'title': 'Software Engineer',
                    'company': 'Tech Corp',
                    'responsibilities': ['Led team of 5 developers'],
                    'achievements': ['Increased performance by 50%']
                }
            ],
            'key_achievements': ['Reduced costs by 30%'],
            'projects': [
                {
                    'name': 'E-commerce Platform',
                    'description': 'Built scalable platform',
                    'technologies': ['Python', 'React'],
                    'outcome': 'Served 1M users'
                }
            ]
        }
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_resume
        
        tool = STARMethodTool(db=mock_db)
        result = tool._run(1)
        
        assert isinstance(result, list)
        assert len(result) > 0
        assert len(result) <= 5
        
        # Check STAR structure
        for example in result:
            assert 'situation' in example
            assert 'task' in example
            assert 'action' in example
            assert 'result' in example
            assert 'relevant_to' in example
    
    def test_extract_star_examples_no_resume(self, mock_db):
        """Test extracting STAR examples when no resume exists"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        tool = STARMethodTool(db=mock_db)
        result = tool._run(1)
        
        assert isinstance(result, list)
        assert len(result) == 0
    
    def test_star_examples_limited_to_five(self, mock_db):
        """Test STAR examples are limited to 5"""
        # Mock resume with many experiences
        mock_resume = Mock(spec=ResumeAnalysis)
        mock_resume.status = 'completed'
        mock_resume.analysis_data = {
            'work_experience': [{'title': f'Role {i}', 'company': f'Company {i}'} for i in range(10)],
            'key_achievements': [f'Achievement {i}' for i in range(10)],
            'projects': [{'name': f'Project {i}'} for i in range(10)]
        }
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_resume
        
        tool = STARMethodTool(db=mock_db)
        result = tool._run(1)
        
        assert len(result) <= 5


class TestConfidenceTool:
    """Test ConfidenceTool (Req 29.7)"""
    
    def test_confidence_tool_initialization(self):
        """Test tool initialization"""
        tool = ConfidenceTool()
        assert tool.name == "confidence_tips"
        assert "confidence" in tool.description.lower()
    
    def test_generate_confidence_tips(self):
        """Test generating confidence tips"""
        tool = ConfidenceTool()
        result = tool._run("Google", "Software Engineer")
        
        assert isinstance(result, dict)
        assert 'confidence_tips' in result
        assert 'pre_interview_checklist' in result
        assert isinstance(result['confidence_tips'], list)
        assert isinstance(result['pre_interview_checklist'], list)
        assert len(result['confidence_tips']) > 0
        assert len(result['pre_interview_checklist']) > 0
    
    def test_tips_include_company_name(self):
        """Test tips include company name"""
        tool = ConfidenceTool()
        result = tool._run("Amazon")
        
        tips_text = ' '.join(result['confidence_tips'])
        checklist_text = ' '.join(result['pre_interview_checklist'])
        
        assert 'Amazon' in tips_text or 'Amazon' in checklist_text
    
    def test_role_specific_tips_engineer(self):
        """Test role-specific tips for engineer"""
        tool = ConfidenceTool()
        result = tool._run("Google", "Software Engineer")
        
        all_text = ' '.join(result['confidence_tips'] + result['pre_interview_checklist'])
        assert 'algorithm' in all_text.lower() or 'coding' in all_text.lower()
    
    def test_role_specific_tips_manager(self):
        """Test role-specific tips for manager"""
        tool = ConfidenceTool()
        result = tool._run("Microsoft", "Engineering Manager")
        
        all_text = ' '.join(result['confidence_tips'] + result['pre_interview_checklist'])
        assert 'leadership' in all_text.lower() or 'team' in all_text.lower()
