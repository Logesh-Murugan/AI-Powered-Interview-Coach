"""
Admin API Routes

User management and system metrics for admin users.
"""
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User, AccountStatus
from app.models.interview_session import InterviewSession, SessionStatus
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.models.question import Question
from app.services.cache_service import CacheService
from app.services.ai.orchestrator import AIOrchestrator

logger = logging.getLogger(__name__)

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user)):
    """Dependency that checks if the current user is an admin."""
    # Simple admin check - user email contains 'admin' or is in admin list
    admin_emails = ["admin@interviewmaster.ai", "admin@example.com", "kk@gamil.com", "logeshmuruganofficial@gmail.com"]
    is_admin = (
        current_user.email in admin_emails or
        "admin" in current_user.email.lower()
    )
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ─── User Management ───────────────────────────────────────────


@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all users with pagination, filtering, and search."""
    query = db.query(User)

    # Status filter
    if status_filter:
        try:
            account_status = AccountStatus(status_filter)
            query = query.filter(User.account_status == account_status)
        except ValueError:
            pass

    # Search by name or email
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.name.ilike(search_term)) |
            (User.email.ilike(search_term))
        )

    # Count total
    total = query.count()

    # Paginate
    users = query.order_by(User.created_at.desc()) \
        .offset((page - 1) * per_page) \
        .limit(per_page) \
        .all()

    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "target_role": u.target_role,
                "account_status": u.account_status.value,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "last_login_at": u.last_login_at,
                "current_streak": u.current_streak,
                "total_achievements": u.total_achievements_count,
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: int,
    new_status: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Suspend, activate, or lock a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        account_status = AccountStatus(new_status)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {[s.value for s in AccountStatus]}"
        )

    user.account_status = account_status
    db.commit()

    return {
        "id": user.id,
        "email": user.email,
        "account_status": user.account_status.value,
        "message": f"User status updated to {new_status}"
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete a user account (hard delete)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    db.delete(user)
    db.commit()

    return {"message": f"User {user.email} deleted successfully"}


# ─── System Metrics ────────────────────────────────────────────


@router.get("/metrics")
async def get_system_metrics(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get comprehensive system metrics dashboard data."""
    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # User metrics
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(
        User.account_status == AccountStatus.ACTIVE
    ).scalar() or 0
    new_users_today = db.query(func.count(User.id)).filter(
        User.created_at >= day_ago
    ).scalar() or 0
    new_users_week = db.query(func.count(User.id)).filter(
        User.created_at >= week_ago
    ).scalar() or 0
    new_users_month = db.query(func.count(User.id)).filter(
        User.created_at >= month_ago
    ).scalar() or 0

    # Interview metrics
    total_sessions = db.query(func.count(InterviewSession.id)).scalar() or 0
    completed_sessions = db.query(func.count(InterviewSession.id)).filter(
        InterviewSession.status == SessionStatus.COMPLETED
    ).scalar() or 0
    sessions_today = db.query(func.count(InterviewSession.id)).filter(
        InterviewSession.created_at >= day_ago
    ).scalar() or 0
    sessions_week = db.query(func.count(InterviewSession.id)).filter(
        InterviewSession.created_at >= week_ago
    ).scalar() or 0

    # Evaluation metrics
    total_evaluations = db.query(func.count(Evaluation.id)).scalar() or 0
    avg_score = db.query(func.avg(Evaluation.overall_score)).scalar() or 0

    # Question metrics
    total_questions = db.query(func.count(Question.id)).scalar() or 0

    # AI provider metrics
    try:
        orchestrator = AIOrchestrator()
        ai_providers = [
            {
                "name": p.config.name,
                "model": p.config.model,
                "priority": p.config.priority,
                "quota_limit": p.config.quota_limit,
            }
            for p in orchestrator.providers
        ]
    except Exception:
        ai_providers = []

    # Cache metrics
    try:
        cache = CacheService()
        cache_metrics = cache.get_metrics() if hasattr(cache, 'get_metrics') else {}
    except Exception:
        cache_metrics = {}

    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "new_today": new_users_today,
            "new_this_week": new_users_week,
            "new_this_month": new_users_month,
        },
        "interviews": {
            "total_sessions": total_sessions,
            "completed_sessions": completed_sessions,
            "completion_rate": round(
                (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0, 1
            ),
            "sessions_today": sessions_today,
            "sessions_this_week": sessions_week,
        },
        "evaluations": {
            "total": total_evaluations,
            "average_score": round(float(avg_score), 1),
        },
        "questions": {
            "total_in_database": total_questions,
        },
        "ai_providers": ai_providers,
        "cache": cache_metrics,
        "generated_at": now.isoformat(),
    }
