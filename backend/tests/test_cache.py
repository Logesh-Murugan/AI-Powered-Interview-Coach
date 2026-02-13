"""
Tests for Redis cache service
"""
import pytest
from datetime import timedelta
from app.services.cache_service import CacheService
from app.utils.cache_keys import CacheKeyBuilder, CacheTTL


@pytest.fixture
def cache():
    """Create a cache service instance for testing"""
    cache = CacheService()
    # Clear any existing test data
    if cache.is_available():
        cache.flush_all()
        cache.clear_metrics()
    yield cache
    # Cleanup after tests
    if cache.is_available():
        cache.flush_all()
        cache.clear_metrics()


def test_cache_availability(cache):
    """Test cache availability check"""
    # This test will pass even if Redis is not running
    # It just checks that the method works
    result = cache.is_available()
    assert isinstance(result, bool)


def test_cache_set_and_get(cache):
    """Test setting and getting values from cache"""
    if not cache.is_available():
        pytest.skip("Redis not available")
    
    key = "test:key"
    value = {"data": "test_value", "number": 42}
    ttl = timedelta(seconds=60)
    
    # Set value
    result = cache.set(key, value, ttl)
    assert result is True
    
    # Get value
    cached_value = cache.get(key)
    assert cached_value == value


def test_cache_get_nonexistent(cache):
    """Test getting a non-existent key"""
    if not cache.is_available():
        pytest.skip("Redis not available")
    
    value = cache.get("nonexistent:key")
    assert value is None


def test_cache_delete(cache):
    """Test deleting a key from cache"""
    if not cache.is_available():
        pytest.skip("Redis not available")
    
    key = "test:delete"
    value = {"data": "to_delete"}
    
    # Set and verify
    cache.set(key, value, timedelta(seconds=60))
    assert cache.get(key) == value
    
    # Delete and verify
    result = cache.delete(key)
    assert result is True
    assert cache.get(key) is None


def test_cache_exists(cache):
    """Test checking if key exists"""
    if not cache.is_available():
        pytest.skip("Redis not available")
    
    key = "test:exists"
    value = {"data": "exists"}
    
    # Key should not exist initially
    assert cache.exists(key) is False
    
    # Set value
    cache.set(key, value, timedelta(seconds=60))
    
    # Key should exist now
    assert cache.exists(key) is True


def test_cache_ttl(cache):
    """Test TTL functionality"""
    if not cache.is_available():
        pytest.skip("Redis not available")
    
    key = "test:ttl"
    value = {"data": "ttl_test"}
    ttl = timedelta(seconds=30)
    
    # Set with TTL
    cache.set(key, value, ttl)
    
    # Check TTL
    remaining_ttl = cache.get_ttl(key)
    assert remaining_ttl is not None
    assert remaining_ttl <= 30
    assert remaining_ttl > 0


def test_cache_delete_pattern(cache):
    """Test deleting keys by pattern"""
    if not cache.is_available():
        pytest.skip("Redis not available")
    
    # Set multiple keys with same prefix
    cache.set("user:1", {"id": 1}, timedelta(seconds=60))
    cache.set("user:2", {"id": 2}, timedelta(seconds=60))
    cache.set("user:3", {"id": 3}, timedelta(seconds=60))
    cache.set("other:1", {"id": 1}, timedelta(seconds=60))
    
    # Delete all user keys
    deleted = cache.delete_pattern("user:*")
    assert deleted == 3
    
    # Verify user keys are gone
    assert cache.get("user:1") is None
    assert cache.get("user:2") is None
    assert cache.get("user:3") is None
    
    # Verify other key still exists
    assert cache.get("other:1") is not None


