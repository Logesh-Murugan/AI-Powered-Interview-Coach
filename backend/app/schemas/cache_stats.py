"""
Cache Statistics Schemas

Pydantic schemas for cache monitoring and statistics API.

Requirements: 25.8, 25.9
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CacheLayerStats(BaseModel):
    """
    Statistics for a single cache layer.
    
    Requirement: 25.8, 25.9
    """
    cache_layer: str = Field(..., description="Name of cache layer")
    cache_hits: int = Field(..., description="Number of cache hits")
    cache_misses: int = Field(..., description="Number of cache misses")
    hit_rate: float = Field(..., description="Cache hit rate percentage")
    total_requests: int = Field(..., description="Total cache requests")
    last_updated: Optional[datetime] = Field(None, description="Last update timestamp")
    
    class Config:
        from_attributes = True


class CacheStatsResponse(BaseModel):
    """
    Response containing cache statistics for all layers.
    
    Requirement: 25.9
    """
    layers: list[CacheLayerStats] = Field(..., description="Statistics for each cache layer")
    overall: CacheLayerStats = Field(..., description="Overall cache statistics")
    
    class Config:
        from_attributes = True


class CacheAlertResponse(BaseModel):
    """
    Response for cache hit rate alert check.
    
    Requirement: 25.10
    """
    alert: bool = Field(..., description="Whether alert should be triggered")
    message: str = Field(..., description="Alert message")
    hit_rate: Optional[float] = Field(None, description="Current hit rate")
    threshold: Optional[float] = Field(None, description="Alert threshold")
    total_requests: Optional[int] = Field(None, description="Total requests processed")
    
    class Config:
        from_attributes = True


class CacheResetRequest(BaseModel):
    """Request to reset cache statistics."""
    cache_layer: Optional[str] = Field(None, description="Specific layer to reset, or None for all")


class CacheResetResponse(BaseModel):
    """Response after resetting cache statistics."""
    success: bool = Field(..., description="Whether reset was successful")
    message: str = Field(..., description="Result message")
    layers_reset: list[str] = Field(..., description="List of layers that were reset")
