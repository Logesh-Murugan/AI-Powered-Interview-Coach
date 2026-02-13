"""
Resume Pydantic schemas for request/response validation
"""
from typing import Optional, Dict, List, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ResumeUploadResponse(BaseModel):
    """Response schema for resume upload"""
    model_config = ConfigDict(from_attributes=True)
    
    resume_id: int = Field(..., description="Resume ID")
    filename: str = Field(..., description="Original filename")
    file_url: str = Field(..., description="Local file URL")
    file_size: int = Field(..., description="File size in bytes")
    status: str = Field(..., description="Processing status")
    message: str = Field(..., description="Success message")


class ResumeResponse(BaseModel):
    """Response schema for resume details"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    filename: str
    file_url: str
    file_size: Optional[int] = None
    extracted_text: Optional[str] = None
    skills: Optional[Dict[str, List[str]]] = None
    experience: Optional[List[Dict[str, Any]]] = None
    education: Optional[List[Dict[str, Any]]] = None
    status: str
    total_experience_months: Optional[int] = None
    seniority_level: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ResumeListResponse(BaseModel):
    """Response schema for list of resumes"""
    model_config = ConfigDict(from_attributes=True)
    
    resumes: List[ResumeResponse]
    total: int
