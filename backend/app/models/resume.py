"""
Resume model for storing user resumes with NLP-extracted data
"""
from sqlalchemy import Column, String, Integer, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum


class ResumeStatus(str, enum.Enum):
    """Resume processing status"""
    UPLOADED = "uploaded"
    TEXT_EXTRACTED = "text_extracted"
    SKILLS_EXTRACTED = "skills_extracted"
    EXPERIENCE_PARSED = "experience_parsed"
    EDUCATION_PARSED = "education_parsed"
    COMPLETED = "completed"
    EXTRACTION_FAILED = "extraction_failed"


class Resume(BaseModel):
    """
    Resume model with JSONB fields for skills, experience, and education.
    Supports NLP-based parsing and structured data storage.
    
    Requirements: 6.7, 6.8, 6.9, 6.10
    """
    __tablename__ = "resumes"
    
    # Foreign key to users table
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # File information
    filename = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)  # Size in bytes
    
    # Extracted text
    extracted_text = Column(Text, nullable=True)
    
    # NLP-extracted structured data (JSONB for flexible schema)
    skills = Column(JSONB, nullable=True)
    # Structure: {
    #   "technical_skills": ["Python", "JavaScript"],
    #   "soft_skills": ["Leadership", "Communication"],
    #   "tools": ["Git", "Docker"],
    #   "languages": ["English", "Spanish"]
    # }
    
    experience = Column(JSONB, nullable=True)
    # Structure: [
    #   {
    #     "job_title": "Software Engineer",
    #     "company_name": "Tech Corp",
    #     "start_date": "2020-01-01",
    #     "end_date": "2022-12-31",
    #     "duration_months": 36,
    #     "description": "Built scalable systems..."
    #   }
    # ]
    
    education = Column(JSONB, nullable=True)
    # Structure: [
    #   {
    #     "degree_type": "Bachelor",
    #     "institution_name": "University of Tech",
    #     "field_of_study": "Computer Science",
    #     "graduation_year": 2019
    #   }
    # ]
    
    # Processing status
    status = Column(
        String(50),
        default=ResumeStatus.UPLOADED.value,
        nullable=False,
        index=True
    )
    
    # Metadata
    total_experience_months = Column(Integer, nullable=True)
    seniority_level = Column(String(50), nullable=True)  # Entry, Mid, Senior, Staff
    
    # Relationships
    user = relationship("User", back_populates="resumes")
    
    def __repr__(self):
        return f"<Resume(id={self.id}, user_id={self.user_id}, filename={self.filename}, status={self.status})>"
    
    @property
    def is_processing_complete(self) -> bool:
        """Check if resume processing is complete"""
        return self.status == ResumeStatus.COMPLETED
    
    @property
    def has_skills(self) -> bool:
        """Check if skills have been extracted"""
        return self.skills is not None and len(self.skills) > 0
    
    @property
    def has_experience(self) -> bool:
        """Check if experience has been parsed"""
        return self.experience is not None and len(self.experience) > 0
    
    @property
    def has_education(self) -> bool:
        """Check if education has been parsed"""
        return self.education is not None and len(self.education) > 0
