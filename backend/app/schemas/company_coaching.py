"""
Company Coaching Schemas

Pydantic schemas for company coaching API endpoints.

Requirements: 29.8
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class CompanyOverview(BaseModel):
    """Company overview information"""
    culture: str
    values: List[str]
    interview_style: str
    hiring_process: str


class PredictedQuestion(BaseModel):
    """Predicted interview question"""
    question: str
    category: str
    difficulty: Optional[str] = None
    why_asked: Optional[str] = None


class STARExample(BaseModel):
    """STAR method example"""
    situation: str
    task: str
    action: str
    result: str
    relevant_to: str


class CoachingSessionCreate(BaseModel):
    """Request to create coaching session"""
    company_name: str = Field(..., min_length=1, max_length=200, description="Company name")
    target_role: Optional[str] = Field(None, max_length=200, description="Target role (optional)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "company_name": "Google",
                "target_role": "Software Engineer"
            }
        }


class CoachingSessionResponse(BaseModel):
    """Coaching session response"""
    id: int
    user_id: int
    company_name: str
    target_role: Optional[str]
    company_overview: Dict[str, Any]
    predicted_questions: List[Dict[str, Any]]
    star_examples: List[Dict[str, Any]]
    confidence_tips: List[str]
    pre_interview_checklist: List[str]
    execution_time_ms: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class CoachingSessionSummary(BaseModel):
    """Summary of coaching session"""
    id: int
    company_name: str
    target_role: Optional[str]
    created_at: datetime
    question_count: int
    star_example_count: int
    
    class Config:
        from_attributes = True


class CoachingSessionList(BaseModel):
    """List of coaching sessions"""
    sessions: List[CoachingSessionSummary]
    total: int
    limit: int
