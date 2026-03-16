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
import re
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from pydantic import ValidationError

from app.models.company_coaching_session import CompanyCoachingSession
from app.models.resume_analysis import ResumeAnalysis
from app.models.user import User
from app.services.agents.schemas.agent_schemas import CoachingResponse
from app.services.agents.utils.json_extraction import (
    extract_json_safe,
    ensure_minimum_arrays,
    create_fallback_response
)

# Initialize logger
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
            execution_time_ms=execution_time_ms
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
        Generate structured coaching data using robust LLM pipeline.
        
        Pipeline: LLM → JSON Extraction → Validation → Auto-fill → Return
        """
        # Build the structured prompt
        prompt = self._build_coaching_prompt(
            company_name=company_name,
            target_role=target_role,
            user_context=user_context
        )
        
        logger.info(f"=== GENERATING COACHING FOR {company_name} ===")
        
        # Retry logic with robust error handling
        max_retries = 3
        last_error = None
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Attempt {attempt + 1}/{max_retries}")
                
                # Call LLM - disable cache for retries to get fresh responses
                use_cache = (attempt == 0)  # Only use cache on first attempt
                llm_response = await self._call_llm(prompt, use_cache=use_cache)
                logger.info(f"LLM response received (length: {len(llm_response)}, cached: {use_cache})")
                
                # Extract JSON using robust extraction with improved regex
                try:
                    parsed_data = self._extract_json_robust(llm_response)
                    logger.info(f"✅ JSON extracted successfully: {list(parsed_data.keys())}")
                except ValueError as e:
                    logger.warning(f"JSON extraction failed: {e}")
                    last_error = str(e)
                    continue
                
                # Ensure minimum array lengths
                parsed_data = ensure_minimum_arrays(parsed_data)
                logger.info("✅ Minimum array lengths ensured")
                
                # Validate with Pydantic
                try:
                    validated = CoachingResponse(**parsed_data)
                    logger.info(f"✅ Pydantic validation successful on attempt {attempt + 1}")
                    return validated.dict()
                    
                except ValidationError as ve:
                    logger.warning(f"⚠️ Pydantic validation failed: {ve}")
                    last_error = str(ve)
                    
                    # Try to fix validation errors automatically
                    try:
                        fixed_data = self._fix_validation_errors(parsed_data, ve)
                        validated = CoachingResponse(**fixed_data)
                        logger.info(f"✅ Validation successful after auto-fix on attempt {attempt + 1}")
                        return validated.dict()
                    except ValidationError as ve2:
                        logger.error(f"❌ Auto-fix failed: {ve2}")
                        last_error = str(ve2)
                        continue
                        
            except Exception as e:
                logger.error(f"❌ Unexpected error on attempt {attempt + 1}: {e}")
                last_error = str(e)
                continue
        
        # All retries failed - use fallback
        logger.error(f"❌ All {max_retries} attempts failed. Using fallback response.")
        logger.error(f"Last error: {last_error}")
        
        fallback_data = create_fallback_response(company_name, target_role)
        
        # Validate fallback data
        try:
            validated_fallback = CoachingResponse(**fallback_data)
            logger.info("✅ Fallback response validated successfully")
            return validated_fallback.dict()
        except ValidationError as e:
            logger.error(f"❌ Even fallback validation failed: {e}")
            raise ValueError(f"Complete system failure: {e}")
    
    def _extract_json_robust(self, text: str) -> Dict[str, Any]:
        """
        Robust JSON extraction that can handle extra text around JSON.
        
        Args:
            text: Raw AI response text
            
        Returns:
            Parsed JSON dictionary
            
        Raises:
            ValueError: If no valid JSON can be extracted
        """
        import re
        import json
        
        if not text or not text.strip():
            raise ValueError("Empty response from AI")
        
        text = text.strip()
        
        # Try 1: Direct JSON parsing (clean response)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # Try 2: Extract JSON object using regex (handles extra text)
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if not match:
            raise ValueError("No JSON found in response")
        
        try:
            return json.loads(match.group())
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to extract valid JSON from AI response: {e}")
    
    def _fix_validation_errors(self, data: Dict[str, Any], error: ValidationError) -> Dict[str, Any]:
        """Automatically fix common validation errors."""
        fixed = data.copy()
        
        # Ensure required fields exist
        if "company_overview" not in fixed or not fixed["company_overview"]:
            fixed["company_overview"] = "Research this company's culture, values, and recent developments."
        
        if "interview_process" not in fixed or not isinstance(fixed["interview_process"], list):
            fixed["interview_process"] = [
                "Initial screening call",
                "Technical interview",
                "Final interview with manager"
            ]
        
        if "predicted_questions" not in fixed or not isinstance(fixed["predicted_questions"], list):
            fixed["predicted_questions"] = [
                "Tell me about yourself.",
                "Why do you want this role?",
                "Describe a challenging project.",
                "How do you handle pressure?",
                "What are your career goals?"
            ]
        
        if "pre_interview_checklist" not in fixed or not isinstance(fixed["pre_interview_checklist"], list):
            fixed["pre_interview_checklist"] = [
                "Research company background",
                "Review job requirements",
                "Prepare STAR examples",
                "Practice technical concepts",
                "Prepare questions to ask"
            ]
        
        return fixed
    
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
        
        prompt = f"""You are an expert interview coach. Generate interview coaching for {company_name}{role_context}.

