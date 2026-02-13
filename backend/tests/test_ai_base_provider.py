"""
Tests for AI provider base classes and types
"""
import pytest
from datetime import datetime
from app.services.ai.types import (
    ProviderType,
    ProviderConfig,
    ProviderResponse,
    ProviderHealth
)
from app.services.ai.base_provider import AIProvider


class TestProviderConfig:
    """Test ProviderConfig dataclass"""
    
    def test_create_provider_config(self):
        """Test creating a provider configuration"""
        config = ProviderConfig(
            name="groq",
            provider_type=ProviderType.GROQ,
            api_key="test_key",
            model="mixtral-8x7b-32768",
            priority=1,
            quota_limit=14400
        )
        
        assert config.name == "groq"
        assert config.provider_type == ProviderType.GROQ
        assert config.api_key == "test_key"
        assert config.model == "mixtral-8x7b-32768"
        assert config.priority == 1
        assert config.quota_limit == 14400
        assert config.timeout == 10  # default
        assert config.enabled is True  # default
    
    def test_provider_config_validation_priority(self):
        """Test priority validation"""
        with pytest.raises(ValueError, match="Priority must be between 1 and 10"):
            ProviderConfig(
                name="test",
                provider_type=ProviderType.GROQ,
                priority=0
            )
        
        with pytest.raises(ValueError, match="Priority must be between 1 and 10"):
            ProviderConfig(
                name="test",
                provider_type=ProviderType.GROQ,
                priority=11
            )
    
    def test_provider_config_validation_timeout(self):
        """Test timeout validation"""
        with pytest.raises(ValueError, match="Timeout must be at least 1 second"):
            ProviderConfig(
                name="test",
                provider_type=ProviderType.GROQ,
                timeout=0
            )
    
    def test_provider_config_validation_quota(self):
        """Test quota validation"""
        with pytest.raises(ValueError, match="Quota limit cannot be negative"):
            ProviderConfig(
                name="test",
                provider_type=ProviderType.GROQ,
                quota_limit=-1
            )


class TestProviderResponse:
    """Test ProviderResponse dataclass"""
    
    def test_create_provider_response(self):
        """Test creating a provider response"""
        response = ProviderResponse(
            provider_name="groq",
            content="This is a test response",
            model="mixtral-8x7b-32768",
            success=True,
            tokens_used=100,
            response_time=1.5
        )
        
        assert response.provider_name == "groq"
        assert response.content == "This is a test response"
        assert response.model == "mixtral-8x7b-32768"
        assert response.success is True
        assert response.error is None
        assert response.tokens_used == 100
        assert response.response_time == 1.5
        assert isinstance(response.timestamp, datetime)
    
    def test_provider_response_to_dict(self):
        """Test converting response to dictionary"""
        response = ProviderResponse(
            provider_name="groq",
            content="Test",
            model="mixtral",
            success=True
        )
        
        response_dict = response.to_dict()
        
        assert response_dict['provider_name'] == "groq"
        assert response_dict['content'] == "Test"
        assert response_dict['model'] == "mixtral"
        assert response_dict['success'] is True
        assert 'timestamp' in response_dict
    
    def test_provider_response_error(self):
        """Test error response"""
        response = ProviderResponse(
            provider_name="groq",
            content="",
            model="mixtral",
            success=False,
            error="API timeout"
        )
        
        assert response.success is False
        assert response.error == "API timeout"


