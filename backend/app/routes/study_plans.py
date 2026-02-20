"""
Study Plan API Routes

Endpoints for generating and managing personalized study plans.

Requirements: 28.1-28.11
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.study_plan import (
    StudyPlanCreateRequest,
    StudyPlanResponse,
    StudyPlanProgressUpdate,
    StudyPlanListResponse
)
from app.services.agents.study_plan_agent_service import StudyPlanAgentService


router = APIRouter()


@router.post("", response_model=StudyPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_study_plan(
    request: StudyPlanCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a new personalized study plan.
    
    This endpoint:
    1. Validates user has resume analysis (Req 28.1)
    2. Retrieves skill data (Req 28.2)
    3. Initializes agent with 5 tools (Req 28.3)
    4. Executes agent with 20s timeout (Req 28.10)
    5. Stores plan in database (Req 28.8)
    
    Requirements: 28.1-28.11
    """
    try:
        service = StudyPlanAgentService(db)
        
        study_plan = service.generate_study_plan(
            user_id=current_user.id,
            target_role=request.target_role,
            duration_days=request.duration_days,
            available_hours_per_week=request.available_hours_per_week
        )
        
        # Convert to response model
        response = StudyPlanResponse(
            id=study_plan.id,
            user_id=study_plan.user_id,
            target_role=study_plan.target_role,
            duration_days=study_plan.duration_days,
            available_hours_per_week=study_plan.available_hours_per_week,
            plan_data=study_plan.plan_data,
            execution_time_ms=study_plan.execution_time_ms,
            status=study_plan.status,
            progress_percentage=study_plan.progress_percentage,
            total_tasks=study_plan.total_tasks,
            completed_tasks=study_plan.completed_tasks,
            total_milestones=study_plan.total_milestones,
            completed_milestones=study_plan.completed_milestones,
            created_at=study_plan.created_at,
            updated_at=study_plan.updated_at
        )
        
        return response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except TimeoutError as e:
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail=f"Study plan generation timed out: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate study plan: {str(e)}"
        )


@router.get("/{plan_id}", response_model=StudyPlanResponse)
async def get_study_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific study plan by ID.
    
    Requirements: 28.8
    """
    service = StudyPlanAgentService(db)
    study_plan = service.get_study_plan(plan_id, current_user.id)
    
    if not study_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study plan {plan_id} not found"
        )
    
    response = StudyPlanResponse(
        id=study_plan.id,
        user_id=study_plan.user_id,
        target_role=study_plan.target_role,
        duration_days=study_plan.duration_days,
        available_hours_per_week=study_plan.available_hours_per_week,
        plan_data=study_plan.plan_data,
        execution_time_ms=study_plan.execution_time_ms,
        status=study_plan.status,
        progress_percentage=study_plan.progress_percentage,
        total_tasks=study_plan.total_tasks,
        completed_tasks=study_plan.completed_tasks,
        total_milestones=study_plan.total_milestones,
        completed_milestones=study_plan.completed_milestones,
        created_at=study_plan.created_at,
        updated_at=study_plan.updated_at
    )
    
    return response


@router.get("/active/current", response_model=StudyPlanResponse)
async def get_active_study_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the user's currently active study plan.
    
    Requirements: 28.8
    """
    service = StudyPlanAgentService(db)
    study_plan = service.get_active_plan(current_user.id)
    
    if not study_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active study plan found"
        )
    
    response = StudyPlanResponse(
        id=study_plan.id,
        user_id=study_plan.user_id,
        target_role=study_plan.target_role,
        duration_days=study_plan.duration_days,
        available_hours_per_week=study_plan.available_hours_per_week,
        plan_data=study_plan.plan_data,
        execution_time_ms=study_plan.execution_time_ms,
        status=study_plan.status,
        progress_percentage=study_plan.progress_percentage,
        total_tasks=study_plan.total_tasks,
        completed_tasks=study_plan.completed_tasks,
        total_milestones=study_plan.total_milestones,
        completed_milestones=study_plan.completed_milestones,
        created_at=study_plan.created_at,
        updated_at=study_plan.updated_at
    )
    
    return response


@router.patch("/{plan_id}/progress", response_model=StudyPlanResponse)
async def update_study_plan_progress(
    plan_id: int,
    progress_update: StudyPlanProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update progress on a study plan.
    
    Mark tasks and milestones as completed.
    
    Requirements: 28.11
    """
    try:
        service = StudyPlanAgentService(db)
        
        study_plan = service.update_progress(
            plan_id=plan_id,
            user_id=current_user.id,
            task_updates=progress_update.task_updates
        )
        
        response = StudyPlanResponse(
            id=study_plan.id,
            user_id=study_plan.user_id,
            target_role=study_plan.target_role,
            duration_days=study_plan.duration_days,
            available_hours_per_week=study_plan.available_hours_per_week,
            plan_data=study_plan.plan_data,
            execution_time_ms=study_plan.execution_time_ms,
            status=study_plan.status,
            progress_percentage=study_plan.progress_percentage,
            total_tasks=study_plan.total_tasks,
            completed_tasks=study_plan.completed_tasks,
            total_milestones=study_plan.total_milestones,
            completed_milestones=study_plan.completed_milestones,
            created_at=study_plan.created_at,
            updated_at=study_plan.updated_at
        )
        
        return response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update progress: {str(e)}"
        )


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def abandon_study_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Abandon a study plan.
    
    Marks the plan as abandoned but keeps it in the database for history.
    
    Requirements: 28.8
    """
    try:
        service = StudyPlanAgentService(db)
        service.abandon_plan(plan_id, current_user.id)
        return None
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to abandon plan: {str(e)}"
        )