CANDIDATE PROFILE:
- Experience: {experience} years
- Key Skills: {skills}

CRITICAL INSTRUCTIONS:
- Return ONLY valid JSON - absolutely no other text
- Do NOT include explanations
- Do NOT include markdown
- Do NOT include text before or after JSON
- The response MUST start with {{ and end with }}
- No trailing commas in JSON
- Use realistic, specific content for {company_name}

REQUIRED JSON SCHEMA (follow exactly):
{{
  "company_overview": "string",
  "interview_process": ["string", "string", "string"],
  "predicted_questions": ["string", "string", "string", "string", "string"],
  "pre_interview_checklist": ["string", "string", "string", "string", "string"]
}}

Generate the JSON response now (no other text):"""
        
        return prompt

    async def _call_llm(self, prompt: str, use_cache: bool = True) -> str:
        """
        Call the LLM with optimized parameters for JSON generation.
        Uses singleton AI orchestrator to prevent reinitialization.
        
        Args:
            prompt: The prompt to send to the LLM
            use_cache: Whether to use Redis cache (False for retries)
        """
        from app.services.ai.singleton import get_ai_orchestrator
        from app.services.ai.types import AIRequest
        
        # Get singleton orchestrator (no reinitialization)
        orchestrator = get_ai_orchestrator()
        
        # Optimized parameters for stable JSON output
        request = AIRequest(
            prompt=prompt,
            max_tokens=800,  # Reduced for focused output
            temperature=0.2,  # Lower temperature for more consistent JSON
            task_type="company_coaching"
        )
        
        # Call LLM with or without cache
        if use_cache:
            response = orchestrator.generate(request)
        else:
            response = orchestrator.generate_without_cache(request)
        
        return response.content
    
    
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
        from datetime import datetime, timedelta
        from sqlalchemy import func
        
        # Get user to check tier (assuming free tier for now)
        user = self.db.query(User).filter(User.id == user_id).first()
        
        # For free tier users, limit to 3 sessions per month
        # In production, check user.subscription_tier
        is_free_tier = True  # TODO: Check actual subscription tier
        
        if is_free_tier:
            # Count sessions in current month
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
        execution_time_ms: int
    ) -> CompanyCoachingSession:
        """Create coaching session record in database (Req 29.9)."""
        try:
            coaching_session = CompanyCoachingSession(
                user_id=user_id,
                company_name=company_name,
                target_role=target_role,
                coaching_data=coaching_data,
                agent_reasoning=agent_reasoning,
                execution_time_ms=execution_time_ms
            )
            
            self.db.add(coaching_session)
            self.db.commit()
            self.db.refresh(coaching_session)
            
            return coaching_session
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Database error while saving coaching session: {e}")
            raise ValueError(f"Failed to save coaching session: {e}")
    
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
