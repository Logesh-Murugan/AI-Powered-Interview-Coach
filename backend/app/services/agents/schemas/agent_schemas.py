"""
Pydantic schemas for AI agent outputs.
Ensures structured, validated responses from LLMs.
"""
from typing import List, Optional
from pydantic import BaseModel, Field, validator


class CompanyOverview(BaseModel):
    """Company culture and interview information."""
    culture: str = Field(..., description="Company culture description")
    values: str = Field(..., description="Company core values")
    interview_style: str = Field(..., description="Interview format and style")
    hiring_process: str = Field(..., description="Hiring process overview")


class StarExample(BaseModel):
    """STAR method example from candidate's experience."""
    situation: str = Field(..., description="The situation/context")
    task: str = Field(..., description="The task/challenge")
    action: str = Field(..., description="The action taken")
    result: str = Field(..., description="The result/outcome")


class CoachingResponse(BaseModel):
    """Complete company coaching response schema - simplified and robust."""
    company_overview: str = Field(..., description="Company overview and culture")
    interview_process: List[str] = Field(..., min_items=3, description="Interview process steps")
    predicted_questions: List[str] = Field(..., min_items=5, description="Predicted interview questions")
    pre_interview_checklist: List[str] = Field(..., min_items=5, description="Pre-interview checklist")
    
    @validator('interview_process')
    def validate_process(cls, v):
        """Ensure minimum 3 process steps."""
        if len(v) < 3:
            default_steps = [
                "Initial phone/video screening",
                "Technical interview with team",
                "Final interview with hiring manager"
            ]
            while len(v) < 3:
                idx = len(v)
                if idx < len(default_steps):
                    v.append(default_steps[idx])
                else:
                    v.append(f"Interview step {idx + 1}")
        return v
    
    @validator('predicted_questions')
    def validate_questions(cls, v):
        """Ensure minimum 5 questions."""
        if len(v) < 5:
            default_questions = [
                "Tell me about yourself and your background.",
                "Why do you want to work at this company?",
                "Describe a challenging project you worked on.",
                "How do you handle working under pressure?",
                "What are your career goals?"
            ]
            while len(v) < 5:
                idx = len(v)
                if idx < len(default_questions):
                    v.append(default_questions[idx])
                else:
                    v.append(f"Interview question {idx + 1}")
        return v
    
    @validator('pre_interview_checklist')
    def validate_checklist(cls, v):
        """Ensure minimum 5 checklist items."""
        if len(v) < 5:
            default_items = [
                "Research company background and recent news",
                "Review job description and requirements",
                "Prepare STAR method examples",
                "Practice technical concepts",
                "Prepare questions to ask interviewer"
            ]
            while len(v) < 5:
                idx = len(v)
                if idx < len(default_items):
                    v.append(default_items[idx])
                else:
                    v.append(f"Preparation step {idx + 1}")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "company_overview": "Google is a technology company focused on innovation and user-centric products with a collaborative culture.",
                "interview_process": [
                    "Initial phone screening with recruiter",
                    "Technical interview with engineering team",
                    "Final interview with hiring manager"
                ],
                "predicted_questions": [
                    "Tell me about a challenging project you worked on.",
                    "How would you approach system design for our products?",
                    "Why do you want to work at Google?",
                    "Describe a time you had to learn a new technology quickly.",
                    "What questions do you have about our team and culture?"
                ],
                "pre_interview_checklist": [
                    "Research Google's recent products and initiatives",
                    "Prepare 3-5 STAR method examples",
                    "Review system design fundamentals",
                    "Practice coding problems on whiteboard",
                    "Prepare thoughtful questions about the role"
                ]
            }
        }


class StudyPlanTask(BaseModel):
    """Daily study task."""
    skill: str = Field(..., description="Skill being practiced")
    duration_minutes: int = Field(..., gt=0, description="Task duration in minutes")
    completed: bool = Field(default=False)


class DailyTasks(BaseModel):
    """Tasks for a specific day."""
    day: int = Field(..., gt=0)
    date: str
    tasks: List[StudyPlanTask]


class WeeklyMilestone(BaseModel):
    """Weekly learning milestone."""
    week: int = Field(..., gt=0)
    milestone: str
    skills_covered: List[str]
    assessment: str
    completed: bool = Field(default=False)


class TimeEstimates(BaseModel):
    """Study time estimates."""
    total_hours: int = Field(..., gt=0)
    hours_per_week: int = Field(..., gt=0)
    completion_date: str


class StudyPlanResponse(BaseModel):
    """Complete study plan response schema."""
    daily_tasks: List[DailyTasks]
    weekly_milestones: List[WeeklyMilestone]
    resource_links: dict = Field(default_factory=dict)
    time_estimates: TimeEstimates


class ResumeAnalysisResponse(BaseModel):
    """Resume analysis response schema."""
    technical_skills: List[str]
    soft_skills: List[str]
    experience_years: float = Field(..., ge=0)
    education_level: str
    skill_gaps: List[str]
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
