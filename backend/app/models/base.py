"""
Base model with common fields for all database models
"""
from datetime import datetime
from sqlalchemy import Column, Integer, DateTime
from app.database import Base


class BaseModel(Base):
    """
    Abstract base model with common fields.
    All models should inherit from this.
    """
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete support
    
    def soft_delete(self):
        """Mark record as deleted without removing from database"""
        self.deleted_at = datetime.utcnow()
    
    @property
    def is_deleted(self) -> bool:
        """Check if record is soft deleted"""
        return self.deleted_at is not None
