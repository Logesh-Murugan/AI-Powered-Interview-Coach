"""
Tests for cache optimization and 4-layer caching strategy.

Requirements: 25.1-25.12
"""
import pytest
from datetime import timedelta
from app.utils.cache_keys import CacheKeys, CacheTTL
from app.services.cache_monitoring_service import CacheMonitoringService
from app.models.cache_metadata import CacheMetadata


class TestCacheKeys:
    """Test cache key generation patterns."""
    
    def test_questions_cache_key_pattern(self):
        """
        Test questions cache key pattern.
        
        Requirement: 25.2
        Pattern: questions:{role}:{difficulty}:{count}:{hash}
        """
        role = "Software Engineer"
        difficulty = "medium"
        count = 5
        categories = ["algorithms", "data-structures", "system-design"]
        
        key = CacheKeys.questions(role, difficulty, count, categories)
        
        # Verify pattern
        assert key.startswith("questions:")
        assert role in key
        assert difficulty in key
        assert str(count) in key
        
        # Verify hash is consistent for same categories
        key2 = CacheKeys.questions(role, difficulty, count, categories)
        assert key == key2
        
        # Verify hash changes with different categories
        key3 = CacheKeys.questions(role, difficulty, count, ["algorithms"])
        assert key != key3
    
    def test_questions_cache_key_sorted_categories(self):
        """
        Test that categories are sorted for consistent hashing.
        
        Requirement: 25.2
        """
        role = "Software Engineer"
        difficulty = "medium"
        count = 5
        
        # Different order, same categories
        categories1 = ["algorithms", "data-structures", "system-design"]
        categories2 = ["system-design", "algorithms", "data-structures"]
        
        key1 = CacheKeys.questions(role, difficulty, count, categories1)
        key2 = CacheKeys.questions(role, difficulty, count, categories2)
        
        # Should generate same key
        assert key1 == key2
    
    def test_evaluation_cache_key_pattern(self):
        """
        Test evaluation cache key pattern.
        
        Requirement: 25.3
        Pattern: eval:{answer_hash}
        """
        answer_text = "This is my answer to the question"
        
        key = CacheKeys.evaluation(answer_text)
        
        # Verify pattern
        assert key.startswith("eval:")
        
        # Verify consistent hashing
        key2 = CacheKeys.evaluation(answer_text)
        assert key == key2
    
    def test_evaluation_cache_key_normalization(self):
        """
        Test that answer text is normalized for consistent hashing.
        
        Requirement: 25.3
        - Lowercase
        - Trim whitespace
        - Remove extra spaces
        """
        answer1 = "This is my answer"
        answer2 = "  THIS IS MY ANSWER  "
        answer3 = "this   is   my   answer"
        
        key1 = CacheKeys.evaluation(answer1)
        key2 = CacheKeys.evaluation(answer2)
        key3 = CacheKeys.evaluation(answer3)
        
        # All should generate same key after normalization
        assert key1 == key2 == key3
    
    def test_session_cache_key_pattern(self):
        """
        Test session cache key pattern.
        
        Requirement: 25.4
        Pattern: session:{session_id}
        """
        session_id = 123
        
        key = CacheKeys.session(session_id)
        
        # Verify pattern
        assert key == "session:123"
    
    def test_user_preferences_cache_key_pattern(self):
        """
        Test user preferences cache key pattern.
        
        Requirement: 25.5
        Pattern: user:{user_id}:prefs
        """
        user_id = 456
        
        key = CacheKeys.user_preferences(user_id)
        
        # Verify pattern
        assert key == "user:456:prefs"


