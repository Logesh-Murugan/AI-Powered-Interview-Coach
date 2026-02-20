"""
Resume Analysis model for storing LangChain agent analysis results

Stores comprehensive resume analysis including:
- Skill inventory
- Experience timeline
- Skill gaps
- Improvement roadmap
- Agent reasoning steps

Requirements: 27.9
"""
from sqlalchemy import Column, String, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class ResumeAnalysis(BaseModel):
    """
    Resume Analysis model for storing agent-generated insights.
    
    Stores structured analysis data and agent reasoning for transparency.
    
    Requirements: 27.9
    """
    __tablename__ = "resume_analyses"
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Analysis data (structured JSON)
    analysis_data = Column(JSONB, nullable=False)
    # Structure: {
    #   "skill_inventory": {
    #     "technical_skills": [...],
    #     "soft_skills": [...],
    #     "tools": [...],
    #     "languages": [...]
    #   },
    #   "experience_timeline": {
    #     "total_years": 5.5,
    #     "seniority_level": "Mid",
    #     "companies": [...],
    #     "roles": [...]
    #   },
    #   "skill_gaps": {
    #     "target_role": "Software Engineer",
    #     "required_missing": [...],
    #     "preferred_missing": [...],
    #     "match_percentage": 75.0
    #   },
    #   "improvement_roadmap": {
    #     "timeline_weeks": 12,
    #     "milestones": [...]
    #   }
    # }
    
    # Agent reasoning steps (for transparency)
    agent_reasoning = Column(JSONB, nullable=True)
    # Structure: [
    #   {
    #     "step_number": 1,
    #     "tool": "resume_parser",
    #     "tool_input": {...},
    #     "thought": "I need to parse the resume first...",
    #     "observation": "Resume data retrieved successfully"
    #   }
    # ]
    
    # Execution metadata
    execution_time_ms = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False, index=True)  # success, failed, timeout, fallback
    
    # Relationships
    user = relationship("User", back_populates="resume_analyses")
    resume = relationship("Resume", back_populates="analyses")
    
    def __repr__(self):
        return f"<ResumeAnalysis(id={self.id}, resume_id={self.resume_id}, status={self.status})>"
    
    @property
    def is_successful(self) -> bool:
        """Check if analysis was successful"""
        return self.status in ['success', 'fallback']
    
    @property
    def used_agent(self) -> bool:
        """Check if agent was used (vs fallback)"""
        return self.status == 'success'
    
    @property
    def has_reasoning(self) -> bool:
        """Check if reasoning steps are available"""
        return self.agent_reasoning is not None and len(self.agent_reasoning) > 0
