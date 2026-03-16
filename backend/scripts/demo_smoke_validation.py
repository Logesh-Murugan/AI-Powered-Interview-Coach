"""
Deterministic smoke validation for the local InterviewMaster AI backend.

This script exercises the real FastAPI app with TestClient against the local
PostgreSQL and Redis setup. It validates the main demo journey and a seeded
advanced-feature pass without depending on live AI provider calls.
"""

from __future__ import annotations

import argparse
import sys
import uuid
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any
from unittest.mock import patch

from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.database import SessionLocal
from app.main import app
from app.models.company_coaching_session import CompanyCoachingSession
from app.models.question import Question
from app.models.resume import Resume, ResumeStatus
from app.models.resume_analysis import ResumeAnalysis
from app.models.study_plan import StudyPlan
from app.models.user import AccountStatus, User


@dataclass
class StepResult:
    name: str
    status_code: int
    ok: bool
    detail: str


class SmokeFailure(RuntimeError):
    """Raised when a smoke validation step fails."""


def require(response, expected_status: int, step_name: str) -> Any:
    if response.status_code != expected_status:
        try:
            payload = response.json()
        except Exception:
            payload = response.text
        raise SmokeFailure(
            f"{step_name} failed: expected {expected_status}, got {response.status_code}. "
            f"Payload: {payload}"
        )
    return response


def activate_user(email: str) -> User:
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            raise SmokeFailure(f"Unable to activate missing user {email}")
        user.account_status = AccountStatus.ACTIVE
        db.commit()
        db.refresh(user)
        return user


def ensure_questions(role: str, difficulty: str, category: str, count: int) -> list[int]:
    with SessionLocal() as db:
        existing = db.query(Question).filter(
            Question.role == role,
            Question.difficulty == difficulty,
            Question.category == category,
            Question.deleted_at.is_(None),
        ).limit(count).all()

        question_ids = [question.id for question in existing]
        remaining = count - len(question_ids)

        for index in range(remaining):
            question = Question(
                question_text=f"Smoke question {index + 1}: explain how you would handle a production issue end-to-end.",
                category=category,
                difficulty=difficulty,
                role=role,
                expected_answer_points=[
                    "State the impact clearly",
                    "Describe the debugging path",
                    "Explain the fix and validation",
                ],
                time_limit_seconds=300,
                provider_name="smoke-seed",
                generation_metadata={"seeded_by": "demo_smoke_validation"},
            )
            db.add(question)
            db.flush()
            question_ids.append(question.id)

        db.commit()
        return question_ids


