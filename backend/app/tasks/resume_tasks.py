"""
Background tasks for resume processing
"""
import os
from sqlalchemy.orm import Session
from loguru import logger
from app.database import SessionLocal
from app.models.resume import Resume, ResumeStatus
from app.models.resume_analysis import ResumeAnalysis
from app.utils.text_extraction import extract_text_from_resume, get_text_statistics
from app.utils.skill_extraction import extract_and_categorize_skills, get_skill_statistics


def extract_resume_text_task(resume_id: int, retry_count: int = 0, max_retries: int = 2):
    """
    Background task to extract text from resume file.
    
    This task:
    1. Reads the resume file from local storage
    2. Extracts text based on file type (PDF or DOCX)
    3. Cleans the extracted text
    4. Stores the text in the database
    5. Updates the resume status
    6. Automatically triggers skill extraction on success
    
    Args:
        resume_id: Resume ID to process
        retry_count: Current retry attempt (default: 0)
        max_retries: Maximum number of retries (default: 2)
    """
    db: Session = SessionLocal()
    
    try:
        logger.info(f"[BACKGROUND TASK] Starting text extraction for resume {resume_id} (attempt {retry_count + 1}/{max_retries + 1})")
        
        # Get resume from database
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        
        if not resume:
            logger.error(f"[BACKGROUND TASK] Resume {resume_id} not found")
            return
        
        # Check if already processed successfully
        if resume.status in [ResumeStatus.TEXT_EXTRACTED.value, ResumeStatus.SKILLS_EXTRACTED.value, ResumeStatus.COMPLETED.value]:
            logger.warning(f"[BACKGROUND TASK] Resume {resume_id} already processed (status: {resume.status})")
            return
        
        # Get file extension
        file_extension = os.path.splitext(resume.filename)[1].lower()
        
        if file_extension not in ['.pdf', '.docx']:
            logger.error(f"[BACKGROUND TASK] Unsupported file extension: {file_extension}")
            resume.status = ResumeStatus.EXTRACTION_FAILED.value
            db.commit()
            return
        
        try:
            # Extract text
            logger.info(f"[BACKGROUND TASK] Extracting text from {resume.filename} ({file_extension})")
            extracted_text, success = extract_text_from_resume(
                resume.file_url,
                file_extension
            )
            
            if success and extracted_text and len(extracted_text.strip()) > 50:
                # Get text statistics
                stats = get_text_statistics(extracted_text)
                logger.info(
                    f"[BACKGROUND TASK] Text extraction successful for resume {resume_id}: "
                    f"{stats['word_count']} words, {stats['character_count']} characters"
                )
                
                # Update resume with extracted text
                resume.extracted_text = extracted_text
                resume.status = ResumeStatus.TEXT_EXTRACTED.value
                
                db.commit()
                db.refresh(resume)
                logger.info(f"[BACKGROUND TASK] Resume {resume_id} updated with extracted text, status: {resume.status}")
                
                # Trigger skill extraction immediately
                logger.info(f"[BACKGROUND TASK] Triggering skill extraction for resume {resume_id}")
                extract_skills_task(resume_id)
                
            else:
                raise Exception(f"Text extraction returned empty or too short result (length: {len(extracted_text) if extracted_text else 0})")
                
        except Exception as e:
            error_msg = str(e)
            logger.error(f"[BACKGROUND TASK] Text extraction failed for resume {resume_id}: {error_msg}")
            import traceback
            logger.error(f"[BACKGROUND TASK] Traceback: {traceback.format_exc()}")
            
            # Retry logic
            if retry_count < max_retries:
                logger.info(f"[BACKGROUND TASK] Retrying text extraction for resume {resume_id} (attempt {retry_count + 2}/{max_retries + 1})")
                import time
                time.sleep(2)  # Wait 2 seconds before retry
                extract_resume_text_task(resume_id, retry_count + 1, max_retries)
            else:
                # Mark as failed after all retries
                logger.error(f"[BACKGROUND TASK] All retries exhausted for resume {resume_id}, marking as failed")
                resume.status = ResumeStatus.EXTRACTION_FAILED.value
                db.commit()
            
    except Exception as e:
        logger.error(f"[BACKGROUND TASK] Error in extract_resume_text_task for resume {resume_id}: {str(e)}")
        import traceback
        logger.error(f"[BACKGROUND TASK] Traceback: {traceback.format_exc()}")
        try:
            db.rollback()
        except:
            pass
        
    finally:
        try:
            db.close()
        except:
            pass
        logger.info(f"[BACKGROUND TASK] Finished processing resume {resume_id}")


