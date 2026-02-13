"""Pydantic schemas for user profile endpoints."""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional
from enum import Enum


class ExperienceLevel(str, Enum):
    """Experience level enum."""
    ENTRY = "Entry"
    MID = "Mid"
    SENIOR = "Senior"
    STAFF = "Staff"
    PRINCIPAL = "Principal"


# Predefined list of valid target roles
VALID_TARGET_ROLES = [
    "Software Engineer",
    "Product Manager",
    "Data Scientist",
    "Marketing Manager",
    "Finance Analyst",
    "Business Analyst",
    "UX Designer",
    "DevOps Engineer",
    "Data Engineer",
    "Machine Learning Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Mobile Developer",
    "QA Engineer",
    "Security Engineer",
    "Cloud Architect",
    "Technical Writer",
    "Sales Engineer",
    "Customer Success Manager"
]


class UserProfileResponse(BaseModel):
    """Schema for user profile response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    email: str
    name: str
    target_role: Optional[str] = None
    experience_level: Optional[str] = None
    account_status: str
    created_at: str
    updated_at: str


class UserProfileUpdateRequest(BaseModel):
    """Schema for user profile update request."""
    
    name: Optional[str] = Field(
        None,
        min_length=2,
        max_length=255,
        description="User's full name",
        examples=["John Doe"]
    )
    target_role: Optional[str] = Field(
        None,
        max_length=255,
        description="Target job role for interview preparation",
        examples=["Software Engineer"]
    )
    experience_level: Optional[ExperienceLevel] = Field(
        None,
        description="Experience level (Entry, Mid, Senior, Staff, Principal)",
        examples=["Mid"]
    )
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate name is not empty or whitespace only."""
        if v is not None:
            if not v or not v.strip():
                raise ValueError("Name cannot be empty or whitespace only")
            return v.strip()
        return v
    
    @field_validator('target_role')
    @classmethod
    def validate_target_role(cls, v: Optional[str]) -> Optional[str]:
        """Validate target_role against predefined list."""
        if v is not None:
            if v not in VALID_TARGET_ROLES:
                raise ValueError(
                    f"Invalid target_role. Must be one of: {', '.join(VALID_TARGET_ROLES)}"
                )
        return v
