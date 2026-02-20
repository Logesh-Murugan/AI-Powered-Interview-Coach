"""
Study Plan Pydantic Schemas

Request and response schemas for study plan endpoints.

Requirements: 28.1-28.11
"""
from pydantic import BaseModel, Field, validator
from typing import Dict, List, Any, Optional
from datetime import datetime


class StudyPlanCreateRequest(BaseModel):
    """Request schema for creating a study plan"""
    target_role: str = Field(..., min_length=1, max_length=100, description="Target job role")
    duration_days: int = Field(..., ge=30, le=90, description="Plan duration in days (30, 60, or 90)")
    available_hours_per_week: int = Field(..., ge=1, le=168, description="Hours available per week")
    
    @validator('duration_days')
    def validate_duration(cls, v):
        """Validate duration is 30, 60, or 90 days"""
        if v not in [30, 60, 90]:
            raise ValueError('duration_days must be 30, 60, or 90')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "target_role": "Software Engineer",
                "duration_days": 90,
                "available_hours_per_week": 15
            }
        }


class DailyTask(BaseModel):
    """Schema for a single daily task"""
    skill: str
    activity: str
    duration_minutes: int
    resources: List[str]
    completed: bool = False


class DayTasks(BaseModel):
    """Schema for tasks for a single day"""
    day: int
    date: str
    tasks: List[DailyTask]


class WeeklyMilestone(BaseModel):
    """Schema for a weekly milestone"""
    week: int
    milestone: str
    skills_covered: List[str]
    assessment: str
    completed: bool = False


class TimeEstimates(BaseModel):
    """Schema for time estimates"""
    total_hours: int
    hours_per_week: int
    completion_date: str


class StudyPlanData(BaseModel):
    """Schema for study plan data structure"""
    daily_tasks: List[DayTasks]
    weekly_milestones: List[WeeklyMilestone]
    resource_links: Dict[str, List[str]]
    time_estimates: TimeEstimates


class StudyPlanResponse(BaseModel):
    """Response schema for study plan"""
    id: int
    user_id: int
    target_role: str
    duration_days: int
    available_hours_per_week: int
    plan_data: Dict[str, Any]
    execution_time_ms: int
    status: str
    progress_percentage: float
    total_tasks: int
    completed_tasks: int
    total_milestones: int
    completed_milestones: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": 1,
                "user_id": 123,
                "target_role": "Software Engineer",
                "duration_days": 90,
                "available_hours_per_week": 15,
                "plan_data": {
                    "daily_tasks": [],
                    "weekly_milestones": [],
                    "resource_links": {},
                    "time_estimates": {}
                },
                "execution_time_ms": 15000,
                "status": "active",
                "progress_percentage": 25.5,
                "total_tasks": 90,
                "completed_tasks": 23,
                "total_milestones": 12,
                "completed_milestones": 3,
                "created_at": "2026-02-15T10:00:00",
                "updated_at": "2026-02-15T10:00:00"
            }
        }


class StudyPlanProgressUpdate(BaseModel):
    """Request schema for updating study plan progress"""
    task_updates: Dict[str, bool] = Field(..., description="Dictionary of task completions")
    
    class Config:
        schema_extra = {
            "example": {
                "task_updates": {
                    "1_0": True,
                    "1_1": True,
                    "2_0": False,
                    "milestone_1": True
                }
            }
        }


class StudyPlanListResponse(BaseModel):
    """Response schema for list of study plans"""
    plans: List[StudyPlanResponse]
    total: int
    
    class Config:
        schema_extra = {
            "example": {
                "plans": [],
                "total": 5
            }
        }