def test_cache_metrics(cache):
    """Test cache metrics tracking"""
    if not cache.is_available():
        pytest.skip("Redis not available")
    
    # Clear metrics
    cache.clear_metrics()
    
    # Perform some cache operations
    cache.set("test:1", {"data": 1}, timedelta(seconds=60))
    cache.get("test:1")  # Hit
    cache.get("test:2")  # Miss
    cache.get("test:1")  # Hit
    
    # Get metrics
    metrics = cache.get_metrics()
    assert metrics["available"] is True
    assert metrics["hits"] == 2
    assert metrics["misses"] == 1
    assert metrics["total_requests"] == 3
    assert metrics["hit_rate"] == pytest.approx(66.67, rel=0.1)


def test_cache_key_builder():
    """Test cache key builder"""
    # User keys
    assert CacheKeyBuilder.user_profile(123) == "user:profile:123"
    assert CacheKeyBuilder.user_preferences(456) == "user:preferences:456"
    
    # Question keys
    assert CacheKeyBuilder.question_set("engineer", "medium", "algorithms") == \
           "question:set:engineer:medium:algorithms"
    
    # Interview keys
    assert CacheKeyBuilder.interview_session(789) == "interview:session:789"
    
    # Resume keys
    assert CacheKeyBuilder.resume_analysis(101) == "resume:analysis:101"
    
    # Analytics keys
    assert CacheKeyBuilder.analytics_summary(202, "weekly") == \
           "analytics:summary:202:weekly"
    
    # AI response keys
    assert CacheKeyBuilder.ai_response("abc123") == "ai_response:abc123"


def test_cache_ttl_values():
    """Test that TTL values are properly defined"""
    # L1 Cache
    assert CacheTTL.L1_USER_SESSION == timedelta(minutes=5)
    assert CacheTTL.L1_INTERVIEW_STATE == timedelta(minutes=3)
    
    # L2 Cache
    assert CacheTTL.L2_USER_PROFILE == timedelta(minutes=30)
    assert CacheTTL.L2_USER_PREFERENCES == timedelta(minutes=60)
    assert CacheTTL.L2_QUESTION_SET == timedelta(minutes=15)
    
    # L3 Cache
    assert CacheTTL.L3_RESUME_ANALYSIS == timedelta(hours=24)
    assert CacheTTL.L3_ANALYTICS_SUMMARY == timedelta(hours=6)
    assert CacheTTL.L3_INTERVIEW_HISTORY == timedelta(hours=12)
    
    # L4 Cache
    assert CacheTTL.L4_AI_RESPONSE == timedelta(days=30)
    assert CacheTTL.L4_QUESTION_BANK == timedelta(days=7)
    assert CacheTTL.L4_SKILL_TAXONOMY == timedelta(days=30)


def test_cache_graceful_degradation(cache):
    """Test that cache operations fail gracefully when Redis is unavailable"""
    # This test simulates Redis being unavailable
    original_client = cache.redis_client
    cache.redis_client = None
    
    # All operations should return safe defaults
    assert cache.is_available() is False
    assert cache.get("any:key") is None
    assert cache.set("any:key", {"data": "value"}, timedelta(seconds=60)) is False
    assert cache.delete("any:key") is False
    assert cache.exists("any:key") is False
    assert cache.get_ttl("any:key") is None
    assert cache.delete_pattern("any:*") == 0
    
    metrics = cache.get_metrics()
    assert metrics["available"] is False
    
    # Restore original client
    cache.redis_client = original_client


def test_cache_json_serialization(cache):
    """Test that complex objects are properly serialized"""
    if not cache.is_available():
        pytest.skip("Redis not available")
    
    key = "test:complex"
    value = {
        "string": "test",
        "number": 42,
        "float": 3.14,
        "boolean": True,
        "null": None,
        "list": [1, 2, 3],
        "nested": {
            "key": "value"
        }
    }
    
    cache.set(key, value, timedelta(seconds=60))
    cached_value = cache.get(key)
    
    assert cached_value == value
    assert isinstance(cached_value["nested"], dict)
    assert isinstance(cached_value["list"], list)
