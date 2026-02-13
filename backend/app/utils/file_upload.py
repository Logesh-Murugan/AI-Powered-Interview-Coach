"""
File upload utilities for resume handling - Local Storage
"""
import uuid
import os
from typing import Tuple
from pathlib import Path
from fastapi import UploadFile, HTTPException


# Allowed file extensions and MIME types
ALLOWED_EXTENSIONS = {'.pdf', '.docx'}
ALLOWED_MIME_TYPES = {
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}

# File size limit (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes


def validate_file_extension(filename: str) -> bool:
    """
    Validate file extension.
    
    Args:
        filename: Name of the file
        
    Returns:
        True if extension is valid, False otherwise
    """
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def validate_file_size(file_size: int) -> bool:
    """
    Validate file size.
    
    Args:
        file_size: Size of file in bytes
        
    Returns:
        True if size is valid, False otherwise
    """
    return file_size <= MAX_FILE_SIZE


def generate_unique_filename(original_filename: str) -> str:
    """
    Generate unique filename with UUID prefix.
    
    Args:
        original_filename: Original filename
        
    Returns:
        Unique filename with UUID prefix
    """
    ext = os.path.splitext(original_filename)[1].lower()
    unique_id = uuid.uuid4().hex[:12]
    # Sanitize original filename (remove special chars)
    safe_name = "".join(c for c in original_filename if c.isalnum() or c in ('-', '_', '.'))
    return f"{unique_id}_{safe_name}"


async def upload_file_local(
    file: UploadFile,
    folder: str = "resumes"
) -> Tuple[str, int]:
    """
    Upload file to local storage.
    
    Args:
        file: FastAPI UploadFile object
        folder: Folder name for organization
        
    Returns:
        Tuple of (file_url, file_size)
        
    Raises:
        HTTPException: If upload fails
    """
    from loguru import logger
    import shutil
    
    logger.info(f"Uploading file to local storage: {file.filename}")
    
    try:
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Validate file size
        if not validate_file_size(file_size):
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds maximum limit of {MAX_FILE_SIZE / (1024 * 1024)}MB"
            )
        
        # Validate file extension
        if not validate_file_extension(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Generate unique filename
        unique_filename = generate_unique_filename(file.filename)
        
        # Create uploads directory
        upload_dir = Path("uploads") / folder
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Save file locally
        file_path = upload_dir / unique_filename
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        # Generate URL (relative path that can be served by FastAPI)
        file_url = f"/uploads/{folder}/{unique_filename}"
        
        logger.info(f"File saved locally: {file_path} ({file_size} bytes)")
        
        # Reset file pointer for potential reuse
        await file.seek(0)
        
        return file_url, file_size
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"File upload failed: {str(e)}"
        )


async def delete_file_local(file_url: str) -> bool:
    """
    Delete file from local storage.
    
    Args:
        file_url: File URL (local path)
        
    Returns:
        True if deletion successful, False otherwise
    """
    try:
        # Extract file path from URL
        # URL format: /uploads/resumes/filename.pdf
        if file_url.startswith('/uploads/'):
            file_path = Path(file_url.lstrip('/'))
            
            if file_path.exists():
                file_path.unlink()
                return True
        
        return False
        
    except Exception as e:
        print(f"Error deleting file: {str(e)}")
        return False


def get_file_extension(filename: str) -> str:
    """
    Get file extension from filename.
    
    Args:
        filename: Name of the file
        
    Returns:
        File extension (lowercase, with dot)
    """
    return os.path.splitext(filename)[1].lower()
