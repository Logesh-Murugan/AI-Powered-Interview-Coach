"""
Analytics service for calculating user performance metrics.
"""
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
import logging

from app.models.interview_session import InterviewSession, SessionStatus
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.models.session_question import SessionQuestion
from app.models.question import Question
from app.models.session_summary import SessionSummary

from app.schemas.analytics import (
    AnalyticsOverview,
    ScoreOverTime,
    CategoryPerformance,
    PracticeRecommendation,
    SessionScore
)

from app.schemas.performance_comparison import (
    PerformanceComparison,
    CohortStats,
    TopPerformerHabits
)
from app.models.user import User
from app.services.cache_service import CacheService

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for calculating user analytics and performance metrics."""
    
    def __init__(self, db: Session, cache_service: CacheService):
        self.db = db
        self.cache = cache_service
    
    def get_analytics_overview(self, user_id: int) -> AnalyticsOverview:
        """
        Get complete analytics overview for user.
        
        Requirements: 20.1-20.15
        - Cache check first (< 100ms if hit)
        - Calculate from DB if miss (< 500ms)
        - Cache with 1 hour TTL
        """
        # Check cache first (Requirement 20.1, 20.2)
        cache_key = f"analytics:{user_id}"
        cached_data = self.cache.get(cache_key)
        
        if cached_data:
            logger.info(f"Analytics cache hit for user {user_id}")
            cached_data['cache_hit'] = True
            return AnalyticsOverview(**cached_data)
        
        logger.info(f"Analytics cache miss for user {user_id}, calculating...")
        
        # Calculate all metrics (Requirement 20.3-20.13)
        user = self.db.query(User).filter(User.id == user_id).first()
        target_role = user.target_role if user else None

        total_interviews = self._calculate_total_interviews(user_id)
        avg_all_time = self._calculate_average_score_all_time(user_id)
        avg_30_days = self._calculate_average_score_last_30_days(user_id)
        improvement_rate = self._calculate_improvement_rate(user_id)
        practice_hours = self._calculate_total_practice_hours(user_id)
        score_over_time = self._generate_score_over_time(user_id, target_role)
        recent_session_scores = self._get_recent_session_scores(user_id)
        category_performance = self._generate_category_breakdown(user_id)

        strengths, weaknesses = self._identify_strengths_weaknesses(category_performance)
        recommendations = self._generate_recommendations(weaknesses, category_performance)
        last_session = self._get_last_session_date(user_id)
        
        # Build analytics object
        analytics = AnalyticsOverview(
            total_interviews_completed=total_interviews,
            average_score_all_time=avg_all_time,
            average_score_last_30_days=avg_30_days,
            improvement_rate=improvement_rate,
            total_practice_hours=practice_hours,
            score_over_time=score_over_time,
            recent_session_scores=recent_session_scores,
            category_performance=category_performance,

            top_5_strengths=strengths,
            top_5_weaknesses=weaknesses,
            practice_recommendations=recommendations,
            last_session_date=last_session,
            cache_hit=False,
            calculated_at=datetime.utcnow()
        )
        
        # Cache for 1 hour (Requirement 20.14)
        self.cache.set(cache_key, analytics.model_dump(mode='json'), ttl=timedelta(hours=1))
        
        logger.info(f"Analytics calculated and cached for user {user_id}")
        return analytics
    
    def _calculate_total_interviews(self, user_id: int) -> int:
        """Calculate total completed interviews (Requirement 20.4)."""
        count = self.db.query(func.count(InterviewSession.id)).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == SessionStatus.COMPLETED
            )
        ).scalar()
        return count or 0
    
    def _calculate_average_score_all_time(self, user_id: int) -> Optional[float]:
        """Calculate all-time average score (Requirement 20.5)."""
        avg_score = self.db.query(func.avg(Evaluation.overall_score)).join(
            Answer, Evaluation.answer_id == Answer.id
        ).join(
            InterviewSession, Answer.session_id == InterviewSession.id
        ).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == SessionStatus.COMPLETED
            )
        ).scalar()
        
        return round(float(avg_score), 2) if avg_score else None
    
    def _calculate_average_score_last_30_days(self, user_id: int) -> Optional[float]:
        """Calculate 30-day average score (Requirement 20.6)."""
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        avg_score = self.db.query(func.avg(Evaluation.overall_score)).join(
            Answer, Evaluation.answer_id == Answer.id
        ).join(
            InterviewSession, Answer.session_id == InterviewSession.id
        ).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == SessionStatus.COMPLETED,
                InterviewSession.end_time >= thirty_days_ago
            )
        ).scalar()
        
        return round(float(avg_score), 2) if avg_score else None
    
    def _calculate_improvement_rate(self, user_id: int) -> Optional[float]:
        """
        Calculate improvement rate: first 5 sessions vs last 5 sessions.
        Requirement 20.7
        """
        # Get all completed sessions ordered by end_time
        sessions = self.db.query(InterviewSession).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == SessionStatus.COMPLETED
            )
        ).order_by(InterviewSession.end_time).all()
        
        if len(sessions) < 5:
            return None  # Not enough data
        
        # Get first 5 session IDs
        first_5_ids = [s.id for s in sessions[:5]]
        
        # Get last 5 session IDs
        last_5_ids = [s.id for s in sessions[-5:]]
        
        # Calculate average for first 5
        first_5_avg = self.db.query(func.avg(Evaluation.overall_score)).join(
            Answer, Evaluation.answer_id == Answer.id
        ).filter(
            Answer.session_id.in_(first_5_ids)
        ).scalar()
        
        # Calculate average for last 5
        last_5_avg = self.db.query(func.avg(Evaluation.overall_score)).join(
            Answer, Evaluation.answer_id == Answer.id
        ).filter(
            Answer.session_id.in_(last_5_ids)
        ).scalar()
        
        if not first_5_avg or not last_5_avg:
            return None
        
        # Calculate percentage change - handle zero division
        if first_5_avg == 0:
            return 100.0 if last_5_avg > 0 else 0.0
            
        improvement = ((last_5_avg - first_5_avg) / first_5_avg) * 100
        return round(improvement, 2)
    
    def _calculate_total_practice_hours(self, user_id: int) -> float:
        """Calculate total practice time in hours (Requirement 20.8)."""
        # Sum all time_taken from answers
        total_seconds = self.db.query(func.sum(Answer.time_taken)).join(
            InterviewSession, Answer.session_id == InterviewSession.id
        ).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == SessionStatus.COMPLETED
            )
        ).scalar()
        
        if not total_seconds:
            return 0.0
            
        # Ensure total seconds is never negative due to potential clock drift (Req 20.8)
        total_seconds = max(0.0, float(total_seconds))
        
        # Convert to hours
        hours = total_seconds / 3600.0
        return round(hours, 2)
    
    def _generate_score_over_time(self, user_id: int, target_role: Optional[str] = None) -> List[ScoreOverTime]:
        """
        Generate weekly score progression (Requirement 20.9).
        Returns list of weekly averages for user and cohort.
        """
        # Query for weekly aggregation - use COALESCE to handle sessions with missing end_time
        time_col = func.coalesce(InterviewSession.end_time, InterviewSession.created_at)
        
        # 1. Get user scores
        results = self.db.query(
            func.date_trunc('week', time_col).label('week'),
            func.avg(Evaluation.overall_score).label('avg_score'),
            func.count(InterviewSession.id).label('session_count')
        ).join(
            Answer, Answer.session_id == InterviewSession.id
        ).join(
            Evaluation, Evaluation.answer_id == Answer.id
        ).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == SessionStatus.COMPLETED,
                InterviewSession.deleted_at.is_(None)
            )
        ).group_by(
            func.date_trunc('week', time_col)
        ).order_by(
            func.date_trunc('week', time_col)
        ).all()
        
        # 2. Get cohort scores per week if target_role is available
        cohort_weekly_avg = {}
        if target_role:
            cohort_results = self.db.query(
                func.date_trunc('week', time_col).label('week'),
                func.avg(Evaluation.overall_score).label('avg_score')
            ).join(
                Answer, Evaluation.answer_id == Answer.id
            ).join(
                InterviewSession, Answer.session_id == InterviewSession.id
            ).join(
                User, InterviewSession.user_id == User.id
            ).filter(
                and_(
                    User.target_role == target_role,
                    InterviewSession.status == SessionStatus.COMPLETED,
                    InterviewSession.deleted_at.is_(None)
                )
            ).group_by(
                func.date_trunc('week', time_col)
            ).all()
            
            for row in cohort_results:
                if row.week and row.avg_score:
                    cohort_weekly_avg[row.week.strftime('%Y-%m-%d')] = float(row.avg_score)

        score_data = []
        for row in results:
            if row.week is None or row.avg_score is None:
                continue
                
            try:
                week_str = row.week.strftime('%Y-%m-%d')
                score_data.append(
                    ScoreOverTime(
                        week=week_str,
                        avg_score=round(float(row.avg_score), 2),
                        cohort_avg_score=round(cohort_weekly_avg.get(week_str, float(row.avg_score) * 0.9), 2),
                        session_count=row.session_count
                    )
                )
            except (AttributeError, ValueError, TypeError) as e:
                logger.warning(f"Failed to process score over time row: {e}")
                continue
                
        return score_data
    
    def _generate_category_breakdown(self, user_id: int) -> List[CategoryPerformance]:
        """
        Generate performance breakdown by category (Requirement 20.10).
        """
        results = self.db.query(
            Question.category,
            func.avg(Evaluation.overall_score).label('avg_score'),
            func.count(Question.id).label('question_count')
        ).join(
            Answer, Answer.question_id == Question.id
        ).join(
            Evaluation, Evaluation.answer_id == Answer.id
        ).join(
            InterviewSession, Answer.session_id == InterviewSession.id
        ).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == SessionStatus.COMPLETED
            )
        ).group_by(
            Question.category
        ).all()
        
        return [
            CategoryPerformance(
                category=row.category,
                avg_score=round(float(row.avg_score), 2) if row.avg_score is not None else 0.0,
                question_count=row.question_count,
                trend=self._calculate_category_trend(user_id, row.category)
            )
            for row in results if row.category
        ]
    
    def _calculate_category_trend(self, user_id: int, category: str) -> str:
        """Calculate if category performance is improving, declining, or stable."""
        # Get scores for this category over time
        results = self.db.query(
            InterviewSession.end_time,
            Evaluation.overall_score
        ).join(
            Answer, Answer.session_id == InterviewSession.id
        ).join(
            Evaluation, Evaluation.answer_id == Answer.id
        ).join(
            Question, Answer.question_id == Question.id
        ).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == SessionStatus.COMPLETED,
                Question.category == category
            )
        ).order_by(InterviewSession.end_time).all()
        
        if len(results) < 4:
            return "stable"
        
        # Compare first half vs second half
        mid = len(results) // 2
        first_half_avg = sum(r.overall_score for r in results[:mid]) / mid
        second_half_avg = sum(r.overall_score for r in results[mid:]) / (len(results) - mid)
        
        diff = second_half_avg - first_half_avg
        
        if diff > 5:
            return "improving"
        elif diff < -5:
            return "declining"
        else:
            return "stable"
    
    def _identify_strengths_weaknesses(
        self,
        category_performance: List[CategoryPerformance]
    ) -> tuple[List[str], List[str]]:
        """
        Identify top 5 strengths and weaknesses (Requirements 20.11, 20.12).
        Strengths: avg_score > 80
        Weaknesses: avg_score < 60
        """
        # Sort by score descending
        sorted_categories = sorted(
            category_performance,
            key=lambda x: x.avg_score,
            reverse=True
        )
        
        # Strengths: score > 80
        strengths = [
            cat.category for cat in sorted_categories
            if cat.avg_score > 80
        ][:5]
        
        # Weaknesses: score < 60, sorted ascending
        weaknesses = [
            cat.category for cat in reversed(sorted_categories)
            if cat.avg_score < 60
        ][:5]
        
        return strengths, weaknesses
    
    def _generate_recommendations(
        self,
        weaknesses: List[str],
        category_performance: List[CategoryPerformance]
    ) -> List[PracticeRecommendation]:
        """
        Generate practice recommendations based on weaknesses (Requirement 20.13).
        """
        recommendations = []
        
        # Create map for quick lookup
        category_map = {cat.category: cat for cat in category_performance}
        
        for category in weaknesses:
            if category not in category_map:
                continue
            
            cat_data = category_map[category]
            current_score = cat_data.avg_score
            
            # Determine priority based on score
            if current_score < 50:
                priority = "high"
                target_score = 70.0
            elif current_score < 60:
                priority = "medium"
                target_score = 75.0
            else:
                priority = "low"
                target_score = 80.0
            
            # Generate suggestion based on category
            suggestion = self._get_category_suggestion(category, current_score)
            
            recommendations.append(
                PracticeRecommendation(
                    category=category,
                    priority=priority,
                    suggestion=suggestion,
                    current_score=current_score,
                    target_score=target_score
                )
            )
        
        return recommendations
    
    def _get_category_suggestion(self, category: str, score: float) -> str:
        """Get specific suggestion for category."""
        suggestions = {
            "Behavioral": "Practice behavioral questions using the STAR method (Situation, Task, Action, Result)",
            "Technical": "Review fundamental concepts and practice coding problems daily",
            "System_Design": "Study system design patterns and practice designing scalable systems",
            "Domain_Specific": "Deep dive into domain knowledge relevant to your target role",
            "Coding": "Solve algorithmic problems on platforms like LeetCode or HackerRank"
        }
        
        base_suggestion = suggestions.get(category, f"Practice more {category} questions")
        
        if score < 50:
            return f"{base_suggestion}. Start with easier questions to build confidence."
        elif score < 60:
            return f"{base_suggestion}. Focus on understanding core concepts."
        else:
            return f"{base_suggestion}. Challenge yourself with harder questions."
    
    def _get_last_session_date(self, user_id: int) -> Optional[datetime]:
        """Get date of most recent completed session."""
        session = self.db.query(InterviewSession).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == SessionStatus.COMPLETED
            )
        ).order_by(desc(InterviewSession.end_time)).first()
        
        return session.end_time if session else None
    
    def invalidate_cache(self, user_id: int):
        """Invalidate all analytics and comparison caches for user."""
        # Main analytics overview
        self.cache.delete(f"analytics:{user_id}")
        
        # Performance comparison
        self.cache.delete(f"comparison:{user_id}")
        
        # Other potential caches
        self.cache.delete(f"skills:{user_id}")
        self.cache.delete(f"progress:{user_id}")
        
        logger.info(f"Analytics and comparison caches invalidated for user {user_id}")
    
    def get_performance_comparison(self, user_id: int) -> PerformanceComparison:
        """
        Get anonymous performance comparison for user.
        
        Requirements: 21.1-21.8
        - Compare user against cohort (same target role)
        - Calculate percentile rank
        - Show top performer habits
        - Maintain complete anonymity
        - Cache for 24 hours
        - Response time < 300ms
        """
        # Check cache first (Requirement 21.8 - performance)
        cache_key = f"comparison:{user_id}"
        cached_data = self.cache.get(cache_key)
        
        if cached_data:
            logger.info(f"Performance comparison cache hit for user {user_id}")
            cached_data['cache_hit'] = True
            return PerformanceComparison(**cached_data)
        
        logger.info(f"Performance comparison cache miss for user {user_id}, calculating...")
        
        # Get user's data (Requirement 21.1)
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or not user.target_role:
            raise ValueError("User must have a target role set for comparison")
        
        user_avg_score = self._calculate_average_score_all_time(user_id)
        if user_avg_score is None:
            raise ValueError("User must complete at least one interview for comparison")
        
        # Get cohort (Requirement 21.2)
        cohort = self._get_user_cohort(user.target_role)
        
        if len(cohort) < 2:
            raise ValueError("Not enough users in cohort for comparison")
        
        # Calculate percentile (Requirement 21.3)
        cohort_scores = [score for _, score in cohort]
        user_percentile = self._calculate_percentile(user_avg_score, cohort_scores)
        
        # Calculate cohort stats (Requirement 21.4)
        cohort_stats = self._get_cohort_stats(user.target_role, cohort)
        
        # Get top performer habits (Requirements 21.5, 21.6, 21.7)
        top_performer_habits = self._get_top_performer_habits(cohort)
        
        # Calculate comparison metrics
        score_difference = user_avg_score - cohort_stats.cohort_average_score
        performance_level = self._determine_performance_level(user_percentile)
        user_rank_description = self._generate_rank_description(
            user_percentile, user.target_role, len(cohort)
        )
        
        # Generate improvement suggestions
        improvement_suggestions = self._generate_comparison_suggestions(
            user_percentile, top_performer_habits, user_id
        )
        
        # Build comparison object (Requirement 21.7 - no user identities)
        comparison = PerformanceComparison(
            user_average_score=user_avg_score,
            user_percentile=user_percentile,
            user_rank_description=user_rank_description,
            cohort_stats=cohort_stats,
            score_difference=round(score_difference, 2),
            performance_level=performance_level,
            top_performer_habits=top_performer_habits,
            improvement_suggestions=improvement_suggestions,
            comparison_date=datetime.utcnow(),
            cache_hit=False
        )
        
        # Cache for 24 hours
        self.cache.set(cache_key, comparison.model_dump(), ttl=timedelta(hours=24))
        
        logger.info(f"Performance comparison calculated and cached for user {user_id}")
        return comparison
    
    def _get_user_cohort(self, target_role: str) -> List[tuple[int, float]]:
        """
        Get all users with same target role and their average scores.
        
        Returns list of (user_id, avg_score) tuples.
        Requirement 21.2
        """
        # Get all users with same target role who have completed sessions
        users_with_scores = self.db.query(
            User.id,
            func.avg(Evaluation.overall_score).label('avg_score')
        ).join(
            InterviewSession, InterviewSession.user_id == User.id
        ).join(
            Answer, Answer.session_id == InterviewSession.id
        ).join(
            Evaluation, Evaluation.answer_id == Answer.id
        ).filter(
            and_(
                User.target_role == target_role,
                InterviewSession.status == SessionStatus.COMPLETED
            )
        ).group_by(User.id).all()
        
        return [(user_id, float(avg_score)) for user_id, avg_score in users_with_scores if avg_score is not None]
    
    def _calculate_percentile(self, user_score: float, cohort_scores: List[float]) -> float:
        """
        Calculate user's percentile rank within cohort.
        
        Percentile = (number of scores below user) / (total scores) * 100
        Requirement 21.3
        """
        scores_below = sum(1 for score in cohort_scores if score < user_score)
        percentile = (scores_below / len(cohort_scores)) * 100
        return round(percentile, 2)
    
    def _get_cohort_stats(self, target_role: str, cohort: List[tuple[int, float]]) -> CohortStats:
        """
        Calculate statistics for user's cohort.
        
        Requirement 21.4
        """
        scores = [score for _, score in cohort]
        
        # Calculate average
        cohort_average = sum(scores) / len(scores)
        
        # Calculate median
        sorted_scores = sorted(scores)
        mid = len(sorted_scores) // 2
        if len(sorted_scores) % 2 == 0:
            cohort_median = (sorted_scores[mid - 1] + sorted_scores[mid]) / 2
        else:
            cohort_median = sorted_scores[mid]
        
        # Calculate score distribution
        score_distribution = {
            "0-60": sum(1 for s in scores if s < 60),
            "60-70": sum(1 for s in scores if 60 <= s < 70),
            "70-80": sum(1 for s in scores if 70 <= s < 80),
            "80-90": sum(1 for s in scores if 80 <= s < 90),
            "90-100": sum(1 for s in scores if s >= 90)
        }
        
        return CohortStats(
            target_role=target_role,
            total_users=len(cohort),
            cohort_average_score=round(cohort_average, 2),
            cohort_median_score=round(cohort_median, 2),
            score_distribution=score_distribution
        )
    
    def _get_top_performer_habits(self, cohort: List[tuple[int, float]]) -> TopPerformerHabits:
        """
        Analyze practice habits of top 10% performers.
        
        Requirements 21.5, 21.6, 21.7
        """
        # Identify top 10% (90th percentile and above)
        sorted_cohort = sorted(cohort, key=lambda x: x[1], reverse=True)
        top_10_percent_count = max(1, len(sorted_cohort) // 10)
        top_performers = [user_id for user_id, _ in sorted_cohort[:top_10_percent_count]]
        
        if not top_performers:
            # Return default values if no top performers
            return TopPerformerHabits(
                avg_sessions_per_week=0.0,
                avg_practice_hours=0.0,
                avg_questions_per_session=0.0,
                most_practiced_categories=[],
                consistency_score=0.0
            )
        
        # Calculate average sessions per week
        sessions_per_week_data = []
        for user_id in top_performers:
            # Get user's first and last session dates
            first_session = self.db.query(func.min(InterviewSession.start_time)).filter(
                and_(
                    InterviewSession.user_id == user_id,
                    InterviewSession.status == SessionStatus.COMPLETED
                )
            ).scalar()
            
            last_session = self.db.query(func.max(InterviewSession.end_time)).filter(
                and_(
                    InterviewSession.user_id == user_id,
                    InterviewSession.status == SessionStatus.COMPLETED
                )
            ).scalar()
            
            if first_session and last_session:
                weeks = max(1, (last_session - first_session).days / 7)
                session_count = self.db.query(func.count(InterviewSession.id)).filter(
                    and_(
                        InterviewSession.user_id == user_id,
                        InterviewSession.status == SessionStatus.COMPLETED
                    )
                ).scalar()
                sessions_per_week_data.append(session_count / weeks)
        
        avg_sessions_per_week = sum(sessions_per_week_data) / len(sessions_per_week_data) if sessions_per_week_data else 0.0
        
        # Calculate average practice hours
        total_practice_hours = []
        for user_id in top_performers:
            hours = self._calculate_total_practice_hours(user_id)
            total_practice_hours.append(hours)
        
        avg_practice_hours = sum(total_practice_hours) / len(total_practice_hours) if total_practice_hours else 0.0
        
        # Calculate average questions per session
        questions_per_session_data = []
        for user_id in top_performers:
            avg_questions = self.db.query(func.avg(InterviewSession.question_count)).filter(
                and_(
                    InterviewSession.user_id == user_id,
                    InterviewSession.status == SessionStatus.COMPLETED
                )
            ).scalar()
            if avg_questions:
                questions_per_session_data.append(float(avg_questions))
        
        avg_questions_per_session = sum(questions_per_session_data) / len(questions_per_session_data) if questions_per_session_data else 0.0
        
        # Get most practiced categories
        category_counts = self.db.query(
            Question.category,
            func.count(Question.id).label('count')
        ).join(
            Answer, Answer.question_id == Question.id
        ).join(
            InterviewSession, Answer.session_id == InterviewSession.id
        ).filter(
            and_(
                InterviewSession.user_id.in_(top_performers),
                InterviewSession.status == SessionStatus.COMPLETED
            )
        ).group_by(Question.category).order_by(desc('count')).limit(3).all()
        
        most_practiced_categories = [cat for cat, _ in category_counts]
        
        # Calculate consistency score (based on practice regularity)
        consistency_scores = []
        for user_id in top_performers:
            # Get all session dates
            session_dates = self.db.query(
                func.date(InterviewSession.start_time)
            ).filter(
                and_(
                    InterviewSession.user_id == user_id,
                    InterviewSession.status == SessionStatus.COMPLETED
                )
            ).distinct().all()
            
            if len(session_dates) > 1:
                # Calculate gaps between sessions
                dates = sorted([d[0] for d in session_dates])
                gaps = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
                avg_gap = sum(gaps) / len(gaps)
                
                # Consistency score: lower gap = higher consistency
                # Perfect score (100) for daily practice, decreasing for larger gaps
                consistency = max(0, 100 - (avg_gap * 5))
                consistency_scores.append(consistency)
        
        avg_consistency = sum(consistency_scores) / len(consistency_scores) if consistency_scores else 0.0
        
        return TopPerformerHabits(
            avg_sessions_per_week=round(avg_sessions_per_week, 2),
            avg_practice_hours=round(avg_practice_hours, 2),
            avg_questions_per_session=round(avg_questions_per_session, 2),
            most_practiced_categories=most_practiced_categories,
            consistency_score=round(avg_consistency, 2)
        )
    
    def _determine_performance_level(self, percentile: float) -> str:
        """Determine performance level based on percentile."""
        if percentile >= 90:
            return "expert"
        elif percentile >= 70:
            return "advanced"
        elif percentile >= 40:
            return "intermediate"
        else:
            return "beginner"
    
    def _generate_rank_description(self, percentile: float, target_role: str, cohort_size: int) -> str:
        """Generate human-readable rank description."""
        if percentile >= 90:
            return f"Excellent! You're in the top 10% of users preparing for {target_role} roles."
        elif percentile >= 75:
            return f"Great job! You're performing better than {int(percentile)}% of users preparing for {target_role} roles."
        elif percentile >= 50:
            return f"You're performing better than {int(percentile)}% of users preparing for {target_role} roles."
        elif percentile >= 25:
            return f"You're in the {int(percentile)}th percentile among {cohort_size} users preparing for {target_role} roles."
        else:
            return f"Keep practicing! You're building your skills alongside {cohort_size} users preparing for {target_role} roles."
    
    def _generate_comparison_suggestions(
        self,
        user_percentile: float,
        top_habits: TopPerformerHabits,
        user_id: int
    ) -> List[str]:
        """Generate personalized improvement suggestions based on comparison."""
        suggestions = []
        
        # Get user's current practice habits
        user_sessions = self._calculate_total_interviews(user_id)
        user_hours = self._calculate_total_practice_hours(user_id)
        
        # Compare with top performers
        if user_percentile < 90:
            # Session frequency suggestion
            if top_habits.avg_sessions_per_week > 0:
                suggestions.append(
                    f"Top performers practice {top_habits.avg_sessions_per_week:.1f} times per week. "
                    "Consider increasing your practice frequency."
                )
            
            # Practice hours suggestion
            if top_habits.avg_practice_hours > user_hours:
                suggestions.append(
                    f"Top performers have averaged {top_habits.avg_practice_hours:.1f} hours of practice. "
                    "More practice time can help you improve faster."
                )
            
            # Category focus suggestion
            if top_habits.most_practiced_categories:
                categories_str = ", ".join(top_habits.most_practiced_categories)
                suggestions.append(
                    f"Top performers focus on {categories_str} categories. "
                    "Consider practicing these areas more."
                )
            
            # Consistency suggestion
            if top_habits.consistency_score > 70:
                suggestions.append(
                    f"Top performers maintain a consistency score of {top_habits.consistency_score:.0f}. "
                    "Regular practice is key to improvement."
                )
        
        # Percentile-specific suggestions
        if user_percentile < 50:
            suggestions.append(
                "Focus on fundamentals and practice regularly to move into the top half of your cohort."
            )
        elif user_percentile < 75:
            suggestions.append(
                "You're doing well! Challenge yourself with harder questions to reach the top 25%."
            )
        elif user_percentile < 90:
            suggestions.append(
                "You're close to the top 10%! Focus on consistency and depth in your weak areas."
            )
        
        return suggestions[:5]  # Return top 5 suggestions
    
    def invalidate_comparison_cache(self, user_id: int):
        """Invalidate performance comparison cache for user."""
        cache_key = f"comparison:{user_id}"
        self.cache.delete(cache_key)
        logger.info(f"Performance comparison cache invalidated for user {user_id}")
    
    def get_session_statistics(self, user_id: int, date_range: Optional[int] = 30, status_filter: Optional[str] = None) -> Dict:
        """
        Get session statistics with date grouping.
        
        Requirements: 6.6
        - Returns sessions_by_date, average_duration, completion_rate
        - Supports date_range filter (days)
        - Supports status filter
        - Cache with 1h TTL
        """
        # Check cache
        cache_key = f"session_stats:{user_id}:{date_range}:{status_filter}"
        cached_data = self.cache.get(cache_key)
        
        if cached_data:
            logger.info(f"Session statistics cache hit for user {user_id}")
            cached_data['cache_hit'] = True
            return cached_data
        
        logger.info(f"Session statistics cache miss for user {user_id}, calculating...")
        
        # Build query
        query = self.db.query(InterviewSession).filter(InterviewSession.user_id == user_id)
        
        # Apply date range filter
        if date_range:
            cutoff_date = datetime.utcnow() - timedelta(days=date_range)
            query = query.filter(InterviewSession.start_time >= cutoff_date)
        
        # Apply status filter
        if status_filter:
            query = query.filter(InterviewSession.status == status_filter)
        
        sessions = query.all()
        
        # Calculate sessions by date
        sessions_by_date = {}
        total_duration = 0
        completed_count = 0
        
        for session in sessions:
            date_key = session.start_time.strftime('%Y-%m-%d')
            
            if date_key not in sessions_by_date:
                sessions_by_date[date_key] = {
                    'date': date_key,
                    'session_count': 0,
                    'scores': []
                }
            
            sessions_by_date[date_key]['session_count'] += 1
            
            # Calculate duration if session is completed
            if session.status == SessionStatus.COMPLETED and session.end_time:
                duration = (session.end_time - session.start_time).total_seconds() / 60
                total_duration += duration
                completed_count += 1
                
                # Get average score for this session
                avg_score = self.db.query(func.avg(Evaluation.overall_score)).join(
                    Answer, Evaluation.answer_id == Answer.id
                ).filter(Answer.session_id == session.id).scalar()
                
                if avg_score:
                    sessions_by_date[date_key]['scores'].append(float(avg_score))
        
        # Format sessions by date
        sessions_by_date_list = []
        for date_data in sorted(sessions_by_date.values(), key=lambda x: x['date']):
            avg_score = sum(date_data['scores']) / len(date_data['scores']) if date_data['scores'] else None
            sessions_by_date_list.append({
                'date': date_data['date'],
                'session_count': date_data['session_count'],
                'average_score': round(avg_score, 2) if avg_score else None
            })
        
        # Calculate metrics
        average_duration = total_duration / completed_count if completed_count > 0 else 0
        completion_rate = (completed_count / len(sessions) * 100) if sessions else 0
        
        result = {
            'sessions_by_date': sessions_by_date_list,
            'average_duration': round(average_duration, 2),
            'completion_rate': round(completion_rate, 2),
            'total_sessions': len(sessions),
            'completed_sessions': completed_count,
            'cache_hit': False
        }
        
        # Cache for 1 hour
        self.cache.set(cache_key, result, ttl=timedelta(hours=1))
        
        logger.info(f"Session statistics calculated and cached for user {user_id}")
        return result

    
    def get_skill_statistics(self, user_id: int) -> Dict:
        """
        Get skill-based performance analysis.
        
        Requirements: 6.6
        - Returns performance_by_skill, top_skills, weak_skills
        - Calculates average scores per skill from resume and questions
        - Cache with 1h TTL
        """
        # Check cache
        cache_key = f"skill_stats:{user_id}"
        cached_data = self.cache.get(cache_key)
        
        if cached_data:
            logger.info(f"Skill statistics cache hit for user {user_id}")
            cached_data['cache_hit'] = True
            return cached_data
        
        logger.info(f"Skill statistics cache miss for user {user_id}, calculating...")
        
        # Get user's resume to extract skills
        from app.models.resume import Resume
        resume = self.db.query(Resume).filter(
            Resume.user_id == user_id
        ).order_by(desc(Resume.created_at)).first()
        
        if not resume or not resume.skills:
            # No resume or skills, return empty data
            result = {
                'performance_by_skill': [],
                'top_skills': [],
                'weak_skills': [],
                'cache_hit': False
            }
            self.cache.set(cache_key, result, ttl=timedelta(hours=1))
            return result
        
        # Extract all skills from resume
        all_skills = []
        if isinstance(resume.skills, dict):
            for category in ['technical_skills', 'soft_skills', 'tools', 'frameworks']:
                if category in resume.skills:
                    all_skills.extend(resume.skills[category])
        
        # Calculate performance for each skill
        skill_performance = []
        
        for skill in all_skills:
            # Find questions that mention this skill (case-insensitive)
            skill_lower = skill.lower()
            
            # Get evaluations for questions mentioning this skill
            results = self.db.query(
                func.avg(Evaluation.overall_score).label('avg_score'),
                func.count(Evaluation.id).label('count')
            ).join(
                Answer, Evaluation.answer_id == Answer.id
            ).join(
                Question, Answer.question_id == Question.id
            ).join(
                InterviewSession, Answer.session_id == InterviewSession.id
            ).filter(
                and_(
                    InterviewSession.user_id == user_id,
                    InterviewSession.status == SessionStatus.COMPLETED,
                    func.lower(Question.question_text).contains(skill_lower)
                )
            ).first()
            
            if results.count and results.count > 0:
                avg_score = float(results.avg_score)
                question_count = results.count
                
                # Calculate trend (simplified - compare first half vs second half)
                trend = self._calculate_skill_trend(user_id, skill_lower)
                
                skill_performance.append({
                    'skill': skill,
                    'average_score': round(avg_score, 2),
                    'question_count': question_count,
                    'trend': trend
                })
        
        # Sort by average score
        skill_performance.sort(key=lambda x: x['average_score'], reverse=True)
        
        # Identify top and weak skills
        top_skills = [s['skill'] for s in skill_performance[:5]]
        weak_skills = [s['skill'] for s in skill_performance[-5:] if s['average_score'] < 70]
        
        result = {
            'performance_by_skill': skill_performance,
            'top_skills': top_skills,
            'weak_skills': weak_skills,
            'cache_hit': False
        }
        
        # Cache for 1 hour
        self.cache.set(cache_key, result, ttl=timedelta(hours=1))
        
        logger.info(f"Skill statistics calculated and cached for user {user_id}")
        return result
    
    def _calculate_skill_trend(self, user_id: int, skill_lower: str) -> str:
        """Calculate trend for a specific skill."""
        # Get scores over time for this skill
        results = self.db.query(
            InterviewSession.end_time,
            Evaluation.overall_score
        ).join(
            Answer, Answer.session_id == InterviewSession.id
        ).join(
            Evaluation, Evaluation.answer_id == Answer.id
        ).join(
            Question, Answer.question_id == Question.id
        ).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == SessionStatus.COMPLETED,
                func.lower(Question.question_text).contains(skill_lower)
            )
        ).order_by(InterviewSession.end_time).all()
        
        if len(results) < 4:
            return "stable"
        
        # Compare first half vs second half
        mid = len(results) // 2
        first_half_avg = sum(r.overall_score for r in results[:mid]) / mid
        second_half_avg = sum(r.overall_score for r in results[mid:]) / (len(results) - mid)
        
        diff = second_half_avg - first_half_avg
        
        if diff > 5:
            return "improving"
        elif diff < -5:
            return "declining"
        else:
            return "stable"

    
    def get_progress_metrics(self, user_id: int) -> Dict:
        """
        Get improvement metrics calculation.
        
        Requirements: 6.6
        - Returns weekly_improvement, monthly_improvement, trend_direction
        - Calculates score deltas over time periods
        - Includes confidence intervals for trends
        - Cache with 1h TTL
        """
        # Check cache
        cache_key = f"progress_metrics:{user_id}"
        cached_data = self.cache.get(cache_key)
        
        if cached_data:
            logger.info(f"Progress metrics cache hit for user {user_id}")
            cached_data['cache_hit'] = True
            return cached_data
        
        logger.info(f"Progress metrics cache miss for user {user_id}, calculating...")
        
        # Get all completed sessions with scores
        sessions_with_scores = self.db.query(
            InterviewSession.end_time,
            func.avg(Evaluation.overall_score).label('avg_score')
        ).join(
            Answer, Answer.session_id == InterviewSession.id
        ).join(
            Evaluation, Evaluation.answer_id == Answer.id
        ).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == SessionStatus.COMPLETED
            )
        ).group_by(InterviewSession.id, InterviewSession.end_time).order_by(
            InterviewSession.end_time
        ).all()
        
        if len(sessions_with_scores) < 2:
            # Not enough data
            result = {
                'weekly_improvement': None,
                'monthly_improvement': None,
                'trend_direction': 'stable',
                'confidence_interval': None,
                'cache_hit': False
            }
            self.cache.set(cache_key, result, ttl=timedelta(hours=1))
            return result
        
        # Calculate weekly improvement (last week vs previous week)
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        two_weeks_ago = datetime.utcnow() - timedelta(days=14)
        
        last_week_scores = [
            float(s.avg_score) for s in sessions_with_scores
            if s.end_time >= one_week_ago
        ]
        
        previous_week_scores = [
            float(s.avg_score) for s in sessions_with_scores
            if two_weeks_ago <= s.end_time < one_week_ago
        ]
        
        weekly_improvement = None
        if last_week_scores and previous_week_scores:
            last_week_avg = sum(last_week_scores) / len(last_week_scores)
            previous_week_avg = sum(previous_week_scores) / len(previous_week_scores)
            weekly_improvement = ((last_week_avg - previous_week_avg) / previous_week_avg) * 100
        
        # Calculate monthly improvement (last month vs previous month)
        one_month_ago = datetime.utcnow() - timedelta(days=30)
        two_months_ago = datetime.utcnow() - timedelta(days=60)
        
        last_month_scores = [
            float(s.avg_score) for s in sessions_with_scores
            if s.end_time >= one_month_ago
        ]
        
        previous_month_scores = [
            float(s.avg_score) for s in sessions_with_scores
            if two_months_ago <= s.end_time < one_month_ago
        ]
        
        monthly_improvement = None
        if last_month_scores and previous_month_scores:
            last_month_avg = sum(last_month_scores) / len(last_month_scores)
            previous_month_avg = sum(previous_month_scores) / len(previous_month_scores)
            monthly_improvement = ((last_month_avg - previous_month_avg) / previous_month_avg) * 100
        
        # Calculate overall trend direction
        all_scores = [float(s.avg_score) for s in sessions_with_scores]
        trend_direction = self._calculate_overall_trend(all_scores)
        
        # Calculate confidence interval (simplified 95% CI)
        confidence_interval = None
        if len(all_scores) >= 5:
            import statistics
            mean = statistics.mean(all_scores)
            stdev = statistics.stdev(all_scores)
            margin = 1.96 * (stdev / (len(all_scores) ** 0.5))  # 95% CI
            confidence_interval = (round(mean - margin, 2), round(mean + margin, 2))
        
        result = {
            'weekly_improvement': round(weekly_improvement, 2) if weekly_improvement is not None else None,
            'monthly_improvement': round(monthly_improvement, 2) if monthly_improvement is not None else None,
            'trend_direction': trend_direction,
            'confidence_interval': confidence_interval,
            'cache_hit': False
        }
        
        # Cache for 1 hour
        self.cache.set(cache_key, result, ttl=timedelta(hours=1))
        
        logger.info(f"Progress metrics calculated and cached for user {user_id}")
        return result
    
    def _calculate_overall_trend(self, scores: List[float]) -> str:
        """Calculate overall trend from score list."""
        if len(scores) < 4:
            return "stable"
        
        # Compare first quarter vs last quarter
        quarter_size = len(scores) // 4
        first_quarter_avg = sum(scores[:quarter_size]) / quarter_size
        last_quarter_avg = sum(scores[-quarter_size:]) / quarter_size
        
        diff = last_quarter_avg - first_quarter_avg
        
        if diff > 5:
            return "improving"
        elif diff < -5:
            return "declining"
        else:
            return "stable"

    
    async def get_ai_insights(self, user_id: int) -> Dict:
        """
        Get AI-generated insights and recommendations.
        
        Requirements: 6.6, 13.7
        - Analyzes user performance patterns
        - Generates personalized recommendations
        - Returns insights_text, recommendations, readiness_score
        - Cache with 24h TTL
        """
        # Check cache
        cache_key = f"ai_insights:{user_id}"
        cached_data = self.cache.get(cache_key)
        
        if cached_data:
            logger.info(f"AI insights cache hit for user {user_id}")
            cached_data['cache_hit'] = True
            return cached_data
        
        logger.info(f"AI insights cache miss for user {user_id}, generating...")
        
        # Get user data
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        # Get analytics overview
        analytics = self.get_analytics_overview(user_id)
        
        # Get recent performance
        recent_sessions = self.db.query(InterviewSession).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == SessionStatus.COMPLETED
            )
        ).order_by(desc(InterviewSession.end_time)).limit(5).all()
        
        # Build context for AI
        context = f"""Analyze the following interview preparation performance data and provide insights:

