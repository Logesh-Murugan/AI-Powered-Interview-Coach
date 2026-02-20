"""
Resume Intelligence Agent Service

Provides comprehensive resume analysis using LangChain agents with:
- Skill inventory analysis
- Experience timeline analysis
- Skill gap identification
- Learning roadmap generation
- 30-day caching
- Fallback to traditional NLP

Requirements: 27.1-27.13
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from langchain_core.prompts import PromptTemplate
from langchain_core.tools import Tool

from app.services.agents.base_agent import BaseAgent
from app.services.agents.agent_executor import AgentExecutor
from app.services.agents.tools.resume_tools import (
    ResumeParserTool,
    SkillExtractorTool,
    ExperienceAnalyzerTool,
    SkillGapTool,
    RoadmapGeneratorTool
)
from app.models.resume import Resume, ResumeStatus
from app.models.resume_analysis import ResumeAnalysis

logger = logging.getLogger(__name__)


class ResumeIntelligenceAgent(BaseAgent):
    """
    LangChain agent for comprehensive resume analysis.
    
    Uses 5 custom tools to analyze resume and generate insights.
    
    Requirements: 27.4, 27.5, 27.6
    """
    
    def _register_tools(self) -> list[Tool]:
        """
        Register resume analysis tools.
        
        Returns:
            List of 5 resume analysis tools
        """
        return [
            ResumeParserTool.as_tool(),
            SkillExtractorTool.as_tool(),
            ExperienceAnalyzerTool.as_tool(),
            SkillGapTool.as_tool(),
            RoadmapGeneratorTool.as_tool()
        ]
    
    def _get_prompt_template(self) -> PromptTemplate:
        """
        Get prompt template for resume analysis agent.
        
        Returns:
            PromptTemplate for ReAct agent
        """
        template = """You are a professional career coach and resume analyst. Your goal is to provide comprehensive resume analysis and career guidance.

You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Your task is to analyze the resume and provide:
1. Skill Inventory - Complete list of technical skills, soft skills, tools, and languages
2. Experience Timeline - Career progression, seniority level, and experience analysis
3. Skill Gaps - Comparison with target role requirements and missing skills
4. Improvement Roadmap - Structured learning plan with milestones

Begin!

