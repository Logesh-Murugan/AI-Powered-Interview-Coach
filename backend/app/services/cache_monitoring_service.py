"""
Cache Monitoring Service

Tracks cache performance metrics in database for analysis and alerting.

Requirements: 25.6, 25.7, 25.8, 25.9, 25.10
"""
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, List
import logging

from app.models.cache_metadata import CacheMetadata

logger = logging.getLogger(__name__)


class CacheMonitoringService:
    """
    Service for monitoring cache performance and storing metrics in database.
    
    Requirements: 25.6-25.10
    """
    
    # Cache layer names (Req 25.1)
    LAYER_L1_QUESTIONS = "L1_Questions"
    LAYER_L2_EVALUATIONS = "L2_Evaluations"
    LAYER_L3_SESSIONS = "L3_Sessions"
    LAYER_L4_USER_PREFS = "L4_User_Preferences"
    LAYER_OVERALL = "Overall"
    
    # Alert threshold (Req 25.10)
    HIT_RATE_THRESHOLD = 85.0
    
    def __init__(self, db: Session):
        self.db = db
    
    def record_hit(self, cache_layer: str):
        """
        Record a cache hit for the specified layer.
        
        Requirement: 25.6
        
        Args:
            cache_layer: Name of cache layer (L1_Questions, L2_Evaluations, etc.)
        """
        try:
            # Get or create cache metadata record
            metadata = self.db.query(CacheMetadata).filter(
                CacheMetadata.cache_layer == cache_layer
            ).first()
            
            if not metadata:
                metadata = CacheMetadata(
                    cache_layer=cache_layer,
                    cache_hits=0,
                    cache_misses=0,
                    hit_rate=0.0
                )
                self.db.add(metadata)
            
            # Increment hits
            metadata.cache_hits += 1
            metadata.hit_rate = metadata.calculate_hit_rate()
            metadata.last_updated = datetime.utcnow()
            
            # Also update overall stats
            self._update_overall_stats(is_hit=True)
            
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Error recording cache hit for {cache_layer}: {e}")
            self.db.rollback()
    
    def record_miss(self, cache_layer: str):
        """
        Record a cache miss for the specified layer.
        
        Requirement: 25.7
        
        Args:
            cache_layer: Name of cache layer
        """
        try:
            # Get or create cache metadata record
            metadata = self.db.query(CacheMetadata).filter(
                CacheMetadata.cache_layer == cache_layer
            ).first()
            
            if not metadata:
                metadata = CacheMetadata(
                    cache_layer=cache_layer,
                    cache_hits=0,
                    cache_misses=0,
                    hit_rate=0.0
                )
                self.db.add(metadata)
            
            # Increment misses
            metadata.cache_misses += 1
            metadata.hit_rate = metadata.calculate_hit_rate()
            metadata.last_updated = datetime.utcnow()
            
            # Also update overall stats
            self._update_overall_stats(is_hit=False)
            
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Error recording cache miss for {cache_layer}: {e}")
            self.db.rollback()
    
    def _update_overall_stats(self, is_hit: bool):
        """Update overall cache statistics."""
        overall = self.db.query(CacheMetadata).filter(
            CacheMetadata.cache_layer == self.LAYER_OVERALL
        ).first()
        
        if not overall:
            overall = CacheMetadata(
                cache_layer=self.LAYER_OVERALL,
                cache_hits=0,
                cache_misses=0,
                hit_rate=0.0
            )
            self.db.add(overall)
            self.db.flush()  # Flush to get the ID and avoid unique constraint violations
        
        if is_hit:
            overall.cache_hits += 1
        else:
            overall.cache_misses += 1
        
        overall.hit_rate = overall.calculate_hit_rate()
        overall.last_updated = datetime.utcnow()
    
    def get_layer_stats(self, cache_layer: str) -> Dict:
        """
        Get statistics for a specific cache layer.
        
        Requirement: 25.8, 25.9
        
        Args:
            cache_layer: Name of cache layer
            
        Returns:
            Dictionary with cache statistics
        """
        metadata = self.db.query(CacheMetadata).filter(
            CacheMetadata.cache_layer == cache_layer
        ).first()
        
        if not metadata:
            return {
                'cache_layer': cache_layer,
                'cache_hits': 0,
                'cache_misses': 0,
                'hit_rate': 0.0,
                'total_requests': 0,
                'last_updated': None
            }
        
        return metadata.to_dict()
    
    def get_all_stats(self) -> List[Dict]:
        """
        Get statistics for all cache layers.
        
        Requirement: 25.9
        
        Returns:
            List of cache statistics for all layers
        """
        all_metadata = self.db.query(CacheMetadata).all()
        return [metadata.to_dict() for metadata in all_metadata]
    
    def check_hit_rate_alert(self) -> Dict:
        """
        Check if cache hit rate is below threshold and needs alerting.
        
        Requirement: 25.10
        
        Returns:
            Dictionary with alert status and details
        """
        overall = self.db.query(CacheMetadata).filter(
            CacheMetadata.cache_layer == self.LAYER_OVERALL
        ).first()
        
        if not overall:
            return {
                'alert': False,
                'message': 'No cache data available yet'
            }
        
        # Only check if we have enough data (at least 100 requests per Req 25.12)
        total_requests = overall.cache_hits + overall.cache_misses
        if total_requests < 100:
            return {
                'alert': False,
                'message': f'Insufficient data: {total_requests}/100 requests',
                'hit_rate': overall.hit_rate
            }
        
        # Check if hit rate is below threshold (Req 25.10)
        if overall.hit_rate < self.HIT_RATE_THRESHOLD:
            logger.warning(
                f"Cache hit rate alert: {overall.hit_rate:.2f}% "
                f"(threshold: {self.HIT_RATE_THRESHOLD}%)"
            )
            return {
                'alert': True,
                'message': f'Cache hit rate below threshold: {overall.hit_rate:.2f}%',
                'hit_rate': overall.hit_rate,
                'threshold': self.HIT_RATE_THRESHOLD,
                'total_requests': total_requests
            }
        
        return {
            'alert': False,
            'message': 'Cache performance is healthy',
            'hit_rate': overall.hit_rate,
            'threshold': self.HIT_RATE_THRESHOLD,
            'total_requests': total_requests
        }
    
    def reset_stats(self, cache_layer: str = None):
        """
        Reset cache statistics for a layer or all layers.
        
        Args:
            cache_layer: Specific layer to reset, or None for all layers
        """
        try:
            if cache_layer:
                metadata = self.db.query(CacheMetadata).filter(
                    CacheMetadata.cache_layer == cache_layer
                ).first()
                if metadata:
                    metadata.cache_hits = 0
                    metadata.cache_misses = 0
                    metadata.hit_rate = 0.0
                    metadata.last_updated = datetime.utcnow()
            else:
                # Reset all layers
                all_metadata = self.db.query(CacheMetadata).all()
                for metadata in all_metadata:
                    metadata.cache_hits = 0
                    metadata.cache_misses = 0
                    metadata.hit_rate = 0.0
                    metadata.last_updated = datetime.utcnow()
            
            self.db.commit()
            logger.info(f"Cache stats reset for: {cache_layer or 'all layers'}")
            
        except Exception as e:
            logger.error(f"Error resetting cache stats: {e}")
            self.db.rollback()
