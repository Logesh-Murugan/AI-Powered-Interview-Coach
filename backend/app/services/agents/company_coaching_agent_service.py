"""
Company Coaching Agent Service

Provides company-specific interview coaching using LangChain agents.

Requirements: 29.1-29.11
"""
import time
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.company_coaching_session import CompanyCoachingSession
from app.models.resume_analysis import ResumeAnalysis
from app.models.user import User
from app.services.agents.base_agent import BaseAgent
from app.services.agents.agent_executor import AgentExecutor
from app.services.agents.tools.company_coaching_tools import (
    CompanyResearchTool,
    InterviewPatternTool,
    STARMethodTool,
    ConfidenceTool
)


class CompanyCoachingAgentService:
    """Service for generating company-specific interview coaching using AI agents."""
    
    def __init__(self, db: Session):
        """Initialize company coaching agent service"""
        self.db = db
        self.max_execution_time = 20.0  # 20 seconds (Req 29.10)
        self.free_tier_monthly_limit = 3  # 3 sessions per month (Req 29.11)
        
    def generate_coaching_session(
        self,
        user_id: int,
        company_name: str,
        target_role: Optional[str] = None
    ) -> CompanyCoachingSession:
        """Generate company-specific interview coaching session."""
        start_time = time.time()
        
        self._validate_user_prerequisites(user_id)
        self._check_rate_limit(user_id)
        agent = self._initialize_agent()
        agent_input = self._prepare_agent_input(user_id, company_name, target_role)
        
        executor = AgentExecutor(
            agent=agent,
            max_iterations=10,
            max_execution_time=self.max_execution_time
        )
        
        result = executor.run(agent_input)
        coaching_data = self._parse_agent_output(result['output'])
        self._validate_coaching_structure(coaching_data)
        execution_time_ms = int((time.time() - start_time) * 1000)
        
        coaching_session = self._create_coaching_session_record(
            user_id, company_name, target_role,
            coaching_data, result.get('reasoning_steps', []), execution_time_ms
        )
        
        return coaching_session

    def _validate_user_prerequisites(self, user_id: int) -> None:
        """Validate user has resume analysis."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        resume_analysis = self.db.query(ResumeAnalysis).filter(
            ResumeAnalysis.user_id == user_id,
            ResumeAnalysis.status == 'completed'
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

    def _initialize_agent(self) -> BaseAgent:
        """Initialize agent with 4 custom tools (Req 29.1)."""
        tools = [
            CompanyResearchTool(),
            InterviewPatternTool(db=self.db),
            STARMethodTool(db=self.db),
            ConfidenceTool()
        ]
        
        system_message = """You are an expert interview coach specializing in company-specific preparation.
Your goal is to help candidates prepare for interviews at specific companies by:
1. Researching the company's culture, values, and interview style
2. Analyzing historical interview patterns
3. Extracting relevant STAR method examples from the candidate's experience
4. Providing confidence-building tips and a pre-interview checklist

Generate comprehensive, actionable coaching that helps candidates feel prepared and confident."""
        
        agent = BaseAgent(
            tools=tools,
            system_message=system_message,
            agent_type="company_coaching"
        )
        
        return agent

    def _prepare_agent_input(
        self,
        user_id: int,
        company_name: str,
        target_role: Optional[str]
    ) -> str:
        """Prepare input prompt for the agent (Req 29.2)."""
        # Get user's resume analysis for context
        resume_analysis = self.db.query(ResumeAnalysis).filter(
            ResumeAnalysis.user_id == user_id,
            ResumeAnalysis.status == 'completed'
        ).first()
        
        analysis_data = resume_analysis.analysis_data or {}
        skills = ', '.join(analysis_data.get('technical_skills', [])[:10])
        experience_years = analysis_data.get('experience_years', 0)
        
        role_context = f" for the {target_role} role" if target_role else ""
        
        prompt = f"""Generate comprehensive interview coaching for {company_name}{role_context}.

Candidate Profile:
- Experience: {experience_years} years
- Key Skills: {skills}
- User ID: {user_id}

Use your tools to:
1. Research {company_name}'s culture, values, and interview style
2. Analyze typical interview patterns for {company_name}
3. Extract 3-5 STAR method examples from the candidate's resume
4. Generate confidence-building tips and pre-interview checklist

Output JSON with: company_overview, predicted_questions (top 10), star_examples, confidence_tips, pre_interview_checklist"""
        
        return prompt

    def _parse_agent_output(self, output: str) -> Dict[str, Any]:
        """Parse agent output into structured coaching data."""
        import json
        import re
        
        # Try to extract JSON from markdown code fence
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', output, re.DOTALL)
        if json_match:
            json_str = json_match.group(1).strip()
        else:
            # Try to find raw JSON
            json_match = re.search(r'\{[\s\S]*\}', output, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                raise ValueError("Could not extract JSON from agent output")
        
        try:
            coaching_data = json.loads(json_str)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in agent output: {e}")
        
        return coaching_data
    
    def _validate_coaching_structure(self, coaching_data: Dict[str, Any]) -> None:
        """Validate coaching contains required fields (Req 29.8)."""
        required_fields = [
            'company_overview',
            'predicted_questions',
            'star_examples',
            'confidence_tips',
            'pre_interview_checklist'
        ]
        
        for field in required_fields:
            if field not in coaching_data:
                raise ValueError(f"Coaching missing required field: {field}")
        
        # Validate field types
        if not isinstance(coaching_data['company_overview'], dict):
            raise ValueError("company_overview must be a dictionary")
        
        if not isinstance(coaching_data['predicted_questions'], list):
            raise ValueError("predicted_questions must be a list")
        
        if not isinstance(coaching_data['star_examples'], list):
            raise ValueError("star_examples must be a list")
        
        if not isinstance(coaching_data['confidence_tips'], list):
            raise ValueError("confidence_tips must be a list")
        
        if not isinstance(coaching_data['pre_interview_checklist'], list):
            raise ValueError("pre_interview_checklist must be a list")
        
        # Validate we have at least some content
        if len(coaching_data['predicted_questions']) < 5:
            raise ValueError("Must have at least 5 predicted questions")
        
        if len(coaching_data['star_examples']) < 3:
            raise ValueError("Must have at least 3 STAR examples")

    def _create_coaching_session_record(
        self,
        user_id: int,
        company_name: str,
        target_role: Optional[str],
        coaching_data: Dict[str, Any],
        agent_reasoning: list,
        execution_time_ms: int
    ) -> CompanyCoachingSession:
        """Create coaching session record in database (Req 29.9)."""
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
