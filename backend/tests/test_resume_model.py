"""
Unit tests for Resume model

Tests Requirements: 6.7, 6.8, 6.9, 6.10
"""
import pytest
import uuid
from datetime import datetime
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
    """Create a test user with unique email"""
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    user = User(
        email=unique_email,
        password_hash="hashed_password",
        name="Test User",
        account_status=AccountStatus.ACTIVE
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Cleanup after test
    yield user
    
    # Delete test user and associated resumes after test
    try:
        db_session.query(Resume).filter(Resume.user_id == user.id).delete()
        db_session.delete(user)
        db_session.commit()
    except Exception:
        db_session.rollback()


class TestResumeModel:
    """Test Resume model functionality"""
    
    def test_create_resume(self, db_session, test_user):
        """Test creating a resume record"""
        resume = Resume(
            user_id=test_user.id,
            filename="test_resume.pdf",
            file_url="https://example.com/resumes/test_resume.pdf",
            file_size=1024000,
            status=ResumeStatus.UPLOADED.value
        )
        
        db_session.add(resume)
        db_session.commit()
        db_session.refresh(resume)
        
        assert resume.id is not None
        assert resume.user_id == test_user.id
        assert resume.filename == "test_resume.pdf"
        assert resume.file_url == "https://example.com/resumes/test_resume.pdf"
        assert resume.file_size == 1024000
        assert resume.status == ResumeStatus.UPLOADED.value
        assert resume.created_at is not None
        assert resume.updated_at is not None
    
    def test_resume_with_jsonb_fields(self, db_session, test_user):
        """Test resume with JSONB fields for skills, experience, education"""
        skills_data = {
            "technical_skills": ["Python", "JavaScript", "SQL"],
            "soft_skills": ["Leadership", "Communication"],
            "tools": ["Git", "Docker", "AWS"],
            "languages": ["English", "Spanish"]
        }
        
        experience_data = [
            {
                "job_title": "Software Engineer",
                "company_name": "Tech Corp",
                "start_date": "2020-01-01",
                "end_date": "2022-12-31",
                "duration_months": 36,
                "description": "Built scalable systems"
            }
        ]
        
        education_data = [
            {
                "degree_type": "Bachelor",
                "institution_name": "University of Tech",
                "field_of_study": "Computer Science",
                "graduation_year": 2019
            }
        ]
        
        resume = Resume(
            user_id=test_user.id,
            filename="test_resume.pdf",
            file_url="https://example.com/resumes/test_resume.pdf",
            skills=skills_data,
            experience=experience_data,
            education=education_data,
            status=ResumeStatus.COMPLETED.value
        )
        
        db_session.add(resume)
        db_session.commit()
        db_session.refresh(resume)
        
        assert resume.skills == skills_data
        assert resume.experience == experience_data
        assert resume.education == education_data
        assert len(resume.skills["technical_skills"]) == 3
        assert resume.experience[0]["job_title"] == "Software Engineer"
        assert resume.education[0]["degree_type"] == "Bachelor"
    
    def test_resume_status_enum(self, db_session, test_user):
        """Test resume status values"""
        resume = Resume(
            user_id=test_user.id,
            filename="test.pdf",
            file_url="https://example.com/test.pdf",
            status=ResumeStatus.UPLOADED.value
        )
        
        db_session.add(resume)
        db_session.commit()
        
        # Test status transitions
        resume.status = ResumeStatus.TEXT_EXTRACTED.value
        db_session.commit()
        assert resume.status == ResumeStatus.TEXT_EXTRACTED.value
        
        resume.status = ResumeStatus.SKILLS_EXTRACTED.value
        db_session.commit()
        assert resume.status == ResumeStatus.SKILLS_EXTRACTED.value
        
        resume.status = ResumeStatus.COMPLETED.value
        db_session.commit()
        assert resume.status == ResumeStatus.COMPLETED.value
    
    def test_resume_foreign_key_constraint(self, db_session, test_user):
        """Test foreign key relationship to users table"""
        resume = Resume(
            user_id=test_user.id,
            filename="test.pdf",
            file_url="https://example.com/test.pdf"
        )
        
        db_session.add(resume)
        db_session.commit()
        db_session.refresh(resume)
        
        # Test relationship
        assert resume.user is not None
        assert resume.user.id == test_user.id
        assert resume.user.email == test_user.email
    
    def test_resume_soft_delete(self, db_session, test_user):
        """Test soft delete functionality"""
        resume = Resume(
            user_id=test_user.id,
            filename="test.pdf",
            file_url="https://example.com/test.pdf"
        )
        
        db_session.add(resume)
        db_session.commit()
        
        # Soft delete
        resume.soft_delete()
        db_session.commit()
        
        assert resume.deleted_at is not None
        assert resume.is_deleted is True
    
    def test_resume_properties(self, db_session, test_user):
        """Test resume helper properties"""
        resume = Resume(
            user_id=test_user.id,
            filename="test.pdf",
            file_url="https://example.com/test.pdf",
            status=ResumeStatus.UPLOADED.value
        )
        
        # Test is_processing_complete
        assert resume.is_processing_complete is False
        resume.status = ResumeStatus.COMPLETED.value
        assert resume.is_processing_complete is True
        
        # Test has_skills
        assert resume.has_skills is False
        resume.skills = {"technical_skills": ["Python"]}
        assert resume.has_skills is True
        
        # Test has_experience
        assert resume.has_experience is False
        resume.experience = [{"job_title": "Engineer"}]
        assert resume.has_experience is True
        
        # Test has_education
        assert resume.has_education is False
        resume.education = [{"degree_type": "Bachelor"}]
        assert resume.has_education is True
    
    def test_resume_metadata_fields(self, db_session, test_user):
        """Test resume metadata fields"""
        resume = Resume(
            user_id=test_user.id,
            filename="test.pdf",
            file_url="https://example.com/test.pdf",
            total_experience_months=48,
            seniority_level="Senior"
        )
        
        db_session.add(resume)
        db_session.commit()
        db_session.refresh(resume)
        
        assert resume.total_experience_months == 48
        assert resume.seniority_level == "Senior"
    
    def test_resume_extracted_text(self, db_session, test_user):
        """Test storing extracted text"""
        long_text = "This is a sample resume text. " * 100
        
        resume = Resume(
            user_id=test_user.id,
            filename="test.pdf",
            file_url="https://example.com/test.pdf",
            extracted_text=long_text,
            status=ResumeStatus.TEXT_EXTRACTED.value
        )
        
        db_session.add(resume)
        db_session.commit()
        db_session.refresh(resume)
        
        assert resume.extracted_text == long_text
        assert len(resume.extracted_text) > 1000
    
    def test_multiple_resumes_per_user(self, db_session, test_user):
        """Test user can have multiple resumes"""
        resume1 = Resume(
            user_id=test_user.id,
            filename="resume_v1.pdf",
            file_url="https://example.com/resume_v1.pdf"
        )
        
        resume2 = Resume(
            user_id=test_user.id,
            filename="resume_v2.pdf",
            file_url="https://example.com/resume_v2.pdf"
        )
        
        db_session.add_all([resume1, resume2])
        db_session.commit()
        
        # Query user's resumes
        user_resumes = db_session.query(Resume).filter(Resume.user_id == test_user.id).all()
        assert len(user_resumes) == 2
    
    def test_resume_cascade_delete(self, db_session, test_user):
        """Test cascade delete when user is deleted"""
        resume = Resume(
            user_id=test_user.id,
            filename="test.pdf",
            file_url="https://example.com/test.pdf"
        )
        
        db_session.add(resume)
        db_session.commit()
        resume_id = resume.id
        
        # Delete user (should cascade to resumes)
        db_session.delete(test_user)
        db_session.commit()
        
        # Verify resume is deleted
        deleted_resume = db_session.query(Resume).filter(Resume.id == resume_id).first()
        assert deleted_resume is None
    
    def test_resume_repr(self, db_session, test_user):
        """Test resume string representation"""
        resume = Resume(
            user_id=test_user.id,
            filename="test.pdf",
            file_url="https://example.com/test.pdf",
            status=ResumeStatus.UPLOADED.value
        )
        
        db_session.add(resume)
        db_session.commit()
        db_session.refresh(resume)
        
        repr_str = repr(resume)
        assert "Resume" in repr_str
        assert str(resume.id) in repr_str
        assert str(test_user.id) in repr_str
        assert "test.pdf" in repr_str
        assert ResumeStatus.UPLOADED.value in repr_str
