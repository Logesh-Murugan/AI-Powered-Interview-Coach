"""
Question Routes

API endpoints for question generation and management.

Requirements: 12.1-12.15
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import time
import logging

from app.database import get_db
from app.schemas.question import (
    QuestionGenerateRequest,
    QuestionGenerateResponse,
    QuestionResponse
)
from app.services.question_service import QuestionService
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/v1/questions", tags=["questions"])
logger = logging.getLogger(__name__)


@router.post("/generate", response_model=QuestionGenerateResponse)
async def generate_questions(
    request: QuestionGenerateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate interview questions based on role and difficulty.
    
    This endpoint uses intelligent caching:
    1. Checks Redis cache first (< 100ms)
    2. Checks database second (< 500ms)
    3. Calls AI only if needed (< 3000ms)
    
    Requirements: 12.1-12.15
    
    Args:
        request: Question generation parameters
        db: Database session
        current_user: Authenticated user
        
    Returns:
        QuestionGenerateResponse with generated questions and metadata
        
    Raises:
        HTTPException: If generation fails
    """
    start_time = time.time()
    
    try:
        user_id = current_user.get("user_id")
        logger.info(
            f"User {user_id} requesting {request.question_count} questions "
            f"for role={request.role}, difficulty={request.difficulty}"
        )
        
        # Initialize service
        service = QuestionService(db)
        
        # Check if response will be from cache (for cache_hit flag)
        cache_key = service._construct_cache_key(
            request.role,
            request.difficulty,
            request.question_count,
            request.categories
        )
        cached_data = service._get_from_cache(cache_key)
        cache_hit = cached_data is not None
        
        # Generate questions
        questions_data = service.generate(
            role=request.role,
            difficulty=request.difficulty,
            question_count=request.question_count,
            categories=request.categories
        )
        
        # Calculate response time
        response_time_ms = (time.time() - start_time) * 1000
        
        # Convert to response models
        questions = [QuestionResponse(**q) for q in questions_data]
        
        logger.info(
            f"Generated {len(questions)} questions in {response_time_ms:.2f}ms "
            f"(cache_hit={cache_hit})"
        )
        
        return QuestionGenerateResponse(
            success=True,
            questions=questions,
            count=len(questions),
            cache_hit=cache_hit,
            response_time_ms=round(response_time_ms, 2),
            message="Questions generated successfully"
        )
        
    except ValueError as e:
        # Validation errors
        logger.warning(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    except Exception as e:
        # Unexpected errors
        logger.error(f"Question generation failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate questions. Please try again later."
        )


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Health check endpoint for question service.
    
    Returns:
        Simple health status
    """
    return {
        "status": "healthy",
        "service": "questions",
        "timestamp": time.time()
    }