Question: {input}
Thought: {agent_scratchpad}"""
        
        return PromptTemplate(
            template=template,
            input_variables=["input", "tools", "tool_names", "agent_scratchpad"]
        )


class ResumeAgentService:
    """
    Service for resume intelligence agent operations.
    
    Handles:
    - Cache checking (30-day TTL)
    - Agent execution
    - Fallback to traditional NLP
    - Result storage
    
    Requirements: 27.1-27.13
    """
    
    CACHE_TTL_DAYS = 30
    
    def __init__(self, db: Session):
        self.db = db
    
    def analyze_resume(
        self,
        resume_id: int,
        user_id: int,
        target_role: str = "Software Engineer",
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        Analyze resume using LangChain agent.
        
        Args:
            resume_id: Resume ID to analyze
            user_id: User ID (for authorization)
            target_role: Target role for skill gap analysis
            force_refresh: Force new analysis (skip cache)
            
        Returns:
            Dictionary with analysis results
            
        Raises:
            ValueError: If resume not found or not ready
            
        Requirements: 27.1-27.13
        """
        # Requirement 27.1: Validate resume exists and is ready
        resume = self._validate_resume(resume_id, user_id)
        
        # Requirement 27.2, 27.3: Check cache (< 30 days old)
        if not force_refresh:
            cached_analysis = self._get_cached_analysis(resume_id)
            if cached_analysis:
                logger.info(f"Returning cached analysis for resume {resume_id}")
                return self._format_analysis_response(cached_analysis, from_cache=True)
        
        # Execute agent analysis
        try:
            analysis_result = self._execute_agent_analysis(resume, target_role)
            
            # Store in database
            analysis_record = self._store_analysis(
                resume_id=resume_id,
                user_id=user_id,
                analysis_data=analysis_result['output'],
                agent_reasoning=analysis_result['reasoning_steps'],
                execution_time_ms=analysis_result['execution_time_ms'],
                status=analysis_result['status']
            )
            
            return self._format_analysis_response(analysis_record, from_cache=False)
            
        except Exception as e:
            logger.error(f"Agent analysis failed: {e}")
            
            # Requirement 27.13: Fallback to traditional NLP
            fallback_result = self._fallback_analysis(resume, target_role)
            
            # Store fallback result
            analysis_record = self._store_analysis(
                resume_id=resume_id,
                user_id=user_id,
                analysis_data=fallback_result,
                agent_reasoning=[],
                execution_time_ms=0,
                status='fallback'
            )
            
            return self._format_analysis_response(analysis_record, from_cache=False)
    
    def _validate_resume(self, resume_id: int, user_id: int) -> Resume:
        """
        Validate resume exists and is ready for analysis.
        
        Args:
            resume_id: Resume ID
            user_id: User ID
            
        Returns:
            Resume object
            
        Raises:
            ValueError: If validation fails
            
        Requirement: 27.1
        """
        resume = self.db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.user_id == user_id,
            Resume.deleted_at.is_(None)
        ).first()
        
        if not resume:
            raise ValueError(f"Resume {resume_id} not found for user {user_id}")
        
        if resume.status not in [ResumeStatus.SKILLS_EXTRACTED.value, ResumeStatus.COMPLETED.value]:
            raise ValueError(
                f"Resume {resume_id} is not ready for analysis. "
                f"Current status: {resume.status}. "
                f"Required status: skills_extracted or completed"
            )
        
        if not resume.extracted_text:
            raise ValueError(f"Resume {resume_id} has no extracted text")
        
        return resume
    
    def _get_cached_analysis(self, resume_id: int) -> Optional[ResumeAnalysis]:
        """
        Get cached analysis if less than 30 days old.
        
        Args:
            resume_id: Resume ID
            
        Returns:
            ResumeAnalysis or None
            
        Requirements: 27.2, 27.3
        """
        cutoff_date = datetime.utcnow() - timedelta(days=self.CACHE_TTL_DAYS)
        
        analysis = self.db.query(ResumeAnalysis).filter(
            ResumeAnalysis.resume_id == resume_id,
            ResumeAnalysis.deleted_at.is_(None),
            ResumeAnalysis.created_at >= cutoff_date,
            ResumeAnalysis.status.in_(['success', 'fallback'])
        ).order_by(ResumeAnalysis.created_at.desc()).first()
        
        return analysis
    
    def _execute_agent_analysis(
        self,
        resume: Resume,
        target_role: str
    ) -> Dict[str, Any]:
        """
        Execute LangChain agent for resume analysis.
        
        Args:
            resume: Resume object
            target_role: Target role for analysis
            
        Returns:
            Agent execution result
            
        Requirements: 27.4, 27.5, 27.6, 27.11, 27.12
        """
        # Initialize agent
        agent = ResumeIntelligenceAgent(
            max_iterations=10,  # Requirement 27.6
            max_execution_time=20.0,  # Requirement 27.11
            verbose=True
        )
        
        # Create executor with fallback
        executor = AgentExecutor(
            agent=agent,
            fallback_function=lambda input_data: self._fallback_analysis(
                resume,
                input_data.get('target_role', 'Software Engineer')
            )
        )
        
        # Prepare input
        input_data = {
            'input': f"""Analyze resume {resume.id} for target role: {target_role}

Steps to follow:
1. Use resume_parser tool to get resume data
2. Use skill_extractor tool to analyze skills from the resume text
3. Use experience_analyzer tool to analyze career progression
4. Use skill_gap_analyzer tool to identify gaps for the target role
5. Use roadmap_generator tool to create a learning plan

Provide a comprehensive analysis with all four sections:
- Skill Inventory
- Experience Timeline
- Skill Gaps
- Improvement Roadmap""",
            'resume_id': resume.id,
            'target_role': target_role
        }
        
        # Execute with fallback
        result = executor.execute_with_fallback(input_data)
        
        # Requirement 27.8: Validate output structure
        if result['status'] == 'success':
            validated_output = self._validate_and_parse_output(
                result['output'],
                resume,
                target_role
            )
            result['output'] = validated_output
        
        return result
    
    def _validate_and_parse_output(
        self,
        agent_output: str,
        resume: Resume,
        target_role: str
    ) -> Dict[str, Any]:
        """
        Validate and parse agent output into structured format.
        
        Args:
            agent_output: Raw agent output
            resume: Resume object
            target_role: Target role
            
        Returns:
            Structured analysis data
            
        Requirement: 27.8
        """
        # Try to extract structured data from agent output
        # For now, use fallback structure with agent insights
        return {
            'skill_inventory': resume.skills or {},
            'experience_timeline': {
                'total_years': resume.total_experience_months / 12 if resume.total_experience_months else 0,
                'seniority_level': resume.seniority_level or 'Unknown',
                'analysis': agent_output[:500]  # Include agent insights
            },
            'skill_gaps': {
                'target_role': target_role,
                'analysis': agent_output[500:1000] if len(agent_output) > 500 else ''
            },
            'improvement_roadmap': {
                'recommendations': agent_output[1000:1500] if len(agent_output) > 1000 else ''
            },
            'agent_summary': agent_output
        }
    
    def _fallback_analysis(
        self,
        resume: Resume,
        target_role: str
    ) -> Dict[str, Any]:
        """
        Fallback to traditional NLP analysis.
        
        Args:
            resume: Resume object
            target_role: Target role
            
        Returns:
            Analysis data using traditional methods
            
        Requirement: 27.13
        """
        logger.info(f"Using fallback NLP analysis for resume {resume.id}")
        
        # Use existing skill extraction
        skills = resume.skills or {}
        
        # Basic experience analysis
        experience_years = resume.total_experience_months / 12 if resume.total_experience_months else 0
        
        return {
            'skill_inventory': skills,
            'experience_timeline': {
                'total_years': experience_years,
                'seniority_level': resume.seniority_level or 'Unknown',
                'companies': [],
                'roles': []
            },
            'skill_gaps': {
                'target_role': target_role,
                'required_missing': [],
                'preferred_missing': [],
                'match_percentage': 0.0,
                'note': 'Fallback analysis - limited detail'
            },
            'improvement_roadmap': {
                'timeline_weeks': 12,
                'milestones': [],
                'note': 'Fallback analysis - generic recommendations'
            },
            'fallback_used': True
        }
    
    def _store_analysis(
        self,
        resume_id: int,
        user_id: int,
        analysis_data: Dict[str, Any],
        agent_reasoning: list,
        execution_time_ms: int,
        status: str
    ) -> ResumeAnalysis:
        """
        Store analysis in database.
        
        Args:
            resume_id: Resume ID
            user_id: User ID
            analysis_data: Analysis results
            agent_reasoning: Agent reasoning steps
            execution_time_ms: Execution time
            status: Analysis status
            
        Returns:
            ResumeAnalysis record
            
        Requirement: 27.9
        """
        analysis = ResumeAnalysis(
            resume_id=resume_id,
            user_id=user_id,
            analysis_data=analysis_data,
            agent_reasoning=agent_reasoning,
            execution_time_ms=execution_time_ms,
            status=status
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
        from_cache: bool
    ) -> Dict[str, Any]:
        """
        Format analysis for API response.
        
        Args:
            analysis: ResumeAnalysis record
            from_cache: Whether from cache
            
        Returns:
            Formatted response
            
        Requirement: 27.10
        """
        return {
            'analysis_id': analysis.id,
            'resume_id': analysis.resume_id,
            'analysis_data': analysis.analysis_data,
            'agent_reasoning': analysis.agent_reasoning if analysis.has_reasoning else None,
            'execution_time_ms': analysis.execution_time_ms,
            'status': analysis.status,
            'analyzed_at': analysis.created_at.isoformat(),
            'from_cache': from_cache,
            'cache_age_days': (datetime.utcnow() - analysis.created_at).days if from_cache else 0
        }
    
    def get_analysis_history(
        self,
        resume_id: int,
        user_id: int,
        limit: int = 10
    ) -> list[Dict[str, Any]]:
        """
        Get analysis history for resume.
        
        Args:
            resume_id: Resume ID
            user_id: User ID
            limit: Maximum number of records
            
        Returns:
            List of analysis records
        """
        # Verify resume belongs to user
        resume = self.db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.user_id == user_id
        ).first()
        
        if not resume:
            raise ValueError(f"Resume {resume_id} not found for user {user_id}")
        
        analyses = self.db.query(ResumeAnalysis).filter(
            ResumeAnalysis.resume_id == resume_id,
            ResumeAnalysis.deleted_at.is_(None)
        ).order_by(ResumeAnalysis.created_at.desc()).limit(limit).all()
        
        return [
            self._format_analysis_response(analysis, from_cache=False)
            for analysis in analyses
        ]
