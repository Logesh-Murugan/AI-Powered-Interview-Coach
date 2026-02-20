"""
Tests for resume analysis tools

Requirements: 27.4, 27.5
"""
import pytest
import json
from unittest.mock import Mock, patch

from app.services.agents.tools.resume_tools import (
    ResumeParserTool,
    SkillExtractorTool,
    ExperienceAnalyzerTool,
    SkillGapTool,
    RoadmapGeneratorTool
)


class TestResumeParserTool:
    """Test suite for ResumeParserTool"""
    
    def test_tool_metadata(self):
        """Test tool has correct metadata"""
        assert ResumeParserTool.name == "resume_parser"
        assert "resume_id" in ResumeParserTool.description.lower()
    
    def test_as_tool_returns_langchain_tool(self):
        """Test as_tool returns LangChain Tool"""
        tool = ResumeParserTool.as_tool()
        
        assert tool.name == "resume_parser"
        assert callable(tool.func)
    
    @patch('app.services.agents.tools.resume_tools.SessionLocal')
    def test_parse_existing_resume(self, mock_session):
        """Test parsing existing resume"""
        # Mock database
        mock_db = Mock()
        mock_session.return_value = mock_db
        
        mock_resume = Mock()
        mock_resume.id = 1
        mock_resume.filename = "test.pdf"
        mock_resume.extracted_text = "Test resume text"
        mock_resume.skills = {"technical_skills": ["Python"]}
        mock_resume.experience = {"entries": []}
        mock_resume.education = {"entries": []}
        mock_resume.status = "completed"
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_resume
        
        result = ResumeParserTool._run("1")
        result_data = json.loads(result)
        
        assert result_data['resume_id'] == 1
        assert result_data['filename'] == "test.pdf"
        assert 'skills' in result_data
    
    @patch('app.services.agents.tools.resume_tools.SessionLocal')
    def test_parse_nonexistent_resume(self, mock_session):
        """Test parsing nonexistent resume"""
        mock_db = Mock()
        mock_session.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = ResumeParserTool._run("999")
        result_data = json.loads(result)
        
        assert 'error' in result_data


class TestSkillExtractorTool:
    """Test suite for SkillExtractorTool"""
    
    def test_tool_metadata(self):
        """Test tool has correct metadata"""
        assert SkillExtractorTool.name == "skill_extractor"
        assert "skills" in SkillExtractorTool.description.lower()
    
    @patch('app.services.agents.tools.resume_tools.extract_skills_from_text')
    def test_extract_skills_from_text(self, mock_extract):
        """Test skill extraction"""
        mock_extract.return_value = {
            'technical_skills': [
                {'skill': 'Python', 'confidence': 0.9},
                {'skill': 'JavaScript', 'confidence': 0.8}
            ],
            'soft_skills': [{'skill': 'Leadership', 'confidence': 0.7}],
            'tools': [{'skill': 'Git', 'confidence': 0.9}],
            'languages': [{'skill': 'English', 'confidence': 1.0}]
        }
        
        result = SkillExtractorTool._run("Resume with Python and JavaScript")
        result_data = json.loads(result)
        
        assert len(result_data['technical_skills']) == 2
        assert result_data['total_skills'] == 5  # 2 technical + 1 soft + 1 tool + 1 language
    
    def test_extract_skills_handles_error(self):
        """Test error handling"""
        with patch('app.services.agents.tools.resume_tools.extract_skills_from_text', side_effect=Exception("Test error")):
            result = SkillExtractorTool._run("test")
            result_data = json.loads(result)
            
            assert 'error' in result_data


class TestExperienceAnalyzerTool:
    """Test suite for ExperienceAnalyzerTool"""
    
    def test_tool_metadata(self):
        """Test tool has correct metadata"""
        assert ExperienceAnalyzerTool.name == "experience_analyzer"
        assert "experience" in ExperienceAnalyzerTool.description.lower()
    
    def test_analyze_experience_with_entries(self):
        """Test experience analysis"""
        experience_data = {
            'entries': [
                {
                    'company_name': 'Tech Corp',
                    'job_title': 'Software Engineer',
                    'duration_months': 36
                },
                {
                    'company_name': 'Startup Inc',
                    'job_title': 'Senior Engineer',
                    'duration_months': 24
                }
            ]
        }
        
        result = ExperienceAnalyzerTool._run(json.dumps(experience_data))
        result_data = json.loads(result)
        
        assert result_data['total_experience_months'] == 60
        assert result_data['total_experience_years'] == 5.0
        assert result_data['seniority_level'] == 'Senior'  # 5 years = Senior level
        assert result_data['number_of_companies'] == 2
    
    def test_seniority_levels(self):
        """Test seniority level calculation"""
        # Entry level (< 2 years)
        result = ExperienceAnalyzerTool._run(json.dumps({
            'entries': [{'duration_months': 12}]
        }))
        assert json.loads(result)['seniority_level'] == 'Entry'
        
        # Mid level (2-5 years)
        result = ExperienceAnalyzerTool._run(json.dumps({
            'entries': [{'duration_months': 36}]
        }))
        assert json.loads(result)['seniority_level'] == 'Mid'
        
        # Senior level (5-10 years)
        result = ExperienceAnalyzerTool._run(json.dumps({
            'entries': [{'duration_months': 72}]
        }))
        assert json.loads(result)['seniority_level'] == 'Senior'
        
        # Staff level (> 10 years)
        result = ExperienceAnalyzerTool._run(json.dumps({
            'entries': [{'duration_months': 132}]
        }))
        assert json.loads(result)['seniority_level'] == 'Staff/Principal'


