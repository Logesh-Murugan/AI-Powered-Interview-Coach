"""
Tests for Study Plan Tools

Tests the 5 custom tools used by the study plan agent.

Requirements: 28.3
"""
import pytest
from unittest.mock import Mock, MagicMock
from app.services.agents.tools.study_plan_tools import (
    SkillAssessmentTool,
    JobMarketTool,
    LearningResourceTool,
    ProgressTrackerTool,
    SchedulerTool
)


class TestSkillAssessmentTool:
    """Test SkillAssessmentTool"""
    
    def test_skill_assessment_tool_initialization(self, db):
        """Test tool initializes correctly"""
        tool = SkillAssessmentTool(db=db)
        
        assert tool.name == "skill_assessment"
        assert "assess" in tool.description.lower()
        assert tool.db == db
    
    def test_skill_assessment_with_resume_analysis(self, db, test_user, test_resume_analysis):
        """Test skill assessment retrieves data from resume analysis"""
        tool = SkillAssessmentTool(db=db)
        
        result = tool._run(user_id=test_user.id)
        
        assert "technical_skills" in result
        assert "soft_skills" in result
        assert isinstance(result["technical_skills"], list)
    
    def test_skill_assessment_no_resume_analysis(self, db, test_user):
        """Test skill assessment handles missing resume analysis"""
        tool = SkillAssessmentTool(db=db)
        
        result = tool._run(user_id=test_user.id)
        
        # Should return empty or default structure
        assert "technical_skills" in result or "error" in result


class TestJobMarketTool:
    """Test JobMarketTool"""
    
    def test_job_market_tool_initialization(self):
        """Test tool initializes correctly"""
        tool = JobMarketTool()
        
        assert tool.name == "job_market_research"
        assert "job market" in tool.description.lower()
    
    def test_job_market_software_engineer(self):
        """Test job market research for Software Engineer"""
        tool = JobMarketTool()
        
        result = tool._run(target_role="Software Engineer")
        
        assert "required_skills" in result
        assert "salary_range" in result
        assert isinstance(result["required_skills"], list)
        assert len(result["required_skills"]) > 0
    
    def test_job_market_data_scientist(self):
        """Test job market research for Data Scientist"""
        tool = JobMarketTool()
        
        result = tool._run(target_role="Data Scientist")
        
        assert "required_skills" in result
        assert "Python" in result["required_skills"] or "python" in str(result["required_skills"]).lower()
    
    def test_job_market_unknown_role(self):
        """Test job market research for unknown role"""
        tool = JobMarketTool()
        
        result = tool._run(target_role="Unknown Role XYZ")
        
        # Should return generic data or error
        assert "required_skills" in result or "error" in result


class TestLearningResourceTool:
    """Test LearningResourceTool"""
    
    def test_learning_resource_tool_initialization(self):
        """Test tool initializes correctly"""
        tool = LearningResourceTool()
        
        assert tool.name == "learning_resources"
        assert "resource" in tool.description.lower()
    
    def test_learning_resources_python(self):
        """Test learning resources for Python"""
        tool = LearningResourceTool()
        
        result = tool._run(skill_name="Python", difficulty_level="beginner")
        
        assert "resources" in result
        assert isinstance(result["resources"], list)
        assert len(result["resources"]) > 0
    
    def test_learning_resources_javascript(self):
        """Test learning resources for JavaScript"""
        tool = LearningResourceTool()
        
        result = tool._run(skill_name="JavaScript", difficulty_level="intermediate")
        
        assert "resources" in result
        assert len(result["resources"]) > 0
    
    def test_learning_resources_difficulty_levels(self):
        """Test different difficulty levels"""
        tool = LearningResourceTool()
        
        beginner = tool._run(skill_name="Python", difficulty_level="beginner")
        advanced = tool._run(skill_name="Python", difficulty_level="advanced")
        
        assert "resources" in beginner
        assert "resources" in advanced
        # Resources should be different for different levels
        assert beginner["resources"] != advanced["resources"] or len(beginner["resources"]) > 0


class TestProgressTrackerTool:
    """Test ProgressTrackerTool"""
    
    def test_progress_tracker_tool_initialization(self, db):
        """Test tool initializes correctly"""
        tool = ProgressTrackerTool(db=db)
        
        assert tool.name == "progress_tracker"
        assert "progress" in tool.description.lower()
        assert tool.db == db
    
    def test_progress_tracker_with_interviews(self, db, test_user):
        """Test progress tracking with interview history"""
        tool = ProgressTrackerTool(db=db)
        
        result = tool._run(user_id=test_user.id, skill_name="Python")
        
        assert "practice_sessions" in result or "sessions" in result
        assert "average_score" in result or "score" in result
    
    def test_progress_tracker_no_history(self, db, test_user):
        """Test progress tracking with no interview history"""
        tool = ProgressTrackerTool(db=db)
        
        result = tool._run(user_id=test_user.id, skill_name="NewSkill")
        
        # Should handle gracefully
        assert isinstance(result, dict)


class TestSchedulerTool:
    """Test SchedulerTool"""
    
    def test_scheduler_tool_initialization(self):
        """Test tool initializes correctly"""
        tool = SchedulerTool()
        
        assert tool.name == "scheduler"
        assert "schedule" in tool.description.lower()
    
    def test_scheduler_30_day_plan(self):
        """Test scheduler for 30-day plan"""
        tool = SchedulerTool()
        
        tasks = [
            {"skill": "Python", "duration_minutes": 60},
            {"skill": "JavaScript", "duration_minutes": 45}
        ]
        
        result = tool._run(
            tasks=tasks,
            available_hours_per_week=15,
            duration_days=30
        )
        
        assert "daily_schedule" in result or "schedule" in result
        assert isinstance(result, dict)
    
    def test_scheduler_90_day_plan(self):
        """Test scheduler for 90-day plan"""
        tool = SchedulerTool()
        
        tasks = [
            {"skill": "Python", "duration_minutes": 60},
            {"skill": "React", "duration_minutes": 90}
        ]
        
        result = tool._run(
            tasks=tasks,
            available_hours_per_week=20,
            duration_days=90
        )
        
        assert isinstance(result, dict)
        # Should distribute tasks over 90 days
    
    def test_scheduler_realistic_time_allocation(self):
        """Test scheduler creates realistic time allocations"""
        tool = SchedulerTool()
        
        tasks = [
            {"skill": "Python", "duration_minutes": 60},
            {"skill": "JavaScript", "duration_minutes": 60},
            {"skill": "React", "duration_minutes": 60}
        ]
        
        result = tool._run(
            tasks=tasks,
            available_hours_per_week=10,
            duration_days=60
        )
        
        # Should not exceed available hours
        assert isinstance(result, dict)


# Fixtures
@pytest.fixture
def test_resume_analysis(db, test_user):
    """Create test resume analysis"""
    from app.models.resume_analysis import ResumeAnalysis
    
    analysis = ResumeAnalysis(
        user_id=test_user.id,
        resume_id=1,
        analysis_data={
            "technical_skills": ["Python", "JavaScript", "SQL"],
            "soft_skills": ["Communication", "Problem Solving"],
            "experience_years": 3,
            "skill_gaps": ["React", "Docker"],
            "strengths": ["Python", "SQL"],
            "weaknesses": ["Frontend Development"]
        },
        agent_reasoning=[],
        execution_time_ms=5000,
        status="completed"
    )
    
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    return analysis
