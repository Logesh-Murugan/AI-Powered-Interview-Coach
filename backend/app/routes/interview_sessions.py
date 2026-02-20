"""
Interview Session Routes

API endpoints for interview session management.

Requirements: 14.1-14.10
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.interview_session import (
    InterviewSessionCreate,
    InterviewSessionResponse,
    QuestionResponse
)
from app.schemas.answer import AnswerSubmit, AnswerResponse
from app.schemas.answer_draft import AnswerDraftSave, AnswerDraftResponse, AnswerDraftRetrieve
from app.schemas.session_summary import SessionSummaryResponse
from app.services.interview_session_service import InterviewSessionService
from app.services.session_summary_service import SessionSummaryService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "",
    response_model=list,
    summary="List Interview Sessions",
    description="Get all interview sessions for the current user"
)
async def list_interview_sessions(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all interview sessions for the current user.
    
    Returns:
    - List of interview sessions ordered by creation date (newest first)
    """
    try:
        user_id = current_user['user_id']
        
        logger.info(f"Listing interview sessions for user {user_id}")
        
        # Get all sessions for user
        from app.models.interview_session import InterviewSession
        sessions = db.query(InterviewSession).filter(
            InterviewSession.user_id == user_id
        ).order_by(InterviewSession.created_at.desc()).all()
        
        # Format response
        result = []
        for session in sessions:
            result.append({
                'id': session.id,
                'role': session.role,
                'difficulty': session.difficulty,
                'status': session.status.value if hasattr(session.status, 'value') else session.status,
                'question_count': session.question_count,
                'categories': session.categories,
                'start_time': session.start_time.isoformat() if session.start_time else None,
                'end_time': session.end_time.isoformat() if session.end_time else None,
                'created_at': session.created_at.isoformat() if session.created_at else None
            })
        
        logger.info(f"Found {len(result)} sessions for user {user_id}")
        return result
        
    except Exception as e:
        logger.error(f"Error listing interview sessions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list interview sessions"
        )


@router.post(
    "",
    response_model=InterviewSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Interview Session",
    description="Create a new interview practice session with generated questions"
)
async def create_interview_session(
    session_data: InterviewSessionCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new interview session.
    
    Requirements: 14.1-14.10
    
    - **role**: Target job role (required)
    - **difficulty**: Question difficulty level (Easy, Medium, Hard, Expert)
    - **question_count**: Number of questions (1-20)
    - **categories**: Optional list of question categories
    
    Returns:
    - Session ID
    - Session details
    - First question to display
    
    Response time target: < 500ms
    """
    try:
        # Validate user is authenticated (Req 14.1)
        user_id = current_user['user_id']
        
        logger.info(f"Creating interview session for user {user_id}: role={session_data.role}, difficulty={session_data.difficulty}")
        
        # Create session using service
        service = InterviewSessionService(db)
        result = service.create_session(
            user_id=user_id,
            role=session_data.role,
            difficulty=session_data.difficulty,
            question_count=session_data.question_count,
            categories=session_data.categories
        )
        
        # Format response
        response = InterviewSessionResponse(
            session_id=result['session_id'],
            role=result['role'],
            difficulty=result['difficulty'],
            status=result['status'],
            question_count=result['question_count'],
            categories=result['categories'],
            start_time=result['start_time'],
            first_question=QuestionResponse(**result['first_question'])
        )
        
        logger.info(f"Successfully created session {result['session_id']} for user {user_id}")
        return response
        
    except ValueError as e:
        # Validation errors (Req 14.2-14.5)
        logger.warning(f"Validation error creating session: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Internal errors
        logger.error(f"Error creating interview session: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create interview session"
        )


@router.get(
    "/health",
    summary="Health Check",
    description="Check if the interview sessions service is healthy"
)
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "interview_sessions"}


@router.get(
    "/{session_id}/questions/{question_number}",
    response_model=QuestionResponse,
    summary="Get Question",
    description="Retrieve a specific question from an interview session"
)
async def get_question(
    session_id: int,
    question_number: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific question from an interview session.
    
    Requirements: 15.1-15.7
    
    - **session_id**: Interview session ID
    - **question_number**: Question number (1-based index)
    
    Returns:
    - Question details with timer information
    
    Response time target: < 200ms
    """
    try:
        user_id = current_user['user_id']
        
        logger.info(f"Retrieving question {question_number} for session {session_id}, user {user_id}")
        
        # Create service
        service = InterviewSessionService(db)
        
        # Get session and validate ownership (Req 15.1)
        session = service.get_session(session_id, user_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied"
            )
        
        # Get question by display order (Req 15.2)
        from app.models.session_question import SessionQuestion
        from app.models.question import Question
        
        session_question = db.query(SessionQuestion).join(Question).filter(
            SessionQuestion.session_id == session_id,
            SessionQuestion.display_order == question_number
        ).first()
        
        if not session_question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Question {question_number} not found in session"
            )
        
        # Record question displayed timestamp (Req 15.4)
        from datetime import datetime
        if not session_question.question_displayed_at:
            session_question.question_displayed_at = datetime.utcnow()
            db.commit()
        
        # Get question details
        question = session_question.question
        
        # Format response (Req 15.3)
        response = QuestionResponse(
            id=question.id,
            question_text=question.question_text,
            category=question.category,
            difficulty=question.difficulty,
            time_limit_seconds=question.time_limit_seconds,
            question_number=question_number
        )
        
        logger.info(f"Successfully retrieved question {question_number} for session {session_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving question: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve question"
        )