class TestCacheTTL:
    """Test cache TTL values."""
    
    def test_l1_questions_ttl(self):
        """
        Test L1 Questions cache TTL.
        
        Requirement: 25.1 - TTL 30 days
        """
        assert CacheTTL.L1_QUESTIONS == timedelta(days=30)
    
    def test_l2_evaluations_ttl(self):
        """
        Test L2 Evaluations cache TTL.
        
        Requirement: 25.1 - TTL 7 days
        """
        assert CacheTTL.L2_EVALUATIONS == timedelta(days=7)
    
    def test_l3_sessions_ttl(self):
        """
        Test L3 Sessions cache TTL.
        
        Requirement: 25.1 - TTL 2 hours
        """
        assert CacheTTL.L3_SESSIONS == timedelta(hours=2)
    
    def test_l4_user_preferences_ttl(self):
        """
        Test L4 User Preferences cache TTL.
        
        Requirement: 25.1 - TTL 24 hours
        """
        assert CacheTTL.L4_USER_PREFERENCES == timedelta(hours=24)


class TestCacheMetadata:
    """Test CacheMetadata model."""
    
    def test_calculate_hit_rate_with_data(self):
        """
        Test hit rate calculation.
        
        Requirement: 25.8
        Formula: cache_hits / (cache_hits + cache_misses) * 100
        """
        metadata = CacheMetadata(
            cache_layer="L1_Questions",
            cache_hits=90,
            cache_misses=10
        )
        
        hit_rate = metadata.calculate_hit_rate()
        
        # 90 / (90 + 10) * 100 = 90.0
        assert hit_rate == 90.0
    
    def test_calculate_hit_rate_zero_requests(self):
        """Test hit rate calculation with zero requests."""
        metadata = CacheMetadata(
            cache_layer="L1_Questions",
            cache_hits=0,
            cache_misses=0
        )
        
        hit_rate = metadata.calculate_hit_rate()
        
        # Should return 0.0 when no requests
        assert hit_rate == 0.0
    
    def test_calculate_hit_rate_all_hits(self):
        """Test hit rate calculation with 100% hits."""
        metadata = CacheMetadata(
            cache_layer="L1_Questions",
            cache_hits=100,
            cache_misses=0
        )
        
        hit_rate = metadata.calculate_hit_rate()
        
        assert hit_rate == 100.0
    
    def test_calculate_hit_rate_all_misses(self):
        """Test hit rate calculation with 0% hits."""
        metadata = CacheMetadata(
            cache_layer="L1_Questions",
            cache_hits=0,
            cache_misses=100
        )
        
        hit_rate = metadata.calculate_hit_rate()
        
        assert hit_rate == 0.0


