"""
Pydantic schemas for resume analysis API

Requirements: 27.10
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class SkillInventory(BaseModel):
    """Skill inventory section"""
    technical_skills: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)


class ExperienceTimeline(BaseModel):
    """Experience timeline section"""
    total_years: float = Field(ge=0)
    seniority_level: str
    companies: List[str] = Field(default_factory=list)
    roles: List[str] = Field(default_factory=list)
    analysis: Optional[str] = None


class SkillGaps(BaseModel):
    """Skill gaps section"""
    target_role: str
    required_missing: List[str] = Field(default_factory=list)
    preferred_missing: List[str] = Field(default_factory=list)
    match_percentage: float = Field(ge=0, le=100)
    priority: Optional[str] = None
    recommendation: Optional[str] = None
    analysis: Optional[str] = None


class Milestone(BaseModel):
    """Learning roadmap milestone"""
    milestone_number: int
    weeks: str
    skills_to_learn: List[str]
    estimated_hours: int
    activities: List[str]


class ImprovementRoadmap(BaseModel):
    """Improvement roadmap section"""
    timeline_weeks: int = Field(ge=0)
    hours_per_week: Optional[int] = None
    total_hours: Optional[int] = None
    milestones: List[Milestone] = Field(default_factory=list)
    success_tips: List[str] = Field(default_factory=list)
    recommendations: Optional[str] = None


class ReasoningStep(BaseModel):
    """Agent reasoning step"""
    step_number: int
    tool: str
    tool_input: Dict[str, Any]
    thought: str
    observation: str


class ResumeAnalysisRequest(BaseModel):
    """Request to analyze resume"""
    target_role: str = Field(
        default="Software Engineer",
        description="Target role for skill gap analysis"
    )
    force_refresh: bool = Field(
        default=False,
        description="Force new analysis (skip cache)"
    )


class ResumeAnalysisResponse(BaseModel):
    """Response with resume analysis"""
    analysis_id: int
    resume_id: int
    analysis_data: Dict[str, Any]
    agent_reasoning: Optional[List[Dict[str, Any]]] = None
    execution_time_ms: int
    status: str
    analyzed_at: str
    from_cache: bool
    cache_age_days: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "analysis_id": 1,
                "resume_id": 42,
                "analysis_data": {
                    "skill_inventory": {
                        "technical_skills": ["Python", "JavaScript", "SQL"],
                        "soft_skills": ["Leadership", "Communication"],
                        "tools": ["Git", "Docker"],
                        "languages": ["English", "Spanish"]
                    },
                    "experience_timeline": {
                        "total_years": 5.5,
                        "seniority_level": "Mid",
                        "companies": ["Tech Corp", "Startup Inc"],
                        "roles": ["Software Engineer", "Senior Developer"]
                    },
                    "skill_gaps": {
                        "target_role": "Software Engineer",
                        "required_missing": ["Kubernetes"],
                        "preferred_missing": ["AWS", "React"],
                        "match_percentage": 80.0
                    },
                    "improvement_roadmap": {
                        "timeline_weeks": 12,
                        "milestones": []
                    }
                },
                "agent_reasoning": [
                    {
                        "step_number": 1,
                        "tool": "resume_parser",
                        "tool_input": {"resume_id": "42"},
                        "thought": "I need to parse the resume first",
                        "observation": "Resume data retrieved"
                    }
                ],
                "execution_time_ms": 15000,
                "status": "success",
                "analyzed_at": "2026-02-15T10:30:00",
                "from_cache": False,
                "cache_age_days": 0
            }
        }


class AnalysisHistoryResponse(BaseModel):
    """Response with analysis history"""
    analyses: List[ResumeAnalysisResponse]
    total: int