def seed_advanced_records(user_id: int) -> dict[str, int]:
    with SessionLocal() as db:
        resume = Resume(
            user_id=user_id,
            filename="smoke_resume.pdf",
            file_url="/uploads/smoke_resume.pdf",
            file_size=1024,
            extracted_text="Python React AWS PostgreSQL distributed systems",
            skills={
                "technical_skills": ["Python", "React", "PostgreSQL", "AWS"],
                "soft_skills": ["Communication"],
                "tools": ["Git", "Docker"],
                "languages": ["English"],
            },
            experience=[
                {
                    "job_title": "Software Engineer",
                    "company_name": "Smoke Corp",
                    "start_date": "2023-01-01",
                    "end_date": "2026-01-01",
                    "duration_months": 36,
                }
            ],
            education=[
                {
                    "degree_type": "Bachelor",
                    "institution_name": "Smoke University",
                    "field_of_study": "Computer Science",
                    "graduation_year": 2022,
                }
            ],
            status=ResumeStatus.COMPLETED.value,
            total_experience_months=36,
            seniority_level="Mid",
        )
        db.add(resume)
        db.flush()

        analysis = ResumeAnalysis(
            user_id=user_id,
            resume_id=resume.id,
            analysis_data={
                "skill_inventory": {
                    "technical_skills": ["Python", "React", "AWS"],
                    "soft_skills": ["Communication"],
                    "tools": ["Docker"],
                    "languages": ["English"],
                },
                "experience_timeline": {
                    "total_years": 3.0,
                    "seniority_level": "Mid",
                    "companies": ["Smoke Corp"],
                    "roles": ["Software Engineer"],
                },
                "skill_gaps": {
                    "target_role": "Software Engineer",
                    "required_missing": ["System Design"],
                    "preferred_missing": ["Kubernetes"],
                    "match_percentage": 82.0,
                },
                "improvement_roadmap": {
                    "timeline_weeks": 8,
                    "milestones": [],
                },
            },
            agent_reasoning=[
                {
                    "step_number": 1,
                    "tool": "resume_parser",
                    "tool_input": {"resume_id": str(resume.id)},
                    "thought": "Seeded smoke reasoning",
                    "observation": "Resume parsed successfully",
                }
            ],
            execution_time_ms=250,
            status="success",
        )
        db.add(analysis)

        study_plan = StudyPlan(
            user_id=user_id,
            target_role="Software Engineer",
            duration_days=30,
            available_hours_per_week=10,
            plan_data={
                "daily_tasks": [
                    {
                        "day": 1,
                        "date": "2026-03-10",
                        "tasks": [
                            {
                                "skill": "Algorithms",
                                "activity": "Solve two medium problems",
                                "duration_minutes": 60,
                                "resources": ["https://example.com/algo"],
                                "completed": False,
                            }
                        ],
                    }
                ],
                "weekly_milestones": [
                    {
                        "week": 1,
                        "milestone": "Refresh data structures",
                        "skills_covered": ["Arrays", "Linked Lists"],
                        "assessment": "Timed coding round",
                        "completed": False,
                    }
                ],
                "resource_links": {"Algorithms": ["https://example.com/algo"]},
                "time_estimates": {
                    "total_hours": 40,
                    "hours_per_week": 10,
                    "completion_date": "2026-04-07",
                },
            },
            agent_reasoning=[],
            execution_time_ms=300,
            status="active",
            progress_percentage=0.0,
        )
        db.add(study_plan)
        db.flush()

        coaching_session = CompanyCoachingSession(
            user_id=user_id,
            company_name="Google",
            target_role="Software Engineer",
            coaching_data={
                "company_overview": {
                    "culture": "Collaborative and high-bar engineering culture",
                    "values": ["User focus", "Technical excellence"],
                    "interview_style": "Structured and problem-solving focused",
                    "hiring_process": "Screening, onsite, committee review",
                },
                "predicted_questions": [
                    {
                        "question": "Design a URL shortener.",
                        "category": "System Design",
                        "difficulty": "Medium",
                        "why_asked": "Tests scalable design thinking",
                    }
                ],
                "star_examples": [
                    {
                        "situation": "Production incident",
                        "task": "Restore service quickly",
                        "action": "Debugged and rolled out a safe fix",
                        "result": "Recovered within 20 minutes",
                        "relevant_to": "Ownership",
                    }
                ],
                "confidence_tips": ["Narrate tradeoffs clearly"],
                "pre_interview_checklist": ["Review system design basics"],
            },
            agent_reasoning=[],
            execution_time_ms=275,
        )
        db.add(coaching_session)
        db.commit()

        return {
            "resume_id": resume.id,
            "study_plan_id": study_plan.id,
            "coaching_session_id": coaching_session.id,
        }


def mocked_resume_analysis(resume_id: int, user_id: int, target_role: str, force_refresh: bool) -> dict[str, Any]:
    return {
        "analysis_id": 999001,
        "resume_id": resume_id,
        "analysis_data": {
            "skill_inventory": {"technical_skills": ["Python"], "soft_skills": [], "tools": [], "languages": []},
            "experience_timeline": {"total_years": 3.0, "seniority_level": "Mid", "companies": ["Smoke Corp"], "roles": ["Engineer"]},
            "skill_gaps": {"target_role": target_role, "required_missing": ["System Design"], "preferred_missing": [], "match_percentage": 80.0},
            "improvement_roadmap": {"timeline_weeks": 6, "milestones": []},
        },
        "agent_reasoning": [],
        "execution_time_ms": 123,
        "status": "success",
        "analyzed_at": datetime.utcnow().isoformat(),
        "from_cache": False,
        "cache_age_days": 0,
    }


def mocked_study_plan(user_id: int) -> Any:
    now = datetime.utcnow()

    class _StudyPlanMock:
        id = 999101
        user_id = 0
        target_role = "Software Engineer"
        duration_days = 30
        available_hours_per_week = 10
        plan_data = {
            "daily_tasks": [
                {
                    "day": 1,
                    "date": "2026-03-10",
                    "tasks": [
                        {
                            "skill": "Algorithms",
                            "activity": "Practice arrays",
                            "duration_minutes": 45,
                            "resources": ["https://example.com/arrays"],
                            "completed": False,
                        }
                    ],
                }
            ],
            "weekly_milestones": [],
            "resource_links": {"Algorithms": ["https://example.com/arrays"]},
            "time_estimates": {
                "total_hours": 40,
                "hours_per_week": 10,
                "completion_date": "2026-04-07",
            },
        }
        execution_time_ms = 110
        status = "active"
        progress_percentage = 0.0
        created_at = now
        updated_at = now

    mock = _StudyPlanMock()
    mock.user_id = user_id
    return mock


