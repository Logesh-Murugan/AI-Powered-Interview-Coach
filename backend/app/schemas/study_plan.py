"""
Study Plan Pydantic Schemas

Request and response schemas for study plan endpoints.

Requirements: 28.1-28.11
"""
from datetime import datetime
from typing import Any, Dict, List

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StudyPlanCreateRequest(BaseModel):
    """Request schema for creating a study plan."""
    target_role: str = Field(..., min_length=1, max_length=100, description='Target job role')
    duration_days: int = Field(..., ge=30, le=180, description='Plan duration in days')
    available_hours_per_week: int = Field(..., ge=5, le=40, description='Hours available per week')

    @field_validator('duration_days')
    @classmethod
    def validate_duration(cls, value: int) -> int:
        if value < 30 or value > 180:
            raise ValueError('duration_days must be between 30 and 180')
        return value

    model_config = ConfigDict(
        json_schema_extra={
            'example': {
                'target_role': 'Software Engineer',
                'duration_days': 90,
                'available_hours_per_week': 15,
            }
        }
    )


class DailyTask(BaseModel):
    skill: str
    activity: str
    duration_minutes: int
    resources: List[str]
    completed: bool = False


class DayTasks(BaseModel):
    day: int
    date: str
    tasks: List[DailyTask]


class WeeklyMilestone(BaseModel):
    week: int
    milestone: str
    skills_covered: List[str]
    assessment: str
    completed: bool = False


class TimeEstimates(BaseModel):
    total_hours: int
    hours_per_week: int
    completion_date: str


class StudyPlanData(BaseModel):
    daily_tasks: List[DayTasks]
    weekly_milestones: List[WeeklyMilestone]
    resource_links: Dict[str, List[str]]
    time_estimates: TimeEstimates


class StudyPlanResponse(BaseModel):
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

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            'example': {
                'id': 1,
                'user_id': 123,
                'target_role': 'Software Engineer',
                'duration_days': 90,
                'available_hours_per_week': 15,
                'plan_data': {
                    'daily_tasks': [],
                    'weekly_milestones': [],
                    'resource_links': {},
                    'time_estimates': {},
                },
                'execution_time_ms': 15000,
                'status': 'active',
                'progress_percentage': 25.5,
                'total_tasks': 90,
                'completed_tasks': 23,
                'total_milestones': 12,
                'completed_milestones': 3,
                'created_at': '2026-02-15T10:00:00',
                'updated_at': '2026-02-15T10:00:00',
            }
        }
    )


class StudyPlanProgressUpdate(BaseModel):
    task_updates: Dict[str, bool] = Field(..., description='Dictionary of task completions')

    model_config = ConfigDict(
        json_schema_extra={
            'example': {
                'task_updates': {
                    '1_0': True,
                    '1_1': True,
                    '2_0': False,
                    'milestone_1': True,
                }
            }
        }
    )


class StudyPlanListResponse(BaseModel):
    plans: List[StudyPlanResponse]
    total: int

    model_config = ConfigDict(
        json_schema_extra={
            'example': {
                'plans': [],
                'total': 5,
            }
        }
    )
