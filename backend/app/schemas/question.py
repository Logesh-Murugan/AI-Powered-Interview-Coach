"""
Question Schemas

Pydantic schemas for question generation API requests and responses.

Requirements: 12.1-12.15
"""
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import List, Optional
from datetime import datetime


class QuestionGenerateRequest(BaseModel):
    """Request schema for question generation"""
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
    
    role: str = Field(..., min_length=2, max_length=100, description="Target job role")
    difficulty: str = Field(..., description="Question difficulty level")
    question_count: int = Field(..., ge=1, le=20, description="Number of questions to generate")
    categories: Optional[List[str]] = Field(None, description="Optional list of question categories")
    
    @field_validator('difficulty')
    @classmethod
    def validate_difficulty(cls, v):
        """Validate difficulty is one of allowed values"""
        valid_difficulties = {'Easy', 'Medium', 'Hard', 'Expert'}
        if v not in valid_difficulties:
            raise ValueError(f"Difficulty must be one of: {valid_difficulties}")
        return v
    
    @field_validator('categories')
    @classmethod
    def validate_categories(cls, v):
        """Validate categories are valid"""
        if v is None:
            return v
        
        valid_categories = {'Technical', 'Behavioral', 'Domain_Specific', 'System_Design', 'Coding'}
        invalid = set(v) - valid_categories
        if invalid:
            raise ValueError(f"Invalid categories: {invalid}. Must be one of: {valid_categories}")
        return v


class QuestionResponse(BaseModel):
    """Response schema for a single question"""
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "question_text": "Describe a time when you had to debug a complex production issue.",
                "category": "Behavioral",
                "difficulty": "Medium",
                "role": "Software Engineer",
                "expected_answer_points": [
                    "Clearly described the problem and its impact",
                    "Explained systematic debugging approach",
                    "Demonstrated technical problem-solving skills",
                    "Showed ownership and follow-through"
                ],
                "time_limit_seconds": 300,
                "usage_count": 0,
                "created_at": "2026-02-12T19:00:00"
            }
        }
    )
    
    id: int
    question_text: str
    category: str
    difficulty: str
    role: str
    expected_answer_points: List[str]
    time_limit_seconds: int
    usage_count: int
    created_at: Optional[str]


class QuestionGenerateResponse(BaseModel):
    """Response schema for question generation"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "questions": [
                    {
                        "id": 1,
                        "question_text": "Describe a time when you had to debug a complex production issue.",
                        "category": "Behavioral",
                        "difficulty": "Medium",
                        "role": "Software Engineer",
                        "expected_answer_points": [
                            "Clearly described the problem and its impact",
                            "Explained systematic debugging approach"
                        ],
                        "time_limit_seconds": 300,
                        "usage_count": 0,
                        "created_at": "2026-02-12T19:00:00"
                    }
                ],
                "count": 1,
                "cache_hit": False,
                "response_time_ms": 2500.5,
                "message": "Questions generated successfully"
            }
        }
    )
    
    success: bool
    questions: List[QuestionResponse]
    count: int
    cache_hit: bool
    response_time_ms: float
    message: Optional[str] = None
