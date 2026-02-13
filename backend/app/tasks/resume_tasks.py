"""
Background tasks for resume processing
"""
import os
from sqlalchemy.orm import Session
from loguru import logger
from app.database import SessionLocal
from app.models.resume import Resume, ResumeStatus
from app.utils.text_extraction import extract_text_from_resume, get_text_statistics
from app.utils.skill_extraction import extract_and_categorize_skills, get_skill_statistics


def extract_resume_text_task(resume_id: int):
    """
    Background task to extract text from resume file.
    
    This task:
    1. Reads the resume file from local storage
    2. Extracts text based on file type (PDF or DOCX)
    3. Cleans the extracted text
    4. Stores the text in the database
    5. Updates the resume status
    
    Args:
        resume_id: Resume ID to process
    """
    db: Session = SessionLocal()
    
    try:
        logger.info(f"Starting text extraction for resume {resume_id}")
        
        # Get resume from database
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        
        if not resume:
            logger.error(f"Resume {resume_id} not found")
            return
        
        # Check if already processed
        if resume.status != ResumeStatus.UPLOADED.value:
            logger.warning(f"Resume {resume_id} already processed (status: {resume.status})")
            return
        
        # Get file extension
        file_extension = os.path.splitext(resume.filename)[1].lower()
        
        try:
            # Extract text
            logger.info(f"Extracting text from {resume.filename} ({file_extension})")
            extracted_text, success = extract_text_from_resume(
                resume.file_url,
                file_extension
            )
            
            if success and extracted_text:
                # Get text statistics
                stats = get_text_statistics(extracted_text)
                logger.info(
                    f"Text extraction successful for resume {resume_id}: "
                    f"{stats['word_count']} words, {stats['character_count']} characters"
                )
                
                # Update resume with extracted text
                resume.extracted_text = extracted_text
                resume.status = ResumeStatus.TEXT_EXTRACTED.value
                
                db.commit()
                logger.info(f"Resume {resume_id} updated with extracted text")
                
                # Trigger skill extraction
                extract_skills_task(resume_id)
                
            else:
                raise Exception("Text extraction returned empty result")
                
        except Exception as e:
            # Mark as failed
            logger.error(f"Text extraction failed for resume {resume_id}: {str(e)}")
            resume.status = ResumeStatus.EXTRACTION_FAILED.value
            db.commit()
            
    except Exception as e:
        logger.error(f"Error in extract_resume_text_task for resume {resume_id}: {str(e)}")
        db.rollback()
        
    finally:
        db.close()


def extract_skills_task(resume_id: int):
    """
    Background task to extract skills from resume text.
    
    This task:
    1. Gets the extracted text from the resume
    2. Uses NLP to extract skills
    3. Categorizes skills into technical, soft skills, tools, languages
    4. Stores skills in JSONB format
    5. Updates the resume status
    
    Args:
        resume_id: Resume ID to process
    """
    db: Session = SessionLocal()
    
    try:
        logger.info(f"Starting skill extraction for resume {resume_id}")
        
        # Get resume from database
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        
        if not resume:
            logger.error(f"Resume {resume_id} not found")
            return
        
        # Check if text has been extracted
        if not resume.extracted_text:
            logger.error(f"Resume {resume_id} has no extracted text")
            return
        
        # Check if already processed
        if resume.status not in [ResumeStatus.TEXT_EXTRACTED.value, ResumeStatus.UPLOADED.value]:
            logger.warning(f"Resume {resume_id} already processed skills (status: {resume.status})")
            return
        
        try:
            # Extract skills
            logger.info(f"Extracting skills from resume {resume_id}")
            detailed_skills, categorized_skills = extract_and_categorize_skills(
                resume.extracted_text,
                confidence_threshold=0.6
            )
            
            # Get statistics
            stats = get_skill_statistics(categorized_skills)
            logger.info(
                f"Skill extraction successful for resume {resume_id}: "
                f"{stats['total_skills']} total skills extracted"
            )
            
            # Update resume with skills
            resume.skills = categorized_skills
            resume.status = ResumeStatus.SKILLS_EXTRACTED.value
            
            db.commit()
            logger.info(f"Resume {resume_id} updated with extracted skills")
            
        except Exception as e:
            # Mark as failed
            logger.error(f"Skill extraction failed for resume {resume_id}: {str(e)}")
            resume.status = ResumeStatus.EXTRACTION_FAILED.value
            db.commit()
            
    except Exception as e:
        logger.error(f"Error in extract_skills_task for resume {resume_id}: {str(e)}")
        db.rollback()
        
    finally:
        db.close()


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
