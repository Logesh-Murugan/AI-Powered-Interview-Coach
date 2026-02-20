"""
Cache Statistics API Routes

Endpoints for monitoring cache performance and statistics.

Requirements: 25.9, 25.10
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services.cache_monitoring_service import CacheMonitoringService
from app.schemas.cache_stats import (
    CacheStatsResponse,
    CacheLayerStats,
    CacheAlertResponse,
    CacheResetRequest,
    CacheResetResponse
)

router = APIRouter()


@router.get("/stats", response_model=CacheStatsResponse)
def get_cache_statistics(db: Session = Depends(get_db)):
    """
    Get cache statistics for all layers.
    
    Requirement: 25.9 - Monitor cache hit rate in real-time dashboard
    
    Returns:
        Cache statistics for all layers including overall stats
    """
    service = CacheMonitoringService(db)
    
    # Get all layer stats
    all_stats = service.get_all_stats()
    
    # Separate overall from layer stats
    overall_stats = None
    layer_stats = []
    
    for stats in all_stats:
        if stats['cache_layer'] == CacheMonitoringService.LAYER_OVERALL:
            overall_stats = CacheLayerStats(**stats)
        else:
            layer_stats.append(CacheLayerStats(**stats))
    
    # If no overall stats exist yet, create default
    if not overall_stats:
        overall_stats = CacheLayerStats(
            cache_layer=CacheMonitoringService.LAYER_OVERALL,
            cache_hits=0,
            cache_misses=0,
            hit_rate=0.0,
            total_requests=0,
            last_updated=None
        )
    
    return CacheStatsResponse(
        layers=layer_stats,
        overall=overall_stats
    )


@router.get("/stats/{cache_layer}", response_model=CacheLayerStats)
def get_layer_statistics(
    cache_layer: str,
    db: Session = Depends(get_db)
):
    """
    Get cache statistics for a specific layer.
    
    Requirement: 25.9
    
    Args:
        cache_layer: Name of cache layer (L1_Questions, L2_Evaluations, etc.)
        
    Returns:
        Cache statistics for the specified layer
    """
    service = CacheMonitoringService(db)
    stats = service.get_layer_stats(cache_layer)
    
    return CacheLayerStats(**stats)


@router.get("/alert", response_model=CacheAlertResponse)
def check_cache_alert(db: Session = Depends(get_db)):
    """
    Check if cache hit rate is below threshold and needs alerting.
    
    Requirement: 25.10 - Send alert when cache hit rate drops below 85%
    
    Returns:
        Alert status and details
    """
    service = CacheMonitoringService(db)
    alert_info = service.check_hit_rate_alert()
    
    return CacheAlertResponse(**alert_info)


@router.post("/reset", response_model=CacheResetResponse)
def reset_cache_statistics(
    request: CacheResetRequest,
    db: Session = Depends(get_db)
):
    """
    Reset cache statistics for a layer or all layers.
    
    Note: This is primarily for testing and development.
    
    Args:
        request: Reset request with optional cache_layer
        
    Returns:
        Reset confirmation
    """
    service = CacheMonitoringService(db)
    
    try:
        service.reset_stats(request.cache_layer)
        
        if request.cache_layer:
            layers_reset = [request.cache_layer]
            message = f"Cache statistics reset for layer: {request.cache_layer}"
        else:
            layers_reset = [
                CacheMonitoringService.LAYER_L1_QUESTIONS,
                CacheMonitoringService.LAYER_L2_EVALUATIONS,
                CacheMonitoringService.LAYER_L3_SESSIONS,
                CacheMonitoringService.LAYER_L4_USER_PREFS,
                CacheMonitoringService.LAYER_OVERALL
            ]
            message = "Cache statistics reset for all layers"
        
        return CacheResetResponse(
            success=True,
            message=message,
            layers_reset=layers_reset
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reset cache statistics: {str(e)}"
        )
