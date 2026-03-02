"""
Comprehensive tests for AI Orchestrator

Tests cover:
- Provider registration
- Provider selection algorithm
- Fallback chain logic
- Circuit breaker integration
- Multiple API key rotation
- Cache integration
- Error handling
- Metrics tracking
"""

import pytest
import sys
import os

# Ensure app is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from unittest.mock import Mock, AsyncMock, patch
from datetime import timedelta

from app.services.ai.orchestrator import AIOrchestrator
from app.services.ai.base_provider import AIProvider
from app.services.ai.types import ProviderConfig, ProviderResponse, ProviderHealth, ProviderType
from app.services.cache_service import CacheService


# Mock Provider for testing
class MockProvider(AIProvider):
    """Mock AI provider for testing."""
    
    def __init__(self, config: ProviderConfig):
        super().__init__(config)
        self.call_count = 0
        self.should_fail = False
        self.response_content = "Mock response"
    
    async def _call_api(self, prompt: str, **kwargs) -> ProviderResponse:
        """Mock API call."""
        self.call_count += 1
        
        if self.should_fail:
            return ProviderResponse(
                provider_name=self.config.name,
                content="",
                model=self.config.model,
                success=False,
                error="Mock failure"
            )
        
        return ProviderResponse(
            provider_name=self.config.name,
            content=self.response_content,
            model=self.config.model,
            success=True,
            tokens_used=100,
            response_time=1.0
        )


@pytest.fixture
def mock_cache_service():
    """Create mock cache service."""
    cache = Mock(spec=CacheService)
    cache.get = Mock(return_value=None)
    cache.set = Mock()
    return cache


@pytest.fixture
def orchestrator(mock_cache_service):
    """Create orchestrator with mock cache."""
    return AIOrchestrator(cache_service=mock_cache_service)


@pytest.fixture
def mock_provider_1():
    """Create first mock provider (priority 1)."""
    config = ProviderConfig(
        name="provider_1",
        provider_type=ProviderType.GROQ,
        api_key="test_key_1",
        model="test-model-1",
        priority=1,
        quota_limit=1000,
        enabled=True
    )
    return MockProvider(config)


@pytest.fixture
def mock_provider_2():
    """Create second mock provider (priority 2)."""
    config = ProviderConfig(
        name="provider_2",
        provider_type=ProviderType.HUGGINGFACE,
        api_key="test_key_2",
        model="test-model-2",
        priority=2,
        quota_limit=500,
        enabled=True
    )
    return MockProvider(config)


@pytest.fixture
def mock_provider_3():
    """Create third mock provider (priority 3, disabled)."""
    config = ProviderConfig(
        name="provider_3",
        provider_type=ProviderType.GROQ,
        api_key="test_key_3",
        model="test-model-3",
        priority=3,
        quota_limit=1000,
        enabled=False
    )
    return MockProvider(config)


# Test: Provider Registration
class TestProviderRegistration:
    """Tests for provider registration."""
    
    def test_register_single_provider(self, orchestrator, mock_provider_1):
        """Test registering a single provider."""
        orchestrator.register_provider(mock_provider_1)
        
        assert len(orchestrator.providers) == 1
        assert orchestrator.providers[0] == mock_provider_1
        assert "provider_1" in orchestrator.circuit_breakers
        assert "provider_1" in orchestrator.provider_calls
        assert "provider_1" in orchestrator.provider_failures
    
    def test_register_multiple_providers(self, orchestrator, mock_provider_1, mock_provider_2):
        """Test registering multiple providers."""
        orchestrator.register_provider(mock_provider_1)
        orchestrator.register_provider(mock_provider_2)
        
        assert len(orchestrator.providers) == 2
        assert len(orchestrator.circuit_breakers) == 2
    
    def test_providers_sorted_by_priority(self, orchestrator, mock_provider_1, mock_provider_2):
        """Test providers are sorted by priority (lower number = higher priority)."""
        # Register in reverse order
        orchestrator.register_provider(mock_provider_2)  # priority 2
        orchestrator.register_provider(mock_provider_1)  # priority 1
        
        # Should be sorted by priority
        assert orchestrator.providers[0].config.priority == 1
        assert orchestrator.providers[1].config.priority == 2
    
    def test_register_with_custom_circuit_breaker_config(self, orchestrator, mock_provider_1):
        """Test registering provider with custom circuit breaker config."""
        cb_config = {
            'failure_threshold': 10,
            'timeout_duration': 120,
            'success_threshold': 2
        }
        
        orchestrator.register_provider(mock_provider_1, circuit_breaker_config=cb_config)
        
        circuit_breaker = orchestrator.circuit_breakers["provider_1"]
        assert circuit_breaker.failure_threshold == 10
        assert circuit_breaker.timeout_duration == 120
        assert circuit_breaker.success_threshold == 2


