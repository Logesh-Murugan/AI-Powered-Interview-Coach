"""
Interview Session Schemas

Pydantic schemas for interview session request/response validation.

Requirements: 14.1-14.10
"""
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime


class InterviewSessionCreate(BaseModel):
    """Schema for creating an interview session"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "role": "Software Engineer",
                "difficulty": "Medium",
                "question_count": 5,
                "categories": ["Technical", "Behavioral"]
            }
        }
    )
    
    role: str = Field(..., min_length=1, max_length=100, description="Target job role")
    difficulty: str = Field(..., description="Question difficulty level")
    question_count: int = Field(..., ge=1, le=20, description="Number of questions (1-20)")
    categories: Optional[List[str]] = Field(None, description="Optional list of question categories")
    
    @field_validator('difficulty')
    @classmethod
    def validate_difficulty(cls, v):
        """Validate difficulty is one of the allowed values"""
        valid_difficulties = ['Easy', 'Medium', 'Hard', 'Expert']
        if v not in valid_difficulties:
            raise ValueError(f"Difficulty must be one of: {', '.join(valid_difficulties)}")
        return v
    
    @field_validator('categories')
    @classmethod
    def validate_categories(cls, v):
        """Validate categories are valid"""
        if v is not None:
            valid_categories = {'Technical', 'Behavioral', 'Domain_Specific', 'System_Design', 'Coding'}
            invalid = set(v) - valid_categories
            if invalid:
                raise ValueError(f"Invalid categories: {', '.join(invalid)}")
        return v


class QuestionResponse(BaseModel):
    """Schema for question in session response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    question_text: str
    category: str
    difficulty: str
    time_limit_seconds: int
    question_number: int


class InterviewSessionResponse(BaseModel):
    """Schema for interview session response"""
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "session_id": 1,
                "role": "Software Engineer",
                "difficulty": "Medium",
                "status": "in_progress",
                "question_count": 5,
                "categories": ["Technical", "Behavioral"],
                "start_time": "2026-02-12T20:00:00",
                "first_question": {
                    "id": 1,
                    "question_text": "Describe your experience with microservices architecture.",
                    "category": "Technical",
                    "difficulty": "Medium",
                    "time_limit_seconds": 300,
                    "question_number": 1
                }
            }
        }
    )
    
    session_id: int
    role: str
    difficulty: str
    status: str
    question_count: int
    categories: Optional[List[str]]
    start_time: datetime
    first_question: QuestionResponse


class InterviewSessionDetail(BaseModel):
    """Schema for detailed interview session info"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    role: str
    difficulty: str
    status: str
    question_count: int
    categories: Optional[List[str]]
    start_time: datetime
    end_time: Optional[datetime]
    created_at: datetime
