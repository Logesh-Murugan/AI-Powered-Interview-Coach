"""
Study Plan Background Tasks

Celery tasks for automated study plan management:
- Weekly progress reviews
- Auto-update plans based on performance
- Send progress notifications

Requirements: 28.9, 28.11
"""
from celery import shared_task
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from loguru import logger
from app.database import SessionLocal
from app.models.study_plan import StudyPlan
from app.models.user import User
from app.services.agents.study_plan_agent_service import StudyPlanAgentService


@shared_task(name="review_study_plan_progress")
def review_study_plan_progress(plan_id: int):
    """
    Weekly review of study plan progress.
    
    This task:
    1. Checks completion rate
    2. Identifies stuck tasks
    3. Suggests adjustments
    4. Sends progress report to user
    
    Requirements: 28.9
    """
    db = SessionLocal()
    try:
        # Get study plan
        study_plan = db.query(StudyPlan).filter(
            StudyPlan.id == plan_id,
            StudyPlan.status == 'active'
        ).first()
        
        if not study_plan:
            logger.warning(f"Study plan {plan_id} not found or not active")
            return
        
        # Calculate progress metrics
        total_tasks = study_plan.total_tasks
        completed_tasks = study_plan.completed_tasks
        progress_percentage = study_plan.progress_percentage
        
        # Calculate expected progress based on time elapsed
        days_elapsed = (datetime.utcnow() - study_plan.created_at).days
        expected_progress = (days_elapsed / study_plan.duration_days) * 100
        
        # Determine if user is on track
        on_track = progress_percentage >= (expected_progress - 10)  # 10% tolerance
        
        logger.info(
            f"Study plan {plan_id} review",
            extra={
                "plan_id": plan_id,
                "user_id": study_plan.user_id,
                "progress": progress_percentage,
                "expected": expected_progress,
                "on_track": on_track,
                "completed_tasks": completed_tasks,
                "total_tasks": total_tasks
            }
        )
        
        # TODO: Send progress report email/notification to user
        # This would integrate with a notification service
        
        # If significantly behind, could trigger plan adjustment
        if progress_percentage < (expected_progress - 20):
            logger.warning(
                f"Study plan {plan_id} significantly behind schedule",
                extra={
                    "plan_id": plan_id,
                    "user_id": study_plan.user_id,
                    "progress": progress_percentage,
                    "expected": expected_progress
                }
            )
            # TODO: Trigger plan adjustment or send encouragement
        
        return {
            "plan_id": plan_id,
            "progress": progress_percentage,
            "expected": expected_progress,
            "on_track": on_track
        }
        
    except Exception as e:
        logger.error(f"Error reviewing study plan {plan_id}: {e}")
        raise
    finally:
        db.close()