# Test: Provider Selection
class TestProviderSelection:
    """Tests for provider selection algorithm."""
    
    def test_select_best_provider(self, orchestrator, mock_provider_1, mock_provider_2):
        """Test selecting best provider based on score."""
        orchestrator.register_provider(mock_provider_1)
        orchestrator.register_provider(mock_provider_2)
        
        # Provider 1 should be selected (higher priority)
        provider = orchestrator._select_provider()
        assert provider == mock_provider_1
    
    def test_skip_disabled_provider(self, orchestrator, mock_provider_1, mock_provider_3):
        """Test that disabled providers are skipped."""
        orchestrator.register_provider(mock_provider_3)  # disabled
        orchestrator.register_provider(mock_provider_1)  # enabled
        
        provider = orchestrator._select_provider()
        assert provider == mock_provider_1
    
    def test_skip_provider_with_open_circuit(self, orchestrator, mock_provider_1, mock_provider_2):
        """Test that providers with open circuit breaker are skipped."""
        orchestrator.register_provider(mock_provider_1)
        orchestrator.register_provider(mock_provider_2)
        
        # Open circuit breaker for provider 1
        circuit_breaker = orchestrator.circuit_breakers["provider_1"]
        for _ in range(5):  # Trigger circuit breaker
            circuit_breaker.record_failure()
        
        # Should select provider 2
        provider = orchestrator._select_provider()
        assert provider == mock_provider_2
    
    def test_no_available_providers(self, orchestrator, mock_provider_3):
        """Test when no providers are available."""
        orchestrator.register_provider(mock_provider_3)  # disabled
        
        provider = orchestrator._select_provider()
        assert provider is None
    
    def test_provider_score_calculation(self, orchestrator, mock_provider_1):
        """Test provider score calculation."""
        orchestrator.register_provider(mock_provider_1)
        
        # Set known health values
        mock_provider_1.health.is_healthy = True
        mock_provider_1.health.consecutive_failures = 0
        mock_provider_1.health.quota_remaining = 0.8
        mock_provider_1.health.average_response_time = 2.0
        
        score = orchestrator._calculate_provider_score(mock_provider_1)
        
        # Score should be between 0 and 1
        assert 0.0 <= score <= 1.0
        
        # With good health (1.0), good quota (0.8), and decent response time (2s = 0.8)
        # Expected: (1.0 * 0.4) + (0.8 * 0.3) + (0.8 * 0.3) = 0.4 + 0.24 + 0.24 = 0.88
        assert score == pytest.approx(0.88, abs=0.01)