def mocked_coaching_session(user_id: int) -> Any:
    now = datetime.utcnow()

    class _CoachingMock:
        id = 999201
        user_id = 0
        company_name = "Meta"
        target_role = "Software Engineer"
        company_overview = {
            "culture": "Fast-moving product culture",
            "values": ["Move fast", "Impact"],
            "interview_style": "Product and execution heavy",
            "hiring_process": "Recruiter, phone screen, onsite",
        }
        predicted_questions = [{"question": "Design a feed ranking system", "category": "System Design"}]
        star_examples = [{"situation": "Incident", "task": "Lead response", "action": "Coordinated fix", "result": "Resolved", "relevant_to": "Leadership"}]
        confidence_tips = ["Be explicit about tradeoffs"]
        pre_interview_checklist = ["Review architecture choices"]
        execution_time_ms = 145
        created_at = now

    mock = _CoachingMock()
    mock.user_id = user_id
    return mock


def mocked_session_summary(session_id: int) -> dict[str, Any]:
    now = datetime.utcnow().isoformat()
    return {
        "id": 999301,
        "session_id": session_id,
        "overall_session_score": 82.0,
        "avg_content_quality": 84.0,
        "avg_clarity": 80.0,
        "avg_confidence": 79.0,
        "avg_technical_accuracy": 85.0,
        "score_trend": 4.5,
        "previous_session_score": 78.5,
        "top_strengths": ["Structured response", "Clear debugging steps", "Strong ownership"],
        "top_improvements": ["Add more metrics", "Tighten conclusion", "Mention tradeoffs"],
        "category_performance": {"Technical": 82.0},
        "radar_chart_data": {"labels": ["Content", "Clarity", "Confidence", "Technical"], "values": [84.0, 80.0, 79.0, 85.0]},
        "line_chart_data": {"labels": ["Prev", "Current"], "scores": [78.5, 82.0]},
        "total_questions": 1,
        "total_time_seconds": 180,
        "generated_at": now,
        "created_at": now,
    }


