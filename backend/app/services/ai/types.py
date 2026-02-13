"""
Type definitions for AI providers
"""
from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class ProviderType(str, Enum):
    """AI provider types"""
    GROQ = "groq"
    HUGGINGFACE = "huggingface"


@dataclass
class ProviderConfig:
    """
    Configuration for an AI provider.
    
    Attributes:
        name: Provider name (e.g., "groq", "gemini")
        provider_type: Type of provider
        api_key: API key for authentication (optional for local providers)
        api_url: Base URL for API calls
        model: Model name to use
        priority: Provider priority (1 = highest, 4 = lowest)
        quota_limit: Maximum requests per day (0 = unlimited)
        timeout: Request timeout in seconds
        max_retries: Maximum number of retries on failure
        enabled: Whether provider is enabled
    """
    name: str
    provider_type: ProviderType
    api_key: Optional[str] = None
    api_url: Optional[str] = None
    model: str = ""
    priority: int = 1
    quota_limit: int = 0  # 0 = unlimited
    timeout: int = 10
    max_retries: int = 3
    enabled: bool = True
    
    def __post_init__(self):
        """Validate configuration"""
        if self.priority < 1 or self.priority > 10:
            raise ValueError("Priority must be between 1 and 10")
        
        if self.timeout < 1:
            raise ValueError("Timeout must be at least 1 second")
        
        if self.quota_limit < 0:
            raise ValueError("Quota limit cannot be negative")


@dataclass
class ProviderResponse:
    """
    Response from an AI provider.
    
    Attributes:
        provider_name: Name of the provider that generated the response
        content: Generated content from the AI
        model: Model used for generation
        success: Whether the request was successful
        error: Error message if request failed
        tokens_used: Number of tokens used (if available)
        response_time: Time taken to generate response in seconds
        timestamp: When the response was generated
        metadata: Additional metadata from the provider
    """
    provider_name: str
    content: str
    model: str
    success: bool = True
    error: Optional[str] = None
    tokens_used: Optional[int] = None
    response_time: float = 0.0
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert response to dictionary"""
        return {
            'provider_name': self.provider_name,
            'content': self.content,
            'model': self.model,
            'success': self.success,
            'error': self.error,
            'tokens_used': self.tokens_used,
            'response_time': self.response_time,
            'timestamp': self.timestamp.isoformat(),
            'metadata': self.metadata
        }


@dataclass
class ProviderHealth:
    """
    Health status of an AI provider.
    
    Attributes:
        provider_name: Name of the provider
        is_healthy: Whether provider is currently healthy
        health_score: Health score (0.0 to 1.0)
        last_success: Timestamp of last successful request
        last_failure: Timestamp of last failed request
        consecutive_failures: Number of consecutive failures
        total_requests: Total number of requests made
        successful_requests: Number of successful requests
        failed_requests: Number of failed requests
        average_response_time: Average response time in seconds
        quota_remaining: Remaining quota (percentage, 0.0 to 1.0)
    """
    provider_name: str
    is_healthy: bool = True
    health_score: float = 1.0
    last_success: Optional[datetime] = None
    last_failure: Optional[datetime] = None
    consecutive_failures: int = 0
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    average_response_time: float = 0.0
    quota_remaining: float = 1.0
    
    def update_success(self, response_time: float):
        """Update health after successful request"""
        self.is_healthy = True
        self.last_success = datetime.utcnow()
        self.consecutive_failures = 0
        self.total_requests += 1
        self.successful_requests += 1
        
        # Update average response time
        if self.average_response_time == 0:
            self.average_response_time = response_time
        else:
            # Exponential moving average
            self.average_response_time = (
                0.7 * self.average_response_time + 0.3 * response_time
            )
        
        # Recalculate health score
        self._calculate_health_score()
    
    def update_failure(self):
        """Update health after failed request"""
        self.last_failure = datetime.utcnow()
        self.consecutive_failures += 1
        self.total_requests += 1
        self.failed_requests += 1
        
        # Mark as unhealthy after 5 consecutive failures
        if self.consecutive_failures >= 5:
            self.is_healthy = False
        
        # Recalculate health score
        self._calculate_health_score()
    
    def _calculate_health_score(self):
        """Calculate health score based on metrics"""
        if self.total_requests == 0:
            self.health_score = 1.0
            return
        
        # Success rate (0.0 to 1.0)
        success_rate = self.successful_requests / self.total_requests
        
        # Consecutive failure penalty
        failure_penalty = min(self.consecutive_failures * 0.1, 0.5)
        
        # Response time score (faster is better)
        # Assume 1 second is ideal, 10 seconds is poor
        if self.average_response_time > 0:
            response_score = max(0, 1.0 - (self.average_response_time / 10.0))
        else:
            response_score = 1.0
        
        # Combined health score
        self.health_score = max(0.0, min(1.0, (
            success_rate * 0.5 +
            response_score * 0.3 +
            self.quota_remaining * 0.2 -
            failure_penalty
        )))
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert health status to dictionary"""
        return {
            'provider_name': self.provider_name,
            'is_healthy': self.is_healthy,
            'health_score': round(self.health_score, 2),
            'last_success': self.last_success.isoformat() if self.last_success else None,
            'last_failure': self.last_failure.isoformat() if self.last_failure else None,
            'consecutive_failures': self.consecutive_failures,
            'total_requests': self.total_requests,
            'successful_requests': self.successful_requests,
            'failed_requests': self.failed_requests,
            'average_response_time': round(self.average_response_time, 3),
            'quota_remaining': round(self.quota_remaining, 2)
        }


@dataclass
class AIRequest:
    """
    Request to AI provider for content generation.
    
    Attributes:
        prompt: The prompt to send to the AI
        max_tokens: Maximum number of tokens to generate
        temperature: Sampling temperature (0.0 to 1.0)
        task_type: Type of task (e.g., "question_generation", "evaluation")
        metadata: Additional metadata for the request
    """
    prompt: str
    max_tokens: int = 1000
    temperature: float = 0.7
    task_type: str = "general"
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Validate request parameters"""
        if self.temperature < 0.0 or self.temperature > 1.0:
            raise ValueError("Temperature must be between 0.0 and 1.0")
        
        if self.max_tokens < 1:
            raise ValueError("max_tokens must be at least 1")


@dataclass
class AIResponse:
    """
    Response from AI provider (alias for ProviderResponse for backward compatibility).
    
    This is essentially the same as ProviderResponse but with a more generic name
    for use in higher-level services.
    """
    provider_name: str
    content: str
    model: str
    success: bool = True
    error: Optional[str] = None
    tokens_used: Optional[int] = None
    response_time: float = 0.0
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert response to dictionary"""
        return {
            'provider_name': self.provider_name,
            'content': self.content,
            'model': self.model,
            'success': self.success,
            'error': self.error,
            'tokens_used': self.tokens_used,
            'response_time': self.response_time,
            'timestamp': self.timestamp.isoformat(),
            'metadata': self.metadata
        }