# Test: API Calls and Fallback
class TestAPICallsAndFallback:
    """Tests for API calls and fallback logic."""
    
    @pytest.mark.asyncio
    async def test_successful_call(self, orchestrator, mock_provider_1):
        """Test successful API call."""
        orchestrator.register_provider(mock_provider_1)
        
        response = await orchestrator.call("Test prompt")
        
        assert response.success is True
        assert response.content == "Mock response"
        assert response.provider_name == "provider_1"
        assert mock_provider_1.call_count == 1
    
    @pytest.mark.asyncio
    async def test_fallback_on_failure(self, orchestrator, mock_provider_1, mock_provider_2):
        """Test fallback to next provider on failure."""
        orchestrator.register_provider(mock_provider_1)
        orchestrator.register_provider(mock_provider_2)
        
        # Make provider 1 fail
        mock_provider_1.should_fail = True
        
        response = await orchestrator.call("Test prompt")
        
        # Should fallback to provider 2
        assert response.success is True
        assert response.provider_name == "provider_2"
        assert mock_provider_1.call_count == 1
        assert mock_provider_2.call_count == 1
    
    @pytest.mark.asyncio
    async def test_all_providers_fail(self, orchestrator, mock_provider_1, mock_provider_2):
        """Test when all providers fail."""
        orchestrator.register_provider(mock_provider_1)
        orchestrator.register_provider(mock_provider_2)
        
        # Make both providers fail
        mock_provider_1.should_fail = True
        mock_provider_2.should_fail = True
        
        response = await orchestrator.call("Test prompt")
        
        assert response.success is False
        assert response.error == "All providers failed"
        assert mock_provider_1.call_count == 1
        assert mock_provider_2.call_count == 1
    
    @pytest.mark.asyncio
    async def test_circuit_breaker_prevents_calls(self, orchestrator, mock_provider_1, mock_provider_2):
        """Test that circuit breaker prevents calls to unhealthy provider."""
        orchestrator.register_provider(mock_provider_1)
        orchestrator.register_provider(mock_provider_2)
        
        # Open circuit breaker for provider 1
        circuit_breaker = orchestrator.circuit_breakers["provider_1"]
        for _ in range(5):
            circuit_breaker.record_failure()
        
        response = await orchestrator.call("Test prompt")
        
        # Should skip provider 1 and use provider 2
        assert response.success is True
        assert response.provider_name == "provider_2"
        assert mock_provider_1.call_count == 0  # Not called
        assert mock_provider_2.call_count == 1
    
    @pytest.mark.asyncio
    async def test_circuit_breaker_records_success(self, orchestrator, mock_provider_1):
        """Test that circuit breaker records successful calls."""
        orchestrator.register_provider(mock_provider_1)
        
        circuit_breaker = orchestrator.circuit_breakers["provider_1"]
        
        # Make a successful call
        await orchestrator.call("Test prompt")
        
        # Circuit breaker should record success
        assert circuit_breaker.success_count == 1
        assert circuit_breaker.failure_count == 0
    
    @pytest.mark.asyncio
    async def test_circuit_breaker_records_failure(self, orchestrator, mock_provider_1, mock_provider_2):
        """Test that circuit breaker records failures."""
        orchestrator.register_provider(mock_provider_1)
        orchestrator.register_provider(mock_provider_2)
        
        circuit_breaker = orchestrator.circuit_breakers["provider_1"]
        
        # Make provider 1 fail
        mock_provider_1.should_fail = True
        
        await orchestrator.call("Test prompt")
        
        # Circuit breaker should record failure
        assert circuit_breaker.failure_count == 1


# Test: Cache Integration
class TestCacheIntegration:
    """Tests for cache integration."""
    
    @pytest.mark.asyncio
    async def test_cache_hit(self, orchestrator, mock_provider_1, mock_cache_service):
        """Test cache hit returns cached response."""
        orchestrator.register_provider(mock_provider_1)
        
        # Set up cache to return a response
        cached_response = {
            'provider_name': 'cached_provider',
            'content': 'Cached content',
            'model': 'cached-model',
            'success': True,
            'error': None,
            'tokens_used': 50,
            'response_time': 0.5,
            'metadata': {}
        }
        mock_cache_service.get.return_value = cached_response
        
        response = await orchestrator.call("Test prompt", cache_key="test_key")
        
        # Should return cached response
        assert response.content == "Cached content"
        assert response.provider_name == "cached_provider"
        assert mock_provider_1.call_count == 0  # Provider not called
        assert orchestrator.cache_hits == 1
        assert orchestrator.cache_misses == 0
    
    @pytest.mark.asyncio
    async def test_cache_miss(self, orchestrator, mock_provider_1, mock_cache_service):
        """Test cache miss calls provider."""
        orchestrator.register_provider(mock_provider_1)
        
        # Cache returns None (miss)
        mock_cache_service.get.return_value = None
        
        response = await orchestrator.call("Test prompt", cache_key="test_key")
        
        # Should call provider
        assert response.content == "Mock response"
        assert mock_provider_1.call_count == 1
        assert orchestrator.cache_hits == 0
        assert orchestrator.cache_misses == 1
    
    @pytest.mark.asyncio
    async def test_cache_disabled(self, orchestrator, mock_provider_1, mock_cache_service):
        """Test that cache can be disabled."""
        orchestrator.register_provider(mock_provider_1)
        
        # Set up cache to return a response
        mock_cache_service.get.return_value = {'content': 'Cached'}
        
        # Call with cache disabled
        response = await orchestrator.call("Test prompt", cache_key="test_key", use_cache=False)
        
        # Should not use cache
        assert response.content == "Mock response"
        assert mock_provider_1.call_count == 1
        assert orchestrator.cache_hits == 0
    
    @pytest.mark.asyncio
    async def test_successful_response_cached(self, orchestrator, mock_provider_1, mock_cache_service):
        """Test that successful responses are cached."""
        orchestrator.register_provider(mock_provider_1)
        
        mock_cache_service.get.return_value = None
        
        await orchestrator.call("Test prompt", cache_key="test_key")
        
        # Cache set should be called
        mock_cache_service.set.assert_called_once()
        
        # Check cache key and TTL
        call_args = mock_cache_service.set.call_args
        assert call_args[0][0] == "test_key"  # cache_key
        assert call_args[0][2] == timedelta(days=30)  # TTL
    
    @pytest.mark.asyncio
    async def test_failed_response_not_cached(self, orchestrator, mock_provider_1, mock_cache_service):
        """Test that failed responses are not cached."""
        orchestrator.register_provider(mock_provider_1)
        
        mock_cache_service.get.return_value = None
        mock_provider_1.should_fail = True
        
        await orchestrator.call("Test prompt", cache_key="test_key")
        
        # Cache set should not be called
        mock_cache_service.set.assert_not_called()


