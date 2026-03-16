"""
Media API Routes

API endpoints for recording upload, processing, and management.

Requirements: Recording System Implementation
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.answer import Answer
from app.models.interview_session import InterviewSession
from app.services.media_service import MediaService
from app.utils.media_storage import MediaStorageManager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/upload-recording",
    summary="Upload Recording",
    description="Upload audio/video recording for an interview answer"
)
async def upload_recording(
    session_id: int = Form(...),
    question_id: int = Form(...),
    audio_file: Optional[UploadFile] = File(None),
    video_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and process audio/video recording for an interview answer.
    
    Args:
        session_id: Interview session ID
        question_id: Question ID
        audio_file: Audio recording file (optional if video provided)
        video_file: Video recording file (optional)
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Processing results including transcription and voice analysis
        
    Raises:
        400: Invalid request or file validation failed
        403: Access denied to session
        404: Session or answer not found
        413: File too large
        500: Processing failed
    """
    try:
        user_id = current_user.id
        
        logger.info(f"Recording upload request: user={user_id}, session={session_id}, question={question_id}")
        
        # Validate that at least one file is provided
        if not audio_file and not video_file:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one recording file (audio or video) must be provided"
            )
        
        # Verify session ownership
        session = db.query(InterviewSession).filter(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user_id,
            InterviewSession.deleted_at.is_(None)
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied"
            )
        
        # Find or create the answer record
        answer = db.query(Answer).filter(
            Answer.session_id == session_id,
            Answer.question_id == question_id,
            Answer.user_id == user_id,
            Answer.deleted_at.is_(None)
        ).first()
        
        if not answer:
            # Create a new answer record for the recording
            from datetime import datetime
            answer = Answer(
                session_id=session_id,
                question_id=question_id,
                user_id=user_id,
                answer_text="",  # Empty text, will be filled when user submits
                time_taken=0,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(answer)
            db.flush()  # Get the ID without committing
            logger.info(f"Created new answer record: {answer.id}")
            
            # Link the answer to session_question for proper workflow integration
            from app.models.session_question import SessionQuestion
            session_question = db.query(SessionQuestion).filter(
                SessionQuestion.session_id == session_id,
                SessionQuestion.question_id == question_id
            ).first()
            
            if session_question and not session_question.answer_id:
                session_question.answer_id = answer.id
                session_question.status = 'answered'
                logger.info(f"Linked session_question to new answer {answer.id}")
            elif session_question:
                logger.info(f"Session_question already has answer_id: {session_question.answer_id}")
            else:
                logger.warning(f"No session_question found for session {session_id}, question {question_id}")
        
        # Process recording using media service
        media_service = MediaService()
        processing_result = await media_service.process_recording(
            audio_file=audio_file,
            user_id=user_id,
            question_id=question_id,
            video_file=video_file
        )
        
        # Update answer record with recording data AND transcription as answer text
        answer.audio_url = processing_result.get('audio_url')
        answer.video_url = processing_result.get('video_url')
        answer.recording_duration = processing_result.get('recording_duration')
        answer.recording_format = processing_result.get('recording_format')
        answer.transcription = processing_result.get('transcription')
        answer.voice_analysis = processing_result.get('voice_analysis')
        
        # IMPORTANT: If answer_text is empty, populate it with transcription
        # This allows speech-to-text to be evaluated like a normal text answer
        transcription_text = processing_result.get('transcription', '').strip()
        if not answer.answer_text.strip() and transcription_text:
            answer.answer_text = transcription_text
            logger.info(f"Populated answer_text with transcription: {len(transcription_text)} characters")
        
        db.commit()
        
        logger.info(f"Recording processed successfully: answer_id={answer.id}")
        
        # Return processing results
        return {
            "success": True,
            "answer_id": answer.id,
            "audio_url": processing_result.get('audio_url'),
            "video_url": processing_result.get('video_url'),
            "recording_duration": processing_result.get('recording_duration'),
            "transcription": processing_result.get('transcription'),
            "voice_analysis": processing_result.get('voice_analysis'),
            "processing_metadata": processing_result.get('processing_metadata')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Recording upload failed: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Recording processing failed"
        )


@router.get(
    "/health",
    summary="Media Service Health Check",
    description="Check media service health and capabilities"
)
async def media_health_check():
    """
    Check media service health status.
    
    Returns:
        Health status and service capabilities
    """
    try:
        media_service = MediaService()
        health_status = media_service.health_check()
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "whisper_loaded": False,
            "storage_accessible": False,
            "processing_ready": False
        }


