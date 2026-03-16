"""
Study Plan API Routes

Endpoints for generating and managing personalized study plans.

Requirements: 28.1-28.11
"""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.study_plan import StudyPlanCreateRequest, StudyPlanProgressUpdate, StudyPlanResponse
from app.services.agents.study_plan_agent_service import StudyPlanAgentService


router = APIRouter()


def _primitive_or_default(value: Any, expected_type: type, default: Any) -> Any:
    return value if isinstance(value, expected_type) else default


def _get_attr(study_plan: Any, name: str, default: Any = None) -> Any:
    value = getattr(study_plan, name, default)
    return default if callable(value) else value


def _derive_total_tasks(plan_data: dict[str, Any]) -> int:
    daily_tasks = plan_data.get('daily_tasks', [])
    return sum(len(day.get('tasks', [])) for day in daily_tasks if isinstance(day, dict))


def _derive_completed_tasks(plan_data: dict[str, Any]) -> int:
    daily_tasks = plan_data.get('daily_tasks', [])
    completed = 0
    for day in daily_tasks:
        if not isinstance(day, dict):
            continue
        for task in day.get('tasks', []):
            if isinstance(task, dict) and task.get('completed', False):
                completed += 1
    return completed


def _derive_total_milestones(plan_data: dict[str, Any]) -> int:
    milestones = plan_data.get('weekly_milestones', [])
    return len(milestones) if isinstance(milestones, list) else 0


def _derive_completed_milestones(plan_data: dict[str, Any]) -> int:
    milestones = plan_data.get('weekly_milestones', [])
    if not isinstance(milestones, list):
        return 0
    return sum(1 for milestone in milestones if isinstance(milestone, dict) and milestone.get('completed', False))


def _to_response(study_plan: Any) -> StudyPlanResponse:
    plan_data = _primitive_or_default(_get_attr(study_plan, 'plan_data', {}), dict, {})
    total_tasks = _primitive_or_default(_get_attr(study_plan, 'total_tasks'), int, _derive_total_tasks(plan_data))
    completed_tasks = _primitive_or_default(_get_attr(study_plan, 'completed_tasks'), int, _derive_completed_tasks(plan_data))
    total_milestones = _primitive_or_default(_get_attr(study_plan, 'total_milestones'), int, _derive_total_milestones(plan_data))
    completed_milestones = _primitive_or_default(_get_attr(study_plan, 'completed_milestones'), int, _derive_completed_milestones(plan_data))

    return StudyPlanResponse(
        id=_primitive_or_default(_get_attr(study_plan, 'id'), int, 0),
        user_id=_primitive_or_default(_get_attr(study_plan, 'user_id'), int, 0),
        target_role=_primitive_or_default(_get_attr(study_plan, 'target_role'), str, ''),
        duration_days=_primitive_or_default(_get_attr(study_plan, 'duration_days'), int, 0),
        available_hours_per_week=_primitive_or_default(_get_attr(study_plan, 'available_hours_per_week'), int, 0),
        plan_data=plan_data,
        execution_time_ms=_primitive_or_default(_get_attr(study_plan, 'execution_time_ms'), int, 0),
        status=_primitive_or_default(_get_attr(study_plan, 'status'), str, 'active'),
        progress_percentage=_primitive_or_default(_get_attr(study_plan, 'progress_percentage'), (int, float), 0.0),
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        total_milestones=total_milestones,
        completed_milestones=completed_milestones,
        created_at=_get_attr(study_plan, 'created_at'),
        updated_at=_get_attr(study_plan, 'updated_at'),
    )


@router.post('', response_model=StudyPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_study_plan(
    request: StudyPlanCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Creating study plan for user {current_user.id}: {request.target_role}, {request.duration_days} days, {request.available_hours_per_week} hours/week")
        
        service = StudyPlanAgentService(db)
        study_plan = service.generate_study_plan(
            user_id=current_user.id,
            target_role=request.target_role,
            duration_days=request.duration_days,
            available_hours_per_week=request.available_hours_per_week,
        )
        
        logger.info(f"Study plan created successfully for user {current_user.id}")
        return _to_response(study_plan)
        
    except ValueError as e:
        logger.error(f"Study plan validation error for user {current_user.id}: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except TimeoutError as e:
        logger.error(f"Study plan timeout for user {current_user.id}: {e}")
        raise HTTPException(status_code=status.HTTP_408_REQUEST_TIMEOUT, detail=f'Study plan generation timed out: {str(e)}')
    except Exception as e:
        logger.error(f"Study plan creation failed for user {current_user.id}: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f'Failed to generate study plan: {str(e)}')


@router.get('/active', response_model=StudyPlanResponse)
@router.get('/active/current', response_model=StudyPlanResponse)
async def get_active_study_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = StudyPlanAgentService(db)
    study_plan = service.get_active_plan(current_user.id)

    if not study_plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='No active study plan found')

    return _to_response(study_plan)


@router.get('/{plan_id}', response_model=StudyPlanResponse)
async def get_study_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        service = StudyPlanAgentService(db)
        study_plan = service.get_study_plan(plan_id, current_user.id)
        if not study_plan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f'Study plan {plan_id} not found')
        return _to_response(study_plan)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch('/{plan_id}/progress', response_model=StudyPlanResponse)
async def update_study_plan_progress(
    plan_id: int,
    progress_update: StudyPlanProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        service = StudyPlanAgentService(db)
        study_plan = service.update_progress(
            plan_id=plan_id,
            user_id=current_user.id,
            task_updates=progress_update.task_updates,
        )
        return _to_response(study_plan)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f'Failed to update progress: {str(e)}')


@router.post('/{plan_id}/abandon', response_model=StudyPlanResponse)
async def abandon_study_plan_post(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        service = StudyPlanAgentService(db)
        study_plan = service.abandon_plan(plan_id, current_user.id)
        return _to_response(study_plan)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f'Failed to abandon plan: {str(e)}')


@router.delete('/{plan_id}', status_code=status.HTTP_204_NO_CONTENT)
async def abandon_study_plan_delete(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        service = StudyPlanAgentService(db)
        service.abandon_plan(plan_id, current_user.id)
        return None
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f'Failed to abandon plan: {str(e)}')