@shared_task(name="update_plan_based_on_performance")
def update_plan_based_on_performance(user_id: int):
    """
    Auto-update study plan based on interview performance.
    
    This task:
    1. Analyzes recent interview performance
    2. Identifies skill improvements
    3. Adjusts study plan focus areas
    4. Updates resource recommendations
    
    Requirements: 28.11
    """
    db = SessionLocal()
    try:
        # Get user's active study plan
        study_plan = db.query(StudyPlan).filter(
            StudyPlan.user_id == user_id,
            StudyPlan.status == 'active'
        ).first()
        
        if not study_plan:
            logger.info(f"No active study plan for user {user_id}")
            return
        
        # Get recent interview performance (last 7 days)
        from app.models.evaluation import Evaluation
        from app.models.answer import Answer
        
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        recent_evaluations = db.query(Evaluation).join(Answer).filter(
            Answer.user_id == user_id,
            Evaluation.created_at >= seven_days_ago
        ).all()
        
        if not recent_evaluations:
            logger.info(f"No recent evaluations for user {user_id}")
            return
        
        # Analyze performance by skill
        skill_scores = {}
        for evaluation in recent_evaluations:
            eval_data = evaluation.evaluation_data or {}
            skill_breakdown = eval_data.get('skill_breakdown', {})
            
            for skill, score in skill_breakdown.items():
                if skill not in skill_scores:
                    skill_scores[skill] = []
                skill_scores[skill].append(score)
        
        # Calculate average scores
        skill_averages = {
            skill: sum(scores) / len(scores)
            for skill, scores in skill_scores.items()
        }
        
        # Identify improved skills (score > 80)
        improved_skills = [
            skill for skill, avg in skill_averages.items()
            if avg >= 80
        ]
        
        # Identify struggling skills (score < 60)
        struggling_skills = [
            skill for skill, avg in skill_averages.items()
            if avg < 60
        ]
        
        logger.info(
            f"Performance analysis for user {user_id}",
            extra={
                "user_id": user_id,
                "plan_id": study_plan.id,
                "improved_skills": improved_skills,
                "struggling_skills": struggling_skills,
                "skill_averages": skill_averages
            }
        )
        
        # TODO: Adjust study plan based on performance
        # - Reduce time on improved skills
        # - Increase focus on struggling skills
        # - Add targeted resources for weak areas
        
        # For now, just log the insights
        if improved_skills:
            logger.info(f"User {user_id} showing improvement in: {', '.join(improved_skills)}")
        
        if struggling_skills:
            logger.warning(f"User {user_id} struggling with: {', '.join(struggling_skills)}")
        
        return {
            "user_id": user_id,
            "plan_id": study_plan.id,
            "improved_skills": improved_skills,
            "struggling_skills": struggling_skills
        }
        
    except Exception as e:
        logger.error(f"Error updating plan for user {user_id}: {e}")
        raise
    finally:
        db.close()


@shared_task(name="schedule_weekly_reviews")
def schedule_weekly_reviews():
    """
    Schedule weekly reviews for all active study plans.
    
    This task runs daily and schedules reviews for plans
    that haven't been reviewed in the last 7 days.
    
    Requirements: 28.9
    """
    db = SessionLocal()
    try:
        # Get all active study plans
        active_plans = db.query(StudyPlan).filter(
            StudyPlan.status == 'active'
        ).all()
        
        logger.info(f"Found {len(active_plans)} active study plans")
        
        scheduled_count = 0
        for plan in active_plans:
            # Check if plan needs review (7 days since last update)
            days_since_update = (datetime.utcnow() - plan.updated_at).days
            
            if days_since_update >= 7:
                # Schedule review task
                review_study_plan_progress.delay(plan.id)
                scheduled_count += 1
                
                logger.info(
                    f"Scheduled review for plan {plan.id}",
                    extra={
                        "plan_id": plan.id,
                        "user_id": plan.user_id,
                        "days_since_update": days_since_update
                    }
                )
        
        logger.info(f"Scheduled {scheduled_count} weekly reviews")
        
        return {
            "total_active_plans": len(active_plans),
            "scheduled_reviews": scheduled_count
        }
        
    except Exception as e:
        logger.error(f"Error scheduling weekly reviews: {e}")
        raise
    finally:
        db.close()


@shared_task(name="cleanup_abandoned_plans")
def cleanup_abandoned_plans():
    """
    Clean up old abandoned study plans.
    
    Soft-deletes plans that have been abandoned for more than 90 days.
    """
    db = SessionLocal()
    try:
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        
        # Find old abandoned plans
        old_plans = db.query(StudyPlan).filter(
            StudyPlan.status == 'abandoned',
            StudyPlan.updated_at < ninety_days_ago,
            StudyPlan.deleted_at.is_(None)
        ).all()
        
        cleaned_count = 0
        for plan in old_plans:
            plan.deleted_at = datetime.utcnow()
            cleaned_count += 1
        
        db.commit()
        
        logger.info(f"Cleaned up {cleaned_count} old abandoned plans")
        
        return {
            "cleaned_count": cleaned_count
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up abandoned plans: {e}")
        db.rollback()
        raise
    finally:
        db.close()
