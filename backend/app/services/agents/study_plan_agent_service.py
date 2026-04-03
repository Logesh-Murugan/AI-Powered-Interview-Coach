"""
Study Plan Agent Service

Provides personalized study plan generation using direct structured LLM calls.

Architecture:
    Direct LLM → JSON Extraction → Validation → Auto-Fill → Database

Requirements: 28.1-28.11
"""
import json
import re
import time
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.study_plan import StudyPlan
from app.models.resume_analysis import ResumeAnalysis
from app.models.user import User

logger = logging.getLogger(__name__)


class StudyPlanAgentService:
    """
    Service for generating personalized study plans using direct LLM calls.

    Replaces the fragile LangChain ReAct agent with structured prompts
    for reliable JSON output from HuggingFace Llama-3 models.
    """

    def __init__(self, db: Session):
        """Initialize study plan agent service"""
        self.db = db
        self.max_execution_time = 30.0

    # ── Public API ──────────────────────────────────────────────────────

    def generate_study_plan(
        self,
        user_id: int,
        target_role: str,
        duration_days: int,
        available_hours_per_week: int,
    ) -> StudyPlan:
        """Generate a personalized study plan for the user."""
        start_time = time.time()

        try:
            logger.info(f"Starting study plan generation for user {user_id}")

            self._validate_user_prerequisites(user_id)
            logger.info(f"User prerequisites validated for user {user_id}")

            skill_data = self._retrieve_skill_data(user_id)
            logger.info(f"Skill data retrieved for user {user_id}: {len(skill_data)} items")

            # Execute direct LLM analysis
            logger.info(f"Executing direct LLM for study plan (target: {target_role})")
            agent_result = self._execute_direct_plan(
                user_id=user_id,
                target_role=target_role,
                duration_days=duration_days,
                available_hours_per_week=available_hours_per_week,
                skill_data=skill_data,
            )

            plan_data = agent_result["output"]
            agent_reasoning = agent_result.get("reasoning_steps", [])
            execution_time_ms = agent_result.get("execution_time_ms", 0)

            # Check if plan has minimum required structure
            has_milestones = (
                plan_data
                and isinstance(plan_data, dict)
                and plan_data.get("weekly_milestones")
                and len(plan_data.get("weekly_milestones", [])) > 0
            )

            if not plan_data or not has_milestones:
                logger.warning(
                    "AI returned insufficient data, falling back to generated plan"
                )
                plan_data = self._generate_smart_fallback_plan(
                    target_role, duration_days, available_hours_per_week, skill_data
                )
                status = "fallback"
            else:
                status = "active"

            study_plan = self._create_study_plan_record(
                user_id,
                target_role,
                duration_days,
                available_hours_per_week,
                plan_data,
                agent_reasoning,
                execution_time_ms,
                status=status,
            )
            logger.info(
                f"✅ Study plan {status} record created for user {user_id}: "
                f"ID {study_plan.id}"
            )
            return study_plan

        except Exception as e:
            logger.error(f"Failed to create study plan for user {user_id}: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            raise ValueError(f"Failed to save study plan: {e}")

    # ── Core AI Plan Generation (Direct LLM) ────────────────────────────

    def _execute_direct_plan(
        self,
        user_id: int,
        target_role: str,
        duration_days: int,
        available_hours_per_week: int,
        skill_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute direct structured LLM call for study plan generation.

        Replaces the LangChain ReAct agent with a single structured prompt.
        """
        start_time = time.time()

        # Build the prompt with user context
        prompt = self._build_plan_prompt(
            user_id, target_role, duration_days, available_hours_per_week, skill_data
        )

        logger.info(f"=== DIRECT LLM STUDY PLAN for user {user_id} ===")

        max_retries = 3
        last_error = None

        for attempt in range(max_retries):
            try:
                logger.info(f"Attempt {attempt + 1}/{max_retries}")

                use_cache = attempt == 0
                llm_response = self._call_llm(prompt, use_cache=use_cache)
                logger.info(f"LLM response received (length: {len(llm_response)})")

                # Parse and validate
                parsed_data = self._extract_json_robust(llm_response)
                logger.info(f"✅ JSON extracted: {list(parsed_data.keys())}")

                # Normalize structure
                normalized = self._normalize_plan_output(
                    parsed_data, target_role, duration_days, available_hours_per_week
                )

                execution_time_ms = int((time.time() - start_time) * 1000)
                logger.info(f"✅ Study plan generated in {execution_time_ms}ms")

                return {
                    "output": normalized,
                    "reasoning_steps": [
                        {
                            "step": "direct_llm_plan",
                            "model": "meta-llama/Meta-Llama-3-8B-Instruct",
                            "method": "structured_output",
                            "attempt": attempt + 1,
                        }
                    ],
                    "execution_time_ms": execution_time_ms,
                    "status": "success",
                }

            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed: {e}")
                last_error = str(e)
                continue

        # All retries failed
        execution_time_ms = int((time.time() - start_time) * 1000)
        logger.error(
            f"❌ All {max_retries} attempts failed. Last error: {last_error}"
        )

        return {
            "output": None,
            "reasoning_steps": [],
            "execution_time_ms": execution_time_ms,
            "status": "error",
            "error": last_error,
        }

    def _build_plan_prompt(
        self,
        user_id: int,
        target_role: str,
        duration_days: int,
        available_hours_per_week: int,
        skill_data: Dict[str, Any],
    ) -> str:
        """Build structured prompt for study plan generation."""
        technical_skills = skill_data.get("technical_skills", [])
        if isinstance(technical_skills, list):
            skills_str = ", ".join(str(s) for s in technical_skills[:10]) or "Not specified"
        else:
            skills_str = str(technical_skills) if technical_skills else "Not specified"

        strengths = skill_data.get("strengths", [])
        if isinstance(strengths, list):
            strengths_str = ", ".join(str(s) for s in strengths[:5]) or "Not specified"
        else:
            strengths_str = str(strengths) if strengths else "Not specified"

        skill_gaps = skill_data.get("skill_gaps", [])
        if isinstance(skill_gaps, list):
            gaps_list = []
            for gap in skill_gaps[:5]:
                if isinstance(gap, dict):
                    gaps_list.append(str(gap.get("gap", gap)))
                else:
                    gaps_list.append(str(gap))
            gaps_str = ", ".join(gaps_list) or "Not specified"
        else:
            gaps_str = str(skill_gaps) if skill_gaps else "Not specified"

        weeks = max(1, duration_days // 7)
        start_date = datetime.now()
        completion_date = start_date + timedelta(days=duration_days)

        return f"""You are an expert career coach creating a personalized study plan.

USER PROFILE:
- Target Role: {target_role}
- Duration: {duration_days} days ({weeks} weeks)
- Available Time: {available_hours_per_week} hours/week
- Current Technical Skills: {skills_str}
- Experience: {skill_data.get('experience_years', 0)} years
- Strengths: {strengths_str}
- Skill Gaps to Address: {gaps_str}

CRITICAL INSTRUCTIONS:
- Create a study plan PERSONALIZED for this user's target role: {target_role}
- Focus on their specific skill gaps: {gaps_str}
- Fit within {available_hours_per_week} hours/week
- Generate daily_tasks for at least 7 days (one full week as a template)
- Each day must have 2 tasks with specific activities
- Generate exactly {weeks} weekly_milestones (one per week, covering ALL {weeks} weeks)
- Each milestone should cover DIFFERENT skills for progression across weeks
- Include REAL learning resources (real URLs from known platforms)
- Return ONLY valid JSON - no other text, no markdown
- The response MUST start with {{ and end with }}

REQUIRED JSON SCHEMA:
{{
  "daily_tasks": [
    {{
      "day": 1,
      "date": "{start_date.strftime('%Y-%m-%d')}",
      "tasks": [
        {{
          "skill": "specific skill name",
          "activity": "detailed activity description",
          "duration_minutes": 60,
          "resources": ["https://real-resource-url.com"],
          "completed": false
        }},
        {{
          "skill": "another skill",
          "activity": "practice activity",
          "duration_minutes": 30,
          "resources": ["https://resource.com"],
          "completed": false
        }}
      ]
    }}
  ],
  "weekly_milestones": [
    {{
      "week": 1,
      "milestone": "specific achievable milestone for week 1",
      "skills_covered": ["skill1", "skill2"],
      "assessment": "how to verify completion",
      "completed": false
    }},
    {{
      "week": 2,
      "milestone": "specific achievable milestone for week 2",
      "skills_covered": ["skill3", "skill4"],
      "assessment": "how to verify completion",
      "completed": false
    }}
  ],
  "resource_links": {{
    "Skill Name": ["https://resource1.com", "https://resource2.com"]
  }},
  "time_estimates": {{
    "total_hours": {available_hours_per_week * weeks},
    "hours_per_week": {available_hours_per_week},
    "completion_date": "{completion_date.strftime('%Y-%m-%d')}"
  }}
}}

IMPORTANT: Generate 7 daily_tasks entries (days 1-7) with 2 tasks each.
Generate {weeks} weekly milestones with DIFFERENT skills each week so the plan progresses.
Focus on skills relevant to {target_role}, not generic content.

Generate the JSON study plan now:"""

    def _call_llm(self, prompt: str, use_cache: bool = True) -> str:
        """Call LLM via singleton orchestrator."""
        from app.services.ai.singleton import get_ai_orchestrator
        from app.services.ai.types import AIRequest

        orchestrator = get_ai_orchestrator()
        request = AIRequest(
            prompt=prompt,
            max_tokens=2500,
            temperature=0.3,
            task_type="study_plan",
        )

        if use_cache:
            response = orchestrator.generate(request)
        else:
            response = orchestrator.generate_without_cache(request)

        if not response.success:
            raise RuntimeError(f"LLM call failed: {response.error}")
        if not response.content or not response.content.strip():
            raise RuntimeError("LLM returned empty response")

        return response.content

    def _extract_json_robust(self, text: str) -> Dict[str, Any]:
        """Robust JSON extraction from LLM response."""
        if not text or not text.strip():
            raise ValueError("Empty response from AI")

        text = text.strip()

        # Try direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try markdown extraction
        md_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if md_match:
            try:
                return json.loads(md_match.group(1).strip())
            except json.JSONDecodeError:
                pass

        # Try balanced brace extraction
        if "{" in text:
            start_idx = text.find("{")
            brace_count = 0
            end_idx = -1
            for i in range(start_idx, len(text)):
                if text[i] == "{":
                    brace_count += 1
                elif text[i] == "}":
                    brace_count -= 1
                    if brace_count == 0:
                        end_idx = i + 1
                        break

            if end_idx > start_idx:
                json_str = text[start_idx:end_idx]
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    # Try repair
                    s = json_str
                    s = re.sub(r",\s*}", "}", s)
                    s = re.sub(r",\s*]", "]", s)
                    s = re.sub(r"\bTrue\b", "true", s)
                    s = re.sub(r"\bFalse\b", "false", s)
                    s = re.sub(r"\bNone\b", "null", s)
                    try:
                        return json.loads(s)
                    except json.JSONDecodeError:
                        pass

        raise ValueError(f"Could not extract valid JSON: {text[:300]}...")

    def _normalize_plan_output(
        self,
        parsed: Dict[str, Any],
        target_role: str,
        duration_days: int,
        available_hours_per_week: int,
    ) -> Dict[str, Any]:
        """Normalize parsed JSON into the expected study plan schema."""
        # Unwrap if nested
        data = parsed.get("plan", parsed)

        weeks = max(1, duration_days // 7)
        start_date = datetime.now()
        completion_date = (start_date + timedelta(days=duration_days)).strftime(
            "%Y-%m-%d"
        )

        # ── daily_tasks ──
        daily_tasks = data.get("daily_tasks", [])
        if not isinstance(daily_tasks, list):
            daily_tasks = []
        # Ensure each task entry has required fields
        for dt in daily_tasks:
            if isinstance(dt, dict):
                dt.setdefault("day", 1)
                dt.setdefault("date", datetime.now().strftime("%Y-%m-%d"))
                tasks = dt.get("tasks", [])
                if not isinstance(tasks, list):
                    dt["tasks"] = []
                for task in dt.get("tasks", []):
                    if isinstance(task, dict):
                        task.setdefault("skill", target_role)
                        task.setdefault("activity", "Study session")
                        task.setdefault("duration_minutes", 60)
                        task.setdefault("resources", [])
                        task.setdefault("completed", False)

        # ── FILL MISSING DAYS ──
        # The LLM may only generate a subset of days (e.g., 7 out of 30).
        # Fill in missing days using skills from milestones and existing task patterns.
        existing_days = {dt.get("day") for dt in daily_tasks if isinstance(dt, dict)}
        total_days = min(duration_days, 30)

        if len(existing_days) < total_days:
            logger.info(
                f"LLM generated {len(existing_days)} days, need {total_days}. "
                f"Filling missing days..."
            )
            daily_tasks = self._fill_missing_days(
                daily_tasks, total_days, target_role, data, start_date
            )

        # Sort by day number
        daily_tasks.sort(key=lambda x: x.get("day", 0) if isinstance(x, dict) else 0)

        # ── weekly_milestones ──
        milestones = data.get("weekly_milestones", [])
        if not isinstance(milestones, list):
            milestones = []
        for ms in milestones:
            if isinstance(ms, dict):
                ms.setdefault("week", 1)
                ms.setdefault("milestone", f"Complete {target_role} study")
                ms.setdefault("skills_covered", [])
                ms.setdefault("assessment", "Review and practice")
                ms.setdefault("completed", False)

        # Fill missing milestones if needed
        existing_weeks = {ms.get("week") for ms in milestones if isinstance(ms, dict)}
        if len(existing_weeks) < weeks:
            milestones = self._fill_missing_milestones(
                milestones, weeks, target_role, data
            )

        # ── resource_links ──
        resources = data.get("resource_links", {})
        if not isinstance(resources, dict):
            resources = {}

        # ── time_estimates ──
        estimates = data.get("time_estimates", {})
        if not isinstance(estimates, dict):
            estimates = {}
        estimates.setdefault("total_hours", available_hours_per_week * weeks)
        estimates.setdefault("hours_per_week", available_hours_per_week)
        estimates.setdefault("completion_date", completion_date)

        return {
            "daily_tasks": daily_tasks,
            "weekly_milestones": milestones,
            "resource_links": resources,
            "time_estimates": estimates,
        }

    def _fill_missing_days(
        self,
        daily_tasks: List[Dict],
        total_days: int,
        target_role: str,
        llm_data: Dict[str, Any],
        start_date: datetime,
    ) -> List[Dict]:
        """
        Fill in missing days by rotating skills from milestones 
        and using patterns from LLM-generated days as templates.
        """
        # Collect all unique skills from existing tasks and milestones
        all_skills = []
        for dt in daily_tasks:
            if isinstance(dt, dict):
                for task in dt.get("tasks", []):
                    if isinstance(task, dict) and task.get("skill"):
                        skill = task["skill"]
                        if skill not in all_skills:
                            all_skills.append(skill)

        for ms in llm_data.get("weekly_milestones", []):
            if isinstance(ms, dict):
                for skill in ms.get("skills_covered", []):
                    if skill and skill not in all_skills:
                        all_skills.append(skill)

        if not all_skills:
            all_skills = [target_role, "Problem Solving", "System Design"]

        # Collect activity templates from existing tasks
        activity_templates = []
        for dt in daily_tasks:
            if isinstance(dt, dict):
                for task in dt.get("tasks", []):
                    if isinstance(task, dict) and task.get("activity"):
                        activity_templates.append({
                            "activity_prefix": task["activity"].split("(")[0].strip(),
                            "duration": task.get("duration_minutes", 60),
                            "resources": task.get("resources", []),
                        })

        if not activity_templates:
            activity_templates = [
                {"activity_prefix": "Study concepts and theory", "duration": 60, "resources": []},
                {"activity_prefix": "Practice with hands-on exercises", "duration": 60, "resources": []},
            ]

        # Generate missing days
        existing_days = {dt.get("day") for dt in daily_tasks if isinstance(dt, dict)}

        for day_num in range(1, total_days + 1):
            if day_num in existing_days:
                continue

            task_date = start_date + timedelta(days=day_num - 1)
            week_num = ((day_num - 1) // 7) + 1

            # Determine skills for this day based on week
            skill_idx_base = (day_num - 1) % len(all_skills)
            skill1 = all_skills[skill_idx_base]
            skill2 = all_skills[(skill_idx_base + 1) % len(all_skills)]

            # Use activity template patterns
            tmpl1 = activity_templates[(day_num - 1) % len(activity_templates)]
            tmpl2 = activity_templates[day_num % len(activity_templates)]

            tasks = [
                {
                    "skill": skill1,
                    "activity": f"{tmpl1['activity_prefix']} for {skill1} ({tmpl1['duration']} minutes)",
                    "duration_minutes": tmpl1["duration"],
                    "resources": tmpl1.get("resources", []),
                    "completed": False,
                },
                {
                    "skill": skill2,
                    "activity": f"{tmpl2['activity_prefix']} for {skill2} ({tmpl2['duration']} minutes)",
                    "duration_minutes": tmpl2["duration"],
                    "resources": tmpl2.get("resources", []),
                    "completed": False,
                },
            ]

            daily_tasks.append({
                "day": day_num,
                "date": task_date.strftime("%Y-%m-%d"),
                "tasks": tasks,
            })

        logger.info(f"Filled to {len(daily_tasks)} days (target: {total_days})")
        return daily_tasks

    def _fill_missing_milestones(
        self,
        milestones: List[Dict],
        total_weeks: int,
        target_role: str,
        llm_data: Dict[str, Any],
    ) -> List[Dict]:
        """Fill in missing weekly milestones."""
        existing_weeks = {ms.get("week") for ms in milestones if isinstance(ms, dict)}

        # Collect skills from all tasks for milestone generation
        all_skills = []
        for dt in llm_data.get("daily_tasks", []):
            if isinstance(dt, dict):
                for task in dt.get("tasks", []):
                    if isinstance(task, dict) and task.get("skill"):
                        skill = task["skill"]
                        if skill not in all_skills:
                            all_skills.append(skill)

        if not all_skills:
            all_skills = [target_role, "Problem Solving"]

        for week_num in range(1, total_weeks + 1):
            if week_num in existing_weeks:
                continue

            # Pick 2 skills for this week
            s1 = all_skills[((week_num - 1) * 2) % len(all_skills)]
            s2 = all_skills[((week_num - 1) * 2 + 1) % len(all_skills)]
            week_skills = [s1, s2]

            milestones.append({
                "week": week_num,
                "milestone": f"Complete Week {week_num}: Master {s1} and {s2} for {target_role}",
                "skills_covered": week_skills,
                "assessment": f"Build a mini-project demonstrating {s1} and {s2}",
                "completed": False,
            })

        milestones.sort(key=lambda x: x.get("week", 0) if isinstance(x, dict) else 0)
        return milestones

    # ── Smart Fallback ──────────────────────────────────────────────────

    def _generate_smart_fallback_plan(
        self,
        target_role: str,
        duration_days: int,
        available_hours_per_week: int,
        skill_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Generate a context-aware fallback plan using the user's actual skill data.
        NOT a generic static plan — incorporates user's gaps and target role.
        """
        start_date = datetime.now()
        weeks = max(1, min(duration_days // 7, 4))

        # Determine skills to focus on based on user data
        skill_gaps = skill_data.get("skill_gaps", [])
        gap_skills = []
        for gap in skill_gaps:
            if isinstance(gap, dict):
                gap_skills.append(gap.get("gap", str(gap)))
            elif isinstance(gap, str):
                gap_skills.append(gap)

        # Role-specific skills if no gaps available
        if not gap_skills:
            role_skills = {
                "Software Engineer": [
                    "Data Structures",
                    "System Design",
                    "Algorithms",
                    "REST APIs",
                    "Testing",
                ],
                "Data Scientist": [
                    "Machine Learning",
                    "Statistics",
                    "Python/Pandas",
                    "SQL",
                    "Data Visualization",
                ],
                "Frontend Developer": [
                    "React/Vue",
                    "TypeScript",
                    "CSS/Styling",
                    "Performance",
                    "Accessibility",
                ],
                "Backend Developer": [
                    "Databases",
                    "API Design",
                    "Security",
                    "Caching",
                    "Microservices",
                ],
                "DevOps Engineer": [
                    "Docker/Kubernetes",
                    "CI/CD",
                    "Cloud (AWS/GCP)",
                    "Monitoring",
                    "Infrastructure as Code",
                ],
            }
            # Find best match
            for role_key, skills in role_skills.items():
                if role_key.lower() in target_role.lower():
                    gap_skills = skills
                    break
            if not gap_skills:
                gap_skills = ["Technical Skills", "Problem Solving", "System Design",
                             "Communication", "Project Management"]

        # Generate daily tasks focused on actual gaps
        daily_tasks = []
        for day in range(1, min(duration_days + 1, 31)):
            task_date = start_date + timedelta(days=day - 1)
            skill = gap_skills[(day - 1) % len(gap_skills)]

            daily_tasks.append({
                "day": day,
                "date": task_date.strftime("%Y-%m-%d"),
                "tasks": [
                    {
                        "skill": skill,
                        "activity": f"Study {skill} concepts and fundamentals for {target_role}",
                        "duration_minutes": min(60, (available_hours_per_week * 60) // 7),
                        "resources": [],
                        "completed": False,
                    },
                    {
                        "skill": skill,
                        "activity": f"Practice {skill} with hands-on exercises",
                        "duration_minutes": min(30, (available_hours_per_week * 30) // 7),
                        "resources": [],
                        "completed": False,
                    },
                ],
            })

        # Generate weekly milestones
        weekly_milestones = []
        for week in range(1, weeks + 1):
            week_skills = gap_skills[
                ((week - 1) * 2) % len(gap_skills) : ((week - 1) * 2 + 2) % len(gap_skills) + 1
            ]
            if not week_skills:
                week_skills = [gap_skills[(week - 1) % len(gap_skills)]]

            weekly_milestones.append({
                "week": week,
                "milestone": f"Master {', '.join(week_skills)} for {target_role} - Week {week}",
                "skills_covered": week_skills,
                "assessment": f"Build a mini-project demonstrating week {week} skills",
                "completed": False,
            })

        # Resource links per skill
        resource_links = {}
        for skill in gap_skills[:5]:
            resource_links[skill] = [
                f"https://www.google.com/search?q={skill.replace(' ', '+')}+tutorial",
            ]

        completion_date = start_date + timedelta(days=duration_days)

        return {
            "daily_tasks": daily_tasks,
            "weekly_milestones": weekly_milestones,
            "resource_links": resource_links,
            "time_estimates": {
                "total_hours": available_hours_per_week * weeks,
                "hours_per_week": available_hours_per_week,
                "completion_date": completion_date.strftime("%Y-%m-%d"),
            },
        }

    # ── Validation & Helpers ────────────────────────────────────────────

    def _validate_user_prerequisites(self, user_id: int) -> None:
        """Validate user exists."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")

    def _retrieve_skill_data(self, user_id: int) -> Dict[str, Any]:
        """Retrieve skill data from resume analysis."""
        resume_analysis = (
            self.db.query(ResumeAnalysis)
            .filter(
                ResumeAnalysis.user_id == user_id,
                ResumeAnalysis.status.in_(["success", "completed"]),
            )
            .order_by(ResumeAnalysis.created_at.desc())
            .first()
        )

        if not resume_analysis:
            return {
                "technical_skills": [],
                "soft_skills": [],
                "experience_years": 0,
                "education_level": "unknown",
                "skill_gaps": [],
                "strengths": [],
                "weaknesses": [],
            }

        analysis_data = resume_analysis.analysis_data or {}

        # Handle both flat and nested data structures
        skill_inv = analysis_data.get("skill_inventory", {})

        return {
            "technical_skills": self._ensure_list(
                skill_inv.get("technical_skills", analysis_data.get("technical_skills", []))
            ),
            "soft_skills": self._ensure_list(
                skill_inv.get("soft_skills", analysis_data.get("soft_skills", []))
            ),
            "experience_years": analysis_data.get(
                "experience_years",
                analysis_data.get("experience_timeline", {}).get("total_years", 0)
                if isinstance(analysis_data.get("experience_timeline"), dict)
                else 0,
            ),
            "education_level": analysis_data.get("education_level", "unknown"),
            "skill_gaps": self._ensure_list(analysis_data.get("skill_gaps", [])),
            "strengths": self._ensure_list(analysis_data.get("strengths", [])),
            "weaknesses": self._ensure_list(analysis_data.get("weaknesses", [])),
        }

    def _ensure_list(self, value) -> List:
        """Ensure a value is a list, converting if necessary."""
        if isinstance(value, list):
            return value
        elif value is None:
            return []
        elif isinstance(value, dict):
            if "gap" in value:
                return [value["gap"]]
            return [str(value)]
        else:
            return [str(value)]

    def _validate_plan_structure(self, plan_data: Dict[str, Any]) -> None:
        """Validate plan contains required fields."""
        required_fields = [
            "daily_tasks",
            "weekly_milestones",
            "resource_links",
            "time_estimates",
        ]
        for field in required_fields:
            if field not in plan_data:
                raise ValueError(f"Plan missing required field: {field}")

    # ── Database ────────────────────────────────────────────────────────

    def _create_study_plan_record(
        self,
        user_id: int,
        target_role: str,
        duration_days: int,
        available_hours_per_week: int,
        plan_data: Dict[str, Any],
        agent_reasoning: list,
        execution_time_ms: int,
        status: str = "active",
    ) -> StudyPlan:
        """Create study plan record in database."""
        study_plan = StudyPlan(
            user_id=user_id,
            target_role=target_role,
            duration_days=duration_days,
            available_hours_per_week=available_hours_per_week,
            plan_data=plan_data,
            agent_reasoning=agent_reasoning,
            execution_time_ms=execution_time_ms,
            status=status,
            progress_percentage=0.0,
        )

        self.db.add(study_plan)
        self.db.commit()
        self.db.refresh(study_plan)

        return study_plan

    # ── CRUD Operations ─────────────────────────────────────────────────

    def get_study_plan(self, plan_id: int, user_id: int) -> Optional[StudyPlan]:
        """Get study plan by ID"""
        return (
            self.db.query(StudyPlan)
            .filter(StudyPlan.id == plan_id, StudyPlan.user_id == user_id)
            .first()
        )

    def get_active_plan(self, user_id: int) -> Optional[StudyPlan]:
        """Get user's active study plan"""
        try:
            return (
                self.db.query(StudyPlan)
                .filter(
                    StudyPlan.user_id == user_id,
                    StudyPlan.status == "active",
                    StudyPlan.deleted_at.is_(None),
                )
                .first()
            )
        except Exception as e:
            logger.error(f"Error fetching active study plan for user {user_id}: {e}")
            return None

    def update_progress(
        self, plan_id: int, user_id: int, task_updates: Dict[str, Any]
    ) -> StudyPlan:
        """Update study plan progress."""
        import copy
        from sqlalchemy.orm.attributes import flag_modified

        study_plan = self.get_study_plan(plan_id, user_id)
        if not study_plan:
            raise ValueError(f"Study plan {plan_id} not found")

        # Deep copy to ensure SQLAlchemy detects the mutation
        plan_data = copy.deepcopy(study_plan.plan_data)

        logger.info(f"Updating progress for plan {plan_id}: {task_updates}")

        # Handle both frontend format (day_X_task_Y) and backend format (X_Y)
        for day_data in plan_data.get("daily_tasks", []):
            day_num = day_data.get("day")
            for task_idx, task in enumerate(day_data.get("tasks", [])):
                task_key_backend = f"{day_num}_{task_idx}"
                task_key_frontend = f"day_{day_num}_task_{task_idx}"

                if task_key_backend in task_updates:
                    task["completed"] = bool(task_updates[task_key_backend])
                    logger.info(f"Updated task {task_key_backend} -> {task['completed']}")
                elif task_key_frontend in task_updates:
                    task["completed"] = bool(task_updates[task_key_frontend])
                    logger.info(f"Updated task {task_key_frontend} -> {task['completed']}")

        # Handle explicit milestone updates
        for milestone in plan_data.get("weekly_milestones", []):
            week_num = milestone.get("week")
            milestone_key = f"milestone_{week_num}"
            if milestone_key in task_updates:
                milestone["completed"] = bool(task_updates[milestone_key])

        # Auto-complete milestones when all tasks in that week are done
        for milestone in plan_data.get("weekly_milestones", []):
            week_num = milestone.get("week", 0)
            start_day = (week_num - 1) * 7 + 1
            end_day = week_num * 7
            week_total = 0
            week_completed = 0
            for day_data in plan_data.get("daily_tasks", []):
                d = day_data.get("day", 0)
                if start_day <= d <= end_day:
                    for task in day_data.get("tasks", []):
                        week_total += 1
                        if task.get("completed", False):
                            week_completed += 1
            if week_total > 0 and week_completed >= week_total:
                milestone["completed"] = True

        # Recalculate progress
        total_tasks = self._count_total_tasks(plan_data)
        completed_tasks = self._count_completed_tasks(plan_data)

        if total_tasks > 0:
            progress = (completed_tasks / total_tasks) * 100
            study_plan.progress_percentage = round(progress, 2)

        if study_plan.progress_percentage >= 100:
            study_plan.status = "completed"

        # Assign the deep-copied dict and flag it as modified for SQLAlchemy
        study_plan.plan_data = plan_data
        flag_modified(study_plan, "plan_data")

        self.db.commit()
        self.db.refresh(study_plan)

        logger.info(f"Progress updated: {completed_tasks}/{total_tasks} tasks, {study_plan.progress_percentage}%")

        return study_plan

    def abandon_plan(self, plan_id: int, user_id: int) -> StudyPlan:
        """Mark study plan as abandoned"""
        study_plan = self.get_study_plan(plan_id, user_id)
        if not study_plan:
            raise ValueError(f"Study plan {plan_id} not found")

        study_plan.status = "abandoned"
        self.db.commit()
        self.db.refresh(study_plan)

        return study_plan

    def _count_total_tasks(self, plan_data: Dict[str, Any]) -> int:
        """Count total tasks in the plan."""
        daily_tasks = plan_data.get("daily_tasks", [])
        return sum(
            len(day.get("tasks", []))
            for day in daily_tasks
            if isinstance(day, dict)
        )

    def _count_completed_tasks(self, plan_data: Dict[str, Any]) -> int:
        """Count completed tasks in the plan."""
        daily_tasks = plan_data.get("daily_tasks", [])
        completed = 0
        for day in daily_tasks:
            if not isinstance(day, dict):
                continue
            for task in day.get("tasks", []):
                if isinstance(task, dict) and task.get("completed", False):
                    completed += 1
        return completed
