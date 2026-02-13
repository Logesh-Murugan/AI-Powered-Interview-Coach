"""
Base abstract class for AI providers
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime
import time
from loguru import logger

from .types import ProviderConfig, ProviderResponse, ProviderHealth


class AIProvider(ABC):
    """
    Abstract base class for AI providers.
    
    All AI providers (Groq, HuggingFace) must extend this class
    and implement the required methods.
    """
    
    def __init__(self, config: ProviderConfig):
        """
        Initialize AI provider with configuration.
        
        Args:
            config: Provider configuration
        """
        self.config = config
        self.health = ProviderHealth(provider_name=config.name)
        logger.info(f"Initialized {config.name} provider with model {config.model}")
    
    @abstractmethod
    async def call(
        self,
        prompt: str,
        **kwargs
    ) -> ProviderResponse:
        """
        Make an API call to the AI provider.
        
        Args:
            prompt: The prompt to send to the AI
            **kwargs: Additional provider-specific parameters
            
        Returns:
            ProviderResponse with the AI's response
            
        Raises:
            Exception: If the API call fails
        """
        pass
    
    async def call_with_tracking(
        self,
        prompt: str,
        **kwargs
    ) -> ProviderResponse:
        """
        Make an API call with automatic health tracking.
        
        This method wraps the call() method and automatically updates
        health metrics based on success/failure.
        
        Args:
            prompt: The prompt to send to the AI
            **kwargs: Additional provider-specific parameters
            
        Returns:
            ProviderResponse with the AI's response
        """
        start_time = time.time()
        
        try:
            # Make the actual API call
            response = await self.call(prompt, **kwargs)
            
            # Calculate response time
            response_time = time.time() - start_time
            response.response_time = response_time
            
            # Update health on success
            if response.success:
                self.health.update_success(response_time)
                logger.info(
                    f"{self.config.name} call successful "
                    f"(response_time: {response_time:.2f}s)"
                )
            else:
                self.health.update_failure()
                logger.warning(
                    f"{self.config.name} call failed: {response.error}"
                )
            
            return response
            
        except Exception as e:
            # Update health on failure
            self.health.update_failure()
            response_time = time.time() - start_time
            
            logger.error(
                f"{self.config.name} call failed after {response_time:.2f}s: {str(e)}"
            )
            
            # Return error response
            return ProviderResponse(
                provider_name=self.config.name,
                content="",
                model=self.config.model,
                success=False,
                error=str(e),
                response_time=response_time
            )
    
    def get_health_score(self) -> float:
        """
        Get the current health score of the provider.
        
        Health score is calculated based on:
        - Success rate (50%)
        - Average response time (30%)
        - Quota remaining (20%)
        - Consecutive failures (penalty)
        
        Returns:
            Health score between 0.0 (unhealthy) and 1.0 (healthy)
        """
        return self.health.health_score
    
    def check_quota(self) -> bool:
        """
        Check if the provider has remaining quota.
        
        Returns:
            True if quota is available, False otherwise
        """
        if self.config.quota_limit == 0:
            # Unlimited quota
            return True
        
        # Check if quota remaining is above 0
        return self.health.quota_remaining > 0
    
    def is_healthy(self) -> bool:
        """
        Check if the provider is currently healthy.
        
        A provider is considered unhealthy if:
        - It has 5 or more consecutive failures
        - Health score is below 0.3
        - Quota is exhausted
        
        Returns:
            True if provider is healthy, False otherwise
        """
        if not self.config.enabled:
            return False
        
        if not self.check_quota():
            return False
        
        if self.health.consecutive_failures >= 5:
            return False
        
        if self.health.health_score < 0.3:
            return False
        
        return self.health.is_healthy
    
    def get_health_status(self) -> Dict[str, Any]:
        """
        Get detailed health status of the provider.
        
        Returns:
            Dictionary with health metrics
        """
        return {
            'provider_name': self.config.name,
            'provider_type': self.config.provider_type.value,
            'model': self.config.model,
            'priority': self.config.priority,
            'enabled': self.config.enabled,
            'is_healthy': self.is_healthy(),
            'health_score': round(self.health.health_score, 2),
            'quota_remaining': round(self.health.quota_remaining, 2),
            'total_requests': self.health.total_requests,
            'successful_requests': self.health.successful_requests,
            'failed_requests': self.health.failed_requests,
            'consecutive_failures': self.health.consecutive_failures,
            'average_response_time': round(self.health.average_response_time, 3),
            'last_success': self.health.last_success.isoformat() if self.health.last_success else None,
            'last_failure': self.health.last_failure.isoformat() if self.health.last_failure else None
        }
    
    def reset_health(self):
        """Reset health metrics to initial state"""
        self.health = ProviderHealth(provider_name=self.config.name)
        logger.info(f"Reset health metrics for {self.config.name}")
    
    def update_quota_remaining(self, percentage: float):
        """
        Update the remaining quota percentage.
        
        Args:
            percentage: Remaining quota as percentage (0.0 to 1.0)
        """
        self.health.quota_remaining = max(0.0, min(1.0, percentage))
        self.health._calculate_health_score()
    
    def __repr__(self) -> str:
        """String representation of the provider"""
        return (
            f"{self.__class__.__name__}("
            f"name={self.config.name}, "
            f"model={self.config.model}, "
            f"priority={self.config.priority}, "
            f"health_score={self.health.health_score:.2f})"
        )
