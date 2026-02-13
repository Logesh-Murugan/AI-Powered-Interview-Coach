"""
Unit tests for Resume Upload functionality

Tests Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9
"""
import pytest
import io
from fastapi import UploadFile
from unittest.mock import Mock, patch, AsyncMock
from app.services.resume_service import ResumeService
from app.models.resume import Resume, ResumeStatus
from app.models.user import User, AccountStatus
from app.database import SessionLocal


@pytest.fixture
def db_session():
    """Create a database session for testing"""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def test_user(db_session):
    """Create a test user"""
    import uuid
    unique_email = f"resume_test_{uuid.uuid4().hex[:8]}@example.com"
    user = User(
        email=unique_email,
        password_hash="hashed_password",
        name="Resume Test User",
        account_status=AccountStatus.ACTIVE
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    yield user
    
    # Cleanup
    try:
        db_session.query(Resume).filter(Resume.user_id == user.id).delete()
        db_session.delete(user)
        db_session.commit()
    except Exception:
        db_session.rollback()


class TestResumeUpload:
    """Test resume upload functionality"""
    
    @pytest.mark.asyncio
    async def test_upload_resume_success(self, db_session, test_user):
        """Test successful resume upload"""
        # Create mock file
        file_content = b"PDF file content"
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "test_resume.pdf"
        mock_file.read = AsyncMock(return_value=file_content)
        mock_file.seek = AsyncMock()
        
        # Mock Cloudinary upload
        with patch('app.utils.file_upload.cloudinary.uploader.upload') as mock_upload:
            mock_upload.return_value = {
                'secure_url': 'https://res.cloudinary.com/test/resumes/test_resume.pdf'
            }
            
            # Mock BackgroundTasks
            mock_bg_tasks = Mock()
            
            # Upload resume
            service = ResumeService(db_session)
            result = await service.upload_resume(mock_file, test_user.id, mock_bg_tasks)
            
            # Assertions
            assert result.resume_id is not None
            assert result.filename == "test_resume.pdf"
            assert result.file_url.startswith("https://")
            assert result.status == ResumeStatus.UPLOADED.value
            assert "successfully" in result.message.lower()
    
    @pytest.mark.asyncio
    async def test_upload_resume_invalid_user(self, db_session):
        """Test upload with invalid user ID"""
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "test.pdf"
        mock_bg_tasks = Mock()
        
        service = ResumeService(db_session)
        
        with pytest.raises(Exception) as exc_info:
            await service.upload_resume(mock_file, 99999, mock_bg_tasks)
        
        assert "not found" in str(exc_info.value).lower()
    
    def test_get_resume(self, db_session, test_user):
        """Test getting resume by ID"""
        # Create resume
        resume = Resume(
            user_id=test_user.id,
            filename="test.pdf",
            file_url="https://example.com/test.pdf",
            status=ResumeStatus.UPLOADED.value
        )
        db_session.add(resume)
        db_session.commit()
        db_session.refresh(resume)
        
        # Get resume
        service = ResumeService(db_session)
        result = service.get_resume(resume.id, test_user.id)
        
        assert result is not None
        assert result.id == resume.id
        assert result.filename == "test.pdf"
    
    def test_get_resume_wrong_user(self, db_session, test_user):
        """Test getting resume with wrong user ID"""
        # Create resume
        resume = Resume(
            user_id=test_user.id,
            filename="test.pdf",
            file_url="https://example.com/test.pdf"
        )
        db_session.add(resume)
        db_session.commit()
        
        # Try to get with wrong user ID
        service = ResumeService(db_session)
        result = service.get_resume(resume.id, 99999)
        
        assert result is None
    
    def test_get_user_resumes(self, db_session, test_user):
        """Test getting all resumes for a user"""
        # Create multiple resumes
        resume1 = Resume(
            user_id=test_user.id,
            filename="resume1.pdf",
            file_url="https://example.com/resume1.pdf"
        )
        resume2 = Resume(
            user_id=test_user.id,
            filename="resume2.pdf",
            file_url="https://example.com/resume2.pdf"
        )
        
        db_session.add_all([resume1, resume2])
        db_session.commit()
        
        # Get all resumes
        service = ResumeService(db_session)
        results = service.get_user_resumes(test_user.id)
        
        assert len(results) == 2
        assert all(r.user_id == test_user.id for r in results)
    
    def test_delete_resume(self, db_session, test_user):
        """Test soft delete resume"""
        # Create resume
        resume = Resume(
            user_id=test_user.id,
            filename="test.pdf",
            file_url="https://example.com/test.pdf"
        )
        db_session.add(resume)
        db_session.commit()
        resume_id = resume.id
        
        # Delete resume
        service = ResumeService(db_session)
        deleted = service.delete_resume(resume_id, test_user.id)
        
        assert deleted is True
        
        # Verify soft delete
        resume = db_session.query(Resume).filter(Resume.id == resume_id).first()
        assert resume.deleted_at is not None
    
    def test_update_resume_status(self, db_session, test_user):
        """Test updating resume status"""
        # Create resume
        resume = Resume(
            user_id=test_user.id,
            filename="test.pdf",
            file_url="https://example.com/test.pdf",
            status=ResumeStatus.UPLOADED.value
        )
        db_session.add(resume)
        db_session.commit()
        resume_id = resume.id
        
        # Update status
        service = ResumeService(db_session)
        updated = service.update_resume_status(
            resume_id,
            ResumeStatus.TEXT_EXTRACTED.value,
            extracted_text="Sample extracted text"
        )
        
        assert updated is not None
        assert updated.status == ResumeStatus.TEXT_EXTRACTED.value
        assert updated.extracted_text == "Sample extracted text"


class TestFileValidation:
    """Test file validation utilities"""
    
    def test_validate_file_extension_pdf(self):
        """Test PDF extension validation"""
        from app.utils.file_upload import validate_file_extension
        
        assert validate_file_extension("resume.pdf") is True
        assert validate_file_extension("resume.PDF") is True
    
    def test_validate_file_extension_docx(self):
        """Test DOCX extension validation"""
        from app.utils.file_upload import validate_file_extension
        
        assert validate_file_extension("resume.docx") is True
        assert validate_file_extension("resume.DOCX") is True
    
    def test_validate_file_extension_invalid(self):
        """Test invalid extension validation"""
        from app.utils.file_upload import validate_file_extension
        
        assert validate_file_extension("resume.txt") is False
        assert validate_file_extension("resume.doc") is False
        assert validate_file_extension("resume.jpg") is False
    
    def test_validate_file_size_valid(self):
        """Test valid file size"""
        from app.utils.file_upload import validate_file_size, MAX_FILE_SIZE
        
        assert validate_file_size(1024) is True  # 1KB
        assert validate_file_size(MAX_FILE_SIZE) is True  # Exactly 10MB
    
    def test_validate_file_size_invalid(self):
        """Test invalid file size"""
        from app.utils.file_upload import validate_file_size, MAX_FILE_SIZE
        
        assert validate_file_size(MAX_FILE_SIZE + 1) is False  # Over 10MB
    
    def test_generate_unique_filename(self):
        """Test unique filename generation"""
        from app.utils.file_upload import generate_unique_filename
        
        filename1 = generate_unique_filename("resume.pdf")
        filename2 = generate_unique_filename("resume.pdf")
        
        # Should be different
        assert filename1 != filename2
        
        # Should contain original extension
        assert filename1.endswith(".pdf")
        assert filename2.endswith(".pdf")
        
        # Should contain UUID prefix
        assert len(filename1) > len("resume.pdf")