class TestProviderHealth:
    """Test ProviderHealth dataclass"""
    
    def test_create_provider_health(self):
        """Test creating provider health"""
        health = ProviderHealth(provider_name="groq")
        
        assert health.provider_name == "groq"
        assert health.is_healthy is True
        assert health.health_score == 1.0
        assert health.consecutive_failures == 0
        assert health.total_requests == 0
    
    def test_update_success(self):
        """Test updating health after successful request"""
        health = ProviderHealth(provider_name="groq")
        
        health.update_success(response_time=1.5)
        
        assert health.is_healthy is True
        assert health.consecutive_failures == 0
        assert health.total_requests == 1
        assert health.successful_requests == 1
        assert health.failed_requests == 0
        assert health.average_response_time == 1.5
        assert health.last_success is not None
    
    def test_update_failure(self):
        """Test updating health after failed request"""
        health = ProviderHealth(provider_name="groq")
        
        health.update_failure()
        
        assert health.consecutive_failures == 1
        assert health.total_requests == 1
        assert health.successful_requests == 0
        assert health.failed_requests == 1
        assert health.last_failure is not None
    
    def test_multiple_failures_mark_unhealthy(self):
        """Test that 5 consecutive failures mark provider as unhealthy"""
        health = ProviderHealth(provider_name="groq")
        
        # 4 failures - still healthy
        for _ in range(4):
            health.update_failure()
        
        assert health.is_healthy is True
        assert health.consecutive_failures == 4
        
        # 5th failure - now unhealthy
        health.update_failure()
        
        assert health.is_healthy is False
        assert health.consecutive_failures == 5
    
    def test_success_resets_consecutive_failures(self):
        """Test that success resets consecutive failures"""
        health = ProviderHealth(provider_name="groq")
        
        # 3 failures
        for _ in range(3):
            health.update_failure()
        
        assert health.consecutive_failures == 3
        
        # 1 success
        health.update_success(response_time=1.0)
        
        assert health.consecutive_failures == 0
        assert health.is_healthy is True
    
    def test_health_score_calculation(self):
        """Test health score calculation"""
        health = ProviderHealth(provider_name="groq")
        
        # All successful - high score
        for _ in range(10):
            health.update_success(response_time=1.0)
        
        assert health.health_score > 0.8
        
        # Some failures - lower score
        for _ in range(5):
            health.update_failure()
        
        assert health.health_score < 0.8
    
    def test_average_response_time(self):
        """Test average response time calculation"""
        health = ProviderHealth(provider_name="groq")
        
        health.update_success(response_time=1.0)
        assert health.average_response_time == 1.0
        
        health.update_success(response_time=2.0)
        # Exponential moving average: 0.7 * 1.0 + 0.3 * 2.0 = 1.3
        assert abs(health.average_response_time - 1.3) < 0.01
    
    def test_health_to_dict(self):
        """Test converting health to dictionary"""
        health = ProviderHealth(provider_name="groq")
        health.update_success(response_time=1.5)
        
        health_dict = health.to_dict()
        
        assert health_dict['provider_name'] == "groq"
        assert health_dict['is_healthy'] is True
        assert 'health_score' in health_dict
        assert 'total_requests' in health_dict


class MockAIProvider(AIProvider):
    """Mock AI provider for testing"""
    
    def __init__(self, config: ProviderConfig, should_fail: bool = False):
        super().__init__(config)
        self.should_fail = should_fail
        self.call_count = 0
    
    async def call(self, prompt: str, **kwargs) -> ProviderResponse:
        """Mock call implementation"""
        self.call_count += 1
        
        if self.should_fail:
            raise Exception("Mock API error")
        
        return ProviderResponse(
            provider_name=self.config.name,
            content=f"Mock response to: {prompt}",
            model=self.config.model,
            success=True,
            tokens_used=50
        )


