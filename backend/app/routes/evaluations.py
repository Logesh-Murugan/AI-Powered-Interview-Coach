"""
Evaluation Routes

API endpoints for answer evaluation.

Requirements: 18.1-18.14
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.evaluation import EvaluationResponse, EvaluationRequest
from app.services.evaluation_service import EvaluationService
from app.models.answer import Answer

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/evaluate",
    response_model=EvaluationResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate Answer",
    description="Evaluate an answer using AI with multi-criteria scoring"
)
async def evaluate_answer(
    request: EvaluationRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Evaluate an answer using AI.
    
    Requirements: 18.1-18.14
    
    - **answer_id**: ID of the answer to evaluate
    
    Returns:
    - Evaluation scores (content_quality, clarity, confidence, technical_accuracy, overall_score)
    - Detailed feedback (strengths, improvements, suggestions, example_answer)
    
    Response time target: < 5000ms at 95th percentile
    """
    try:
        user_id = current_user['user_id']
        
        logger.info(f"Evaluating answer {request.answer_id} for user {user_id}")
        
        # Verify answer belongs to user
        answer = db.query(Answer).filter(Answer.id == request.answer_id).first()
        if not answer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Answer not found"
            )
        
        if answer.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Check if already evaluated
        if answer.evaluation is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Answer already evaluated"
            )
        
        # Evaluate answer
        service = EvaluationService(db)
        result = service.evaluate_answer(request.answer_id)
        
        logger.info(f"Answer {request.answer_id} evaluated successfully")
        
        return EvaluationResponse(**result)
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Validation error evaluating answer: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error evaluating answer: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to evaluate answer"
        )


@router.get(
    "/{answer_id}",
    response_model=EvaluationResponse,
    summary="Get Evaluation",
    description="Retrieve evaluation for an answer"
)
async def get_evaluation(
    answer_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get evaluation for an answer.
    
    - **answer_id**: ID of the answer
    
    Returns:
    - Evaluation scores and feedback
    """
    try:
        user_id = current_user['user_id']
        
        # Verify answer belongs to user
        answer = db.query(Answer).filter(Answer.id == answer_id).first()
        if not answer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Answer not found"
            )
        
        if answer.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Check if evaluated
        if answer.evaluation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Answer not yet evaluated"
            )
        
        # Get evaluation from relationship
        evaluation = answer.evaluation
        
        if not evaluation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evaluation not found"
            )
        
        # Format response
        result = {
            'evaluation_id': evaluation.id,
            'answer_id': evaluation.answer_id,
            'scores': {
                'content_quality': evaluation.content_quality,
                'clarity': evaluation.clarity,
                'confidence': evaluation.confidence,
                'technical_accuracy': evaluation.technical_accuracy,
                'overall_score': evaluation.overall_score
            },
            'feedback': {
                'strengths': evaluation.strengths,
                'improvements': evaluation.improvements,
                'suggestions': evaluation.suggestions,
                'example_answer': evaluation.example_answer
            },
            'evaluated_at': evaluation.evaluated_at.isoformat() if evaluation.evaluated_at else None
        }
        
        return EvaluationResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving evaluation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve evaluation"
        )