# Test: Metrics
class TestMetrics:
    """Tests for metrics tracking."""
    
    @pytest.mark.asyncio
    async def test_total_requests_tracked(self, orchestrator, mock_provider_1):
        """Test that total requests are tracked."""
        orchestrator.register_provider(mock_provider_1)
        
        await orchestrator.call("Test prompt 1")
        await orchestrator.call("Test prompt 2")
        await orchestrator.call("Test prompt 3")
        
        metrics = orchestrator.get_metrics()
        assert metrics['total_requests'] == 3
    
    @pytest.mark.asyncio
    async def test_provider_calls_tracked(self, orchestrator, mock_provider_1, mock_provider_2):
        """Test that provider calls are tracked."""
        orchestrator.register_provider(mock_provider_1)
        orchestrator.register_provider(mock_provider_2)
        
        await orchestrator.call("Test prompt 1")
        await orchestrator.call("Test prompt 2")
        
        metrics = orchestrator.get_metrics()
        assert metrics['provider_calls']['provider_1'] == 2
    
    @pytest.mark.asyncio
    async def test_provider_failures_tracked(self, orchestrator, mock_provider_1, mock_provider_2):
        """Test that provider failures are tracked."""
        orchestrator.register_provider(mock_provider_1)
        orchestrator.register_provider(mock_provider_2)
        
        mock_provider_1.should_fail = True
        
        await orchestrator.call("Test prompt")
        
        metrics = orchestrator.get_metrics()
        assert metrics['provider_failures']['provider_1'] == 1
    
    @pytest.mark.asyncio
    async def test_cache_hit_rate_calculated(self, orchestrator, mock_provider_1, mock_cache_service):
        """Test that cache hit rate is calculated correctly."""
        orchestrator.register_provider(mock_provider_1)
        
        # First call: cache miss
        mock_cache_service.get.return_value = None
        await orchestrator.call("Test prompt", cache_key="key1")
        
        # Second call: cache hit
        mock_cache_service.get.return_value = {
            'provider_name': 'cached',
            'content': 'Cached',
            'model': 'model',
            'success': True,
            'error': None,
            'tokens_used': 50,
            'response_time': 0.5,
            'metadata': {}
        }
        await orchestrator.call("Test prompt", cache_key="key2")
        
        metrics = orchestrator.get_metrics()
        assert metrics['cache_hit_rate'] == 50.0  # 1 hit out of 2 requests
    
    def test_reset_metrics(self, orchestrator, mock_provider_1):
        """Test that metrics can be reset."""
        orchestrator.register_provider(mock_provider_1)
        
        orchestrator.total_requests = 10
        orchestrator.cache_hits = 5
        orchestrator.provider_calls['provider_1'] = 10
        
        orchestrator.reset_metrics()
        
        assert orchestrator.total_requests == 0
        assert orchestrator.cache_hits == 0
        assert orchestrator.provider_calls['provider_1'] == 0