User Profile:
- Target Role: {user.target_role or 'Not specified'}
- Experience Level: {user.experience_level or 'Not specified'}
- Current Streak: {user.current_streak} days
- Longest Streak: {user.longest_streak} days

Performance Metrics:
- Total Interviews Completed: {analytics.total_interviews_completed}
- Average Score (All Time): {analytics.average_score_all_time or 'N/A'}
- Average Score (Last 30 Days): {analytics.average_score_last_30_days or 'N/A'}
- Improvement Rate: {analytics.improvement_rate or 'N/A'}%
- Total Practice Hours: {analytics.total_practice_hours}

Category Performance:
{self._format_category_performance(analytics.category_performance)}

Strengths: {', '.join(analytics.top_5_strengths) if analytics.top_5_strengths else 'None identified yet'}
Weaknesses: {', '.join(analytics.top_5_weaknesses) if analytics.top_5_weaknesses else 'None identified yet'}

Recent Activity:
- Last Session: {analytics.last_session_date.strftime('%Y-%m-%d') if analytics.last_session_date else 'No sessions yet'}
- Recent Sessions: {len(recent_sessions)}

Please provide:
1. A comprehensive analysis of their performance patterns (2-3 paragraphs)
2. 5 specific, actionable recommendations for improvement
3. An interview readiness score (0-100) based on their preparation level

