"""
Tests for QuotaTracker

Requirements: 26.1-26.11
"""
import pytest
from datetime import date, datetime
from sqlalchemy.orm import Session

from app.services.ai.quota_tracker import QuotaTracker, PROVIDER_QUOTAS
from app.models.ai_provider_usage import AIProviderUsage


class TestQuotaTracker:
    """Test suite for QuotaTracker functionality"""
    
    def test_record_usage_creates_new_record(self, db: Session):
        """
        Test that record_usage creates a new usage record.
        
        Requirements: 26.1, 26.2, 26.3
        """
        tracker = QuotaTracker(db)
        
        # Record usage
        tracker.record_usage('groq_1', character_count=1000, request_count=1)
        
        # Verify record created
        usage = db.query(AIProviderUsage).filter(
            AIProviderUsage.provider_name == 'groq_1',
            AIProviderUsage.date == date.today()
        ).first()
        
        assert usage is not None
        assert usage.provider_name == 'groq_1'
        assert usage.character_count == 1000
        assert usage.request_count == 1
    
    def test_record_usage_updates_existing_record(self, db: Session):
        """
        Test that record_usage updates existing record for same day.
        
        Requirements: 26.1, 26.2, 26.3
        """
        tracker = QuotaTracker(db)
        
        # Record first usage
        tracker.record_usage('groq_1', character_count=1000, request_count=1)
        
        # Record second usage
        tracker.record_usage('groq_1', character_count=500, request_count=1)
        
        # Verify record updated (not duplicated)
        usage = db.query(AIProviderUsage).filter(
            AIProviderUsage.provider_name == 'groq_1',
            AIProviderUsage.date == date.today()
        ).first()
        
        assert usage.character_count == 1500  # 1000 + 500
        assert usage.request_count == 2       # 1 + 1
        
        # Verify only one record exists
        count = db.query(AIProviderUsage).filter(
            AIProviderUsage.provider_name == 'groq_1',
            AIProviderUsage.date == date.today()
        ).count()
        assert count == 1
    
    def test_get_remaining_percentage_no_usage(self, db: Session):
        """
        Test remaining percentage with no usage recorded.
        
        Requirements: 26.4, 26.5
        """
        tracker = QuotaTracker(db)
        
        # No usage recorded
        remaining = tracker.get_remaining_percentage('groq_1')
        
        assert remaining == 1.0  # 100% remaining
    
    def test_get_remaining_percentage_partial_usage(self, db: Session):
        """
        Test remaining percentage with partial usage.
        
        Requirements: 26.4, 26.5
        """
        tracker = QuotaTracker(db)
        
        # Use 50% of quota (14400 / 2 = 7200)
        tracker.record_usage('groq_1', character_count=7200)
        
        remaining = tracker.get_remaining_percentage('groq_1')
        
        assert remaining == pytest.approx(0.5, rel=0.01)  # 50% remaining
    
    def test_get_remaining_percentage_full_usage(self, db: Session):
        """
        Test remaining percentage when quota is exhausted.
        
        Requirements: 26.4, 26.5, 26.11
        """
        tracker = QuotaTracker(db)
        
        # Use 100% of quota
        quota_limit = PROVIDER_QUOTAS['groq_1']
        tracker.record_usage('groq_1', character_count=quota_limit)
        
        remaining = tracker.get_remaining_percentage('groq_1')
        
        assert remaining == 0.0  # 0% remaining
    
    def test_get_remaining_percentage_over_quota(self, db: Session):
        """
        Test remaining percentage when usage exceeds quota.
        
        Requirements: 26.4, 26.5, 26.11
        """
        tracker = QuotaTracker(db)
        
        # Use 120% of quota
        quota_limit = PROVIDER_QUOTAS['groq_1']
        tracker.record_usage('groq_1', character_count=int(quota_limit * 1.2))
        
        remaining = tracker.get_remaining_percentage('groq_1')
        
        assert remaining == 0.0  # Capped at 0%
    
    def test_is_provider_available_with_quota(self, db: Session):
        """
        Test provider availability when quota remains.
        
        Requirements: 26.7, 26.11
        """
        tracker = QuotaTracker(db)
        
        # Use 50% of quota
        tracker.record_usage('groq_1', character_count=7200)
        
        assert tracker.is_provider_available('groq_1') is True
    
    def test_is_provider_available_no_quota(self, db: Session):
        """
        Test provider availability when quota exhausted.
        
        Requirements: 26.7, 26.11
        """
        tracker = QuotaTracker(db)
        
        # Use 100% of quota
        quota_limit = PROVIDER_QUOTAS['groq_1']
        tracker.record_usage('groq_1', character_count=quota_limit)
        
        assert tracker.is_provider_available('groq_1') is False
    
    def test_get_usage_stats_no_usage(self, db: Session):
        """
        Test usage stats with no usage recorded.
        
        Requirements: 26.4, 26.5
        """
        tracker = QuotaTracker(db)
        
        stats = tracker.get_usage_stats('groq_1')
        
        assert stats['provider_name'] == 'groq_1'
        assert stats['request_count'] == 0
        assert stats['character_count'] == 0
        assert stats['remaining_percentage'] == 1.0
        assert stats['status'] == 'available'
    
    def test_get_usage_stats_with_usage(self, db: Session):
        """
        Test usage stats with recorded usage.
        
        Requirements: 26.4, 26.5
        """
        tracker = QuotaTracker(db)
        
        # Use 50% of quota
        tracker.record_usage('groq_1', character_count=7200, request_count=10)
        
        stats = tracker.get_usage_stats('groq_1')
        
        assert stats['provider_name'] == 'groq_1'
        assert stats['request_count'] == 10
        assert stats['character_count'] == 7200
        assert stats['remaining_percentage'] == pytest.approx(0.5, rel=0.01)
        assert stats['status'] == 'available'
    
    def test_get_usage_stats_warning_threshold(self, db: Session):
        """
        Test usage stats at warning threshold (80%).
        
        Requirements: 26.8, 26.9
        """
        tracker = QuotaTracker(db)
        
        # Use 85% of quota
        quota_limit = PROVIDER_QUOTAS['groq_1']
        tracker.record_usage('groq_1', character_count=int(quota_limit * 0.85))
        
        stats = tracker.get_usage_stats('groq_1')
        
        assert stats['status'] == 'warning'
        assert stats['remaining_percentage'] < 0.20
    
    def test_get_usage_stats_critical_threshold(self, db: Session):
        """
        Test usage stats at critical threshold (90%).
        
        Requirements: 26.9, 26.10
        """
        tracker = QuotaTracker(db)
        
        # Use 95% of quota
        quota_limit = PROVIDER_QUOTAS['groq_1']
        tracker.record_usage('groq_1', character_count=int(quota_limit * 0.95))
        
        stats = tracker.get_usage_stats('groq_1')
        
        assert stats['status'] == 'critical'
        assert stats['remaining_percentage'] < 0.10
    
    def test_get_usage_stats_disabled_threshold(self, db: Session):
        """
        Test usage stats when quota exhausted (100%).
        
        Requirements: 26.10, 26.11
        """
        tracker = QuotaTracker(db)
        
        # Use 100% of quota
        quota_limit = PROVIDER_QUOTAS['groq_1']
        tracker.record_usage('groq_1', character_count=quota_limit)
        
        stats = tracker.get_usage_stats('groq_1')
        
        assert stats['status'] == 'disabled'
        assert stats['remaining_percentage'] == 0.0
    
    def test_get_all_provider_stats(self, db: Session):
        """
        Test getting stats for all providers.
        
        Requirements: 26.4, 26.5
        """
        tracker = QuotaTracker(db)
        
        # Record usage for multiple providers
        tracker.record_usage('groq_1', character_count=1000)
        tracker.record_usage('groq_2', character_count=2000)
        tracker.record_usage('huggingface_1', character_count=5000)
        
        all_stats = tracker.get_all_provider_stats()
        
        # Verify all providers included
        assert 'groq_1' in all_stats
        assert 'groq_2' in all_stats
        assert 'groq_3' in all_stats
        assert 'huggingface_1' in all_stats
        assert 'huggingface_2' in all_stats
        
        # Verify stats are correct
        assert all_stats['groq_1']['character_count'] == 1000
        assert all_stats['groq_2']['character_count'] == 2000
        assert all_stats['groq_3']['character_count'] == 0  # No usage
        assert all_stats['huggingface_1']['character_count'] == 5000
    
    def test_multiple_providers_independent(self, db: Session):
        """
        Test that different providers have independent quotas.
        
        Requirements: 26.1, 26.2, 26.3
        """
        tracker = QuotaTracker(db)
        
        # Use quota for groq_1
        tracker.record_usage('groq_1', character_count=10000)
        
        # groq_2 should still have full quota
        remaining_groq_2 = tracker.get_remaining_percentage('groq_2')
        assert remaining_groq_2 == 1.0
    
    def test_reset_daily_usage_specific_provider(self, db: Session):
        """
        Test resetting usage for specific provider.
        """
        tracker = QuotaTracker(db)
        
        # Record usage for multiple providers
        tracker.record_usage('groq_1', character_count=5000)
        tracker.record_usage('groq_2', character_count=3000)
        
        # Reset groq_1 only
        tracker.reset_daily_usage('groq_1')
        
        # Verify groq_1 reset
        assert tracker.get_remaining_percentage('groq_1') == 1.0
        
        # Verify groq_2 unchanged
        remaining_groq_2 = tracker.get_remaining_percentage('groq_2')
        assert remaining_groq_2 < 1.0
    
    def test_reset_daily_usage_all_providers(self, db: Session):
        """
        Test resetting usage for all providers.
        """
        tracker = QuotaTracker(db)
        
        # Record usage for multiple providers
        tracker.record_usage('groq_1', character_count=5000)
        tracker.record_usage('groq_2', character_count=3000)
        tracker.record_usage('huggingface_1', character_count=10000)
        
        # Reset all
        tracker.reset_daily_usage()
        
        # Verify all reset
        assert tracker.get_remaining_percentage('groq_1') == 1.0
        assert tracker.get_remaining_percentage('groq_2') == 1.0
        assert tracker.get_remaining_percentage('huggingface_1') == 1.0