# Test: Provider Status
class TestProviderStatus:
    """Tests for provider status reporting."""
    
    def test_get_provider_status(self, orchestrator, mock_provider_1):
        """Test getting status of a specific provider."""
        orchestrator.register_provider(mock_provider_1)
        
        status = orchestrator.get_provider_status("provider_1")
        
        assert status is not None
        assert 'provider' in status
        assert 'circuit_breaker' in status
        assert 'calls' in status
        assert 'failures' in status
    
    def test_get_nonexistent_provider_status(self, orchestrator):
        """Test getting status of nonexistent provider."""
        status = orchestrator.get_provider_status("nonexistent")
        assert status is None
    
    def test_get_all_providers_status(self, orchestrator, mock_provider_1, mock_provider_2):
        """Test getting status of all providers."""
        orchestrator.register_provider(mock_provider_1)
        orchestrator.register_provider(mock_provider_2)
        
        statuses = orchestrator.get_all_providers_status()
        
        assert len(statuses) == 2
        assert all('provider' in s for s in statuses)
        assert all('circuit_breaker' in s for s in statuses)


# Test: Edge Cases
class TestEdgeCases:
    """Tests for edge cases and error handling."""
    
    @pytest.mark.asyncio
    async def test_call_with_no_providers(self, orchestrator):
        """Test calling with no registered providers."""
        response = await orchestrator.call("Test prompt")
        
        assert response.success is False
        assert "No healthy providers available" in response.error
    
    @pytest.mark.asyncio
    async def test_call_with_empty_prompt(self, orchestrator, mock_provider_1):
        """Test calling with empty prompt."""
        orchestrator.register_provider(mock_provider_1)
        
        response = await orchestrator.call("")
        
        # Should still work (provider handles validation)
        assert response.success is True
    
    @pytest.mark.asyncio
    async def test_cache_error_handling(self, orchestrator, mock_provider_1, mock_cache_service):
        """Test that cache errors don't break the flow."""
        orchestrator.register_provider(mock_provider_1)
        
        # Make cache raise an exception
        mock_cache_service.get.side_effect = Exception("Cache error")
        
        # Should still work by calling provider
        response = await orchestrator.call("Test prompt", cache_key="test_key")
        
        assert response.success is True
        assert mock_provider_1.call_count == 1
    
    def test_repr(self, orchestrator, mock_provider_1):
        """Test string representation."""
        orchestrator.register_provider(mock_provider_1)
        orchestrator.total_requests = 10
        orchestrator.cache_hits = 7
        
        repr_str = repr(orchestrator)
        
        assert "AIOrchestrator" in repr_str
        assert "providers=1" in repr_str
        assert "total_requests=10" in repr_str
        assert "70.0%" in repr_str  # cache hit rate


# Test: Integration Scenarios
class TestIntegrationScenarios:
    """Integration tests for realistic scenarios."""
    
    @pytest.mark.asyncio
    async def test_multi_provider_rotation(self, orchestrator, mock_provider_1, mock_provider_2):
        """Test rotation through multiple providers."""
        orchestrator.register_provider(mock_provider_1)
        orchestrator.register_provider(mock_provider_2)
        
        # First call: provider 1 succeeds
        response1 = await orchestrator.call("Prompt 1")
        assert response1.provider_name == "provider_1"
        
        # Make provider 1 fail
        mock_provider_1.should_fail = True
        
        # Second call: should fallback to provider 2
        response2 = await orchestrator.call("Prompt 2")
        assert response2.provider_name == "provider_2"
        
        # Fix provider 1
        mock_provider_1.should_fail = False
        
        # Third call: should use provider 1 again (higher priority)
        response3 = await orchestrator.call("Prompt 3")
        assert response3.provider_name == "provider_1"
    
    @pytest.mark.asyncio
    async def test_circuit_breaker_recovery(self, orchestrator, mock_provider_1, mock_provider_2):
        """Test circuit breaker recovery after timeout."""
        orchestrator.register_provider(mock_provider_1)
        orchestrator.register_provider(mock_provider_2)
        
        circuit_breaker = orchestrator.circuit_breakers["provider_1"]
        
        # Trigger circuit breaker
        for _ in range(5):
            circuit_breaker.record_failure()
        
        assert circuit_breaker.state.value == "OPEN"
        
        # Should use provider 2
        response = await orchestrator.call("Test prompt")
        assert response.provider_name == "provider_2"
        
        # Wait for timeout (simulate)
        import time
        circuit_breaker.last_failure_time = time.time() - 61  # 61 seconds ago
        
        # Circuit should be in HALF_OPEN state
        assert circuit_breaker.can_request() is True
        
        # Successful call should close circuit
        response = await orchestrator.call("Test prompt")
        circuit_breaker.record_success()
        
        assert circuit_breaker.state.value == "CLOSED"