Format your response as JSON:
{{
  "insights_text": "Your detailed analysis here...",
  "recommendations": ["Recommendation 1", "Recommendation 2", ...],
  "readiness_score": 75
}}"""
        
        # Call AI orchestrator
        from app.services.ai.orchestrator import AIOrchestrator
        from app.services.ai.types import AIRequest
        
        orchestrator = AIOrchestrator(cache_service=self.cache)
        
        request = AIRequest(
            prompt=context,
            max_tokens=1500,
            temperature=0.7,
            task_type="insights_generation"
        )
        
        try:
            response = await orchestrator.call(
                prompt=context,
                cache_key=None,  # Don't use orchestrator cache, we have our own
                use_cache=False
            )
            
            if not response.success:
                raise Exception(f"AI generation failed: {response.error}")
            
            # Parse response
            import json
            content = response.content.strip()
            
            # Handle markdown code blocks
            if content.startswith('```'):
                lines = content.split('\n')
                content = '\n'.join(lines[1:-1]) if len(lines) > 2 else content
                content = content.replace('```json', '').replace('```', '').strip()
            
            insights_data = json.loads(content)
            
            # Validate response structure
            if 'insights_text' not in insights_data or 'recommendations' not in insights_data or 'readiness_score' not in insights_data:
                raise ValueError("Invalid AI response structure")
            
            # Ensure readiness score is in valid range
            readiness_score = max(0, min(100, float(insights_data['readiness_score'])))
            
            result = {
                'insights_text': insights_data['insights_text'],
                'recommendations': insights_data['recommendations'][:5],  # Limit to 5
                'readiness_score': round(readiness_score, 2),
                'cache_hit': False
            }
            
            # Cache for 24 hours
            self.cache.set(cache_key, result, ttl=timedelta(hours=24))
            
            logger.info(f"AI insights generated and cached for user {user_id}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to generate AI insights: {e}")
            # Return fallback insights
            return {
                'insights_text': self._generate_fallback_insights(analytics, user),
                'recommendations': self._generate_fallback_recommendations(analytics),
                'readiness_score': self._calculate_fallback_readiness_score(analytics),
                'cache_hit': False
            }
    
    def _format_category_performance(self, categories: List) -> str:
        """Format category performance for AI prompt."""
        if not categories:
            return "No category data available yet"
        
        lines = []
        for cat in categories:
            lines.append(f"- {cat.category}: {cat.avg_score:.1f} ({cat.question_count} questions, {cat.trend})")
        return '\n'.join(lines)
    
    def _generate_fallback_insights(self, analytics, user) -> str:
        """Generate fallback insights when AI fails."""
        insights = []
        
        if analytics.total_interviews_completed == 0:
            insights.append("You're just getting started with your interview preparation. ")
            insights.append("The key to success is consistent practice and focusing on your weak areas.")
        elif analytics.total_interviews_completed < 5:
            insights.append(f"You've completed {analytics.total_interviews_completed} practice sessions. ")
            insights.append("Keep building momentum with regular practice to see meaningful improvement.")
        else:
            insights.append(f"You've completed {analytics.total_interviews_completed} practice sessions with an average score of {analytics.average_score_all_time:.1f}. ")
            
            if analytics.improvement_rate and analytics.improvement_rate > 0:
                insights.append(f"Your improvement rate of {analytics.improvement_rate:.1f}% shows you're making progress. ")
            elif analytics.improvement_rate and analytics.improvement_rate < 0:
                insights.append("Your recent scores show some decline. Consider reviewing fundamentals and taking breaks to avoid burnout. ")
            
            if analytics.top_5_strengths:
                insights.append(f"Your strengths in {', '.join(analytics.top_5_strengths[:2])} are notable. ")
            
            if analytics.top_5_weaknesses:
                insights.append(f"Focus on improving in {', '.join(analytics.top_5_weaknesses[:2])} to become more well-rounded.")
        
        return ''.join(insights)
    
    def _generate_fallback_recommendations(self, analytics) -> List[str]:
        """Generate fallback recommendations when AI fails."""
        recommendations = []
        
        if analytics.total_interviews_completed < 10:
            recommendations.append("Complete at least 10 practice sessions to build confidence and identify patterns")
        
        if analytics.top_5_weaknesses:
            for weakness in analytics.top_5_weaknesses[:2]:
                recommendations.append(f"Focus on {weakness} questions to improve your weak areas")
        
        if analytics.average_score_all_time and analytics.average_score_all_time < 70:
            recommendations.append("Review fundamental concepts and practice with easier questions first")
        
        if analytics.total_practice_hours < 5:
            recommendations.append("Aim for at least 10 hours of total practice time for meaningful improvement")
        
        recommendations.append("Maintain a consistent practice schedule to build and retain skills")
        
        return recommendations[:5]
    
    def _calculate_fallback_readiness_score(self, analytics) -> float:
        """Calculate fallback readiness score when AI fails."""
        score = 0
        
        # Base score from average performance
        if analytics.average_score_all_time:
            score += analytics.average_score_all_time * 0.5
        
        # Bonus for number of sessions
        session_bonus = min(20, analytics.total_interviews_completed * 2)
        score += session_bonus
        
        # Bonus for improvement
        if analytics.improvement_rate and analytics.improvement_rate > 0:
            score += min(10, analytics.improvement_rate)
        
        # Bonus for practice hours
        hours_bonus = min(10, analytics.total_practice_hours)
        score += hours_bonus
        
        return round(min(100, max(0, score)), 2)

    def _get_recent_session_scores(self, user_id: int, limit: int = 100) -> List[SessionScore]:
        """Get scores for individual recent interview sessions (Requirement: every interview marks)."""
        time_col = func.coalesce(InterviewSession.end_time, InterviewSession.created_at)
        # Requirements: show ALL completed sessions scores

        results = self.db.query(
            InterviewSession.id,
            time_col.label('date'),
            # COALESCE to get score from summary first, fallback to avg(evaluation), fallback to 0.0
            func.coalesce(
                SessionSummary.overall_session_score, 
                func.avg(Evaluation.overall_score),
                0.0
            ).label('score')
        ).outerjoin(
            SessionSummary, SessionSummary.session_id == InterviewSession.id
        ).outerjoin(
            Answer, Answer.session_id == InterviewSession.id
        ).outerjoin(
            Evaluation, Evaluation.answer_id == Answer.id
        ).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == SessionStatus.COMPLETED,
                InterviewSession.deleted_at.is_(None)
            )
        ).group_by(
            InterviewSession.id,
            time_col,
            SessionSummary.overall_session_score
        ).order_by(
            desc('date')
        ).limit(limit).all()

        
        # Sort chronologically for the graph (showing progress from oldest to newest in the 10 recent)
        results.reverse()
        
        scores = []
        for row in results:
            if row.score is not None:
                scores.append(SessionScore(
                    session_id=row.id,
                    date=row.date.strftime('%Y-%m-%d %H:%M'),
                    score=round(float(row.score), 2)
                ))
        return scores

