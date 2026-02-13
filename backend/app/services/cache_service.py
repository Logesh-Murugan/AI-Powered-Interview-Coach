"""
Redis cache service with multi-layer caching strategy.
Provides get/set/delete operations with TTL support and cache metrics.
"""
import json
import redis
from typing import Any, Optional
from datetime import timedelta
from loguru import logger

from app.config import settings


class CacheService:
    """
    Redis-based cache service with connection pooling and metrics tracking.
    """
    
    def __init__(self):
        """Initialize Redis client with connection pooling"""
        try:
            # Create Redis connection pool
            pool = redis.ConnectionPool(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
                decode_responses=True,
                max_connections=20,
                socket_connect_timeout=5,
                socket_timeout=5,
            )
            
            self.redis_client = redis.Redis(connection_pool=pool)
            
            # Test connection
            self.redis_client.ping()
            logger.info("Redis connection established successfully")
            
        except redis.ConnectionError as e:
            logger.error(f"Failed to connect to Redis: {e}")
            # Set to None to allow graceful degradation
            self.redis_client = None
    
    def is_available(self) -> bool:
        """Check if Redis is available"""
        if self.redis_client is None:
            return False
        try:
            self.redis_client.ping()
            return True
        except:
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found
        """
        if not self.is_available():
            logger.warning("Redis not available, cache miss")
            return None
        
        try:
            value = self.redis_client.get(key)
            if value:
                self._track_hit(key)
                return json.loads(value)
            else:
                self._track_miss(key)
                return None
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            self._track_miss(key)
            return None
    
    def set(self, key: str, value: Any, ttl: timedelta) -> bool:
        """
        Set value in cache with TTL.
        
        Args:
            key: Cache key
            value: Value to cache (must be JSON serializable)
            ttl: Time to live
            
        Returns:
            True if successful, False otherwise
        """
        if not self.is_available():
            logger.warning("Redis not available, skipping cache set")
            return False
        
        try:
            serialized = json.dumps(value)
            self.redis_client.setex(
                key,
                int(ttl.total_seconds()),
                serialized
            )
            logger.debug(f"Cache set: {key} (TTL: {ttl.total_seconds()}s)")
            return True
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """
        Delete key from cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if key was deleted, False otherwise
        """
        if not self.is_available():
            return False
        
        try:
            result = self.redis_client.delete(key)
            logger.debug(f"Cache delete: {key}")
            return result > 0
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """
        Check if key exists in cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if key exists, False otherwise
        """
        if not self.is_available():
            return False
        
        try:
            return self.redis_client.exists(key) > 0
        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching a pattern.
        
        Args:
            pattern: Key pattern (e.g., "user:*")
            
        Returns:
            Number of keys deleted
        """
        if not self.is_available():
            return 0
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                deleted = self.redis_client.delete(*keys)
                logger.debug(f"Cache delete pattern: {pattern} ({deleted} keys)")
                return deleted
            return 0
        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {e}")
            return 0
    
    def get_ttl(self, key: str) -> Optional[int]:
        """
        Get remaining TTL for a key.
        
        Args:
            key: Cache key
            
        Returns:
            TTL in seconds, or None if key doesn't exist
        """
        if not self.is_available():
            return None
        
        try:
            ttl = self.redis_client.ttl(key)
            return ttl if ttl > 0 else None
        except Exception as e:
            logger.error(f"Cache TTL error for key {key}: {e}")
            return None
    
    def _track_hit(self, key: str):
        """Track cache hit for metrics"""
        try:
            metric_key = "cache:metrics:hits"
            self.redis_client.incr(metric_key)
            # Also track per-prefix hits
            prefix = key.split(":")[0] if ":" in key else "unknown"
            self.redis_client.incr(f"cache:metrics:hits:{prefix}")
        except Exception as e:
            logger.debug(f"Failed to track cache hit: {e}")
    
    def _track_miss(self, key: str):
        """Track cache miss for metrics"""
        try:
            metric_key = "cache:metrics:misses"
            self.redis_client.incr(metric_key)
            # Also track per-prefix misses
            prefix = key.split(":")[0] if ":" in key else "unknown"
            self.redis_client.incr(f"cache:metrics:misses:{prefix}")
        except Exception as e:
            logger.debug(f"Failed to track cache miss: {e}")
    
    def get_metrics(self) -> dict:
        """
        Get cache metrics.
        
        Returns:
            Dictionary with hit/miss counts and hit rate
        """
        if not self.is_available():
            return {
                "available": False,
                "hits": 0,
                "misses": 0,
                "hit_rate": 0.0
            }
        
        try:
            hits = int(self.redis_client.get("cache:metrics:hits") or 0)
            misses = int(self.redis_client.get("cache:metrics:misses") or 0)
            total = hits + misses
            hit_rate = (hits / total * 100) if total > 0 else 0.0
            
            return {
                "available": True,
                "hits": hits,
                "misses": misses,
                "total_requests": total,
                "hit_rate": round(hit_rate, 2)
            }
        except Exception as e:
            logger.error(f"Failed to get cache metrics: {e}")
            return {
                "available": False,
                "error": str(e)
            }
    
    def clear_metrics(self):
        """Clear cache metrics"""
        if not self.is_available():
            return
        
        try:
            self.redis_client.delete("cache:metrics:hits")
            self.redis_client.delete("cache:metrics:misses")
            # Clear per-prefix metrics
            pattern_keys = self.redis_client.keys("cache:metrics:*")
            if pattern_keys:
                self.redis_client.delete(*pattern_keys)
            logger.info("Cache metrics cleared")
        except Exception as e:
            logger.error(f"Failed to clear cache metrics: {e}")
    
    def flush_all(self):
        """
        Flush all cache data (use with caution!).
        Only available in development mode.
        """
        if not self.is_available():
            return
        
        if settings.ENVIRONMENT != "development":
            logger.warning("flush_all() only available in development mode")
            return
        
        try:
            self.redis_client.flushdb()
            logger.warning("All cache data flushed")
        except Exception as e:
            logger.error(f"Failed to flush cache: {e}")


# Global cache service instance
cache_service = CacheService()
