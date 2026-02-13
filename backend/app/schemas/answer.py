"""
Answer Schemas

Pydantic schemas for answer submission and responses.

Requirements: 16.1-16.10
"""
from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime
from typing import Optional


class AnswerSubmit(BaseModel):
    """Schema for answer submission"""
    answer_text: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="User's answer text (10-5000 characters)"
    )
    
    @field_validator('answer_text')
    @classmethod
    def validate_answer_text(cls, v: str) -> str:
        """Validate answer text is not empty or whitespace only"""
        if not v or not v.strip():
            raise ValueError("Answer text cannot be empty or whitespace only")
        return v.strip()
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "answer_text": "In my previous role, I encountered a critical production bug that was affecting user authentication. I used systematic debugging by first checking logs, then reproducing the issue locally, and finally identifying a race condition in the session management code. I implemented a fix using proper locking mechanisms and deployed it with comprehensive tests."
            }
        }
    )


class AnswerResponse(BaseModel):
    """Schema for answer submission response"""
    answer_id: int = Field(..., description="Unique answer identifier")
    session_id: int = Field(..., description="Interview session ID")
    question_id: int = Field(..., description="Question ID")
    time_taken: int = Field(..., description="Time taken to answer in seconds")
    submitted_at: datetime = Field(..., description="Submission timestamp")
    status: str = Field(..., description="Answer status (submitted, evaluating, evaluated)")
    all_questions_answered: bool = Field(..., description="Whether all session questions are answered")
    session_completed: bool = Field(..., description="Whether the interview session is completed")
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "answer_id": 1,
                "session_id": 1,
                "question_id": 1,
                "time_taken": 245,
                "submitted_at": "2026-02-12T10:30:00Z",
                "status": "evaluating",
                "all_questions_answered": False,
                "session_completed": False
            }
        }
    )
