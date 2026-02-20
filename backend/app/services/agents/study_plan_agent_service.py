"""
Study Plan Agent Service

Provides personalized study plan generation using LangChain agents.

Requirements: 28.1-28.11
"""
import time
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.study_plan import StudyPlan
from app.models.resume_analysis import ResumeAnalysis
from app.models.user import User
from app.services.agents.base_agent import BaseAgent
from app.services.agents.agent_executor import AgentExecutor
from app.services.agents.tools.study_plan_tools import (
    SkillAssessmentTool,
    JobMarketTool,
    LearningResourceTool,
    ProgressTrackerTool,
    SchedulerTool
)


class StudyPlanAgentService:
    """Service for generating personalized study plans using AI agents."""
    
    def __init__(self, db: Session):
        """Initialize study plan agent service"""
        self.db = db
        self.max_execution_time = 20.0
        
    def generate_study_plan(
        self,
        user_id: int,
        target_role: str,
        duration_days: int,
        available_hours_per_week: int
    ) -> StudyPlan:
        """Generate a personalized study plan for the user."""
        start_time = time.time()
        
        self._validate_user_prerequisites(user_id)
        skill_data = self._retrieve_skill_data(user_id)
        agent = self._initialize_agent()
        agent_input = self._prepare_agent_input(
            user_id, target_role, duration_days, available_hours_per_week, skill_data
        )
        
        executor = AgentExecutor(
            agent=agent,
            max_iterations=10,
            max_execution_time=self.max_execution_time
        )
        
        result = executor.run(agent_input)
        plan_data = self._parse_agent_output(result['output'])
        self._validate_plan_structure(plan_data)
        execution_time_ms = int((time.time() - start_time) * 1000)
        
        study_plan = self._create_study_plan_record(
            user_id, target_role, duration_days, available_hours_per_week,
            plan_data, result.get('reasoning_steps', []), execution_time_ms
        )
        
        return study_plan
    
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
                "User must have a completed resume analysis before generating study plan."
            )
    
    def _retrieve_skill_data(self, user_id: int) -> Dict[str, Any]:
        """Retrieve skill data from resume analysis."""
        resume_analysis = self.db.query(ResumeAnalysis).filter(
            ResumeAnalysis.user_id == user_id,
            ResumeAnalysis.status == 'completed'
        ).first()
        
        analysis_data = resume_analysis.analysis_data or {}
        
        return {
            'technical_skills': analysis_data.get('technical_skills', []),
            'soft_skills': analysis_data.get('soft_skills', []),
            'experience_years': analysis_data.get('experience_years', 0),
            'education_level': analysis_data.get('education_level', 'unknown'),
            'skill_gaps': analysis_data.get('skill_gaps', []),
            'strengths': analysis_data.get('strengths', []),
            'weaknesses': analysis_data.get('weaknesses', [])
        }
    
    def _initialize_agent(self):
        """Initialize agent with 5 custom tools."""
        tools = [
            SkillAssessmentTool(db=self.db),
            JobMarketTool(),
            LearningResourceTool(),
            ProgressTrackerTool(db=self.db),
            SchedulerTool()
        ]
        
        system_message = """You are a personalized study plan generator.
Create comprehensive, achievable study plans with daily tasks, weekly milestones,
resource links, and progress tracking."""
        
        # Create a simple agent object with tools
        class StudyPlanAgent:
            def __init__(self, tools, system_message):
                self.tools = tools
                self.system_message = system_message
        
        agent = StudyPlanAgent(tools=tools, system_message=system_message)
        
        return agent
    
    def _prepare_agent_input(
        self,
        user_id: int,
        target_role: str,
        duration_days: int,
        available_hours_per_week: int,
        skill_data: Dict[str, Any]
    ) -> str:
        """Prepare input prompt for the agent."""
        skills_str = ', '.join(skill_data.get('technical_skills', [])[:10])
        strengths_str = ', '.join(skill_data.get('strengths', [])[:5])
        gaps_str = ', '.join(skill_data.get('skill_gaps', [])[:5])
        
        prompt = f"""Create a {duration_days}-day study plan for {target_role}.

User Profile:
- Available Time: {available_hours_per_week} hours/week
- Technical Skills: {skills_str}
- Experience: {skill_data.get('experience_years', 0)} years
- Strengths: {strengths_str}
- Skill Gaps: {gaps_str}

Output JSON with: daily_tasks, weekly_milestones, resource_links, time_estimates

Use these tools:
1. SkillAssessmentTool - Assess current skills
2. JobMarketTool - Research job requirements
3. LearningResourceTool - Find learning resources
4. ProgressTrackerTool - Track progress
5. SchedulerTool - Create schedule"""
        return prompt
    
    def _parse_agent_output(self, output: str) -> Dict[str, Any]:
        """Parse agent output into structured plan data."""
        import json
        import re
        
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', output, re.DOTALL)
        if json_match:
            json_str = json_match.group(1).strip()
        else:
            json_match = re.search(r'\{[\s\S]*\}', output, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                raise ValueError("Could not extract JSON from agent output")
        
        try:
            plan_data = json.loads(json_str)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in agent output: {e}")
        
        return plan_data
    
    def _validate_plan_structure(self, plan_data: Dict[str, Any]) -> None:
        """Validate plan contains required fields."""
        required_fields = ['daily_tasks', 'weekly_milestones', 'resource_links', 'time_estimates']
        
        for field in required_fields:
            if field not in plan_data:
                raise ValueError(f"Plan missing required field: {field}")
        
        # Validate field types
        if not isinstance(plan_data['daily_tasks'], list):
            raise ValueError("daily_tasks must be a list")
        
        if not isinstance(plan_data['weekly_milestones'], list):
            raise ValueError("weekly_milestones must be a list")
        
        if not isinstance(plan_data['resource_links'], dict):
            raise ValueError("resource_links must be a dictionary")
        
        if not isinstance(plan_data['time_estimates'], dict):
            raise ValueError("time_estimates must be a dictionary")
        
        # Validate time_estimates structure
        time_estimates = plan_data['time_estimates']
        required_time_fields = ['total_hours', 'hours_per_week', 'completion_date']
        for field in required_time_fields:
            if field not in time_estimates:
                raise ValueError(f"time_estimates missing required field: {field}")
    
    def _create_study_plan_record(
        self,
        user_id: int,
        target_role: str,
        duration_days: int,
        available_hours_per_week: int,
        plan_data: Dict[str, Any],
        agent_reasoning: list,
        execution_time_ms: int
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
            status='active',
            progress_percentage=0.0
        )
        
        self.db.add(study_plan)
        self.db.commit()
        self.db.refresh(study_plan)
        
        return study_plan
    
    def get_study_plan(self, plan_id: int, user_id: int) -> Optional[StudyPlan]:
        """Get study plan by ID"""
        return self.db.query(StudyPlan).filter(
            StudyPlan.id == plan_id,
            StudyPlan.user_id == user_id
        ).first()
    
    def get_active_plan(self, user_id: int) -> Optional[StudyPlan]:
        """Get user's active study plan"""
        return self.db.query(StudyPlan).filter(
            StudyPlan.user_id == user_id,
            StudyPlan.status == 'active'
        ).first()
    
    def update_progress(
        self,
        plan_id: int,
        user_id: int,
        task_updates: Dict[str, Any]
    ) -> StudyPlan:
        """Update study plan progress."""
        study_plan = self.get_study_plan(plan_id, user_id)
        if not study_plan:
            raise ValueError(f"Study plan {plan_id} not found")
        
        plan_data = study_plan.plan_data
        
        for day_data in plan_data.get('daily_tasks', []):
            day_num = day_data.get('day')
            for task_idx, task in enumerate(day_data.get('tasks', [])):
                task_key = f"{day_num}_{task_idx}"
                if task_key in task_updates:
                    task['completed'] = task_updates[task_key]
        
        for milestone in plan_data.get('weekly_milestones', []):
            week_num = milestone.get('week')
            milestone_key = f"milestone_{week_num}"
            if milestone_key in task_updates:
                milestone['completed'] = task_updates[milestone_key]
        
        total_tasks = study_plan.total_tasks
        completed_tasks = study_plan.completed_tasks
        
        if total_tasks > 0:
            progress = (completed_tasks / total_tasks) * 100
            study_plan.progress_percentage = round(progress, 2)
        
        if study_plan.progress_percentage >= 100:
            study_plan.status = 'completed'
        
        study_plan.plan_data = plan_data
        self.db.commit()
        self.db.refresh(study_plan)
        
        return study_plan
    
    def abandon_plan(self, plan_id: int, user_id: int) -> StudyPlan:
        """Mark study plan as abandoned"""
        study_plan = self.get_study_plan(plan_id, user_id)
        if not study_plan:
            raise ValueError(f"Study plan {plan_id} not found")
        
        study_plan.status = 'abandoned'
        self.db.commit()
        self.db.refresh(study_plan)
        
        return study_plan
