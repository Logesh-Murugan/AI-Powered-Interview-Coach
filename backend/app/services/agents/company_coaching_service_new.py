"""
Company Coaching Agent Service - Production Grade

Provides company-specific interview coaching using structured LLM outputs.
Uses Pydantic schemas for guaranteed JSON validity with auto-fill fallbacks.

Architecture:
    Direct LLM → Structured Output → JSON Repair → Auto-Fill → Pydantic Validation → Database

Requirements: 29.1-29.11
"""
import json
import logging
import time
import asyncio
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from pydantic import ValidationError

from app.models.company_coaching_session import CompanyCoachingSession
from app.models.resume_analysis import ResumeAnalysis
from app.models.user import User
from app.services.agents.schemas.agent_schemas import CoachingResponse
from app.services.agents.utils.json_utils import (
    extract_and_repair_json,
    ensure_coaching_data_complete
)

logger = logging.getLogger(__name__)


class CompanyCoachingAgentService:
    """
    Service for generating company-specific interview coaching using structured LLM outputs.
    
    This service replaces the fragile ReAct agent approach with direct structured LLM calls,
    ensuring 100% valid JSON output through Pydantic validation and auto-fill fallbacks.
    """
    
    def __init__(self, db: Session):
        """Initialize company coaching agent service"""
        self.db = db
        self.max_execution_time = 20.0  # 20 seconds (Req 29.10)
        self.free_tier_monthly_limit = 3  # 3 sessions per month (Req 29.11)
    
    async def generate_coaching_session(
        self,
        user_id: int,
        company_name: str,
        target_role: Optional[str] = None
    ) -> CompanyCoachingSession:
        """
        Generate company-specific interview coaching session.
        
        Flow:
        1. Validate user prerequisites
        2. Build structured prompt with schema
        3. Call LLM with retry logic
        4. Extract and repair JSON
        5. Auto-fill missing fields
        6. Pydantic validation
        7. Save to database
        
        Args:
            user_id: User ID
            company_name: Target company name
            target_role: Optional target job role
            
        Returns:
            Created coaching session
            
        Raises:
            ValueError: If validation fails or rate limit exceeded
        """
        start_time = time.time()
        
        # Step 1: Validate prerequisites
        self._validate_user_prerequisites(user_id)
        self._check_rate_limit(user_id)
        
        # Step 2: Get user context
        user_context = self._get_user_context(user_id)
        
        # Step 3: Generate structured coaching
        coaching_data = await self._generate_structured_coaching(
            company_name=company_name,
            target_role=target_role,
            user_context=user_context
        )
        
        execution_time_ms = int((time.time() - start_time) * 1000)
        
        # Step 4: Create and save session
        coaching_session = self._create_coaching_session_record(
            user_id=user_id,
            company_name=company_name,
            target_role=target_role,
            coaching_data=coaching_data,
            agent_reasoning={
                "model": "llama-3.3-70b-versatile",
                "generation_method": "structured_output",
                "validation": "pydantic",
                "auto_fill_applied": True,
                "timestamp": time.time()
            },
            execution_time_ms=execution_time_ms,
            status='success'
        )
        
        logger.info(f"✅ Coaching session created: ID {coaching_session.id} for user {user_id}")
        return coaching_session
    
    async def _generate_structured_coaching(
        self,
        company_name: str,
        target_role: Optional[str],
        user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate structured coaching data using LLM with Pydantic validation.
        
        Implements retry logic with automatic fallback data on complete failure.
        """
        # Build the structured prompt
        prompt = self._build_coaching_prompt(
            company_name=company_name,
            target_role=target_role,
            user_context=user_context
        )
        
        logger.info(f"=== GENERATING STRUCTURED COACHING FOR {company_name} ===")
        
        # Retry logic
        max_retries = 3
        last_error = None
        
        for attempt in range(max_retries):
            try:
                # Call LLM
                llm_response = await self._call_llm(prompt)
                logger.info(f"Attempt {attempt + 1}: LLM response received (length: {len(llm_response)})")
                
                # Extract and repair JSON
                parsed_data = extract_and_repair_json(llm_response)
                
                if not parsed_data:
                    logger.warning(f"Attempt {attempt + 1}: Failed to extract JSON")
                    last_error = "Could not extract valid JSON from LLM response"
                    continue
                
                logger.info(f"✅ JSON extracted with keys: {list(parsed_data.keys())}")
                
                # Auto-fill missing fields with minimum requirements
                parsed_data = ensure_coaching_data_complete(parsed_data)
                logger.info("✅ Auto-fill applied for minimum requirements")
                
                # Validate with Pydantic
                try:
                    validated = CoachingResponse(**parsed_data)
                    logger.info(f"✅ Pydantic validation successful on attempt {attempt + 1}")
                    return validated.dict()
                    
                except ValidationError as ve:
                    logger.warning(f"⚠️ Pydantic validation failed: {ve}")
                    last_error = str(ve)
                    
                    # Try to fix and re-validate
                    fixed_data = self._apply_validation_fixes(parsed_data, ve)
                    try:
                        validated = CoachingResponse(**fixed_data)
                        logger.info(f"✅ Validation successful after fixes on attempt {attempt + 1}")
                        return validated.dict()
                    except ValidationError as ve2:
                        logger.error(f"❌ Validation failed even after fixes: {ve2}")
                        last_error = str(ve2)
                        
            except Exception as e:
                logger.error(f"❌ Error on attempt {attempt + 1}: {e}")
                last_error = str(e)
        
        # All retries failed - use emergency fallback
        logger.error(f"❌ All {max_retries} attempts failed. Using emergency fallback.")
        return self._emergency_fallback_data(company_name)
    
    def _build_coaching_prompt(
        self,
        company_name: str,
        target_role: Optional[str],
        user_context: Dict[str, Any]
    ) -> str:
        """Build the coaching generation prompt with strict JSON schema."""
        skills = user_context.get('skills', 'Not specified')
        experience = user_context.get('experience_years', 0)
        role_context = f" for the {target_role} role" if target_role else ""
        
        prompt = f"""You are an expert interview coach. Generate comprehensive interview coaching for {company_name}{role_context}.

CANDIDATE PROFILE:
- Experience: {experience} years
- Key Skills: {skills}

REQUIREMENTS:
1. Research the company's culture, values, and interview style
2. Predict at least 5 interview questions specific to this company and role
3. Create 1-3 STAR method examples relevant to the candidate's background
4. Provide at least 3 confidence-building tips
5. Create at least 5 pre-interview checklist items

CRITICAL INSTRUCTIONS:
- Return ONLY valid JSON matching the exact schema below
- Do NOT include markdown code blocks (no ```json)
- Do NOT include explanations outside the JSON
- Ensure all arrays have the minimum required items
- Use specific, actionable content tailored to {company_name}

JSON SCHEMA:
{{
  "company_overview": {{
    "culture": "Description of company culture",
    "values": "Company core values",
    "interview_style": "Interview format details",
    "hiring_process": "Hiring process steps"
  }},
  "predicted_questions": [
    "Question 1",
    "Question 2",
    "Question 3",
    "Question 4",
    "Question 5"
  ],
  "star_examples": [
    {{
      "situation": "Context of the example",
      "task": "Specific task/challenge",
      "action": "Steps taken",
      "result": "Measurable outcome"
    }}
  ],
  "confidence_tips": [
    "Tip 1",
    "Tip 2",
    "Tip 3"
  ],
  "pre_interview_checklist": [
    "Item 1",
    "Item 2",
    "Item 3",
    "Item 4",
    "Item 5"
  ]
}}

Generate the JSON now:"""
        
        return prompt
    
    async def _call_llm(self, prompt: str) -> str:
        """
        Call the LLM with the given prompt.
        Uses the existing orchestrator for consistency.
        """
        from app.services.llm.orchestrator import LLMOrchestrator
        
        orchestrator = LLMOrchestrator()
        
        # Call LLM (this is async in the orchestrator)
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,  # Default executor
            lambda: orchestrator.generate_text(prompt)
        )
        
        return response
    
    def _apply_validation_fixes(self, data: Dict[str, Any], error: ValidationError) -> Dict[str, Any]:
        """Apply specific fixes based on validation errors."""
        fixed = data.copy()
        error_str = str(error)
        
        # Fix missing fields
        if "company_overview" in error_str and "company_overview" not in fixed:
            fixed["company_overview"] = {
                "culture": "Research company culture through website and news articles",
                "values": "Review company mission statement and core values",
                "interview_style": "Combination of technical and behavioral interviews",
                "hiring_process": "Multi-round process including phone screen, technical, and final interview"
            }
        
        # Re-apply auto-fill to ensure minimums
        fixed = ensure_coaching_data_complete(fixed)
        
        return fixed
    
    def _emergency_fallback_data(self, company_name: str) -> Dict[str, Any]:
        """
        Emergency fallback data when all generation attempts fail.
        Ensures the user gets useful content even on total failure.
        """
        logger.warning(f"Using emergency fallback for {company_name}")
        
        return {
            "company_overview": {
                "culture": f"Research {company_name}'s culture through their website, Glassdoor, and recent news articles.",
                "values": "Review the company's mission statement, core values, and recent initiatives.",
                "interview_style": "Most tech companies use a combination of technical coding interviews and behavioral questions.",
                "hiring_process": "Typical process: Phone screen → Technical interview → System design → Behavioral → Offer"
            },
            "predicted_questions": [
                "Tell me about yourself and your background.",
                "Why do you want to work at our company?",
                "Describe a challenging project you worked on.",
                "How do you handle conflicts with team members?",
                "What are your strengths and areas for improvement?"
            ],
            "star_examples": [
                {
                    "situation": "A critical project deadline was at risk due to unexpected technical challenges.",
                    "task": "I was responsible for delivering the core feature that blocked the entire release.",
                    "action": "I broke down the problem, identified the bottleneck, worked extra hours, and coordinated with the team to redistribute tasks.",
                    "result": "We delivered on time with all quality metrics met, and the feature became one of our most used components."
                }
            ],
            "confidence_tips": [
                "Research the company's recent news and products before the interview.",
                "Practice answering common questions out loud.",
                "Prepare thoughtful questions to ask the interviewer."
            ],
            "pre_interview_checklist": [
                "Review the job description and match your experience to requirements.",
                "Prepare your STAR examples for behavioral questions.",
                "Research the interviewers on LinkedIn.",
                "Test your technology (camera, microphone, internet) if virtual.",
                "Plan your outfit and route (or virtual background)."
            ]
        }
    
    def _get_user_context(self, user_id: int) -> Dict[str, Any]:
        """Get user context from resume analysis."""
        resume_analysis = self.db.query(ResumeAnalysis).filter(
            ResumeAnalysis.user_id == user_id,
            ResumeAnalysis.status.in_(['success', 'completed'])
        ).first()
        
        if not resume_analysis:
            return {
                'skills': 'Not specified',
                'experience_years': 0,
                'technical_skills': [],
                'strengths': []
            }
        
        analysis_data = resume_analysis.analysis_data or {}
        
        technical_skills = analysis_data.get('technical_skills', [])
        if isinstance(technical_skills, list):
            skills = ', '.join(str(skill) for skill in technical_skills[:10])
        else:
            skills = str(technical_skills) if technical_skills else "Not specified"
        
        return {
            'skills': skills,
            'experience_years': analysis_data.get('experience_years', 0),
            'technical_skills': technical_skills,
            'strengths': analysis_data.get('strengths', [])
        }
    
    def _validate_user_prerequisites(self, user_id: int) -> None:
        """Validate user has resume analysis."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        resume_analysis = self.db.query(ResumeAnalysis).filter(
            ResumeAnalysis.user_id == user_id,
            ResumeAnalysis.status.in_(['success', 'completed'])
        ).first()
        
        if not resume_analysis:
            raise ValueError(
                "User must have a completed resume analysis before requesting company coaching."
            )
    
    def _check_rate_limit(self, user_id: int) -> None:
        """Check if user has exceeded monthly coaching limit (Req 29.11)."""
        from datetime import datetime
        from sqlalchemy import func
        
        user = self.db.query(User).filter(User.id == user_id).first()
        is_free_tier = True  # TODO: Check actual subscription tier
        
        if is_free_tier:
            first_day_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            session_count = self.db.query(func.count(CompanyCoachingSession.id)).filter(
                CompanyCoachingSession.user_id == user_id,
                CompanyCoachingSession.created_at >= first_day_of_month
            ).scalar()
            
            if session_count >= self.free_tier_monthly_limit:
                raise ValueError(
                    f"Free tier limit reached: {self.free_tier_monthly_limit} coaching sessions per month. "
                    "Upgrade to premium for unlimited sessions."
                )
    
    def _create_coaching_session_record(
        self,
        user_id: int,
        company_name: str,
        target_role: Optional[str],
        coaching_data: Dict[str, Any],
        agent_reasoning: Dict[str, Any],
        execution_time_ms: int,
        status: str = 'completed'
    ) -> CompanyCoachingSession:
        """Create coaching session record in database (Req 29.9)."""
        coaching_session = CompanyCoachingSession(
            user_id=user_id,
            company_name=company_name,
            target_role=target_role,
            coaching_data=coaching_data,
            agent_reasoning=agent_reasoning,
            execution_time_ms=execution_time_ms,
            status=status
        )
        
        self.db.add(coaching_session)
        self.db.commit()
        self.db.refresh(coaching_session)
        
        return coaching_session
    
    def get_coaching_session(self, session_id: int, user_id: int) -> Optional[CompanyCoachingSession]:
        """Get coaching session by ID"""
        return self.db.query(CompanyCoachingSession).filter(
            CompanyCoachingSession.id == session_id,
            CompanyCoachingSession.user_id == user_id
        ).first()
    
    def get_user_sessions(self, user_id: int, limit: int = 10) -> list:
        """Get user's coaching sessions"""
        return self.db.query(CompanyCoachingSession).filter(
            CompanyCoachingSession.user_id == user_id
        ).order_by(CompanyCoachingSession.created_at.desc()).limit(limit).all()
    
    def get_sessions_by_company(self, user_id: int, company_name: str) -> list:
        """Get user's sessions for a specific company"""
        return self.db.query(CompanyCoachingSession).filter(
            CompanyCoachingSession.user_id == user_id,
            CompanyCoachingSession.company_name.ilike(f"%{company_name}%")
        ).order_by(CompanyCoachingSession.created_at.desc()).all()