class TestSkillGapTool:
    """Test suite for SkillGapTool"""
    
    def test_tool_metadata(self):
        """Test tool has correct metadata"""
        assert SkillGapTool.name == "skill_gap_analyzer"
        assert "gap" in SkillGapTool.description.lower()
    
    def test_identify_skill_gaps(self):
        """Test skill gap identification"""
        input_data = {
            'current_skills': ['Python', 'JavaScript', 'SQL'],
            'target_role': 'Software Engineer'
        }
        
        result = SkillGapTool._run(json.dumps(input_data))
        result_data = json.loads(result)
        
        assert result_data['target_role'] == 'Software Engineer'
        assert 'match_percentage' in result_data
        assert 'required_skills_missing' in result_data
        assert 'preferred_skills_missing' in result_data
    
    def test_perfect_match(self):
        """Test when all required skills are present"""
        input_data = {
            'current_skills': ['Python', 'JavaScript', 'Git', 'SQL', 'REST APIs'],
            'target_role': 'Software Engineer'
        }
        
        result = SkillGapTool._run(json.dumps(input_data))
        result_data = json.loads(result)
        
        assert result_data['match_percentage'] == 100.0
        assert len(result_data['required_skills_missing']) == 0
    
    def test_different_roles(self):
        """Test different target roles"""
        roles = ['Product Manager', 'Data Scientist', 'Marketing Manager']
        
        for role in roles:
            input_data = {
                'current_skills': [],
                'target_role': role
            }
            
            result = SkillGapTool._run(json.dumps(input_data))
            result_data = json.loads(result)
            
            assert result_data['target_role'] == role
            assert len(result_data['required_skills_missing']) > 0


class TestRoadmapGeneratorTool:
    """Test suite for RoadmapGeneratorTool"""
    
    def test_tool_metadata(self):
        """Test tool has correct metadata"""
        assert RoadmapGeneratorTool.name == "roadmap_generator"
        assert "roadmap" in RoadmapGeneratorTool.description.lower()
    
    def test_generate_roadmap(self):
        """Test roadmap generation"""
        input_data = {
            'skill_gaps': ['Docker', 'Kubernetes', 'AWS'],
            'experience_level': 'Mid'
        }
        
        result = RoadmapGeneratorTool._run(json.dumps(input_data))
        result_data = json.loads(result)
        
        assert result_data['experience_level'] == 'Mid'
        assert result_data['total_timeline_weeks'] == 12
        assert result_data['hours_per_week'] == 8
        assert len(result_data['milestones']) > 0
        assert 'success_tips' in result_data
    
    def test_timeline_varies_by_experience(self):
        """Test timeline varies by experience level"""
        skill_gaps = ['Docker', 'Kubernetes']
        
        # Entry level - longer timeline
        result_entry = RoadmapGeneratorTool._run(json.dumps({
            'skill_gaps': skill_gaps,
            'experience_level': 'Entry'
        }))
        data_entry = json.loads(result_entry)
        
        # Senior level - shorter timeline
        result_senior = RoadmapGeneratorTool._run(json.dumps({
            'skill_gaps': skill_gaps,
            'experience_level': 'Senior'
        }))
        data_senior = json.loads(result_senior)
        
        assert data_entry['total_timeline_weeks'] > data_senior['total_timeline_weeks']
        assert data_entry['hours_per_week'] > data_senior['hours_per_week']
    
    def test_milestones_structure(self):
        """Test milestone structure"""
        input_data = {
            'skill_gaps': ['Docker', 'Kubernetes', 'AWS', 'Terraform'],
            'experience_level': 'Mid'
        }
        
        result = RoadmapGeneratorTool._run(json.dumps(input_data))
        result_data = json.loads(result)
        
        for milestone in result_data['milestones']:
            assert 'milestone_number' in milestone
            assert 'weeks' in milestone
            assert 'skills_to_learn' in milestone
            assert 'estimated_hours' in milestone
            assert 'activities' in milestone
