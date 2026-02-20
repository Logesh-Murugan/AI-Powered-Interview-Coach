"""
Achievement service for gamification system.
Requirements: 22.1-22.10
"""
from typing import List, Optional, Dict
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.user_achievement import UserAchievement, AchievementType
from app.models.user import User
from app.models.interview_session import InterviewSession
from app.models.evaluation import Evaluation
from app.models.session_question import SessionQuestion
from app.schemas.achievement import (
    AchievementDefinition,
    UserAchievementResponse,
    AchievementProgress,
    AchievementNotification
)
import logging

logger = logging.getLogger(__name__)


# Achievement definitions with metadata
ACHIEVEMENT_DEFINITIONS = {
    AchievementType.FIRST_INTERVIEW: AchievementDefinition(
        type=AchievementType.FIRST_INTERVIEW,
        name="First Steps",
        description="Complete your first interview session",
        icon="🎯",
        rarity="common"
    ),
    AchievementType.TEN_INTERVIEWS: AchievementDefinition(
        type=AchievementType.TEN_INTERVIEWS,
        name="Getting Started",
        description="Complete 10 interview sessions",
        icon="🚀",
        rarity="common"
    ),
    AchievementType.FIFTY_INTERVIEWS: AchievementDefinition(
        type=AchievementType.FIFTY_INTERVIEWS,
        name="Interview Master",
        description="Complete 50 interview sessions",
        icon="👑",
        rarity="rare"
    ),
    AchievementType.PERFECT_SCORE: AchievementDefinition(
        type=AchievementType.PERFECT_SCORE,
        name="Perfection",
        description="Get a perfect score of 100 on any answer",
        icon="💯",
        rarity="epic"
    ),
    AchievementType.SEVEN_DAY_STREAK: AchievementDefinition(
        type=AchievementType.SEVEN_DAY_STREAK,
        name="Week Warrior",
        description="Practice for 7 consecutive days",
        icon="🔥",
        rarity="rare"
    ),
    AchievementType.THIRTY_DAY_STREAK: AchievementDefinition(
        type=AchievementType.THIRTY_DAY_STREAK,
        name="Dedication Master",
        description="Practice for 30 consecutive days",
        icon="⚡",
        rarity="legendary"
    ),
    AchievementType.CATEGORY_MASTER: AchievementDefinition(
        type=AchievementType.CATEGORY_MASTER,
        name="Category Expert",
        description="Achieve an average score of 90+ in any category (minimum 10 questions)",
        icon="🏆",
        rarity="epic"
    )
}


