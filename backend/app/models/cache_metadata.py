"""
Cache Metadata Model

This model stores cache statistics for monitoring and optimization.

Requirements: 25.6, 25.7, 25.8
"""
from sqlalchemy import Column, Integer, String, BigInteger, Float, DateTime
from datetime import datetime

from app.models.base import Base


class CacheMetadata(Base):
    """
    Cache metadata model for tracking cache performance.
    
    Requirements: 25.6, 25.7, 25.8
    """
    __tablename__ = "cache_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    cache_layer = Column(String(50), nullable=False, unique=True, index=True)
    cache_hits = Column(BigInteger, nullable=False, default=0)
    cache_misses = Column(BigInteger, nullable=False, default=0)
    hit_rate = Column(Float, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<CacheMetadata(layer={self.cache_layer}, hits={self.cache_hits}, misses={self.cache_misses}, hit_rate={self.hit_rate})>"
    
    def calculate_hit_rate(self):
        """
        Calculate cache hit rate.
        
        Requirement: 25.8
        Formula: cache_hits / (cache_hits + cache_misses) * 100
        """
        total = self.cache_hits + self.cache_misses
        if total == 0:
            return 0.0
        return (self.cache_hits / total) * 100
    
    def to_dict(self):
        """Convert cache metadata to dictionary"""
        return {
            'id': self.id,
            'cache_layer': self.cache_layer,
            'cache_hits': self.cache_hits,
            'cache_misses': self.cache_misses,
            'hit_rate': self.hit_rate,
            'total_requests': self.cache_hits + self.cache_misses,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
