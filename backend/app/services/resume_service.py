"""
Resume service for business logic
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, BackgroundTasks
from app.models.resume import Resume, ResumeStatus
from app.models.user import User
from app.utils.file_upload import upload_file_local, delete_file_local
from app.schemas.resume import ResumeUploadResponse, ResumeResponse


class ResumeService:
    """Service for resume operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def upload_resume(
        self,
        file: UploadFile,
        user_id: int,
        background_tasks: BackgroundTasks
    ) -> ResumeUploadResponse:
        """
        Upload resume file and create database record.
        
        Args:
            file: Uploaded file
            user_id: User ID
            background_tasks: FastAPI BackgroundTasks for async processing
            
        Returns:
            ResumeUploadResponse with resume details
            
        Raises:
            HTTPException: If upload fails or user not found
        """
        # Verify user exists
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Upload to local storage
        file_url, file_size = await upload_file_local(file)
        
        # Create resume record
        resume = Resume(
            user_id=user_id,
            filename=file.filename,
            file_url=file_url,
            file_size=file_size,
            status=ResumeStatus.UPLOADED.value
        )
        
        self.db.add(resume)
        self.db.commit()
        self.db.refresh(resume)
        
        # Trigger background task for text extraction
        from app.tasks.resume_tasks import extract_resume_text_task
        background_tasks.add_task(extract_resume_text_task, resume.id)
        
        return ResumeUploadResponse(
            resume_id=resume.id,
            filename=resume.filename,
            file_url=resume.file_url,
            file_size=resume.file_size,
            status=resume.status,
            message="Resume uploaded successfully. Processing will begin shortly."
        )
    
    def get_resume(self, resume_id: int, user_id: int) -> Optional[Resume]:
        """
        Get resume by ID for specific user.
        
        Args:
            resume_id: Resume ID
            user_id: User ID
            
        Returns:
            Resume object or None
        """
        return self.db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.user_id == user_id,
            Resume.deleted_at.is_(None)
        ).first()
    
    def get_user_resumes(self, user_id: int) -> List[Resume]:
        """
        Get all resumes for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            List of Resume objects
        """
        return self.db.query(Resume).filter(
            Resume.user_id == user_id,
            Resume.deleted_at.is_(None)
        ).order_by(Resume.created_at.desc()).all()
    
    def delete_resume(self, resume_id: int, user_id: int) -> bool:
        """
        Soft delete resume.
        
        Args:
            resume_id: Resume ID
            user_id: User ID
            
        Returns:
            True if deleted, False if not found
        """
        resume = self.get_resume(resume_id, user_id)
        if not resume:
            return False
        
        resume.soft_delete()
        self.db.commit()
        return True
    
    def update_resume_status(
        self,
        resume_id: int,
        status: str,
        extracted_text: Optional[str] = None,
        skills: Optional[dict] = None,
        experience: Optional[list] = None,
        education: Optional[list] = None
    ) -> Optional[Resume]:
        """
        Update resume processing status and data.
        
        Args:
            resume_id: Resume ID
            status: New status
            extracted_text: Extracted text (optional)
            skills: Extracted skills (optional)
            experience: Parsed experience (optional)
            education: Parsed education (optional)
            
        Returns:
            Updated Resume object or None
        """
        resume = self.db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            return None
        
        resume.status = status
        
        if extracted_text is not None:
            resume.extracted_text = extracted_text
        
        if skills is not None:
            resume.skills = skills
        
        if experience is not None:
            resume.experience = experience
        
        if education is not None:
            resume.education = education
        
        self.db.commit()
        self.db.refresh(resume)
        return resume
