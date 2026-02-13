"""
Circuit Breaker Pattern Implementation for AI Providers

The circuit breaker prevents cascading failures by stopping requests to a failing provider
and allowing it time to recover.

States:
- CLOSED: Normal operation, requests pass through
- OPEN: Provider is failing, requests are blocked
- HALF_OPEN: Testing if provider has recovered

Transitions:
- CLOSED -> OPEN: After failure_threshold failures
- OPEN -> HALF_OPEN: After timeout_duration seconds
- HALF_OPEN -> CLOSED: On successful test request
- HALF_OPEN -> OPEN: On failed test request
"""

from enum import Enum
from datetime import datetime, timedelta
from typing import Optional
from loguru import logger


class CircuitState(str, Enum):
    """Circuit breaker states"""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Blocking requests
    HALF_OPEN = "half_open"  # Testing recovery


class CircuitBreaker:
    """
    Circuit breaker for fault tolerance.
    
    Prevents cascading failures by:
    1. Tracking failures
    2. Opening circuit after threshold
    3. Allowing recovery attempts
    4. Closing circuit on success
    
    Configuration:
    - failure_threshold: Number of failures before opening (default: 5)
    - timeout_duration: Seconds to wait before attempting recovery (default: 60)
    - success_threshold: Successful requests needed to close from half-open (default: 1)
    """
    
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        timeout_duration: int = 60,
        success_threshold: int = 1
    ):
        """
        Initialize circuit breaker.
        
        Args:
            name: Name of the circuit (e.g., provider name)
            failure_threshold: Number of failures before opening circuit
            timeout_duration: Seconds to wait before attempting recovery
            success_threshold: Successful requests needed to close circuit
        """
        self.name = name
        self.failure_threshold = failure_threshold
        self.timeout_duration = timeout_duration
        self.success_threshold = success_threshold
        
        # State tracking
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time: Optional[datetime] = None
        self._opened_at: Optional[datetime] = None
        
        logger.info(
            f"Circuit breaker '{name}' initialized: "
            f"failure_threshold={failure_threshold}, "
            f"timeout={timeout_duration}s, "
            f"success_threshold={success_threshold}"
        )
    
    @property
    def state(self) -> CircuitState:
        """Get current circuit state."""
        return self._state
    
    @property
    def failure_count(self) -> int:
        """Get current failure count."""
        return self._failure_count
    
    @property
    def success_count(self) -> int:
        """Get current success count (in half-open state)."""
        return self._success_count
    
    @property
    def last_failure_time(self) -> Optional[datetime]:
        """Get timestamp of last failure."""
        return self._last_failure_time
    
    @property
    def opened_at(self) -> Optional[datetime]:
        """Get timestamp when circuit was opened."""
        return self._opened_at
    
    def can_request(self) -> bool:
        """
        Check if requests are allowed through the circuit.
        
        Returns:
            True if request can proceed, False if blocked
        """
        if self._state == CircuitState.CLOSED:
            return True
        
        if self._state == CircuitState.OPEN:
            # Check if we should attempt reset
            if self._should_attempt_reset():
                self._transition_to_half_open()
                return True
            return False
        
        # HALF_OPEN state: allow one test request
        return True
    
    def record_success(self):
        """
        Record a successful request.
        
        Behavior by state:
        - CLOSED: Reset failure count
        - HALF_OPEN: Increment success count, close if threshold met
        - OPEN: Should not happen (log warning)
        """
        if self._state == CircuitState.CLOSED:
            # Reset failure count on success
            if self._failure_count > 0:
                logger.debug(
                    f"Circuit breaker '{self.name}': "
                    f"Success in CLOSED state, resetting failure count from {self._failure_count}"
                )
                self._failure_count = 0
                self._last_failure_time = None
        
        elif self._state == CircuitState.HALF_OPEN:
            self._success_count += 1
            logger.info(
                f"Circuit breaker '{self.name}': "
                f"Success in HALF_OPEN state ({self._success_count}/{self.success_threshold})"
            )
            
            if self._success_count >= self.success_threshold:
                self._transition_to_closed()
        
        elif self._state == CircuitState.OPEN:
            logger.warning(
                f"Circuit breaker '{self.name}': "
                f"Unexpected success in OPEN state"
            )
    
    def record_failure(self):
        """
        Record a failed request.
        
        Behavior by state:
        - CLOSED: Increment failure count, open if threshold met
        - HALF_OPEN: Transition back to OPEN
        - OPEN: Should not happen (log warning)
        """
        self._last_failure_time = datetime.utcnow()
        
        if self._state == CircuitState.CLOSED:
            self._failure_count += 1
            logger.warning(
                f"Circuit breaker '{self.name}': "
                f"Failure in CLOSED state ({self._failure_count}/{self.failure_threshold})"
            )
            
            if self._failure_count >= self.failure_threshold:
                self._transition_to_open()
        
        elif self._state == CircuitState.HALF_OPEN:
            logger.warning(
                f"Circuit breaker '{self.name}': "
                f"Failure in HALF_OPEN state, reopening circuit"
            )
            self._transition_to_open()
        
        elif self._state == CircuitState.OPEN:
            logger.warning(
                f"Circuit breaker '{self.name}': "
                f"Unexpected failure in OPEN state"
            )
    
    def reset(self):
        """
        Manually reset the circuit breaker to CLOSED state.
        
        Useful for:
        - Administrative reset
        - Testing
        - Manual recovery
        """
        logger.info(f"Circuit breaker '{self.name}': Manual reset to CLOSED")
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time = None
        self._opened_at = None
    
    def _should_attempt_reset(self) -> bool:
        """
        Check if enough time has passed to attempt recovery.
        
        Returns:
            True if timeout has elapsed since circuit opened
        """
        if self._opened_at is None:
            return False
        
        elapsed = (datetime.utcnow() - self._opened_at).total_seconds()
        return elapsed >= self.timeout_duration
    
    def _transition_to_open(self):
        """Transition circuit to OPEN state."""
        self._state = CircuitState.OPEN
        self._opened_at = datetime.utcnow()
        self._success_count = 0
        
        logger.error(
            f"Circuit breaker '{self.name}': "
            f"CLOSED -> OPEN (failures: {self._failure_count})"
        )
    
    def _transition_to_half_open(self):
        """Transition circuit to HALF_OPEN state."""
        self._state = CircuitState.HALF_OPEN
        self._success_count = 0
        
        logger.info(
            f"Circuit breaker '{self.name}': "
            f"OPEN -> HALF_OPEN (attempting recovery)"
        )
    
    def _transition_to_closed(self):
        """Transition circuit to CLOSED state."""
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time = None
        self._opened_at = None
        
        logger.info(
            f"Circuit breaker '{self.name}': "
            f"HALF_OPEN -> CLOSED (recovery successful)"
        )
    
    def get_status(self) -> dict:
        """
        Get current circuit breaker status.
        
        Returns:
            Dictionary with current state and metrics
        """
        status = {
            'name': self.name,
            'state': self._state.value,
            'failure_count': self._failure_count,
            'success_count': self._success_count,
            'failure_threshold': self.failure_threshold,
            'timeout_duration': self.timeout_duration,
            'success_threshold': self.success_threshold,
        }
        
        if self._last_failure_time:
            status['last_failure_time'] = self._last_failure_time.isoformat()
        
        if self._opened_at:
            status['opened_at'] = self._opened_at.isoformat()
            elapsed = (datetime.utcnow() - self._opened_at).total_seconds()
            status['time_since_opened'] = elapsed
            status['time_until_retry'] = max(0, self.timeout_duration - elapsed)
        
        return status
    
    def __repr__(self) -> str:
        """String representation of circuit breaker."""
        return (
            f"CircuitBreaker(name='{self.name}', "
            f"state={self._state.value}, "
            f"failures={self._failure_count}/{self.failure_threshold})"
        )
