"""
Resume Analysis API endpoints

Provides endpoints for:
- Triggering resume analysis with LangChain agent
- Retrieving analysis results
- Viewing analysis history

Requirements: 27.1-27.13
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.resume_analysis import (
    ResumeAnalysisRequest,
    ResumeAnalysisResponse,
    AnalysisHistoryResponse
)
from app.services.agents.resume_agent_service import ResumeAgentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/resume-analysis", tags=["Resume Analysis"])


@router.post(
    "/{resume_id}",
    response_model=ResumeAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Resume with AI Agent",
    description="""
    Analyze resume using LangChain AI agent.
    
    The agent provides:
    - Skill inventory (technical, soft skills, tools, languages)
    - Experience timeline (career progression, seniority)
    - Skill gaps (comparison with target role)
    - Improvement roadmap (learning plan with milestones)
    
    Results are cached for 30 days. Use force_refresh=true to bypass cache.
    
    Requirements: 27.1-27.13
    """
)
async def analyze_resume(
    resume_id: int,
    request: ResumeAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze resume with AI agent.
    
    Args:
        resume_id: Resume ID to analyze
        request: Analysis request parameters
        current_user: Authenticated user
        db: Database session
        
    Returns:
        ResumeAnalysisResponse with analysis results
        
    Raises:
        HTTPException: If resume not found or not ready
    """
    try:
        service = ResumeAgentService(db)
        
        result = service.analyze_resume(
            resume_id=resume_id,
            user_id=current_user.id,
            target_role=request.target_role,
            force_refresh=request.force_refresh
        )
        
        logger.info(
            f"Resume {resume_id} analyzed for user {current_user.id} "
            f"(status: {result['status']}, from_cache: {result['from_cache']})"
        )
        
        return result
        
    except ValueError as e:
        logger.warning(f"Resume analysis validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Resume analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze resume"
        )


@router.get(
    "/{resume_id}",
    response_model=ResumeAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Latest Resume Analysis",
    description="""
    Get the most recent analysis for a resume.
    
    Returns cached analysis if available (< 30 days old).
    """
)
async def get_resume_analysis(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get latest resume analysis.
    
    Args:
        resume_id: Resume ID
        current_user: Authenticated user
        db: Database session
        
    Returns:
        ResumeAnalysisResponse with latest analysis
        
    Raises:
        HTTPException: If no analysis found
    """
    try:
        service = ResumeAgentService(db)
        
        # Get cached analysis
        cached = service._get_cached_analysis(resume_id)
        
        if not cached:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No analysis found for resume {resume_id}. "
                       f"Please trigger analysis first."
            )
        
        # Verify ownership
        if cached.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        result = service._format_analysis_response(cached, from_cache=True)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get resume analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve analysis"
        )


@router.get(
    "/{resume_id}/history",
    response_model=AnalysisHistoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Resume Analysis History",
    description="""
    Get analysis history for a resume.
    
    Returns up to 10 most recent analyses.
    """
)
async def get_analysis_history(
    resume_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get analysis history.
    
    Args:
        resume_id: Resume ID
        limit: Maximum number of records (default: 10)
        current_user: Authenticated user
        db: Database session
        
    Returns:
        AnalysisHistoryResponse with history
        
    Raises:
        HTTPException: If resume not found
    """
    try:
        service = ResumeAgentService(db)
        
        analyses = service.get_analysis_history(
            resume_id=resume_id,
            user_id=current_user.id,
            limit=min(limit, 50)  # Cap at 50
        )
        
        return {
            'analyses': analyses,
            'total': len(analyses)
        }
        
    except ValueError as e:
        logger.warning(f"Get analysis history validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Get analysis history error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve analysis history"
        )