class TestCacheMonitoringService:
    """Test cache monitoring service."""
    
    def test_record_hit(self, db):
        """
        Test recording cache hit.
        
        Requirement: 25.6
        """
        service = CacheMonitoringService(db)
        
        # Record hit
        service.record_hit(CacheMonitoringService.LAYER_L1_QUESTIONS)
        
        # Verify in database
        metadata = db.query(CacheMetadata).filter(
            CacheMetadata.cache_layer == CacheMonitoringService.LAYER_L1_QUESTIONS
        ).first()
        
        assert metadata is not None
        assert metadata.cache_hits == 1
        assert metadata.cache_misses == 0
    
    def test_record_miss(self, db):
        """
        Test recording cache miss.
        
        Requirement: 25.7
        """
        service = CacheMonitoringService(db)
        
        # Record miss
        service.record_miss(CacheMonitoringService.LAYER_L2_EVALUATIONS)
        
        # Verify in database
        metadata = db.query(CacheMetadata).filter(
            CacheMetadata.cache_layer == CacheMonitoringService.LAYER_L2_EVALUATIONS
        ).first()
        
        assert metadata is not None
        assert metadata.cache_hits == 0
        assert metadata.cache_misses == 1
    
    def test_hit_rate_calculation(self, db):
        """
        Test automatic hit rate calculation.
        
        Requirement: 25.8
        """
        service = CacheMonitoringService(db)
        
        # Record 90 hits and 10 misses
        for _ in range(90):
            service.record_hit(CacheMonitoringService.LAYER_L1_QUESTIONS)
        for _ in range(10):
            service.record_miss(CacheMonitoringService.LAYER_L1_QUESTIONS)
        
        # Get stats
        stats = service.get_layer_stats(CacheMonitoringService.LAYER_L1_QUESTIONS)
        
        assert stats['cache_hits'] == 90
        assert stats['cache_misses'] == 10
        assert stats['hit_rate'] == 90.0
    
    def test_overall_stats_tracking(self, db):
        """Test that overall stats are tracked across all layers."""
        service = CacheMonitoringService(db)
        
        # Record hits/misses across different layers
        service.record_hit(CacheMonitoringService.LAYER_L1_QUESTIONS)
        service.record_hit(CacheMonitoringService.LAYER_L2_EVALUATIONS)
        service.record_miss(CacheMonitoringService.LAYER_L3_SESSIONS)
        
        # Check overall stats
        overall = service.get_layer_stats(CacheMonitoringService.LAYER_OVERALL)
        
        assert overall['cache_hits'] == 2
        assert overall['cache_misses'] == 1
        assert overall['total_requests'] == 3
    
    def test_check_hit_rate_alert_below_threshold(self, db):
        """
        Test alert when hit rate drops below 85%.
        
        Requirement: 25.10
        """
        service = CacheMonitoringService(db)
        
        # Record 80 hits and 20 misses (80% hit rate) using L1 layer
        # This will automatically update overall stats
        for _ in range(80):
            service.record_hit(CacheMonitoringService.LAYER_L1_QUESTIONS)
        for _ in range(20):
            service.record_miss(CacheMonitoringService.LAYER_L1_QUESTIONS)
        
        # Check alert
        alert = service.check_hit_rate_alert()
        
        assert alert['alert'] is True
        assert alert['hit_rate'] == 80.0
        assert alert['threshold'] == 85.0
    
    def test_check_hit_rate_alert_above_threshold(self, db):
        """Test no alert when hit rate is above 85%."""
        service = CacheMonitoringService(db)
        
        # Record 90 hits and 10 misses (90% hit rate) using L2 layer
        # This will automatically update overall stats
        for _ in range(90):
            service.record_hit(CacheMonitoringService.LAYER_L2_EVALUATIONS)
        for _ in range(10):
            service.record_miss(CacheMonitoringService.LAYER_L2_EVALUATIONS)
        
        # Check alert
        alert = service.check_hit_rate_alert()
        
        assert alert['alert'] is False
        assert alert['hit_rate'] == 90.0
    
    def test_check_hit_rate_alert_insufficient_data(self, db):
        """
        Test no alert with insufficient data.
        
        Requirement: 25.12 - Need 100 requests before checking
        """
        service = CacheMonitoringService(db)
        
        # Record only 50 requests using L3 layer
        # This will automatically update overall stats
        for _ in range(30):
            service.record_hit(CacheMonitoringService.LAYER_L3_SESSIONS)
        for _ in range(20):
            service.record_miss(CacheMonitoringService.LAYER_L3_SESSIONS)
        
        # Check alert
        alert = service.check_hit_rate_alert()
        
        assert alert['alert'] is False
        assert 'Insufficient data' in alert['message']
    
    def test_reset_stats(self, db):
        """Test resetting cache statistics."""
        service = CacheMonitoringService(db)
        
        # Record some data
        service.record_hit(CacheMonitoringService.LAYER_L1_QUESTIONS)
        service.record_miss(CacheMonitoringService.LAYER_L1_QUESTIONS)
        
        # Reset
        service.reset_stats(CacheMonitoringService.LAYER_L1_QUESTIONS)
        
        # Verify reset
        stats = service.get_layer_stats(CacheMonitoringService.LAYER_L1_QUESTIONS)
        assert stats['cache_hits'] == 0
        assert stats['cache_misses'] == 0
        assert stats['hit_rate'] == 0.0


@pytest.fixture
def db():
    """Database session fixture with cleanup."""
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        # Clean up cache_metadata table before each test
        db.query(CacheMetadata).delete()
        db.commit()
        yield db
    finally:
        # Clean up after test
        db.query(CacheMetadata).delete()
        db.commit()
        db.close()