class AchievementService:
    """Service for managing user achievements."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def check_and_award_achievement(
        self,
        user_id: int,
        achievement_type: AchievementType,
        metadata: Optional[Dict] = None
    ) -> Optional[UserAchievement]:
        """Check if user has earned achievement and award it if not already earned."""
        start_time = datetime.utcnow()
        
        try:
            existing = self.db.query(UserAchievement).filter(
                and_(
                    UserAchievement.user_id == user_id,
                    UserAchievement.achievement_type == achievement_type,
                    UserAchievement.deleted_at.is_(None)
                )
            ).first()
            
            if existing:
                logger.info(f"Achievement {achievement_type} already earned by user {user_id}")
                return None
            
            achievement = UserAchievement(
                user_id=user_id,
                achievement_type=achievement_type,
                earned_at=datetime.utcnow(),
                achievement_metadata=metadata
            )
            self.db.add(achievement)
            
            user = self.db.query(User).filter(User.id == user_id).first()
            if user:
                user.total_achievements_count = str(int(user.total_achievements_count or 0) + 1)
            
            self.db.commit()
            self.db.refresh(achievement)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds() * 1000
            logger.info(f"Achievement {achievement_type} awarded to user {user_id} in {elapsed:.2f}ms")
            
            return achievement
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error awarding achievement {achievement_type} to user {user_id}: {e}")
            raise
    
    def check_first_interview(self, user_id: int) -> Optional[UserAchievement]:
        """Check and award First_Interview achievement."""
        completed_count = self.db.query(func.count(InterviewSession.id)).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == 'completed',
                InterviewSession.deleted_at.is_(None)
            )
        ).scalar()
        
        if completed_count >= 1:
            return self.check_and_award_achievement(user_id, AchievementType.FIRST_INTERVIEW)
        return None
    
    def check_ten_interviews(self, user_id: int) -> Optional[UserAchievement]:
        """Check and award Ten_Interviews achievement."""
        completed_count = self.db.query(func.count(InterviewSession.id)).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == 'completed',
                InterviewSession.deleted_at.is_(None)
            )
        ).scalar()
        
        if completed_count >= 10:
            return self.check_and_award_achievement(user_id, AchievementType.TEN_INTERVIEWS)
        return None
    
    def check_fifty_interviews(self, user_id: int) -> Optional[UserAchievement]:
        """Check and award Fifty_Interviews achievement."""
        completed_count = self.db.query(func.count(InterviewSession.id)).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == 'completed',
                InterviewSession.deleted_at.is_(None)
            )
        ).scalar()
        
        if completed_count >= 50:
            return self.check_and_award_achievement(user_id, AchievementType.FIFTY_INTERVIEWS)
        return None
    
    def check_perfect_score(self, user_id: int, evaluation_id: int) -> Optional[UserAchievement]:
        """Check and award Perfect_Score achievement."""
        evaluation = self.db.query(Evaluation).filter(
            and_(
                Evaluation.id == evaluation_id,
                Evaluation.deleted_at.is_(None)
            )
        ).first()
        
        if evaluation and evaluation.overall_score == 100:
            return self.check_and_award_achievement(user_id, AchievementType.PERFECT_SCORE)
        return None
    
    def check_category_master(self, user_id: int, category: str) -> Optional[UserAchievement]:
        """Check and award Category_Master achievement."""
        result = self.db.query(
            func.avg(Evaluation.overall_score).label('avg_score'),
            func.count(Evaluation.id).label('count')
        ).join(
            SessionQuestion, Evaluation.session_question_id == SessionQuestion.id
        ).filter(
            and_(
                SessionQuestion.category == category,
                Evaluation.deleted_at.is_(None),
                SessionQuestion.deleted_at.is_(None)
            )
        ).first()
        
        if result and result.count >= 10 and result.avg_score >= 90:
            metadata = {"category": category}
            return self.check_and_award_achievement(
                user_id,
                AchievementType.CATEGORY_MASTER,
                metadata=metadata
            )
        return None
    
    def check_all_achievements_for_session(self, user_id: int, session_id: int) -> List[UserAchievement]:
        """Check all applicable achievements after session completion."""
        awarded = []
        
        for check_func in [self.check_first_interview, self.check_ten_interviews, self.check_fifty_interviews]:
            achievement = check_func(user_id)
            if achievement:
                awarded.append(achievement)
        
        session = self.db.query(InterviewSession).filter(
            and_(
                InterviewSession.id == session_id,
                InterviewSession.deleted_at.is_(None)
            )
        ).first()
        
        if session:
            for sq in session.session_questions:
                if sq.evaluation:
                    achievement = self.check_perfect_score(user_id, sq.evaluation.id)
                    if achievement:
                        awarded.append(achievement)
                
                if sq.category:
                    achievement = self.check_category_master(user_id, sq.category)
                    if achievement:
                        awarded.append(achievement)
        
        return awarded
    
    def get_all_achievements(self) -> List[AchievementDefinition]:
        """Get all available achievement definitions."""
        return list(ACHIEVEMENT_DEFINITIONS.values())
    
    def get_user_achievements(self, user_id: int) -> List[UserAchievement]:
        """Get all achievements earned by a user."""
        return self.db.query(UserAchievement).filter(
            and_(
                UserAchievement.user_id == user_id,
                UserAchievement.deleted_at.is_(None)
            )
        ).order_by(UserAchievement.earned_at.desc()).all()
    
    def get_achievement_progress(self, user_id: int) -> List[AchievementProgress]:
        """Get progress toward all achievements for a user."""
        progress_list = []
        
        earned_achievements = {
            ua.achievement_type: ua
            for ua in self.get_user_achievements(user_id)
        }
        
        completed_count = self.db.query(func.count(InterviewSession.id)).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == 'completed',
                InterviewSession.deleted_at.is_(None)
            )
        ).scalar() or 0
        
        has_perfect_score = self.db.query(Evaluation).join(
            SessionQuestion
        ).join(
            InterviewSession
        ).filter(
            and_(
                InterviewSession.user_id == user_id,
                Evaluation.overall_score == 100,
                Evaluation.deleted_at.is_(None)
            )
        ).first() is not None
        
        user = self.db.query(User).filter(User.id == user_id).first()
        current_streak = int(user.current_streak) if user and user.current_streak else 0
        
        for achievement_type, definition in ACHIEVEMENT_DEFINITIONS.items():
            is_earned = achievement_type in earned_achievements
            earned_at = earned_achievements[achievement_type].earned_at if is_earned else None
            
            if achievement_type == AchievementType.FIRST_INTERVIEW:
                current = min(completed_count, 1)
                target = 1
            elif achievement_type == AchievementType.TEN_INTERVIEWS:
                current = min(completed_count, 10)
                target = 10
            elif achievement_type == AchievementType.FIFTY_INTERVIEWS:
                current = min(completed_count, 50)
                target = 50
            elif achievement_type == AchievementType.PERFECT_SCORE:
                current = 1 if has_perfect_score else 0
                target = 1
            elif achievement_type == AchievementType.SEVEN_DAY_STREAK:
                current = min(current_streak, 7)
                target = 7
            elif achievement_type == AchievementType.THIRTY_DAY_STREAK:
                current = min(current_streak, 30)
                target = 30
            elif achievement_type == AchievementType.CATEGORY_MASTER:
                current = 1 if is_earned else 0
                target = 1
            else:
                current = 0
                target = 1
            
            progress_percentage = (current / target * 100) if target > 0 else 0
            
            progress_list.append(AchievementProgress(
                achievement_type=achievement_type,
                name=definition.name,
                description=definition.description,
                icon=definition.icon,
                is_earned=is_earned,
                earned_at=earned_at,
                current_progress=current,
                target_progress=target,
                progress_percentage=round(progress_percentage, 2)
            ))
        
        return progress_list