@router.post(
    "/{session_id}/answers",
    response_model=AnswerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Answer",
    description="Submit an answer to a question in an interview session"
)
async def submit_answer(
    session_id: int,
    answer_data: AnswerSubmit,
    question_id: int = Query(..., description="Question ID"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit an answer to a question in an interview session.
    
    Requirements: 16.1-16.10
    
    - **session_id**: Interview session ID
    - **question_id**: Question ID (query parameter)
    - **answer_text**: User's answer (10-5000 characters)
    
    Returns:
    - Answer ID and submission details
    - Session completion status
    
    Response time target: < 300ms
    """
    try:
        user_id = current_user['user_id']
        
        logger.info(f"Submitting answer for session {session_id}, question {question_id}, user {user_id}")
        
        # Validate session belongs to user (Req 16.1)
        from app.models.interview_session import InterviewSession, SessionStatus
        session = db.query(InterviewSession).filter(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user_id
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied"
            )
        
        # Validate question belongs to session (Req 16.2)
        from app.models.session_question import SessionQuestion
        session_question = db.query(SessionQuestion).filter(
            SessionQuestion.session_id == session_id,
            SessionQuestion.question_id == question_id
        ).first()
        
        if not session_question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found in this session"
            )
        
        # Check if already answered
        if session_question.answer_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Question already answered"
            )
        
        # Calculate time_taken (Req 16.4)
        from datetime import datetime
        if not session_question.question_displayed_at:
            # If question was never displayed, use current time
            time_taken = 0
        else:
            time_delta = datetime.utcnow() - session_question.question_displayed_at
            time_taken = int(time_delta.total_seconds())
        
        # Create answer record (Req 16.5)
        from app.models.answer import Answer
        answer = Answer(
            session_id=session_id,
            question_id=question_id,
            user_id=user_id,
            answer_text=answer_data.answer_text,
            time_taken=time_taken,
            submitted_at=datetime.utcnow()
        )
        db.add(answer)
        db.flush()  # Get answer ID without committing
        
        # Update session_questions (Req 16.6)
        session_question.answer_id = answer.id
        session_question.status = 'answered'
        
        # Commit the answer and session_question update first
        db.commit()
        db.refresh(answer)
        
        # Delete answer draft if exists (Req 17.7)
        from app.models.answer_draft import AnswerDraft
        draft = db.query(AnswerDraft).filter(
            AnswerDraft.session_id == session_id,
            AnswerDraft.question_id == question_id
        ).first()
        if draft:
            db.delete(draft)
            db.commit()
            logger.info(f"Deleted draft for question {question_id}")
        
        # Check if all questions are answered (Req 16.9)
        total_questions = db.query(SessionQuestion).filter(
            SessionQuestion.session_id == session_id
        ).count()
        
        answered_questions = db.query(SessionQuestion).filter(
            SessionQuestion.session_id == session_id,
            SessionQuestion.status == 'answered'
        ).count()
        
        all_questions_answered = (answered_questions == total_questions)
        session_completed = False
        
        # Update session status if all answered (Req 16.10)
        if all_questions_answered:
            session.status = SessionStatus.COMPLETED
            session.end_time = datetime.utcnow()
            session_completed = True
            db.commit()
        
        # Trigger evaluation (Req 16.7)
        # For now, call synchronously. Will be async with Celery in TASK-037
        evaluation_triggered = False
        try:
            from app.services.evaluation_service import EvaluationService
            evaluation_service = EvaluationService(db)
            evaluation_result = evaluation_service.evaluate_answer(answer.id)
            evaluation_triggered = True
            logger.info(f"Evaluation completed for answer {answer.id}: score={evaluation_result.get('overall_score')}")
        except Exception as e:
            # Log the error but don't fail the answer submission
            logger.error(f"Evaluation failed for answer {answer.id}: {e}", exc_info=True)
            logger.warning(f"Answer {answer.id} submitted but evaluation failed. User can retry evaluation later.")
            # Store a flag that evaluation needs to be retried
            evaluation_triggered = False
        
        logger.info(f"Answer {answer.id} submitted successfully for session {session_id}")
        
        # Format response
        response = AnswerResponse(
            answer_id=answer.id,
            session_id=session_id,
            question_id=question_id,
            time_taken=time_taken,
            submitted_at=answer.submitted_at,
            status='submitted',  # Will be 'evaluating' once Celery is integrated
            all_questions_answered=all_questions_answered,
            session_completed=session_completed
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting answer: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit answer"
        )



@router.post(
    "/{session_id}/drafts",
    response_model=AnswerDraftResponse,
    status_code=status.HTTP_200_OK,
    summary="Save Answer Draft",
    description="Auto-save answer draft to prevent data loss"
)
async def save_answer_draft(
    session_id: int,
    draft_data: AnswerDraftSave,
    question_id: int = Query(..., description="Question ID"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save or update answer draft for auto-save functionality.
    
    Requirements: 17.1-17.7
    
    - **session_id**: Interview session ID
    - **question_id**: Question ID (query parameter)
    - **draft_text**: Draft answer text (1-5000 characters)
    
    Returns:
    - Draft ID and save confirmation
    
    Response time target: < 200ms
    """
    try:
        user_id = current_user['user_id']
        
        logger.info(f"Saving draft for session {session_id}, question {question_id}, user {user_id}")
        
        # Validate session belongs to user (Req 17.3)
        from app.models.interview_session import InterviewSession
        session = db.query(InterviewSession).filter(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user_id
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied"
            )
        
        # Validate question belongs to session (Req 17.3)
        from app.models.session_question import SessionQuestion
        session_question = db.query(SessionQuestion).filter(
            SessionQuestion.session_id == session_id,
            SessionQuestion.question_id == question_id
        ).first()
        
        if not session_question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found in this session"
            )
        
        # Upsert answer draft (Req 17.4)
        from app.models.answer_draft import AnswerDraft
        from datetime import datetime
        
        draft = db.query(AnswerDraft).filter(
            AnswerDraft.session_id == session_id,
            AnswerDraft.question_id == question_id
        ).first()
        
        if draft:
            # Update existing draft
            draft.draft_text = draft_data.draft_text
            draft.last_saved_at = datetime.utcnow()
        else:
            # Create new draft
            draft = AnswerDraft(
                session_id=session_id,
                question_id=question_id,
                user_id=user_id,
                draft_text=draft_data.draft_text,
                last_saved_at=datetime.utcnow()
            )
            db.add(draft)
        
        db.commit()
        db.refresh(draft)
        
        logger.info(f"Draft {draft.id} saved successfully for session {session_id}")
        
        # Format response
        response = AnswerDraftResponse(
            draft_id=draft.id,
            session_id=session_id,
            question_id=question_id,
            draft_text=draft.draft_text,
            last_saved_at=draft.last_saved_at
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving draft: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save draft"
        )


@router.get(
    "/{session_id}/drafts/{question_id}",
    response_model=AnswerDraftRetrieve,
    summary="Get Answer Draft",
    description="Retrieve saved answer draft for a question"
)
async def get_answer_draft(
    session_id: int,
    question_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve answer draft for a question.
    
    Requirements: 17.6
    
    - **session_id**: Interview session ID
    - **question_id**: Question ID
    
    Returns:
    - Draft text and last saved timestamp
    
    Response time target: < 200ms
    """
    try:
        user_id = current_user['user_id']
        
        logger.info(f"Retrieving draft for session {session_id}, question {question_id}, user {user_id}")
        
        # Validate session belongs to user
        from app.models.interview_session import InterviewSession
        session = db.query(InterviewSession).filter(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user_id
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied"
            )
        
        # Retrieve draft
        from app.models.answer_draft import AnswerDraft
        draft = db.query(AnswerDraft).filter(
            AnswerDraft.session_id == session_id,
            AnswerDraft.question_id == question_id
        ).first()
        
        if not draft:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No draft found for this question"
            )
        
        logger.info(f"Draft {draft.id} retrieved successfully")
        
        # Format response
        response = AnswerDraftRetrieve(
            draft_text=draft.draft_text,
            last_saved_at=draft.last_saved_at
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving draft: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve draft"
        )


@router.delete(
    "/{session_id}/drafts/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Answer Draft",
    description="Delete answer draft after submission"
)
async def delete_answer_draft(
    session_id: int,
    question_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete answer draft after answer submission.
    
    Requirements: 17.7
    
    - **session_id**: Interview session ID
    - **question_id**: Question ID
    
    Returns:
    - 204 No Content on success
    """
    try:
        user_id = current_user['user_id']
        
        logger.info(f"Deleting draft for session {session_id}, question {question_id}, user {user_id}")
        
        # Validate session belongs to user
        from app.models.interview_session import InterviewSession
        session = db.query(InterviewSession).filter(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user_id
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied"
            )
        
        # Delete draft
        from app.models.answer_draft import AnswerDraft
        draft = db.query(AnswerDraft).filter(
            AnswerDraft.session_id == session_id,
            AnswerDraft.question_id == question_id
        ).first()
        
        if draft:
            db.delete(draft)
            db.commit()
            logger.info(f"Draft {draft.id} deleted successfully")
        else:
            logger.info(f"No draft found to delete")
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting draft: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete draft"
        )


@router.get(
    "/{session_id}/summary",
    response_model=SessionSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Session Summary",
    description="Get comprehensive performance summary for a completed interview session"
)
async def get_session_summary(
    session_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get session performance summary.
    
    Requirements: 19.1-19.12
    
    - **session_id**: Interview session ID
    
    Returns:
    - Comprehensive session summary with scores, trends, and visualizations
    
    Raises:
    - 404: Session not found or not owned by user
    - 400: Session not completed
    """
    try:
        user_id = current_user['user_id']
        
        logger.info(f"Generating summary for session {session_id}, user {user_id}")
        
        # Generate summary
        summary_service = SessionSummaryService(db)
        summary = summary_service.generate_summary(session_id, user_id)
        
        return summary
        
    except ValueError as e:
        logger.error(f"Error generating summary: {e}")
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
    except Exception as e:
        logger.error(f"Unexpected error generating summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate session summary"
        )
