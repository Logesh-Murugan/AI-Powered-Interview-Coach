"""
Analytics service for calculating user performance metrics.
"""
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
import logging

from app.models.interview_session import InterviewSession
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.models.session_question import SessionQuestion
from app.models.question import Question
from app.schemas.analytics import (
    AnalyticsOverview,
    ScoreOverTime,
    CategoryPerformance,
    PracticeRecommendation
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
        total_interviews = self._calculate_total_interviews(user_id)
        avg_all_time = self._calculate_average_score_all_time(user_id)
        avg_30_days = self._calculate_average_score_last_30_days(user_id)
        improvement_rate = self._calculate_improvement_rate(user_id)
        practice_hours = self._calculate_total_practice_hours(user_id)
        score_over_time = self._generate_score_over_time(user_id)
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
            category_performance=category_performance,
            top_5_strengths=strengths,
            top_5_weaknesses=weaknesses,
            practice_recommendations=recommendations,
            last_session_date=last_session,
            cache_hit=False,
            calculated_at=datetime.utcnow()
        )
        
        # Cache for 1 hour (Requirement 20.14)
        self.cache.set(cache_key, analytics.model_dump(), ttl=timedelta(hours=1))
        
        logger.info(f"Analytics calculated and cached for user {user_id}")
        return analytics
    
    def _calculate_total_interviews(self, user_id: int) -> int:
        """Calculate total completed interviews (Requirement 20.4)."""
        count = self.db.query(func.count(InterviewSession.id)).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == 'completed'
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
                InterviewSession.status == 'completed'
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
                InterviewSession.status == 'completed',
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
                InterviewSession.status == 'completed'
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
        
        # Calculate percentage change
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
                InterviewSession.status == 'completed'
            )
        ).scalar()
        
        if not total_seconds:
            return 0.0
        
        # Convert to hours
        hours = total_seconds / 3600.0
        return round(hours, 2)
    
    def _generate_score_over_time(self, user_id: int) -> List[ScoreOverTime]:
        """
        Generate weekly score progression (Requirement 20.9).
        Returns list of weekly averages.
        """
        # Query for weekly aggregation
        results = self.db.query(
            func.date_trunc('week', InterviewSession.end_time).label('week'),
            func.avg(Evaluation.overall_score).label('avg_score'),
            func.count(InterviewSession.id).label('session_count')
        ).join(
            Answer, Answer.session_id == InterviewSession.id
        ).join(
            Evaluation, Evaluation.answer_id == Answer.id
        ).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == 'completed'
            )
        ).group_by(
            func.date_trunc('week', InterviewSession.end_time)
        ).order_by(
            func.date_trunc('week', InterviewSession.end_time)
        ).all()
        
        return [
            ScoreOverTime(
                week=row.week.strftime('%Y-%m-%d'),
                avg_score=round(float(row.avg_score), 2),
                session_count=row.session_count
            )
            for row in results
        ]
    
    def _generate_category_breakdown(self, user_id: int) -> List[CategoryPerformance]:
        """
        Generate performance breakdown by category (Requirement 20.10).
        """
        results = self.db.query(
            Question.category,
            func.avg(Evaluation.overall_score).label('avg_score'),
            func.count(Question.id).label('question_count')
        ).join(
            SessionQuestion, SessionQuestion.question_id == Question.id
        ).join(
            Answer, Answer.session_question_id == SessionQuestion.id
        ).join(
            Evaluation, Evaluation.answer_id == Answer.id
        ).join(
            InterviewSession, SessionQuestion.session_id == InterviewSession.id
        ).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == 'completed'
            )
        ).group_by(
            Question.category
        ).all()
        
        return [
            CategoryPerformance(
                category=row.category,
                avg_score=round(float(row.avg_score), 2),
                question_count=row.question_count,
                trend=self._calculate_category_trend(user_id, row.category)
            )
            for row in results
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
            SessionQuestion, Answer.session_question_id == SessionQuestion.id
        ).join(
            Question, SessionQuestion.question_id == Question.id
        ).filter(
            and_(
                InterviewSession.user_id == user_id,
                InterviewSession.status == 'completed',
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
                InterviewSession.status == 'completed'
            )
        ).order_by(desc(InterviewSession.end_time)).first()
        
        return session.end_time if session else None
    
    def invalidate_cache(self, user_id: int):
        """Invalidate analytics cache for user."""
        cache_key = f"analytics:{user_id}"
        self.cache.delete(cache_key)
        logger.info(f"Analytics cache invalidated for user {user_id}")
    
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
                InterviewSession.status == 'completed'
            )
        ).group_by(User.id).all()
        
        return [(user_id, float(avg_score)) for user_id, avg_score in users_with_scores]
    
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
                    InterviewSession.status == 'completed'
                )
            ).scalar()
            
            last_session = self.db.query(func.max(InterviewSession.end_time)).filter(
                and_(
                    InterviewSession.user_id == user_id,
                    InterviewSession.status == 'completed'
                )
            ).scalar()
            
            if first_session and last_session:
                weeks = max(1, (last_session - first_session).days / 7)
                session_count = self.db.query(func.count(InterviewSession.id)).filter(
                    and_(
                        InterviewSession.user_id == user_id,
                        InterviewSession.status == 'completed'
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
                    InterviewSession.status == 'completed'
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
            SessionQuestion, SessionQuestion.question_id == Question.id
        ).join(
            InterviewSession, SessionQuestion.session_id == InterviewSession.id
        ).filter(
            and_(
                InterviewSession.user_id.in_(top_performers),
                InterviewSession.status == 'completed'
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
                    InterviewSession.status == 'completed'
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