class TestAIProvider:
    """Test AIProvider base class"""
    
    def test_create_provider(self):
        """Test creating an AI provider"""
        config = ProviderConfig(
            name="mock",
            provider_type=ProviderType.GROQ,
            model="test-model"
        )
        
        provider = MockAIProvider(config)
        
        assert provider.config.name == "mock"
        assert provider.config.model == "test-model"
        assert provider.health.provider_name == "mock"
    
    @pytest.mark.asyncio
    async def test_call_with_tracking_success(self):
        """Test successful call with tracking"""
        config = ProviderConfig(
            name="mock",
            provider_type=ProviderType.GROQ,
            model="test-model"
        )
        
        provider = MockAIProvider(config, should_fail=False)
        
        response = await provider.call_with_tracking("Test prompt")
        
        assert response.success is True
        assert response.content == "Mock response to: Test prompt"
        assert response.response_time >= 0  # Can be 0 for very fast mock calls
        assert provider.health.successful_requests == 1
        assert provider.health.consecutive_failures == 0
    
    @pytest.mark.asyncio
    async def test_call_with_tracking_failure(self):
        """Test failed call with tracking"""
        config = ProviderConfig(
            name="mock",
            provider_type=ProviderType.GROQ,
            model="test-model"
        )
        
        provider = MockAIProvider(config, should_fail=True)
        
        response = await provider.call_with_tracking("Test prompt")
        
        assert response.success is False
        assert response.error == "Mock API error"
        assert provider.health.failed_requests == 1
        assert provider.health.consecutive_failures == 1
    
    def test_get_health_score(self):
        """Test getting health score"""
        config = ProviderConfig(
            name="mock",
            provider_type=ProviderType.GROQ,
            model="test-model"
        )
        
        provider = MockAIProvider(config)
        
        # Initial health score should be 1.0
        assert provider.get_health_score() == 1.0
    
    def test_check_quota_unlimited(self):
        """Test quota check with unlimited quota"""
        config = ProviderConfig(
            name="mock",
            provider_type=ProviderType.GROQ,
            model="test-model",
            quota_limit=0  # unlimited
        )
        
        provider = MockAIProvider(config)
        
        assert provider.check_quota() is True
    
    def test_check_quota_limited(self):
        """Test quota check with limited quota"""
        config = ProviderConfig(
            name="mock",
            provider_type=ProviderType.GROQ,
            model="test-model",
            quota_limit=100
        )
        
        provider = MockAIProvider(config)
        
        # Initially should have quota
        assert provider.check_quota() is True
        
        # Exhaust quota
        provider.update_quota_remaining(0.0)
        
        assert provider.check_quota() is False
    
    def test_is_healthy(self):
        """Test health check"""
        config = ProviderConfig(
            name="mock",
            provider_type=ProviderType.GROQ,
            model="test-model"
        )
        
        provider = MockAIProvider(config)
        
        # Initially healthy
        assert provider.is_healthy() is True
        
        # After 5 failures - unhealthy
        for _ in range(5):
            provider.health.update_failure()
        
        assert provider.is_healthy() is False
    
    def test_is_healthy_disabled_provider(self):
        """Test that disabled provider is not healthy"""
        config = ProviderConfig(
            name="mock",
            provider_type=ProviderType.GROQ,
            model="test-model",
            enabled=False
        )
        
        provider = MockAIProvider(config)
        
        assert provider.is_healthy() is False
    
    def test_get_health_status(self):
        """Test getting detailed health status"""
        config = ProviderConfig(
            name="mock",
            provider_type=ProviderType.GROQ,
            model="test-model",
            priority=1
        )
        
        provider = MockAIProvider(config)
        
        status = provider.get_health_status()
        
        assert status['provider_name'] == "mock"
        assert status['provider_type'] == "groq"
        assert status['model'] == "test-model"
        assert status['priority'] == 1
        assert status['is_healthy'] is True
        assert 'health_score' in status
        assert 'total_requests' in status
    
    def test_reset_health(self):
        """Test resetting health metrics"""
        config = ProviderConfig(
            name="mock",
            provider_type=ProviderType.GROQ,
            model="test-model"
        )
        
        provider = MockAIProvider(config)
        
        # Make some requests
        provider.health.update_success(1.0)
        provider.health.update_failure()
        
        assert provider.health.total_requests == 2
        
        # Reset
        provider.reset_health()
        
        assert provider.health.total_requests == 0
        assert provider.health.health_score == 1.0
    
    def test_update_quota_remaining(self):
        """Test updating quota remaining"""
        config = ProviderConfig(
            name="mock",
            provider_type=ProviderType.GROQ,
            model="test-model"
        )
        
        provider = MockAIProvider(config)
        
        provider.update_quota_remaining(0.5)
        
        assert provider.health.quota_remaining == 0.5
    
    def test_provider_repr(self):
        """Test provider string representation"""
        config = ProviderConfig(
            name="mock",
            provider_type=ProviderType.GROQ,
            model="test-model",
            priority=1
        )
        
        provider = MockAIProvider(config)
        
        repr_str = repr(provider)
        
        assert "MockAIProvider" in repr_str
        assert "name=mock" in repr_str
        assert "model=test-model" in repr_str
        assert "priority=1" in repr_str
