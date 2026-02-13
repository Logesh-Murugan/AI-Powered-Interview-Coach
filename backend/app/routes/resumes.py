"""
Resume routes for file upload and management
"""
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.resume_service import ResumeService
from app.schemas.resume import ResumeUploadResponse, ResumeResponse, ResumeListResponse


router = APIRouter()


@router.post("/upload", response_model=ResumeUploadResponse, status_code=201)
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Resume file (PDF or DOCX, max 10MB)"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload resume file.
    
    - **file**: Resume file (PDF or DOCX format)
    - **max_size**: 10MB
    - **processing**: Async text extraction and parsing will begin after upload
    
    Returns resume_id and upload confirmation.
    """
    service = ResumeService(db)
    user_id = current_user['user_id']
    return await service.upload_resume(file, user_id, background_tasks)


@router.get("/", response_model=ResumeListResponse)
def get_user_resumes(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all resumes for current user.
    
    Returns list of resumes ordered by creation date (newest first).
    """
    service = ResumeService(db)
    user_id = current_user['user_id']
    resumes = service.get_user_resumes(user_id)
    
    return ResumeListResponse(
        resumes=[ResumeResponse.model_validate(r) for r in resumes],
        total=len(resumes)
    )


@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get resume details by ID.
    
    Returns full resume details including extracted data.
    """
    service = ResumeService(db)
    user_id = current_user['user_id']
    resume = service.get_resume(resume_id, user_id)
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return ResumeResponse.model_validate(resume)


@router.delete("/{resume_id}", status_code=204)
def delete_resume(
    resume_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete resume (soft delete).
    
    Resume will be marked as deleted but data remains in database.
    """
    service = ResumeService(db)
    user_id = current_user['user_id']
    deleted = service.delete_resume(resume_id, user_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return None