class TestQuotaTrackerAlerts:
    """Test suite for quota alert functionality"""
    
    def test_alert_at_80_percent(self, db: Session, caplog):
        """
        Test that warning alert is logged at 80% usage.
        
        Requirements: 26.8, 26.9
        """
        tracker = QuotaTracker(db)
        
        # Use 85% of quota to trigger warning
        quota_limit = PROVIDER_QUOTAS['groq_1']
        tracker.record_usage('groq_1', character_count=int(quota_limit * 0.85))
        
        # Check logs for warning
        assert 'WARNING' in caplog.text
        assert 'groq_1' in caplog.text
        assert '80%' in caplog.text or 'warning' in caplog.text.lower()
    
    def test_alert_at_90_percent(self, db: Session, caplog):
        """
        Test that critical alert is logged at 90% usage.
        
        Requirements: 26.9, 26.10
        """
        tracker = QuotaTracker(db)
        
        # Use 95% of quota to trigger critical
        quota_limit = PROVIDER_QUOTAS['groq_1']
        tracker.record_usage('groq_1', character_count=int(quota_limit * 0.95))
        
        # Check logs for critical warning
        assert 'CRITICAL' in caplog.text or 'WARNING' in caplog.text
        assert 'groq_1' in caplog.text
        assert '90%' in caplog.text or 'critical' in caplog.text.lower()
    
    def test_alert_at_100_percent(self, db: Session, caplog):
        """
        Test that error alert is logged at 100% usage.
        
        Requirements: 26.10, 26.11
        """
        tracker = QuotaTracker(db)
        
        # Use 100% of quota
        quota_limit = PROVIDER_QUOTAS['groq_1']
        tracker.record_usage('groq_1', character_count=quota_limit)
        
        # Check logs for error - actual message is "QUOTA EXCEEDED"
        assert 'QUOTA EXCEEDED' in caplog.text or 'ERROR' in caplog.text
        assert 'groq_1' in caplog.text


class TestQuotaTrackerEdgeCases:
    """Test edge cases and error handling"""
    
    def test_unknown_provider(self, db: Session):
        """Test handling of unknown provider name"""
        tracker = QuotaTracker(db)
        
        # Unknown provider should return 100% remaining
        remaining = tracker.get_remaining_percentage('unknown_provider')
        assert remaining == 1.0
    
    def test_zero_character_count(self, db: Session):
        """Test recording zero characters"""
        tracker = QuotaTracker(db)
        
        tracker.record_usage('groq_1', character_count=0)
        
        remaining = tracker.get_remaining_percentage('groq_1')
        assert remaining == 1.0
    
    def test_negative_character_count_prevented(self, db: Session):
        """Test that negative character counts are handled"""
        tracker = QuotaTracker(db)
        
        # This should not cause issues (implementation should handle gracefully)
        try:
            tracker.record_usage('groq_1', character_count=-100)
            # If it doesn't raise, verify it doesn't break quota calculation
            remaining = tracker.get_remaining_percentage('groq_1')
            assert 0.0 <= remaining <= 1.0
        except ValueError:
            # It's also acceptable to raise an error
            pass
