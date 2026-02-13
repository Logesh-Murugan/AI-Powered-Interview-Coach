"""
Comprehensive tests for Circuit Breaker implementation
"""

import pytest
import time
from datetime import datetime, timedelta
from app.services.ai.circuit_breaker import CircuitBreaker, CircuitState


class TestCircuitBreakerInitialization:
    """Test circuit breaker initialization"""
    
    def test_default_initialization(self):
        """Test circuit breaker with default parameters"""
        cb = CircuitBreaker("test-provider")
        
        assert cb.name == "test-provider"
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_threshold == 5
        assert cb.timeout_duration == 60
        assert cb.success_threshold == 1
        assert cb.failure_count == 0
        assert cb.success_count == 0
        assert cb.last_failure_time is None
        assert cb.opened_at is None
    
    def test_custom_initialization(self):
        """Test circuit breaker with custom parameters"""
        cb = CircuitBreaker(
            name="custom-provider",
            failure_threshold=3,
            timeout_duration=30,
            success_threshold=2
        )
        
        assert cb.name == "custom-provider"
        assert cb.failure_threshold == 3
        assert cb.timeout_duration == 30
        assert cb.success_threshold == 2


class TestCircuitBreakerClosedState:
    """Test circuit breaker behavior in CLOSED state"""
    
    def test_can_request_when_closed(self):
        """Test that requests are allowed in CLOSED state"""
        cb = CircuitBreaker("test-provider")
        assert cb.can_request() is True
        assert cb.state == CircuitState.CLOSED
    
    def test_record_success_in_closed(self):
        """Test recording success in CLOSED state"""
        cb = CircuitBreaker("test-provider")
        cb.record_success()
        
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == 0
    
    def test_record_failure_in_closed(self):
        """Test recording single failure in CLOSED state"""
        cb = CircuitBreaker("test-provider", failure_threshold=5)
        cb.record_failure()
        
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == 1
        assert cb.last_failure_time is not None
    
    def test_multiple_failures_below_threshold(self):
        """Test multiple failures below threshold"""
        cb = CircuitBreaker("test-provider", failure_threshold=5)
        
        for i in range(4):
            cb.record_failure()
            assert cb.state == CircuitState.CLOSED
            assert cb.failure_count == i + 1
    
    def test_failure_count_resets_on_success(self):
        """Test that failure count resets on success"""
        cb = CircuitBreaker("test-provider", failure_threshold=5)
        
        # Record some failures
        cb.record_failure()
        cb.record_failure()
        assert cb.failure_count == 2
        
        # Record success
        cb.record_success()
        assert cb.failure_count == 0
        assert cb.last_failure_time is None


class TestCircuitBreakerOpenTransition:
    """Test transition from CLOSED to OPEN state"""
    
    def test_opens_after_threshold_failures(self):
        """Test circuit opens after reaching failure threshold"""
        cb = CircuitBreaker("test-provider", failure_threshold=5)
        
        # Record failures up to threshold
        for i in range(5):
            cb.record_failure()
        
        assert cb.state == CircuitState.OPEN
        assert cb.failure_count == 5
        assert cb.opened_at is not None
    
    def test_opens_exactly_at_threshold(self):
        """Test circuit opens exactly at threshold, not before"""
        cb = CircuitBreaker("test-provider", failure_threshold=3)
        
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.CLOSED
        
        cb.record_failure()
        assert cb.state == CircuitState.OPEN
    
    def test_custom_failure_threshold(self):
        """Test circuit with custom failure threshold"""
        cb = CircuitBreaker("test-provider", failure_threshold=2)
        
        cb.record_failure()
        assert cb.state == CircuitState.CLOSED
        
        cb.record_failure()
        assert cb.state == CircuitState.OPEN


class TestCircuitBreakerOpenState:
    """Test circuit breaker behavior in OPEN state"""
    
    def test_blocks_requests_when_open(self):
        """Test that requests are blocked in OPEN state"""
        cb = CircuitBreaker("test-provider", failure_threshold=2, timeout_duration=60)
        
        # Open the circuit
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.OPEN
        
        # Requests should be blocked
        assert cb.can_request() is False
    
    def test_stays_open_during_timeout(self):
        """Test circuit stays open during timeout period"""
        cb = CircuitBreaker("test-provider", failure_threshold=2, timeout_duration=2)
        
        # Open the circuit
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.OPEN
        
        # Wait less than timeout
        time.sleep(1)
        assert cb.can_request() is False
        assert cb.state == CircuitState.OPEN
    
    def test_transitions_to_half_open_after_timeout(self):
        """Test circuit transitions to HALF_OPEN after timeout"""
        cb = CircuitBreaker("test-provider", failure_threshold=2, timeout_duration=1)
        
        # Open the circuit
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.OPEN
        
        # Wait for timeout
        time.sleep(1.1)
        
        # Should transition to HALF_OPEN
        assert cb.can_request() is True
        assert cb.state == CircuitState.HALF_OPEN