def run_smoke(include_advanced_posts: bool) -> list[StepResult]:
    results: list[StepResult] = []
    unique_email = f"smoke_{uuid.uuid4().hex[:10]}@example.com"
    password = "SecurePass123!"
    headers: dict[str, str] = {}

    with TestClient(app) as client:
        response = require(client.get("/health"), 200, "health")
        health_payload = response.json()
        results.append(
            StepResult(
                name="health",
                status_code=response.status_code,
                ok=health_payload.get("database") == "connected" and health_payload.get("cache") == "connected",
                detail=f"database={health_payload.get('database')} cache={health_payload.get('cache')}",
            )
        )

        response = require(
            client.post(
                "/api/v1/auth/register",
                json={"email": unique_email, "password": password, "name": "Smoke User"},
            ),
            201,
            "register",
        )
        results.append(StepResult("register", response.status_code, True, response.json()["message"]))

        activate_user(unique_email)

        response = require(
            client.post(
                "/api/v1/auth/login",
                json={"email": unique_email, "password": password},
            ),
            200,
            "login",
        )
        access_token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        results.append(StepResult("login", response.status_code, True, "access token issued"))

        response = require(client.get("/api/v1/users/me", headers=headers), 200, "get_profile")
        results.append(StepResult("get_profile", response.status_code, response.json()["email"] == unique_email, response.json()["email"]))

        ensure_questions("Software Engineer", "Medium", "Technical", 1)

        response = require(
            client.post(
                "/api/v1/interviews",
                headers=headers,
                json={
                    "role": "Software Engineer",
                    "difficulty": "Medium",
                    "question_count": 1,
                    "categories": ["Technical"],
                },
            ),
            201,
            "create_interview_session",
        )
        session_payload = response.json()
        session_id = session_payload["session_id"]
        question_id = session_payload["first_question"]["id"]
        results.append(StepResult("create_interview_session", response.status_code, True, f"session_id={session_id} question_id={question_id}"))

        response = require(client.get(f"/api/v1/interviews/{session_id}", headers=headers), 200, "get_session")
        results.append(StepResult("get_session", response.status_code, response.json()["status"] == "in_progress", response.json()["status"]))

        response = require(client.get(f"/api/v1/interviews/{session_id}/questions/1", headers=headers), 200, "get_question")
        results.append(StepResult("get_question", response.status_code, response.json()["id"] == question_id, response.json()["question_text"][:60]))

        response = require(
            client.post(
                f"/api/v1/interviews/{session_id}/drafts?question_id={question_id}",
                headers=headers,
                json={"draft_text": "This is a saved smoke draft that should survive autosave."},
            ),
            200,
            "save_draft",
        )
        results.append(StepResult("save_draft", response.status_code, True, f"draft_id={response.json()['draft_id']}"))

        response = require(
            client.get(f"/api/v1/interviews/{session_id}/drafts/{question_id}", headers=headers),
            200,
            "get_draft",
        )
        results.append(StepResult("get_draft", response.status_code, "smoke draft" in response.json()["draft_text"], "draft retrieved"))

        response = require(
            client.post(
                f"/api/v1/interviews/{session_id}/answers?question_id={question_id}",
                headers=headers,
                json={
                    "answer_text": (
                        "I would first assess user impact, inspect logs and metrics, reproduce the issue, "
                        "identify the root cause, apply a safe fix, validate it with tests, and monitor recovery."
                    )
                },
            ),
            201,
            "submit_answer",
        )
        submit_payload = response.json()
        results.append(
            StepResult(
                "submit_answer",
                response.status_code,
                submit_payload["session_completed"] is True,
                f"answer_id={submit_payload['answer_id']}",
            )
        )

        with patch("app.routes.interview_sessions.SessionSummaryService.generate_summary", return_value=mocked_session_summary(session_id)):
            response = require(
                client.get(f"/api/v1/interviews/{session_id}/summary", headers=headers),
                200,
                "get_session_summary",
            )
        results.append(StepResult("get_session_summary", response.status_code, True, f"score={response.json()['overall_session_score']}"))

        response = require(client.get("/api/v1/interviews", headers=headers), 200, "list_interview_sessions")
        results.append(StepResult("list_interview_sessions", response.status_code, len(response.json()) >= 1, f"count={len(response.json())}"))

        response = require(client.get("/api/v1/analytics/overview", headers=headers), 200, "analytics_overview")
        results.append(
            StepResult(
                "analytics_overview",
                response.status_code,
                "total_interviews_completed" in response.json(),
                f"total_interviews={response.json().get('total_interviews_completed')}",
            )
        )

        response = require(client.get("/api/v1/achievements/user", headers=headers), 200, "achievements_user")
        results.append(StepResult("achievements_user", response.status_code, True, f"earned={response.json().get('total_earned')}"))

        response = require(client.get("/api/v1/achievements/progress", headers=headers), 200, "achievements_progress")
        results.append(StepResult("achievements_progress", response.status_code, True, f"available={response.json().get('total_available')}"))

        response = require(client.get("/api/v1/streaks/current", headers=headers), 200, "streak_current")
        results.append(StepResult("streak_current", response.status_code, response.json().get("success") is True, "current streak ok"))

        response = require(client.get("/api/v1/streaks/history", headers=headers), 200, "streak_history")
        results.append(StepResult("streak_history", response.status_code, response.json().get("success") is True, "history ok"))

        response = require(client.get("/api/v1/streaks/stats", headers=headers), 200, "streak_stats")
        results.append(StepResult("streak_stats", response.status_code, response.json().get("success") is True, "stats ok"))

        response = require(client.get("/api/v1/leaderboard", headers=headers), 200, "leaderboard")
        results.append(StepResult("leaderboard", response.status_code, "entries" in response.json(), f"entries={response.json().get('total_entries')}"))

        response = require(client.get("/api/v1/leaderboard/preference", headers=headers), 200, "leaderboard_preference")
        results.append(
            StepResult(
                "leaderboard_preference",
                response.status_code,
                "leaderboard_opt_out" in response.json(),
                f"leaderboard_opt_out={response.json().get('leaderboard_opt_out')}",
            )
        )

        response = require(
            client.put("/api/v1/leaderboard/preference", headers=headers, json={"opt_out": False}),
            200,
            "leaderboard_preference_update",
        )
        results.append(
            StepResult(
                "leaderboard_preference_update",
                response.status_code,
                response.json().get("leaderboard_opt_out") is False,
                "opt-in confirmed",
            )
        )

        response = require(client.get("/api/v1/export/sessions", headers=headers), 200, "export_sessions_csv")
        results.append(
            StepResult(
                "export_sessions_csv",
                response.status_code,
                "text/csv" in response.headers.get("content-type", ""),
                response.headers.get("content-disposition", ""),
            )
        )

        user = activate_user(unique_email)
        advanced_ids = seed_advanced_records(user.id)

        response = require(client.get("/api/v1/resumes", headers=headers), 200, "list_resumes")
        results.append(StepResult("list_resumes", response.status_code, response.json().get("total", 0) >= 1, f"total={response.json().get('total')}"))

        response = require(client.get(f"/api/v1/resumes/{advanced_ids['resume_id']}/status", headers=headers), 200, "resume_status")
        results.append(StepResult("resume_status", response.status_code, True, response.json().get("status", "unknown")))

        response = require(
            client.get(f"/api/v1/resume-analysis/{advanced_ids['resume_id']}", headers=headers),
            200,
            "get_resume_analysis",
        )
        results.append(StepResult("get_resume_analysis", response.status_code, response.json()["resume_id"] == advanced_ids["resume_id"], "cached analysis ok"))

        response = require(client.get("/api/v1/study-plans/active", headers=headers), 200, "get_active_study_plan")
        results.append(StepResult("get_active_study_plan", response.status_code, response.json()["status"] == "active", f"plan_id={response.json()['id']}"))

        response = require(client.get("/api/v1/company-coaching", headers=headers), 200, "list_company_coaching")
        results.append(StepResult("list_company_coaching", response.status_code, response.json()["total"] >= 1, f"total={response.json()['total']}"))

        response = require(
            client.get(f"/api/v1/company-coaching/{advanced_ids['coaching_session_id']}", headers=headers),
            200,
            "get_company_coaching",
        )
        results.append(StepResult("get_company_coaching", response.status_code, response.json()["company_name"] == "Google", "detail ok"))

        if include_advanced_posts:
            with patch("app.routes.resume_analysis.ResumeAgentService.analyze_resume", side_effect=mocked_resume_analysis):
                response = require(
                    client.post(
                        f"/api/v1/resume-analysis/{advanced_ids['resume_id']}",
                        headers=headers,
                        json={"target_role": "Software Engineer", "force_refresh": True},
                    ),
                    200,
                    "post_resume_analysis",
                )
            results.append(StepResult("post_resume_analysis", response.status_code, response.json()["status"] == "success", "mocked analysis ok"))

            with patch(
                "app.routes.study_plans.StudyPlanAgentService.generate_study_plan",
                return_value=mocked_study_plan(user.id),
            ):
                response = require(
                    client.post(
                        "/api/v1/study-plans",
                        headers=headers,
                        json={
                            "target_role": "Software Engineer",
                            "duration_days": 30,
                            "available_hours_per_week": 10,
                        },
                    ),
                    201,
                    "post_study_plan",
                )
            results.append(StepResult("post_study_plan", response.status_code, response.json()["status"] == "active", "mocked study plan ok"))

            with patch(
                "app.routes.company_coaching.CompanyCoachingAgentService.generate_coaching_session",
                return_value=mocked_coaching_session(user.id),
            ):
                response = require(
                    client.post(
                        "/api/v1/company-coaching",
                        headers=headers,
                        json={"company_name": "Meta", "target_role": "Software Engineer"},
                    ),
                    201,
                    "post_company_coaching",
                )
            results.append(StepResult("post_company_coaching", response.status_code, response.json()["company_name"] == "Meta", "mocked coaching ok"))

    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Run deterministic smoke validation against the local backend.")
    parser.add_argument(
        "--skip-advanced-posts",
        action="store_true",
        help="Skip mocked POST validation for resume analysis, study plans, and company coaching.",
    )
    args = parser.parse_args()

    try:
        results = run_smoke(include_advanced_posts=not args.skip_advanced_posts)
    except SmokeFailure as exc:
        print(f"[FAIL] {exc}")
        return 1
    except Exception as exc:
        print(f"[FAIL] Unexpected smoke validation error: {exc}")
        return 1

    print("InterviewMaster AI smoke validation")
    print("-" * 72)
    for result in results:
        marker = "PASS" if result.ok else "WARN"
        print(f"[{marker}] {result.name:<32} status={result.status_code:<3} {result.detail}")

    failing = [result for result in results if not result.ok]
    if failing:
        print("-" * 72)
        print(f"Completed with {len(failing)} warning-level mismatches.")
        return 2

    print("-" * 72)
    print(f"Completed successfully. Validated {len(results)} backend smoke steps.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
