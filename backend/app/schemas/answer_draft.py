"""
Answer Draft Schemas

Pydantic schemas for answer draft auto-save functionality.

Requirements: 17.1-17.7
"""
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class AnswerDraftSave(BaseModel):
    """Schema for saving answer draft"""
    draft_text: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Draft answer text (1-5000 characters)"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "draft_text": "I worked on a microservices migration..."
            }
        }
    )


class AnswerDraftResponse(BaseModel):
    """Schema for answer draft response"""
    draft_id: int = Field(..., description="Unique draft identifier")
    session_id: int = Field(..., description="Interview session ID")
    question_id: int = Field(..., description="Question ID")
    draft_text: str = Field(..., description="Draft answer text")
    last_saved_at: datetime = Field(..., description="Last save timestamp")
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "draft_id": 1,
                "session_id": 1,
                "question_id": 1,
                "draft_text": "I worked on a microservices migration...",
                "last_saved_at": "2026-02-12T10:30:00Z"
            }
        }
    )


class AnswerDraftRetrieve(BaseModel):
    """Schema for retrieving answer draft"""
    draft_text: str = Field(..., description="Draft answer text")
    last_saved_at: datetime = Field(..., description="Last save timestamp")
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "draft_text": "I worked on a microservices migration...",
                "last_saved_at": "2026-02-12T10:30:00Z"
            }
        }
    )