class TestCircuitBreakerHalfOpenState:
    """Test circuit breaker behavior in HALF_OPEN state"""
    
    def test_allows_test_request_in_half_open(self):
        """Test that test requests are allowed in HALF_OPEN state"""
        cb = CircuitBreaker("test-provider", failure_threshold=2, timeout_duration=1)
        
        # Open the circuit
        cb.record_failure()
        cb.record_failure()
        
        # Wait for timeout
        time.sleep(1.1)
        
        # Transition to HALF_OPEN
        cb.can_request()
        assert cb.state == CircuitState.HALF_OPEN
        
        # Test request should be allowed
        assert cb.can_request() is True
    
    def test_closes_on_successful_test(self):
        """Test circuit closes on successful test request"""
        cb = CircuitBreaker("test-provider", failure_threshold=2, timeout_duration=1)
        
        # Open the circuit
        cb.record_failure()
        cb.record_failure()
        
        # Wait and transition to HALF_OPEN
        time.sleep(1.1)
        cb.can_request()
        assert cb.state == CircuitState.HALF_OPEN
        
        # Successful test
        cb.record_success()
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == 0
    
    def test_reopens_on_failed_test(self):
        """Test circuit reopens on failed test request"""
        cb = CircuitBreaker("test-provider", failure_threshold=2, timeout_duration=1)
        
        # Open the circuit
        cb.record_failure()
        cb.record_failure()
        
        # Wait and transition to HALF_OPEN
        time.sleep(1.1)
        cb.can_request()
        assert cb.state == CircuitState.HALF_OPEN
        
        # Failed test
        cb.record_failure()
        assert cb.state == CircuitState.OPEN
    
    def test_multiple_successes_required(self):
        """Test circuit requires multiple successes to close"""
        cb = CircuitBreaker(
            "test-provider",
            failure_threshold=2,
            timeout_duration=1,
            success_threshold=3
        )
        
        # Open the circuit
        cb.record_failure()
        cb.record_failure()
        
        # Wait and transition to HALF_OPEN
        time.sleep(1.1)
        cb.can_request()
        assert cb.state == CircuitState.HALF_OPEN
        
        # First success
        cb.record_success()
        assert cb.state == CircuitState.HALF_OPEN
        assert cb.success_count == 1
        
        # Second success
        cb.record_success()
        assert cb.state == CircuitState.HALF_OPEN
        assert cb.success_count == 2
        
        # Third success - should close
        cb.record_success()
        assert cb.state == CircuitState.CLOSED
        assert cb.success_count == 0


class TestCircuitBreakerReset:
    """Test manual reset functionality"""
    
    def test_manual_reset_from_open(self):
        """Test manual reset from OPEN state"""
        cb = CircuitBreaker("test-provider", failure_threshold=2)
        
        # Open the circuit
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.OPEN
        
        # Manual reset
        cb.reset()
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == 0
        assert cb.opened_at is None
    
    def test_manual_reset_from_half_open(self):
        """Test manual reset from HALF_OPEN state"""
        cb = CircuitBreaker("test-provider", failure_threshold=2, timeout_duration=1)
        
        # Open the circuit
        cb.record_failure()
        cb.record_failure()
        
        # Transition to HALF_OPEN
        time.sleep(1.1)
        cb.can_request()
        assert cb.state == CircuitState.HALF_OPEN
        
        # Manual reset
        cb.reset()
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == 0
        assert cb.success_count == 0


