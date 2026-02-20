"""
User model for authentication and profile management
"""
from sqlalchemy import Column, String, Enum as SQLEnum, Boolean, Integer, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum


class AccountStatus(str, enum.Enum):
    """User account status"""
    PENDING_VERIFICATION = "pending_verification"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    LOCKED = "locked"


class ExperienceLevel(str, enum.Enum):
    """User experience level"""
    ENTRY = "entry"
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    PRINCIPAL = "principal"


class User(BaseModel):
    """
    User model with authentication and profile fields.
    Supports soft delete and account status management.
    """
    __tablename__ = "users"
    
    # Authentication
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Profile
    name = Column(String(255), nullable=False)
    target_role = Column(String(255), nullable=True, index=True)
    experience_level = Column(SQLEnum(ExperienceLevel), nullable=True)
    
    # Account Management
    account_status = Column(
        SQLEnum(AccountStatus),
        default=AccountStatus.PENDING_VERIFICATION,
        nullable=False
    )
    failed_login_attempts = Column(String(10), default="0", nullable=False)
    last_login_at = Column(String(50), nullable=True)
    
    # Gamification
    total_achievements_count = Column(Integer, default=0, nullable=False)
    leaderboard_opt_out = Column(Boolean, default=False, nullable=False)  # Req 24.10
    
    # Streak Tracking
    last_practice_date = Column(DateTime, nullable=True)
    current_streak = Column(Integer, default=0, nullable=False)
    longest_streak = Column(Integer, default=0, nullable=False)
    streak_history = Column(JSONB, default=[], nullable=False)
    
    # Relationships
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    interview_sessions = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")
    answers = relationship("Answer", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")
    resume_analyses = relationship("ResumeAnalysis", back_populates="user", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="user", cascade="all, delete-orphan")
    company_coaching_sessions = relationship("CompanyCoachingSession", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, status={self.account_status})>"
