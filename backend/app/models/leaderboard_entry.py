"""
Leaderboard entry model for gamification.
Requirements: 24.1-24.10
"""
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.models.base import Base
from datetime import datetime


class LeaderboardEntry(Base):
    """Model for leaderboard entries."""
    
    __tablename__ = 'leaderboard_entries'
    
    id = Column(Integer, primary_key=True, index=True)
    period = Column(String(20), nullable=False)  # 'weekly' or 'all_time'
    rank = Column(Integer, nullable=False)
    anonymous_username = Column(String(50), nullable=False)
    average_score = Column(Float, nullable=False)
    total_interviews = Column(Integer, nullable=False)
    calculated_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<LeaderboardEntry(rank={self.rank}, period={self.period}, score={self.average_score})>"
