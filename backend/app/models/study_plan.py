"""
Study Plan model for storing personalized learning plans

Stores comprehensive study plans including:
- Daily tasks and schedules
- Weekly milestones
- Learning resources
- Progress tracking
- Agent reasoning steps

Requirements: 28.8
"""
from sqlalchemy import Column, String, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class StudyPlan(BaseModel):
    """
    Study Plan model for storing agent-generated learning plans.
    
    Stores structured plan data with daily tasks, milestones, and resources.
    
    Requirements: 28.8
    """
    __tablename__ = "study_plans"
    
    # Foreign key
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Plan configuration
    target_role = Column(String(100), nullable=False)
    duration_days = Column(Integer, nullable=False)  # 30, 60, or 90
    available_hours_per_week = Column(Integer, nullable=False)
    
    # Plan data (structured JSON)
    plan_data = Column(JSONB, nullable=False)
    # Structure: {
    #   "daily_tasks": [
    #     {
    #       "day": 1,
    #       "date": "2026-02-16",
    #       "tasks": [
    #         {
    #           "skill": "Python",
    #           "activity": "Complete Python basics course",
    #           "duration_minutes": 60,
    #           "resources": ["https://..."],
    #           "completed": false
    #         }
    #       ]
    #     }
    #   ],
    #   "weekly_milestones": [
    #     {
    #       "week": 1,
    #       "milestone": "Complete Python fundamentals",
    #       "skills_covered": ["Python basics", "Data structures"],
    #       "assessment": "Build a simple CLI app",
    #       "completed": false
    #     }
    #   ],
    #   "resource_links": {
    #     "Python": ["https://...", "https://..."],
    #     "JavaScript": ["https://..."]
    #   },
    #   "time_estimates": {
    #     "total_hours": 180,
    #     "hours_per_week": 15,
    #     "completion_date": "2026-05-15"
    #   }
    # }
    
    # Agent reasoning steps (for transparency)
    agent_reasoning = Column(JSONB, nullable=True)
    # Structure: [
    #   {
    #     "step_number": 1,
    #     "tool": "skill_assessment",
    #     "tool_input": {...},
    #     "thought": "I need to assess current skills...",
    #     "observation": "User has Python and JavaScript skills"
    #   }
    # ]
    
    # Execution metadata
    execution_time_ms = Column(Integer, nullable=False)
    
    # Plan status and progress
    status = Column(String(50), nullable=False, index=True)  # active, completed, abandoned, paused
    progress_percentage = Column(Float, default=0.0)  # 0-100
    
    # Relationships
    user = relationship("User", back_populates="study_plans")
    
    def __repr__(self):
        return f"<StudyPlan(id={self.id}, user_id={self.user_id}, target_role={self.target_role}, status={self.status})>"
    
    @property
    def is_active(self) -> bool:
        """Check if plan is currently active"""
        return self.status == 'active'
    
    @property
    def is_completed(self) -> bool:
        """Check if plan is completed"""
        return self.status == 'completed'
    
    @property
    def total_tasks(self) -> int:
        """Get total number of tasks in plan"""
        daily_tasks = self.plan_data.get('daily_tasks', [])
        return sum(len(day.get('tasks', [])) for day in daily_tasks)
    
    @property
    def completed_tasks(self) -> int:
        """Get number of completed tasks"""
        daily_tasks = self.plan_data.get('daily_tasks', [])
        completed = 0
        for day in daily_tasks:
            for task in day.get('tasks', []):
                if task.get('completed', False):
                    completed += 1
        return completed
    
    @property
    def total_milestones(self) -> int:
        """Get total number of milestones"""
        return len(self.plan_data.get('weekly_milestones', []))
    
    @property
    def completed_milestones(self) -> int:
        """Get number of completed milestones"""
        milestones = self.plan_data.get('weekly_milestones', [])
        return sum(1 for m in milestones if m.get('completed', False))
