"""
Company Coaching API Routes

API endpoints for company-specific interview coaching.

Requirements: 29.1-29.11
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.agents.company_coaching_agent_service import CompanyCoachingAgentService
from app.schemas.company_coaching import (
    CoachingSessionCreate,
    CoachingSessionResponse,
    CoachingSessionSummary,
    CoachingSessionList
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/company-coaching", tags=["company-coaching"])


@router.post("", response_model=CoachingSessionResponse, status_code=status.HTTP_201_CREATED)
async def generate_coaching_session(
    request: CoachingSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate company-specific interview coaching session.
    
    Requirements: 29.1-29.11
    
    - Requires completed resume analysis
    - Free tier: 3 sessions per month
    - Execution timeout: 20 seconds
    - Uses structured LLM output with Pydantic validation
    """
    try:
        service = CompanyCoachingAgentService(db)
        coaching_session = await service.generate_coaching_session(
            user_id=current_user.id,
            company_name=request.company_name,
            target_role=request.target_role
        )
        
        # Extract data from coaching_data JSON field
        coaching_data = coaching_session.coaching_data or {}
        
        return CoachingSessionResponse(
            id=coaching_session.id,
            user_id=coaching_session.user_id,
            company_name=coaching_session.company_name,
            target_role=coaching_session.target_role,
            company_overview=coaching_data.get('company_overview', ''),
            interview_process=coaching_data.get('interview_process', []),
            predicted_questions=coaching_data.get('predicted_questions', []),
            pre_interview_checklist=coaching_data.get('pre_interview_checklist', []),
            execution_time_ms=coaching_session.execution_time_ms,
            created_at=coaching_session.created_at
        )
    except ValueError as e:
        # Return 400 for validation errors (invalid JSON, missing fields, etc.)
        logger.error(f"Validation error in company coaching: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Return 500 for system errors (AI generation failure, database errors, etc.)
        logger.error(f"System error in company coaching: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate coaching session: {str(e)}"
        )


@router.get("/{session_id}", response_model=CoachingSessionResponse)
def get_coaching_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get coaching session by ID"""
    service = CompanyCoachingAgentService(db)
    coaching_session = service.get_coaching_session(session_id, current_user.id)
    
    if not coaching_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Coaching session {session_id} not found"
        )
    
    # Extract data from coaching_data JSON field
    coaching_data = coaching_session.coaching_data or {}
    
    return CoachingSessionResponse(
        id=coaching_session.id,
        user_id=coaching_session.user_id,
        company_name=coaching_session.company_name,
        target_role=coaching_session.target_role,
        company_overview=coaching_data.get('company_overview', ''),
        interview_process=coaching_data.get('interview_process', []),
        predicted_questions=coaching_data.get('predicted_questions', []),
        pre_interview_checklist=coaching_data.get('pre_interview_checklist', []),
        execution_time_ms=coaching_session.execution_time_ms,
        created_at=coaching_session.created_at
    )


@router.get("", response_model=CoachingSessionList)
def get_user_coaching_sessions(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's coaching sessions"""
    service = CompanyCoachingAgentService(db)
    sessions = service.get_user_sessions(current_user.id, limit)
    
    session_summaries = [
        CoachingSessionSummary(
            id=session.id,
            company_name=session.company_name,
            target_role=session.target_role,
            created_at=session.created_at,
            question_count=len(session.coaching_data.get('predicted_questions', [])),
            star_example_count=0  # Not used in new schema
        )
        for session in sessions
    ]
    
    return CoachingSessionList(
        sessions=session_summaries,
        total=len(session_summaries),
        limit=limit
    )


@router.get("/company/{company_name}", response_model=CoachingSessionList)
def get_sessions_by_company(
    company_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's coaching sessions for a specific company"""
    service = CompanyCoachingAgentService(db)
    sessions = service.get_sessions_by_company(current_user.id, company_name)
    
    session_summaries = [
        CoachingSessionSummary(
            id=session.id,
            company_name=session.company_name,
            target_role=session.target_role,
            created_at=session.created_at,
            question_count=len(session.coaching_data.get('predicted_questions', [])),
            star_example_count=0  # Not used in new schema
        )
        for session in sessions
    ]
    
    return CoachingSessionList(
        sessions=session_summaries,
        total=len(session_summaries),
        limit=len(session_summaries)
    )