@router.get(
    "/storage/stats",
    summary="Storage Statistics",
    description="Get media storage usage statistics"
)
async def get_storage_stats(
    current_user: User = Depends(get_current_user)
):
    """
    Get storage usage statistics.
    
    Returns:
        Storage usage information
    """
    try:
        stats = MediaStorageManager.get_storage_stats()
        return stats
        
    except Exception as e:
        logger.error(f"Failed to get storage stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve storage statistics"
        )


@router.get(
    "/files",
    summary="List User Files",
    description="List media files for the current user"
)
async def list_user_files(
    media_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    List media files for the current user.
    
    Args:
        media_type: Optional filter by 'audio' or 'video'
        current_user: Authenticated user
        
    Returns:
        List of user's media files
    """
    try:
        user_id = current_user.id
        
        if media_type and media_type not in ['audio', 'video']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="media_type must be 'audio' or 'video'"
            )
        
        files = MediaStorageManager.get_user_files(user_id, media_type)
        
        return {
            "files": files,
            "total_count": len(files),
            "media_type_filter": media_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list user files: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve file list"
        )


@router.delete(
    "/files",
    summary="Delete Media File",
    description="Delete a media file"
)
async def delete_media_file(
    file_url: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a media file.
    
    Args:
        file_url: URL of file to delete
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Deletion status
    """
    try:
        user_id = current_user.id
        
        # Verify user has access to this file
        if not MediaStorageManager.verify_user_access(file_url, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this file"
            )
        
        # Find and update answer records that reference this file
        answers_updated = 0
        
        # Check for audio URL references
        audio_answers = db.query(Answer).filter(
            Answer.audio_url == file_url,
            Answer.user_id == user_id,
            Answer.deleted_at.is_(None)
        ).all()
        
        for answer in audio_answers:
            answer.audio_url = None
            answers_updated += 1
        
        # Check for video URL references
        video_answers = db.query(Answer).filter(
            Answer.video_url == file_url,
            Answer.user_id == user_id,
            Answer.deleted_at.is_(None)
        ).all()
        
        for answer in video_answers:
            answer.video_url = None
            answers_updated += 1
        
        # Delete the physical file
        file_deleted = MediaStorageManager.delete_file(file_url, user_id)
        
        if answers_updated > 0:
            db.commit()
        
        return {
            "success": file_deleted,
            "file_url": file_url,
            "answers_updated": answers_updated,
            "message": "File deleted successfully" if file_deleted else "File not found or already deleted"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete file {file_url}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete file"
        )


@router.post(
    "/cleanup",
    summary="Cleanup Old Files",
    description="Clean up old media files (admin only)"
)
async def cleanup_old_files(
    days_old: int = 30,
    current_user: User = Depends(get_current_user)
):
    """
    Clean up media files older than specified days.
    
    Args:
        days_old: Delete files older than this many days (default: 30)
        current_user: Authenticated user
        
    Returns:
        Cleanup results
        
    Note:
        This endpoint should be restricted to admin users in production
    """
    try:
        # TODO: Add admin role check
        # if not current_user.is_admin:
        #     raise HTTPException(status_code=403, detail="Admin access required")
        
        if days_old < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="days_old must be at least 1"
            )
        
        deleted_count = MediaStorageManager.cleanup_old_files(days_old)
        
        return {
            "success": True,
            "deleted_count": deleted_count,
            "days_old": days_old,
            "message": f"Cleaned up {deleted_count} files older than {days_old} days"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cleanup operation failed"
        )