"""
Utility functions for resume processing

Ensures resumes are processed automatically when needed.
"""
from sqlalchemy.orm import Session
from loguru import logger
from app.models.resume import Resume, ResumeStatus
from app.tasks.resume_tasks import extract_resume_text_task


def ensure_resume_processed(resume_id: int, db: Session) -> bool:
    """
    Ensure resume is processed. If not, trigger processing.
    
    This function checks if a resume needs processing and triggers
    the background task if needed. This ensures resumes are always
    processed even if the initial background task failed.
    
    Args:
        resume_id: Resume ID to check
        db: Database session
        
    Returns:
        True if resume is ready (processed), False if processing was triggered
    """
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    
    if not resume:
        logger.warning(f"Resume {resume_id} not found")
        return False
    
    # Check if resume needs processing
    if resume.status == ResumeStatus.UPLOADED.value:
        logger.info(
            f"Resume {resume_id} is in UPLOADED status, triggering processing"
        )
        # Trigger processing in a separate thread to avoid blocking
        import threading
        thread = threading.Thread(
            target=extract_resume_text_task,
            args=(resume_id,)
        )
        thread.daemon = True
        thread.start()
        return False
    
    # Check if resume is ready for analysis
    if resume.status in [
        ResumeStatus.SKILLS_EXTRACTED.value,
        ResumeStatus.COMPLETED.value
    ]:
        return True
    
    # Resume is in processing or failed state
    if resume.status == ResumeStatus.TEXT_EXTRACTED.value:
        logger.info(
            f"Resume {resume_id} is in TEXT_EXTRACTED status, "
            f"skill extraction may be in progress"
        )
        return False
    
    if resume.status == ResumeStatus.EXTRACTION_FAILED.value:
        logger.warning(
            f"Resume {resume_id} has EXTRACTION_FAILED status, "
            f"manual intervention may be needed"
        )
        return False
    
    return False


def get_resume_processing_status(resume_id: int, db: Session) -> dict:
    """
    Get detailed processing status for a resume.
    
    Args:
        resume_id: Resume ID
        db: Database session
        
    Returns:
        Dictionary with status information
    """
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    
    if not resume:
        return {
            'found': False,
            'status': None,
            'ready_for_analysis': False,
            'message': 'Resume not found'
        }
    
    ready = resume.status in [
        ResumeStatus.SKILLS_EXTRACTED.value,
        ResumeStatus.COMPLETED.value
    ]
    
    status_messages = {
        ResumeStatus.UPLOADED.value: 'Resume uploaded, processing will begin shortly',
        ResumeStatus.TEXT_EXTRACTED.value: 'Text extracted, extracting skills...',
        ResumeStatus.SKILLS_EXTRACTED.value: 'Ready for analysis',
        ResumeStatus.COMPLETED.value: 'Processing complete',
        ResumeStatus.EXTRACTION_FAILED.value: 'Processing failed, please try uploading again'
    }
    
    return {
        'found': True,
        'status': resume.status,
        'ready_for_analysis': ready,
        'message': status_messages.get(
            resume.status,
            f'Unknown status: {resume.status}'
        ),
        'skills_count': len(resume.skills) if resume.skills else 0,
        'has_extracted_text': bool(resume.extracted_text)
    }