class TestCircuitBreakerStatus:
    """Test status reporting"""
    
    def test_status_in_closed_state(self):
        """Test status report in CLOSED state"""
        cb = CircuitBreaker("test-provider")
        status = cb.get_status()
        
        assert status['name'] == "test-provider"
        assert status['state'] == "closed"
        assert status['failure_count'] == 0
        assert status['success_count'] == 0
        assert 'last_failure_time' not in status
        assert 'opened_at' not in status
    
    def test_status_in_open_state(self):
        """Test status report in OPEN state"""
        cb = CircuitBreaker("test-provider", failure_threshold=2)
        
        # Open the circuit
        cb.record_failure()
        cb.record_failure()
        
        status = cb.get_status()
        assert status['state'] == "open"
        assert status['failure_count'] == 2
        assert 'opened_at' in status
        assert 'time_since_opened' in status
        assert 'time_until_retry' in status
    
    def test_status_includes_configuration(self):
        """Test status includes configuration parameters"""
        cb = CircuitBreaker(
            "test-provider",
            failure_threshold=3,
            timeout_duration=30,
            success_threshold=2
        )
        
        status = cb.get_status()
        assert status['failure_threshold'] == 3
        assert status['timeout_duration'] == 30
        assert status['success_threshold'] == 2


class TestCircuitBreakerEdgeCases:
    """Test edge cases and error conditions"""
    
    def test_success_in_open_state_logs_warning(self):
        """Test that success in OPEN state is handled gracefully"""
        cb = CircuitBreaker("test-provider", failure_threshold=2)
        
        # Open the circuit
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.OPEN
        
        # This shouldn't happen, but should be handled
        cb.record_success()
        # State should remain OPEN
        assert cb.state == CircuitState.OPEN
    
    def test_failure_in_open_state_logs_warning(self):
        """Test that failure in OPEN state is handled gracefully"""
        cb = CircuitBreaker("test-provider", failure_threshold=2)
        
        # Open the circuit
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.OPEN
        
        # This shouldn't happen, but should be handled
        cb.record_failure()
        # State should remain OPEN
        assert cb.state == CircuitState.OPEN
    
    def test_rapid_state_transitions(self):
        """Test rapid state transitions"""
        cb = CircuitBreaker("test-provider", failure_threshold=2, timeout_duration=1)
        
        # CLOSED -> OPEN
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.OPEN
        
        # OPEN -> HALF_OPEN
        time.sleep(1.1)
        cb.can_request()
        assert cb.state == CircuitState.HALF_OPEN
        
        # HALF_OPEN -> CLOSED
        cb.record_success()
        assert cb.state == CircuitState.CLOSED
        
        # CLOSED -> OPEN again
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.OPEN


class TestCircuitBreakerRepr:
    """Test string representation"""
    
    def test_repr_in_closed_state(self):
        """Test __repr__ in CLOSED state"""
        cb = CircuitBreaker("test-provider", failure_threshold=5)
        repr_str = repr(cb)
        
        assert "test-provider" in repr_str
        assert "closed" in repr_str
        assert "0/5" in repr_str
    
    def test_repr_in_open_state(self):
        """Test __repr__ in OPEN state"""
        cb = CircuitBreaker("test-provider", failure_threshold=3)
        
        cb.record_failure()
        cb.record_failure()
        cb.record_failure()
        
        repr_str = repr(cb)
        assert "test-provider" in repr_str
        assert "open" in repr_str
        assert "3/3" in repr_str


# Integration test
class TestCircuitBreakerIntegration:
    """Integration tests for complete workflows"""
    
    def test_complete_failure_recovery_cycle(self):
        """Test complete cycle: CLOSED -> OPEN -> HALF_OPEN -> CLOSED"""
        cb = CircuitBreaker("test-provider", failure_threshold=3, timeout_duration=1)
        
        # Start in CLOSED
        assert cb.state == CircuitState.CLOSED
        assert cb.can_request() is True
        
        # Accumulate failures
        for i in range(3):
            cb.record_failure()
        
        # Should be OPEN
        assert cb.state == CircuitState.OPEN
        assert cb.can_request() is False
        
        # Wait for timeout
        time.sleep(1.1)
        
        # Should transition to HALF_OPEN
        assert cb.can_request() is True
        assert cb.state == CircuitState.HALF_OPEN
        
        # Successful recovery
        cb.record_success()
        
        # Should be CLOSED
        assert cb.state == CircuitState.CLOSED
        assert cb.can_request() is True
        assert cb.failure_count == 0
    
    def test_failed_recovery_attempt(self):
        """Test failed recovery: CLOSED -> OPEN -> HALF_OPEN -> OPEN"""
        cb = CircuitBreaker("test-provider", failure_threshold=2, timeout_duration=1)
        
        # Open the circuit
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.OPEN
        
        # Wait and attempt recovery
        time.sleep(1.1)
        cb.can_request()
        assert cb.state == CircuitState.HALF_OPEN
        
        # Recovery fails
        cb.record_failure()
        assert cb.state == CircuitState.OPEN
        
        # Should block requests again
        assert cb.can_request() is False
