"""
Company Coaching API Routes

API endpoints for company-specific interview coaching.

Requirements: 29.1-29.11
"""
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

router = APIRouter(prefix="/api/v1/company-coaching", tags=["company-coaching"])


@router.post("", response_model=CoachingSessionResponse, status_code=status.HTTP_201_CREATED)
def generate_coaching_session(
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
    """
    try:
        service = CompanyCoachingAgentService(db)
        coaching_session = service.generate_coaching_session(
            user_id=current_user.id,
            company_name=request.company_name,
            target_role=request.target_role
        )
        
        return CoachingSessionResponse(
            id=coaching_session.id,
            user_id=coaching_session.user_id,
            company_name=coaching_session.company_name,
            target_role=coaching_session.target_role,
            company_overview=coaching_session.company_overview,
            predicted_questions=coaching_session.predicted_questions,
            star_examples=coaching_session.star_examples,
            confidence_tips=coaching_session.confidence_tips,
            pre_interview_checklist=coaching_session.pre_interview_checklist,
            execution_time_ms=coaching_session.execution_time_ms,
            created_at=coaching_session.created_at
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
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
    
    return CoachingSessionResponse(
        id=coaching_session.id,
        user_id=coaching_session.user_id,
        company_name=coaching_session.company_name,
        target_role=coaching_session.target_role,
        company_overview=coaching_session.company_overview,
        predicted_questions=coaching_session.predicted_questions,
        star_examples=coaching_session.star_examples,
        confidence_tips=coaching_session.confidence_tips,
        pre_interview_checklist=coaching_session.pre_interview_checklist,
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
            question_count=len(session.predicted_questions),
            star_example_count=len(session.star_examples)
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
            question_count=len(session.predicted_questions),
            star_example_count=len(session.star_examples)
        )
        for session in sessions
    ]
    
    return CoachingSessionList(
        sessions=session_summaries,
        total=len(session_summaries),
        limit=len(session_summaries)
    )
