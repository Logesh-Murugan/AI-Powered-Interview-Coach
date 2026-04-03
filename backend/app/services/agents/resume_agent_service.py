"""
Resume Intelligence Agent Service

Provides comprehensive resume analysis using direct structured LLM calls with:
- Skill inventory analysis
- Experience timeline analysis
- Skill gap identification
- Learning roadmap generation
- 30-day caching
- Fallback to traditional NLP

Architecture:
    Direct LLM → JSON Extraction → Validation → Auto-Fill → Database

Requirements: 27.1-27.13
"""
import json
import logging
import re
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models.resume import Resume, ResumeStatus
from app.models.resume_analysis import ResumeAnalysis

logger = logging.getLogger(__name__)


class ResumeAgentService:
    """
    Service for resume intelligence analysis operations.

    Uses direct structured LLM calls instead of LangChain ReAct agents
    for reliable JSON output with HuggingFace Llama-3 models.

    Handles:
    - Cache checking (30-day TTL)
    - Direct LLM analysis with structured prompts
    - Robust JSON extraction and validation
    - Fallback to traditional NLP
    - Result storage

    Requirements: 27.1-27.13
    """

    CACHE_TTL_DAYS = 30

    def __init__(self, db: Session):
        self.db = db

    # ── Public API ──────────────────────────────────────────────────────

    def analyze_resume(
        self,
        resume_id: int,
        user_id: int,
        target_role: str = "Software Engineer",
        force_refresh: bool = False,
        background_tasks=None,
    ) -> Dict[str, Any]:
        """
        Analyze resume results, either from cache or triggering a new scan.
        Supports background execution to prevent timeouts.
        """
        resume = self._validate_resume(resume_id, user_id)

        # Check cache if not forcing refresh
        if not force_refresh:
            cached = self._get_cached_analysis(resume_id, user_id)
            if cached:
                return self._format_analysis_response(cached, from_cache=True)

        # Check for active processing to prevent thundering herd
        processing_now = (
            self.db.query(ResumeAnalysis)
            .filter(
                ResumeAnalysis.resume_id == resume_id,
                ResumeAnalysis.user_id == user_id,
                ResumeAnalysis.status == "processing",
                ResumeAnalysis.created_at
                >= datetime.now(timezone.utc) - timedelta(minutes=10),
            )
            .first()
        )
        if processing_now:
            return self._format_analysis_response(processing_now, from_cache=True)

        # Create 'processing' placeholder
        analysis_record = self._store_analysis(
            resume_id=resume_id,
            user_id=user_id,
            analysis_data={},
            agent_reasoning=[],
            execution_time_ms=0,
            status="processing",
        )
        self.db.commit()
        self.db.refresh(analysis_record)

        # Trigger background execution if background_tasks provided
        if background_tasks:
            logger.info(
                f"Triggering background AI analysis task for resume {resume_id}"
            )
            background_tasks.add_task(
                self.perform_analysis_task,
                analysis_record.id,
                resume_id,
                target_role,
            )
            return self._format_analysis_response(analysis_record, from_cache=False)
        else:
            return self._perform_analysis_sync(analysis_record, resume, target_role)

    def perform_analysis_task(
        self, analysis_id: int, resume_id: int, target_role: str
    ):
        """Background task entry point with fresh session handling."""
        from app.database import SessionLocal

        db = SessionLocal()
        try:
            analysis_record = (
                db.query(ResumeAnalysis)
                .filter(ResumeAnalysis.id == analysis_id)
                .first()
            )
            resume = db.query(Resume).filter(Resume.id == resume_id).first()

            if not analysis_record or not resume:
                logger.error(
                    f"Background task failed: records not found ({analysis_id}, {resume_id})"
                )
                return

            logger.info(
                f"🚀 Starting background AI analysis for resume {resume_id} "
                f"(Analysis ID: {analysis_id})"
            )

            service = ResumeAgentService(db)
            analysis_result = service._execute_direct_analysis(resume, target_role)

            analysis_record.analysis_data = analysis_result["output"]
            analysis_record.agent_reasoning = analysis_result.get(
                "reasoning_steps", []
            )
            analysis_record.execution_time_ms = analysis_result.get(
                "execution_time_ms", 0
            )
            analysis_record.status = analysis_result["status"]
            analysis_record.updated_at = datetime.now(timezone.utc)

            db.commit()
            logger.info(
                f"✅ Background AI analysis completed for resume {resume_id} "
                f"(status: {analysis_result['status']})"
            )

        except Exception as e:
            logger.error(f"❌ Background AI analysis failed: {e}")
            try:
                resume = db.query(Resume).filter(Resume.id == resume_id).first()
                service = ResumeAgentService(db)
                fallback = service._fallback_analysis(resume, target_role)

                record = (
                    db.query(ResumeAnalysis)
                    .filter(ResumeAnalysis.id == analysis_id)
                    .first()
                )
                if record:
                    record.analysis_data = fallback
                    record.status = "fallback"
                    record.updated_at = datetime.now(timezone.utc)
                    db.commit()
            except Exception as fe:
                logger.error(f"Double failure in background task: {fe}")
                db.rollback()
        finally:
            db.close()

    # ── Core AI Analysis (Direct LLM — replaces ReAct agent) ────────────

    def _execute_direct_analysis(
        self, resume: Resume, target_role: str
    ) -> Dict[str, Any]:
        """
        Execute direct structured LLM call for resume analysis.

        Replaces the fragile LangChain ReAct agent with a single structured
        prompt → JSON parse → validate pipeline (same pattern as Company
        Coaching agent which works reliably).
        """
        import time

        start_time = time.time()

        # Gather resume context
        resume_text = (resume.extracted_text or "")[:3000]  # cap for token budget
        existing_skills = resume.skills or {}

        technical_skills = existing_skills.get("technical_skills", [])
        soft_skills = existing_skills.get("soft_skills", [])
        tools_list = existing_skills.get("tools", [])

        if isinstance(technical_skills, list):
            tech_str = ", ".join(str(s) for s in technical_skills[:15])
        else:
            tech_str = str(technical_skills) if technical_skills else "Not extracted"

        if isinstance(soft_skills, list):
            soft_str = ", ".join(str(s) for s in soft_skills[:10])
        else:
            soft_str = str(soft_skills) if soft_skills else "Not extracted"

        if isinstance(tools_list, list):
            tools_str = ", ".join(str(t) for t in tools_list[:10])
        else:
            tools_str = str(tools_list) if tools_list else "Not extracted"

        experience_years = (
            resume.total_experience_months / 12
            if resume.total_experience_months
            else 0
        )
        seniority = resume.seniority_level or "Unknown"

        # Build structured prompt
        prompt = f"""You are an expert resume analyst. Analyze the following REAL resume and generate a structured JSON analysis.

RESUME TEXT (this is a REAL person's resume - use their ACTUAL information):
---
{resume_text}
---

PRE-EXTRACTED DATA:
- Technical Skills: {tech_str}
- Soft Skills: {soft_str}
- Tools: {tools_str}
- Experience: {experience_years:.1f} years
- Seniority Level: {seniority}
- Target Role: {target_role}

CRITICAL INSTRUCTIONS:
- Use the person's ACTUAL name, companies, and skills from the resume above
- Do NOT use placeholder names like "ABC Corporation", "XYZ Inc", or "John Doe"
- If information is not in the resume, say "Not found in resume"
- Base ALL analysis on the actual resume text provided
- Return ONLY valid JSON - no other text, no markdown, no explanation
- The response MUST start with {{ and end with }}

REQUIRED JSON SCHEMA (follow exactly):
{{
  "skill_inventory": {{
    "technical_skills": ["actual skills from resume"],
    "soft_skills": ["actual soft skills"],
    "tools": ["actual tools/technologies"],
    "languages": ["programming or spoken languages"]
  }},
  "experience_timeline": {{
    "total_years": {experience_years:.1f},
    "seniority_level": "{seniority}",
    "analysis": "2-3 sentence summary of their career progression using REAL company names",
    "companies": ["actual company names from resume"]
  }},
  "skill_gaps": [
    {{
      "gap": "specific skill needed for {target_role}",
      "recommendations": ["actionable step 1", "actionable step 2"]
    }}
  ],
  "improvement_roadmap": {{
    "short_term": ["goal 1 for next 1-3 months", "goal 2"],
    "long_term": ["goal 1 for 6-12 months", "goal 2"]
  }}
}}

Generate the JSON analysis now:"""

        # Call LLM
        logger.info(f"=== DIRECT LLM RESUME ANALYSIS for resume {resume.id} ===")
        logger.info(f"Resume text length: {len(resume_text)} chars")
        logger.info(f"Target role: {target_role}")

        max_retries = 3
        last_error = None

        for attempt in range(max_retries):
            try:
                logger.info(f"Attempt {attempt + 1}/{max_retries}")

                use_cache = attempt == 0
                llm_response = self._call_llm(prompt, use_cache=use_cache)
                logger.info(
                    f"LLM response received (length: {len(llm_response)})"
                )

                # Extract and parse JSON
                parsed_data = self._extract_json_robust(llm_response)
                logger.info(
                    f"✅ JSON extracted successfully: {list(parsed_data.keys())}"
                )

                # Validate and normalize structure
                validated = self._normalize_analysis_output(
                    parsed_data, resume, target_role
                )

                execution_time_ms = int((time.time() - start_time) * 1000)
                logger.info(
                    f"✅ Resume analysis completed in {execution_time_ms}ms"
                )

                return {
                    "output": validated,
                    "reasoning_steps": [
                        {
                            "step": "direct_llm_analysis",
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

        # All retries failed — use fallback
        execution_time_ms = int((time.time() - start_time) * 1000)
        logger.error(
            f"❌ All {max_retries} attempts failed for resume {resume.id}. "
            f"Last error: {last_error}. Using fallback."
        )

        fallback_data = self._fallback_analysis(resume, target_role)
        return {
            "output": fallback_data,
            "reasoning_steps": [],
            "execution_time_ms": execution_time_ms,
            "status": "fallback",
            "error": last_error,
        }

    def _call_llm(self, prompt: str, use_cache: bool = True) -> str:
        """Call LLM via singleton orchestrator."""
        from app.services.ai.singleton import get_ai_orchestrator
        from app.services.ai.types import AIRequest

        orchestrator = get_ai_orchestrator()
        request = AIRequest(
            prompt=prompt,
            max_tokens=1500,
            temperature=0.2,
            task_type="resume_analysis",
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

        # Try 1: Direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try 2: Extract from markdown code fence
        md_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if md_match:
            try:
                return json.loads(md_match.group(1).strip())
            except json.JSONDecodeError:
                pass

        # Try 3: Find outermost JSON object with balanced braces
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
                    # Try repairing
                    repaired = self._repair_json(json_str)
                    if repaired:
                        return repaired

        raise ValueError(f"Could not extract valid JSON from response: {text[:300]}...")

    def _repair_json(self, json_str: str) -> Optional[Dict]:
        """Try to repair common JSON formatting issues from LLMs."""
        try:
            s = json_str
            # Fix trailing commas
            s = re.sub(r",\s*}", "}", s)
            s = re.sub(r",\s*]", "]", s)
            # Fix Python booleans/None
            s = re.sub(r"\bTrue\b", "true", s)
            s = re.sub(r"\bFalse\b", "false", s)
            s = re.sub(r"\bNone\b", "null", s)
            return json.loads(s)
        except (json.JSONDecodeError, Exception):
            return None

    def _normalize_analysis_output(
        self, parsed: Dict[str, Any], resume: Resume, target_role: str
    ) -> Dict[str, Any]:
        """
        Normalize and validate parsed JSON into the standard frontend schema.
        Auto-fills missing fields with resume data instead of failing.
        """
        # Unwrap if wrapped in "analysis_data"
        data = parsed.get("analysis_data", parsed)

        # ── Key remapping (fuzzy names the LLM might use) ──
        key_map = {
            "skills": "skill_inventory",
            "skill_analysis": "skill_inventory",
            "inventory": "skill_inventory",
            "experience": "experience_timeline",
            "experience_analysis": "experience_timeline",
            "timeline": "experience_timeline",
            "gaps": "skill_gaps",
            "gap_analysis": "skill_gaps",
            "roadmap": "improvement_roadmap",
            "learning_roadmap": "improvement_roadmap",
            "improvement": "improvement_roadmap",
            "plan": "improvement_roadmap",
        }
        for fuzzy, target in key_map.items():
            if fuzzy in data and target not in data:
                data[target] = data[fuzzy]

        # ── skill_inventory ──
        si = data.get("skill_inventory", {})
        if not isinstance(si, dict):
            si = {}
        existing = resume.skills or {}
        formatted_inventory = {
            "technical_skills": si.get(
                "technical_skills", existing.get("technical_skills", [])
            ),
            "soft_skills": si.get("soft_skills", existing.get("soft_skills", [])),
            "tools": si.get("tools", existing.get("tools", [])),
            "languages": si.get("languages", existing.get("languages", [])),
        }

        # ── experience_timeline ──
        et = data.get("experience_timeline", {})
        if isinstance(et, list):
            et = {"timeline": et}
        if not isinstance(et, dict):
            et = {}
        exp_years = (
            resume.total_experience_months / 12
            if resume.total_experience_months
            else 0
        )
        formatted_timeline = {
            "total_years": et.get("total_years", exp_years),
            "seniority_level": et.get(
                "seniority_level", resume.seniority_level or "Unknown"
            ),
            "analysis": et.get("analysis", ""),
            "companies": (
                [str(c) for c in et.get("companies", [])]
                if et.get("companies")
                else []
            ),
        }

        # ── skill_gaps ──
        sg = data.get("skill_gaps", [])
        formatted_gaps = []
        if isinstance(sg, list):
            for gap in sg:
                if isinstance(gap, dict):
                    formatted_gaps.append(
                        {
                            "gap": gap.get("gap", str(gap)),
                            "recommendations": gap.get(
                                "recommendations",
                                [f"Study {gap.get('gap', 'this skill')}"],
                            ),
                        }
                    )
                elif isinstance(gap, str):
                    formatted_gaps.append(
                        {
                            "gap": gap,
                            "recommendations": [
                                f"Master {gap} fundamentals",
                                f"Build a project using {gap}",
                            ],
                        }
                    )
        elif isinstance(sg, dict):
            for g in sg.get("required_missing", []):
                formatted_gaps.append(
                    {
                        "gap": str(g),
                        "recommendations": [
                            f"Master {g} fundamentals",
                            f"Build a project using {g}",
                        ],
                    }
                )

        # ── improvement_roadmap ──
        ir = data.get("improvement_roadmap", {})
        if isinstance(ir, list):
            ir = {"short_term": ir[:3], "long_term": ir[3:] or ["Build expertise"]}
        if not isinstance(ir, dict):
            ir = {}
        formatted_roadmap = {
            "short_term": ir.get("short_term", ["Address technical gaps"]),
            "long_term": ir.get("long_term", ["Target senior leadership"]),
        }

        result = {
            "skill_inventory": formatted_inventory,
            "experience_timeline": formatted_timeline,
            "skill_gaps": formatted_gaps,
            "improvement_roadmap": formatted_roadmap,
            "fallback_used": False,
        }

        summary = data.get("analysis_summary") or data.get("summary")
        if summary:
            result["analysis_summary"] = summary

        logger.info(
            f"✅ Analysis normalized: {len(formatted_gaps)} gaps, "
            f"{len(formatted_inventory.get('technical_skills', []))} tech skills"
        )
        return result

    # ── Sync execution path ─────────────────────────────────────────────

    def _perform_analysis_sync(self, analysis_record, resume, target_role):
        """Internal synchronous execution logic."""
        try:
            analysis_result = self._execute_direct_analysis(resume, target_role)

            analysis_record.analysis_data = analysis_result["output"]
            analysis_record.agent_reasoning = analysis_result.get(
                "reasoning_steps", []
            )
            analysis_record.execution_time_ms = analysis_result.get(
                "execution_time_ms", 0
            )
            analysis_record.status = analysis_result["status"]
            analysis_record.updated_at = datetime.now(timezone.utc)

            self.db.commit()
            self.db.refresh(analysis_record)
            return self._format_analysis_response(analysis_record, from_cache=False)

        except Exception as e:
            logger.error(f"Agent analysis failed: {e}")
            fallback_result = self._fallback_analysis(resume, target_role)
            analysis_record.analysis_data = fallback_result
            analysis_record.status = "fallback"
            analysis_record.updated_at = datetime.now(timezone.utc)
            self.db.commit()
            return self._format_analysis_response(
                analysis_record, from_cache=False, error=str(e)
            )

    # ── Validation ──────────────────────────────────────────────────────

    def _validate_resume(self, resume_id: int, user_id: int) -> Resume:
        """Validate resume exists and is ready for analysis."""
        resume = (
            self.db.query(Resume)
            .filter(
                Resume.id == resume_id,
                Resume.user_id == user_id,
                Resume.deleted_at.is_(None),
            )
            .first()
        )

        if not resume:
            raise ValueError(f"Resume {resume_id} not found for user {user_id}")

        # Auto-trigger processing if resume is still in UPLOADED status
        if resume.status == ResumeStatus.UPLOADED.value:
            logger.warning(
                f"Resume {resume_id} is in UPLOADED status, triggering processing"
            )
            from app.tasks.resume_tasks import extract_resume_text_task
            import threading

            thread = threading.Thread(
                target=extract_resume_text_task, args=(resume_id,)
            )
            thread.daemon = True
            thread.start()

            raise ValueError(
                f"Resume {resume_id} is not ready for analysis and is being processed. "
                f"Please wait a few moments and try again. "
                f"Processing typically takes 30-60 seconds."
            )

        allowed_statuses = [
            ResumeStatus.TEXT_EXTRACTED.value,
            ResumeStatus.SKILLS_EXTRACTED.value,
            ResumeStatus.COMPLETED.value,
        ]

        if resume.status not in allowed_statuses:
            status_messages = {
                ResumeStatus.EXTRACTION_FAILED.value: "Processing failed, please try uploading the resume again"
            }
            message = status_messages.get(
                resume.status, f"Current status: {resume.status}"
            )
            raise ValueError(
                f"Resume {resume_id} is not ready for analysis. "
                f"{message}. "
                f"Required status: skills_extracted or completed"
            )

        if not resume.extracted_text:
            raise ValueError(f"Resume {resume_id} has no extracted text")

        return resume

    # ── Cache ───────────────────────────────────────────────────────────

    def _get_cached_analysis(
        self, resume_id: int, user_id: int = None
    ) -> Optional[ResumeAnalysis]:
        """Get cached analysis if less than 30 days old."""
        now = datetime.now(timezone.utc)
        cutoff_date = now - timedelta(days=self.CACHE_TTL_DAYS)

        query = self.db.query(ResumeAnalysis).filter(
            ResumeAnalysis.resume_id == resume_id,
            ResumeAnalysis.deleted_at.is_(None),
            ResumeAnalysis.created_at >= cutoff_date,
            ResumeAnalysis.status.in_(["success", "fallback", "processing"]),
        )

        if user_id is not None:
            query = query.filter(ResumeAnalysis.user_id == user_id)

        return query.order_by(ResumeAnalysis.created_at.desc()).first()

    # ── Fallback ────────────────────────────────────────────────────────

    def _fallback_analysis(self, resume: Resume, target_role: str) -> Dict[str, Any]:
        """Fallback to traditional NLP analysis when AI fails."""
        logger.info(f"Using fallback NLP analysis for resume {resume.id}")

        skills = resume.skills or {}
        experience_years = (
            resume.total_experience_months / 12
            if resume.total_experience_months
            else 0
        )

        return {
            "skill_inventory": {
                "technical_skills": skills.get("technical_skills", []),
                "soft_skills": skills.get("soft_skills", []),
                "tools": skills.get("tools", []),
                "languages": skills.get("languages", []),
            },
            "experience_timeline": {
                "total_years": experience_years,
                "seniority_level": resume.seniority_level or "Unknown",
                "companies": [],
                "analysis": "Analysis generated using traditional NLP methods.",
            },
            "skill_gaps": [
                {
                    "gap": f"Advanced {target_role} skills",
                    "recommendations": [
                        f"Study core {target_role} competencies",
                        "Practice with real-world projects",
                    ],
                }
            ],
            "improvement_roadmap": {
                "short_term": ["Complete skills assessment", "Address key gaps"],
                "long_term": [
                    f"Build expertise for {target_role}",
                    "Target leadership roles",
                ],
            },
            "fallback_used": True,
        }

    # ── Database ────────────────────────────────────────────────────────

    def _store_analysis(
        self,
        resume_id: int,
        user_id: int,
        analysis_data: Dict[str, Any],
        agent_reasoning: list,
        execution_time_ms: int,
        status: str,
    ) -> ResumeAnalysis:
        """Store analysis in database."""
        analysis = ResumeAnalysis(
            resume_id=resume_id,
            user_id=user_id,
            analysis_data=analysis_data,
            agent_reasoning=agent_reasoning,
            execution_time_ms=execution_time_ms,
            status=status,
        )

        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)

        logger.info(
            f"Stored analysis {analysis.id} for resume {resume_id} "
            f"(status: {status}, time: {execution_time_ms}ms)"
        )
        return analysis

    def _format_analysis_response(
        self,
        analysis: ResumeAnalysis,
        from_cache: bool,
        error: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Format analysis for API response."""
        try:
            created_at = getattr(analysis, "created_at", None)
            if created_at is None:
                created_at = datetime.now(timezone.utc)
            analyzed_at = created_at.isoformat()
        except Exception:
            analyzed_at = datetime.now(timezone.utc).isoformat()

        try:
            created_at = getattr(analysis, "created_at", None)
            cache_age_days = (
                (datetime.now(timezone.utc) - created_at).days if created_at else 0
            )
        except Exception:
            cache_age_days = 0

        actual_data = {}
        if analysis.analysis_data:
            actual_data = analysis.analysis_data
            if isinstance(actual_data, str):
                try:
                    actual_data = json.loads(actual_data)
                except Exception:
                    actual_data = {}

        response = {
            "analysis_id": getattr(analysis, "id", 0),
            "resume_id": getattr(analysis, "resume_id", 0),
            "analysis_data": actual_data,
            "agent_reasoning": getattr(analysis, "agent_reasoning", []),
            "execution_time_ms": getattr(analysis, "execution_time_ms", 0),
            "status": getattr(analysis, "status", "failed"),
            "analyzed_at": analyzed_at,
            "from_cache": from_cache,
            "cache_age_days": cache_age_days,
        }

        if error:
            response["error"] = error

        return response

    # ── History ──────────────────────────────────────────────────────────

    def get_analysis_history(
        self, resume_id: int, user_id: int, limit: int = 10
    ) -> list[Dict[str, Any]]:
        """Get analysis history for resume."""
        resume = (
            self.db.query(Resume)
            .filter(Resume.id == resume_id, Resume.user_id == user_id)
            .first()
        )

        if not resume:
            raise ValueError(f"Resume {resume_id} not found for user {user_id}")

        analyses = (
            self.db.query(ResumeAnalysis)
            .filter(
                ResumeAnalysis.resume_id == resume_id,
                ResumeAnalysis.deleted_at.is_(None),
            )
            .order_by(ResumeAnalysis.created_at.desc())
            .limit(limit)
            .all()
        )

        return [
            self._format_analysis_response(analysis, from_cache=False)
            for analysis in analyses
        ]
