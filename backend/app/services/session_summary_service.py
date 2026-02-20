"""
Session Summary Service

This service generates comprehensive session performance summaries.

Requirements: 19.1-19.12
"""
import logging
from typing import Dict, Any, List
from collections import Counter
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.interview_session import InterviewSession, SessionStatus
from app.models.session_summary import SessionSummary
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.models.session_question import SessionQuestion
from app.models.question import Question
from app.services.achievement_service import AchievementService
from app.services.streak_service import StreakService

logger = logging.getLogger(__name__)


class SessionSummaryService:
    """
    Service for generating session performance summaries.
    
    Requirements: 19.1-19.12
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_summary(self, session_id: int, user_id: int) -> Dict[str, Any]:
        """
        Generate comprehensive session summary.
        
        Requirements: 19.1-19.12
        
        Args:
            session_id: ID of the session to summarize
            user_id: ID of the user (for validation)
        
        Returns:
            Dictionary with session summary data
        
        Raises:
            ValueError: If session not found, not owned by user, or not completed
        """
        # Validate session belongs to user and is completed (Req 19.1)
        session = self.db.query(InterviewSession).filter(
            and_(
                InterviewSession.id == session_id,
                InterviewSession.user_id == user_id
            )
        ).first()
        
        if not session:
            raise ValueError(f"Session {session_id} not found or not owned by user {user_id}")
        
        if session.status != SessionStatus.COMPLETED:
            raise ValueError(f"Session {session_id} is not completed (status: {session.status})")
        
        logger.info(f"Generating summary for session {session_id}")
        
        # Check if summary already exists
        existing_summary = self.db.query(SessionSummary).filter(
            SessionSummary.session_id == session_id
        ).first()
        
        if existing_summary:
            logger.info(f"Summary already exists for session {session_id}, returning existing")
            return existing_summary.to_dict()
        
        # Retrieve all answers and evaluations for session (Req 19.2)
        answers = self.db.query(Answer).filter(Answer.session_id == session_id).all()
        
        if not answers:
            raise ValueError(f"No answers found for session {session_id}")
        
        evaluations = []
        for answer in answers:
            if answer.evaluation:
                evaluations.append(answer.evaluation)
        
        # If no evaluations exist, generate them now
        if not evaluations:
            logger.warning(f"No evaluations found for session {session_id}, attempting to generate them now")
            
            try:
                from app.services.evaluation_service import EvaluationService
                evaluation_service = EvaluationService(self.db)
                
                for answer in answers:
                    try:
                        logger.info(f"Generating evaluation for answer {answer.id}")
                        evaluation_service.evaluate_answer(answer.id)
                        # Refresh answer to get the evaluation
                        self.db.refresh(answer)
                        if answer.evaluation:
                            evaluations.append(answer.evaluation)
                    except Exception as e:
                        logger.error(f"Failed to generate evaluation for answer {answer.id}: {e}")
                        continue
                
                # If still no evaluations after attempting to generate them
                if not evaluations:
                    logger.error(f"Failed to generate any evaluations for session {session_id}")
                    raise ValueError(
                        f"Unable to generate evaluations for session {session_id}. "
                        "This may be due to AI provider configuration issues. "
                        "Please check your AI API keys and try again."
                    )
                    
            except Exception as e:
                logger.error(f"Error generating evaluations for session {session_id}: {e}")
                raise ValueError(
                    f"Unable to generate evaluations for session {session_id}. "
                    f"Error: {str(e)}"
                )
        
        logger.info(f"Found {len(evaluations)} evaluations for session {session_id}")
        
        # Calculate average scores for each criterion (Req 19.3)
        avg_content_quality = sum(e.content_quality for e in evaluations) / len(evaluations)
        avg_clarity = sum(e.clarity for e in evaluations) / len(evaluations)
        avg_confidence = sum(e.confidence for e in evaluations) / len(evaluations)
        avg_technical_accuracy = sum(e.technical_accuracy for e in evaluations) / len(evaluations)
        
        # Calculate overall session score (Req 19.4)
        overall_session_score = sum(e.overall_score for e in evaluations) / len(evaluations)
        overall_session_score = round(overall_session_score, 2)
        
        logger.info(f"Overall session score: {overall_session_score}")
        
        # Retrieve previous session score (Req 19.5)
        previous_session = self.db.query(InterviewSession).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.role == session.role,
                InterviewSession.difficulty == session.difficulty,
                InterviewSession.status == SessionStatus.COMPLETED,
                InterviewSession.id < session_id
            )
        ).order_by(InterviewSession.id.desc()).first()
        
        score_trend = None
        previous_session_score = None
        
        if previous_session:
            # Get previous session summary
            prev_summary = self.db.query(SessionSummary).filter(
                SessionSummary.session_id == previous_session.id
            ).first()
            
            if prev_summary:
                previous_session_score = prev_summary.overall_session_score
                # Calculate score trend (Req 19.6)
                if previous_session_score > 0:
                    score_trend = ((overall_session_score - previous_session_score) / previous_session_score) * 100
                    score_trend = round(score_trend, 2)
                    logger.info(f"Score trend: {score_trend}% (previous: {previous_session_score})")
        
        # Aggregate strengths (Req 19.7)
        all_strengths = []
        for evaluation in evaluations:
            if evaluation.strengths:
                all_strengths.extend(evaluation.strengths)
        
        top_strengths = self._get_top_mentions(all_strengths, top_n=3)
        
        # Aggregate improvements (Req 19.8)
        all_improvements = []
        for evaluation in evaluations:
            if evaluation.improvements:
                all_improvements.extend(evaluation.improvements)
        
        top_improvements = self._get_top_mentions(all_improvements, top_n=3)
        
        # Generate category performance breakdown (Req 19.9)
        category_performance = self._calculate_category_performance(session_id, evaluations)
        
        # Calculate total time
        total_time_seconds = sum(answer.time_taken for answer in answers if answer.time_taken)
        
        # Generate visualization data (Req 19.12)
        radar_chart_data = self._generate_radar_chart_data(
            avg_content_quality,
            avg_clarity,
            avg_confidence,
            avg_technical_accuracy
        )
        
        line_chart_data = self._generate_line_chart_data(
            user_id,
            session.role,
            session.difficulty,
            session_id,
            overall_session_score
        )
        
        # Create session summary record (Req 19.10)
        summary = SessionSummary(
            session_id=session_id,
            overall_session_score=overall_session_score,
            avg_content_quality=round(avg_content_quality, 2),
            avg_clarity=round(avg_clarity, 2),
            avg_confidence=round(avg_confidence, 2),
            avg_technical_accuracy=round(avg_technical_accuracy, 2),
            score_trend=score_trend,
            previous_session_score=previous_session_score,
            top_strengths=top_strengths,
            top_improvements=top_improvements,
            category_performance=category_performance,
            radar_chart_data=radar_chart_data,
            line_chart_data=line_chart_data,
            total_questions=len(answers),
            total_time_seconds=total_time_seconds
        )
        
        self.db.add(summary)
        self.db.commit()
        self.db.refresh(summary)
        
        logger.info(f"Session summary {summary.id} created for session {session_id}")
        
        # Update user's practice streak
        try:
            streak_service = StreakService(self.db)
            streak_info = streak_service.update_streak(user_id)
            logger.info(f"Streak updated for user {user_id}: {streak_info}")
        except Exception as e:
            logger.error(f"Error updating streak for user {user_id}: {e}")
            # Don't fail the summary generation if streak update fails
        
        # Check and award achievements after session completion
        try:
            achievement_service = AchievementService(self.db)
            awarded_achievements = achievement_service.check_all_achievements_for_session(user_id, session_id)
            if awarded_achievements:
                logger.info(f"Awarded {len(awarded_achievements)} achievements to user {user_id} for session {session_id}")
        except Exception as e:
            logger.error(f"Error checking achievements for session {session_id}: {e}")
            # Don't fail the summary generation if achievement checking fails
        
        return summary.to_dict()
    
    def _get_top_mentions(self, items: List[str], top_n: int = 3) -> List[str]:
        """
        Get top N most mentioned items from a list.
        
        Args:
            items: List of items to count
            top_n: Number of top items to return
        
        Returns:
            List of top N most mentioned items
        """
        if not items:
            return []
        
        # Count occurrences
        counter = Counter(items)
        
        # Get top N
        top_items = [item for item, count in counter.most_common(top_n)]
        
        return top_items
    
    def _calculate_category_performance(
        self,
        session_id: int,
        evaluations: List[Evaluation]
    ) -> Dict[str, float]:
        """
        Calculate average score per category.
        
        Requirements: 19.9
        
        Args:
            session_id: Session ID
            evaluations: List of evaluations
        
        Returns:
            Dictionary mapping category to average score
        """
        # Get all session questions with their categories
        session_questions = self.db.query(SessionQuestion).filter(
            SessionQuestion.session_id == session_id
        ).all()
        
        # Map question_id to category
        question_categories = {}
        for sq in session_questions:
            question = self.db.query(Question).filter(Question.id == sq.question_id).first()
            if question:
                question_categories[sq.question_id] = question.category
        
        # Get answers to map evaluation to question
        answers = self.db.query(Answer).filter(Answer.session_id == session_id).all()
        answer_to_question = {answer.id: answer.question_id for answer in answers}
        
        # Group evaluations by category
        category_scores = {}
        for evaluation in evaluations:
            question_id = answer_to_question.get(evaluation.answer_id)
            if question_id:
                category = question_categories.get(question_id)
                if category:
                    if category not in category_scores:
                        category_scores[category] = []
                    category_scores[category].append(evaluation.overall_score)
        
        # Calculate average per category
        category_performance = {}
        for category, scores in category_scores.items():
            category_performance[category] = round(sum(scores) / len(scores), 2)
        
        return category_performance
    
    def _generate_radar_chart_data(
        self,
        content_quality: float,
        clarity: float,
        confidence: float,
        technical_accuracy: float
    ) -> Dict[str, Any]:
        """
        Generate radar chart data for criteria scores.
        
        Requirements: 19.12
        
        Args:
            content_quality: Average content quality score
            clarity: Average clarity score
            confidence: Average confidence score
            technical_accuracy: Average technical accuracy score
        
        Returns:
            Dictionary with radar chart data
        """
        return {
            'labels': ['Content Quality', 'Clarity', 'Confidence', 'Technical Accuracy'],
            'values': [
                round(content_quality, 2),
                round(clarity, 2),
                round(confidence, 2),
                round(technical_accuracy, 2)
            ]
        }
    
    def _generate_line_chart_data(
        self,
        user_id: int,
        role: str,
        difficulty: str,
        current_session_id: int,
        current_score: float
    ) -> Dict[str, Any]:
        """
        Generate line chart data for score progression.
        
        Requirements: 19.12
        
        Args:
            user_id: User ID
            role: Job role
            difficulty: Difficulty level
            current_session_id: Current session ID
            current_score: Current session score
        
        Returns:
            Dictionary with line chart data
        """
        # Get all completed sessions for same role and difficulty
        sessions = self.db.query(InterviewSession).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.role == role,
                InterviewSession.difficulty == difficulty,
                InterviewSession.status == SessionStatus.COMPLETED,
                InterviewSession.id <= current_session_id
            )
        ).order_by(InterviewSession.id.asc()).all()
        
        # Get summaries for these sessions
        session_ids = [s.id for s in sessions]
        summaries = self.db.query(SessionSummary).filter(
            SessionSummary.session_id.in_(session_ids)
        ).all()
        
        # Create mapping
        summary_map = {s.session_id: s.overall_session_score for s in summaries}
        
        # Build chart data
        labels = []
        scores = []
        
        for i, session in enumerate(sessions, 1):
            labels.append(f"Session {i}")
            score = summary_map.get(session.id, current_score if session.id == current_session_id else 0)
            scores.append(round(score, 2))
        
        return {
            'labels': labels,
            'scores': scores
        }