def extract_skills_task(resume_id: int, retry_count: int = 0, max_retries: int = 2):
    """
    Background task to extract skills from resume text.
    
    This task:
    1. Gets the extracted text from the resume
    2. Uses NLP to extract skills
    3. Categorizes skills into technical, soft skills, tools, languages
    4. Stores skills in JSONB format
    5. Updates the resume status to COMPLETED (ready for analysis)
    
    Args:
        resume_id: Resume ID to process
        retry_count: Current retry attempt (default: 0)
        max_retries: Maximum number of retries (default: 2)
    """
    db: Session = SessionLocal()
    
    try:
        logger.info(f"[BACKGROUND TASK] Starting skill extraction for resume {resume_id} (attempt {retry_count + 1}/{max_retries + 1})")
        
        # Get resume from database
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        
        if not resume:
            logger.error(f"[BACKGROUND TASK] Resume {resume_id} not found")
            return
        
        # Check if text has been extracted
        if not resume.extracted_text or len(resume.extracted_text.strip()) < 50:
            logger.error(f"[BACKGROUND TASK] Resume {resume_id} has no extracted text or text too short")
            resume.status = ResumeStatus.EXTRACTION_FAILED.value
            db.commit()
            return
        
        # Check if already processed successfully
        if resume.status in [ResumeStatus.SKILLS_EXTRACTED.value, ResumeStatus.COMPLETED.value]:
            logger.warning(f"[BACKGROUND TASK] Resume {resume_id} already processed skills (status: {resume.status})")
            return
        
        try:
            # Extract skills
            logger.info(f"[BACKGROUND TASK] Extracting skills from resume {resume_id}")
            detailed_skills, categorized_skills = extract_and_categorize_skills(
                resume.extracted_text,
                confidence_threshold=0.6
            )
            
            # Get statistics
            stats = get_skill_statistics(categorized_skills)
            logger.info(
                f"[BACKGROUND TASK] Skill extraction successful for resume {resume_id}: "
                f"{stats['total_skills']} total skills extracted"
            )
            
            # Update resume with skills and mark as COMPLETED (ready for analysis)
            resume.skills = categorized_skills
            resume.status = ResumeStatus.COMPLETED.value  # Changed from SKILLS_EXTRACTED to COMPLETED
            
            db.commit()
            db.refresh(resume)
            logger.info(f"[BACKGROUND TASK] Resume {resume_id} updated with extracted skills, status: {resume.status}")
            logger.info(f"[BACKGROUND TASK] ✅ Resume {resume_id} is now READY FOR ANALYSIS")
            
            # Auto-trigger AI analysis
            logger.info(f"[BACKGROUND TASK] Auto-triggering AI analysis for resume {resume_id}")
            try:
                from app.services.agents.resume_agent_service import ResumeAgentService
                analysis_service = ResumeAgentService(db)
                analysis_result = analysis_service.analyze_resume(
                    resume_id=resume_id,
                    user_id=resume.user_id,
                    target_role="Software Engineer",  # Default role for auto-triggered analysis
                    force_refresh=False
                )
                # Ensure the analysis is committed and visible
                db.commit()
                # Force a fresh query to ensure the analysis is visible
                db.expunge_all()  # Clear session cache
                
                # Verify the analysis is accessible
                verification = db.query(ResumeAnalysis).filter(
                    ResumeAnalysis.resume_id == resume_id,
                    ResumeAnalysis.status == 'success'
                ).order_by(ResumeAnalysis.created_at.desc()).first()
                
                if verification:
                    logger.info(f"[BACKGROUND TASK] ✅ Analysis verified accessible (ID: {verification.id})")
                else:
                    logger.error(f"[BACKGROUND TASK] ❌ Analysis not accessible after background task!")
                
                logger.info(f"[BACKGROUND TASK] ✅ AI analysis completed for resume {resume_id} (status: {analysis_result['status']})")
            except Exception as analysis_error:
                logger.error(f"[BACKGROUND TASK] AI analysis failed for resume {resume_id}: {str(analysis_error)}")
                # Don't fail the whole task if analysis fails - resume is still usable
                import traceback
                logger.error(f"[BACKGROUND TASK] Analysis error traceback: {traceback.format_exc()}")
                try:
                    db.rollback()
                except:
                    pass
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"[BACKGROUND TASK] Skill extraction failed for resume {resume_id}: {error_msg}")
            import traceback
            logger.error(f"[BACKGROUND TASK] Traceback: {traceback.format_exc()}")
            
            # Retry logic
            if retry_count < max_retries:
                logger.info(f"[BACKGROUND TASK] Retrying skill extraction for resume {resume_id} (attempt {retry_count + 2}/{max_retries + 1})")
                import time
                time.sleep(2)  # Wait 2 seconds before retry
                extract_skills_task(resume_id, retry_count + 1, max_retries)
            else:
                # Mark as failed after all retries
                logger.error(f"[BACKGROUND TASK] All retries exhausted for resume {resume_id}, marking as failed")
                resume.status = ResumeStatus.EXTRACTION_FAILED.value
                db.commit()
            
    except Exception as e:
        logger.error(f"[BACKGROUND TASK] Error in extract_skills_task for resume {resume_id}: {str(e)}")
        import traceback
        logger.error(f"[BACKGROUND TASK] Traceback: {traceback.format_exc()}")
        try:
            db.rollback()
        except:
            pass
        
    finally:
        try:
            db.close()
        except:
            pass
        logger.info(f"[BACKGROUND TASK] Finished skill extraction for resume {resume_id}")


def process_resume_pipeline(resume_id: int):
    """
    Full resume processing pipeline (for future use).
    
    This will eventually include:
    1. Text extraction
    2. Skill extraction
    3. Experience parsing
    4. Education parsing
    
    Args:
        resume_id: Resume ID to process
    """
    # For now, just extract text (which triggers skill extraction)
    # In future tasks, we'll add experience and education parsing
    extract_resume_text_task(resume_id)
