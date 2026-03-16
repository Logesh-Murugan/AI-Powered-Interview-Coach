"""
Interview Session Service

This service handles interview session creation and management.

Requirements: 14.1-14.10
"""
import json
import logging
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.interview_session import InterviewSession, SessionStatus
from app.models.session_question import SessionQuestion
from app.services.cache_service import CacheService
from app.services.question_service import QuestionService

logger = logging.getLogger(__name__)


class InterviewSessionService:
    """Service for managing interview sessions"""
    
    # Redis TTL for session metadata
    SESSION_CACHE_TTL = timedelta(hours=2)  # 2 hours
    
    def __init__(self, db: Session, cache: Optional[CacheService] = None):
        """Initialize interview session service"""
        self.db = db
        self.cache = cache or CacheService()
        self.question_service = QuestionService(db, cache)
    
    def create_session(
        self,
        user_id: int,
        role: str,
        difficulty: str,
        question_count: int,
        categories: Optional[List[str]] = None
    ) -> Dict:
        """
        Create a new interview session.
        
        Requirements: 14.1-14.10
        
        Args:
            user_id: ID of the user creating the session
            role: Target job role
            difficulty: Question difficulty level
            question_count: Number of questions to generate
            categories: Optional list of question categories
            
        Returns:
            Dictionary with session details and first question
        """
        try:
            # Step 1: Generate questions using QuestionService (Req 14.6)
            logger.info(f"Generating {question_count} questions for role={role}, difficulty={difficulty}")
            questions = self.question_service.generate(
                role=role,
                difficulty=difficulty,
                question_count=question_count,
                categories=categories
            )
            
            if not questions or len(questions) < question_count:
                raise Exception(f"Failed to generate {question_count} questions")
            
            logger.info(f"Successfully generated {len(questions)} questions")
            
            # Step 2: Create interview session record (Req 14.7)
            session = InterviewSession(
                user_id=user_id,
                role=role,
                difficulty=difficulty,
                status=SessionStatus.IN_PROGRESS,
                question_count=question_count,
                categories=categories,
                start_time=datetime.utcnow()
            )
            self.db.add(session)
            self.db.flush()  # Get session.id without committing
            
            logger.info(f"Created interview session {session.id} for user {user_id}")
            
            # Step 3: Create session_questions records (Req 14.8)
            session_questions = []
            for idx, question in enumerate(questions, start=1):
                sq = SessionQuestion(
                    session_id=session.id,
                    question_id=question['id'],
                    display_order=idx,
                    status='pending'
                )
                session_questions.append(sq)
                self.db.add(sq)
            
            logger.info(f"Added {len(session_questions)} session_questions to database")
            
            # CRITICAL: Commit everything together
            self.db.commit()
            logger.info(f"✅ COMMITTED: Session {session.id} with {len(session_questions)} questions")
            
            # Step 4: Store session metadata in Redis (Req 14.10)
            try:
                self._cache_session_metadata(session.id, {
                    'user_id': user_id,
                    'role': role,
                    'difficulty': difficulty,
                    'question_count': question_count,
                    'categories': categories,
                    'start_time': session.start_time.isoformat(),
                    'status': session.status.value.lower()
                })
            except Exception as cache_error:
                # Don't fail the whole operation if caching fails
                logger.warning(f"Failed to cache session metadata: {cache_error}")
            
            # Step 5: Return session_id and first question (Req 14.9)
            first_question = questions[0]
            first_question['question_number'] = 1
            
            return {
                'session_id': session.id,
                'role': session.role,
                'difficulty': session.difficulty,
                'status': session.status.value.lower(),
                'question_count': session.question_count,
                'categories': session.categories,
                'start_time': session.start_time,
                'first_question': first_question
            }
            
        except Exception as e:
            logger.error(f"❌ ERROR creating session: {e}", exc_info=True)
            self.db.rollback()
            raise
    
    def get_session(self, session_id: int, user_id: int) -> Optional[InterviewSession]:
        """
        Get interview session by ID.
        
        Args:
            session_id: Session ID
            user_id: User ID (for authorization)
            
        Returns:
            InterviewSession or None
        """
        session = self.db.query(InterviewSession).filter(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user_id,
            InterviewSession.deleted_at.is_(None)
        ).first()
        
        return session
    
    def resume_session(self, session_id: int, user_id: int) -> Dict:
        """
        Resume an in-progress interview session.
        
        Returns the next unanswered question and session progress.
        
        Args:
            session_id: Session ID to resume
            user_id: User ID (for authorization)
            
        Returns:
            Dictionary with session details and next question
            
        Raises:
            ValueError: If session not found, not owned by user, or already completed
        """
        # Get session
        session = self.get_session(session_id, user_id)
        if not session:
            raise ValueError("Session not found or access denied")
        
        # Check if session is resumable
        if session.status == SessionStatus.COMPLETED:
            raise ValueError("Session is already completed")
        
        # Get all session questions with their status
        from app.models.session_question import SessionQuestion
        from app.models.question import Question
        
        session_questions = self.db.query(SessionQuestion).join(Question).filter(
            SessionQuestion.session_id == session_id
        ).order_by(SessionQuestion.display_order).all()
        
        if not session_questions:
            raise ValueError("No questions found for this session")
        
        # Find next unanswered question
        next_question = None
        answered_count = 0
        
        for sq in session_questions:
            if sq.status == 'answered':
                answered_count += 1
            elif sq.status == 'pending' and next_question is None:
                next_question = sq
        
        if not next_question:
            # All questions answered, mark session as completed
            session.status = SessionStatus.COMPLETED
            session.end_time = datetime.utcnow()
            self.db.commit()
            raise ValueError("All questions have been answered. Session is now completed.")
        
        # Get question details
        question = next_question.question
        question_number = next_question.display_order
        
        # Record question displayed timestamp if not already set
        if not next_question.question_displayed_at:
            next_question.question_displayed_at = datetime.utcnow()
            self.db.commit()
        
        # Format response
        return {
            'session_id': session.id,
            'role': session.role,
            'difficulty': session.difficulty,
            'status': session.status.value.lower(),
            'question_count': session.question_count,
            'answered_count': answered_count,
            'progress_percentage': int((answered_count / session.question_count) * 100),
            'next_question': {
                'id': question.id,
                'question_text': question.question_text,
                'category': question.category,
                'difficulty': question.difficulty,
                'time_limit_seconds': question.time_limit_seconds,
                'question_number': question_number
            }
        }
    
    def _cache_session_metadata(self, session_id: int, metadata: Dict) -> None:
        """
        Cache session metadata in Redis with 2-hour TTL.
        
        Requirements: 14.10
        
        Args:
            session_id: Session ID
            metadata: Session metadata dictionary
        """
        try:
            cache_key = f"session:{session_id}:metadata"
            self.cache.set(cache_key, json.dumps(metadata), ttl=self.SESSION_CACHE_TTL)
            logger.info(f"Cached metadata for session {session_id}")
        except Exception as e:
            logger.error(f"Failed to cache session metadata: {e}")
    
    def _get_cached_session_metadata(self, session_id: int) -> Optional[Dict]:
        """
        Get cached session metadata from Redis.
        
        Args:
            session_id: Session ID
            
        Returns:
            Session metadata dictionary or None
        """
        try:
            cache_key = f"session:{session_id}:metadata"
            cached_data = self.cache.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.error(f"Failed to get cached session metadata: {e}")
        return None

