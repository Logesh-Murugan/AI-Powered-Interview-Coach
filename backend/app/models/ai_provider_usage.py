"""
AI Provider Usage model for tracking API quota consumption
"""
from sqlalchemy import Column, String, Integer, Date, UniqueConstraint
from app.models.base import BaseModel


class AIProviderUsage(BaseModel):
    """
    Track API usage per provider per day for quota management.
    
    This model stores daily usage statistics for each AI provider
    to enable quota tracking, alerts, and provider disabling.
    
    Requirements: 26.1, 26.2, 26.3, 26.4, 26.5
    """
    __tablename__ = "ai_provider_usage"
    
    # Provider identification
    provider_name = Column(String(100), nullable=False, index=True)
    
    # Date tracking (one record per provider per day)
    date = Column(Date, nullable=False, index=True)
    
    # Usage metrics
    request_count = Column(Integer, default=0, nullable=False)
    character_count = Column(Integer, default=0, nullable=False)
    
    # Unique constraint: one record per provider per day
    __table_args__ = (
        UniqueConstraint('provider_name', 'date', name='uix_provider_date'),
    )
    
    def __repr__(self):
        return (
            f"<AIProviderUsage("
            f"provider={self.provider_name}, "
            f"date={self.date}, "
            f"requests={self.request_count}, "
            f"chars={self.character_count})>"
        )
    
    @property
    def is_over_quota(self) -> bool:
        """Check if usage has exceeded quota (placeholder for now)"""
        # This will be calculated by QuotaTracker based on provider limits
        return False
