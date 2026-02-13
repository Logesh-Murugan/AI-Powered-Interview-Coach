"""
AI Orchestrator - Intelligent Provider Selection and Routing

The orchestrator is the brain that manages all AI providers with:
- Intelligent provider selection based on health, quota, and performance
- Automatic fallback chain (Groq → HuggingFace)
- Circuit breaker integration for fault tolerance
- Multiple API key rotation (3 Groq + 2 HuggingFace)
- Response caching integration
- Health monitoring and metrics

Architecture:
- 2 providers: Groq (priority 1) → HuggingFace (priority 2)
- 5 API keys: 3 Groq + 2 HuggingFace = 43,700 requests/day
- Fallback chain: Try all Groq keys → Try all HuggingFace keys
"""

from typing import List, Optional, Dict, Any
from loguru import logger

from .base_provider import AIProvider
from .groq_provider import GroqProvider
from .huggingface_provider import HuggingFaceProvider
from .circuit_breaker import CircuitBreaker
from .types import ProviderResponse, ProviderConfig
from app.services.cache_service import CacheService


class AIOrchestrator:
    """
    Central orchestrator for AI provider management.
    
    Responsibilities:
    - Provider registration and management
    - Intelligent provider selection
    - Fallback chain execution
    - Circuit breaker integration
    - Cache integration
    - Health monitoring
    """
    
    def __init__(self, cache_service: Optional[CacheService] = None):
        """
        Initialize AI Orchestrator.
        
        Args:
            cache_service: Optional cache service for response caching
        """
        self.providers: List[AIProvider] = []
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        self.cache_service = cache_service or CacheService()
        
        # Metrics
        self.total_requests = 0
        self.cache_hits = 0
        self.cache_misses = 0
        self.provider_calls: Dict[str, int] = {}
        self.provider_failures: Dict[str, int] = {}
        
        # Auto-register providers
        self._register_default_providers()
        
        logger.info("AI Orchestrator initialized")
    
    def _register_default_providers(self):
        """Register default AI providers (Groq and HuggingFace)"""
        from .types import ProviderConfig, ProviderType
        from app.config import settings
        
        # Register Groq providers (3 API keys)
        groq_keys = [
            settings.GROQ_API_KEY,
            settings.GROQ_API_KEY_2,
            settings.GROQ_API_KEY_3,
        ]
        
        for idx, api_key in enumerate(groq_keys, 1):
            if api_key and api_key.strip():  # Check for non-empty string
                try:
                    provider = GroqProvider(api_key=api_key)
                    self.register_provider(provider)
                    logger.info(f"Registered Groq provider #{idx}")
                except Exception as e:
                    logger.error(f"Failed to register Groq provider #{idx}: {e}")
            else:
                logger.warning(f"Groq API key #{idx} not configured")
        
        # Register HuggingFace providers (2 API keys)
        hf_keys = [
            settings.HUGGINGFACE_API_KEY,
            settings.HUGGINGFACE_API_KEY_2,
        ]
        
        for idx, api_key in enumerate(hf_keys, 1):
            if api_key and api_key.strip():  # Check for non-empty string
                try:
                    config = ProviderConfig(
                        name=f"huggingface_{idx}",
                        provider_type=ProviderType.HUGGINGFACE,
                        api_key=api_key,
                        api_url="https://api-inference.huggingface.co",
                        model="mistralai/Mistral-7B-Instruct-v0.2",
                        priority=2,  # Lower priority than Groq
                        quota_limit=30000,  # 30K characters/month per key
                        timeout=30,
                        max_retries=2
                    )
                    provider = HuggingFaceProvider(config=config)
                    self.register_provider(provider)
                    logger.info(f"Registered HuggingFace provider #{idx}")
                except Exception as e:
                    logger.error(f"Failed to register HuggingFace provider #{idx}: {e}")
            else:
                logger.warning(f"HuggingFace API key #{idx} not configured")
    
    def register_provider(
        self,
        provider: AIProvider,
        circuit_breaker_config: Optional[Dict[str, Any]] = None
    ):
        """
        Register an AI provider with the orchestrator.
        
        Args:
            provider: AI provider instance
            circuit_breaker_config: Optional circuit breaker configuration
        """
        # Add provider to list
        self.providers.append(provider)
        
        # Sort providers by priority (lower number = higher priority)
        self.providers.sort(key=lambda p: p.config.priority)
        
        # Create circuit breaker for provider
        cb_config = circuit_breaker_config or {}
        circuit_breaker = CircuitBreaker(
            name=provider.config.name,
            failure_threshold=cb_config.get('failure_threshold', 5),
            timeout_duration=cb_config.get('timeout_duration', 60),
            success_threshold=cb_config.get('success_threshold', 1)
        )
        self.circuit_breakers[provider.config.name] = circuit_breaker
        
        # Initialize metrics
        self.provider_calls[provider.config.name] = 0
        self.provider_failures[provider.config.name] = 0
        
        logger.info(
            f"Registered provider: {provider.config.name} "
            f"(priority: {provider.config.priority}, "
            f"model: {provider.config.model})"
        )
    
    async def call(
        self,
        prompt: str,
        cache_key: Optional[str] = None,
        use_cache: bool = True,
        **kwargs
    ) -> ProviderResponse:
        """
        Make an AI call with intelligent provider selection and fallback.
        
        Args:
            prompt: The prompt to send to the AI
            cache_key: Optional cache key for response caching
            use_cache: Whether to use cache (default: True)
            **kwargs: Additional parameters for the provider
            
        Returns:
            ProviderResponse from the selected provider
        """
        self.total_requests += 1
        
        # Step 1: Check cache if enabled
        if use_cache and cache_key:
            cached_response = self._check_cache(cache_key)
            if cached_response:
                self.cache_hits += 1
                logger.info(f"Cache hit for key: {cache_key}")
                return cached_response
            self.cache_misses += 1
        
        # Step 2: Select best available provider
        provider = self._select_provider()
        
        if not provider:
            error_msg = "No healthy providers available"
            logger.error(error_msg)
            return ProviderResponse(
                provider_name="none",
                content="",
                model="",
                success=False,
                error=error_msg
            )
        
        # Step 3: Try selected provider with fallback
        response = await self._call_with_fallback(
            prompt=prompt,
            exclude_providers=[],
            **kwargs
        )
        
        # Step 4: Cache successful response
        if response.success and use_cache and cache_key:
            self._cache_response(cache_key, response)
        
        return response
    
    async def _call_with_fallback(
        self,
        prompt: str,
        exclude_providers: List[str],
        **kwargs
    ) -> ProviderResponse:
        """
        Call provider with automatic fallback to next provider on failure.
        
        Args:
            prompt: The prompt to send to the AI
            exclude_providers: List of provider names to exclude
            **kwargs: Additional parameters for the provider
            
        Returns:
            ProviderResponse from the first successful provider
        """
        # Get available providers (not excluded, healthy, circuit not open)
        available_providers = [
            p for p in self.providers
            if p.config.name not in exclude_providers
            and p.config.enabled
            and self._can_use_provider(p)
        ]
        
        if not available_providers:
            error_msg = "No available providers for fallback"
            logger.error(error_msg)
            return ProviderResponse(
                provider_name="none",
                content="",
                model="",
                success=False,
                error=error_msg
            )
        
        # Try each provider in order
        for provider in available_providers:
            circuit_breaker = self.circuit_breakers[provider.config.name]
            
            # Check circuit breaker
            if not circuit_breaker.can_request():
                logger.warning(
                    f"Circuit breaker is {circuit_breaker.state.value} "
                    f"for {provider.config.name}, skipping"
                )
                continue
            
            try:
                logger.info(f"Calling provider: {provider.config.name}")
                self.provider_calls[provider.config.name] += 1
                
                # Make the API call
                response = await provider.call_with_tracking(prompt, **kwargs)
                
                if response.success:
                    # Record success in circuit breaker
                    circuit_breaker.record_success()
                    logger.info(
                        f"Provider {provider.config.name} succeeded "
                        f"(response_time: {response.response_time:.2f}s)"
                    )
                    return response
                else:
                    # Record failure in circuit breaker
                    circuit_breaker.record_failure()
                    self.provider_failures[provider.config.name] += 1
                    logger.warning(
                        f"Provider {provider.config.name} returned error: {response.error}"
                    )
                    # Continue to next provider
                    
            except Exception as e:
                # Record failure in circuit breaker
                circuit_breaker.record_failure()
                self.provider_failures[provider.config.name] += 1
                logger.error(
                    f"Provider {provider.config.name} failed with exception: {str(e)}"
                )
                # Continue to next provider
        
        # All providers failed
        error_msg = "All providers failed"
        logger.error(error_msg)
        return ProviderResponse(
            provider_name="none",
            content="",
            model="",
            success=False,
            error=error_msg
        )
    
    def _select_provider(self) -> Optional[AIProvider]:
        """
        Select the best available provider based on scoring algorithm.
        
        Scoring formula:
        score = (health_score * 0.4) + (quota_remaining * 0.3) + (response_time_score * 0.3)
        
        Returns:
            Best available provider or None if no providers available
        """
        best_provider = None
        best_score = -1
        
        for provider in self.providers:
            # Skip disabled providers
            if not provider.config.enabled:
                continue
            
            # Skip if circuit breaker is open
            circuit_breaker = self.circuit_breakers[provider.config.name]
            if not circuit_breaker.can_request():
                continue
            
            # Calculate score
            score = self._calculate_provider_score(provider)
            
            logger.debug(
                f"Provider {provider.config.name} score: {score:.3f} "
                f"(health: {provider.get_health_score():.2f}, "
                f"quota: {provider.health.quota_remaining:.2f})"
            )
            
            if score > best_score:
                best_score = score
                best_provider = provider
        
        if best_provider:
            logger.info(
                f"Selected provider: {best_provider.config.name} "
                f"(score: {best_score:.3f})"
            )
        
        return best_provider
    
    def _calculate_provider_score(self, provider: AIProvider) -> float:
        """
        Calculate provider score based on health, quota, and performance.
        
        Args:
            provider: AI provider to score
            
        Returns:
            Score between 0.0 and 1.0
        """
        # Health score (0-1)
        health_score = provider.get_health_score()
        
        # Quota remaining (0-1)
        quota_remaining = provider.health.quota_remaining
        
        # Response time score (0-1, lower is better)
        # Normalize response time: 0s = 1.0, 10s = 0.0
        avg_response_time = provider.health.average_response_time
        response_time_score = max(0.0, 1.0 - (avg_response_time / 10.0))
        
        # Weighted score
        score = (
            (health_score * 0.4) +
            (quota_remaining * 0.3) +
            (response_time_score * 0.3)
        )
        
        return score
    
    def _can_use_provider(self, provider: AIProvider) -> bool:
        """
        Check if provider can be used (healthy and circuit not open).
        
        Args:
            provider: AI provider to check
            
        Returns:
            True if provider can be used, False otherwise
        """
        # Check if provider is enabled
        if not provider.config.enabled:
            return False
        
        # Check circuit breaker
        circuit_breaker = self.circuit_breakers[provider.config.name]
        if not circuit_breaker.can_request():
            return False
        
        # Check if provider is healthy
        if not provider.is_healthy():
            return False
        
        return True
    
    def _check_cache(self, cache_key: str) -> Optional[ProviderResponse]:
        """
        Check cache for existing response.
        
        Args:
            cache_key: Cache key to check
            
        Returns:
            Cached ProviderResponse or None if not found
        """
        try:
            cached_data = self.cache_service.get(cache_key)
            if cached_data:
                # Reconstruct ProviderResponse from cached data
                return ProviderResponse(**cached_data)
            return None
        except Exception as e:
            logger.warning(f"Cache check failed: {str(e)}")
            return None
    
    def _cache_response(self, cache_key: str, response: ProviderResponse):
        """
        Cache provider response.
        
        Args:
            cache_key: Cache key
            response: Provider response to cache
        """
        try:
            # Convert response to dict for caching
            cache_data = {
                'provider_name': response.provider_name,
                'content': response.content,
                'model': response.model,
                'success': response.success,
                'error': response.error,
                'tokens_used': response.tokens_used,
                'response_time': response.response_time,
                'metadata': response.metadata
            }
            
            # Cache with 30-day TTL (2592000 seconds)
            from datetime import timedelta
            self.cache_service.set(cache_key, cache_data, ttl=timedelta(days=30))
            logger.debug(f"Cached response for key: {cache_key}")
        except Exception as e:
            logger.warning(f"Cache set failed: {str(e)}")
    
    def get_provider_status(self, provider_name: str) -> Optional[Dict[str, Any]]:
        """
        Get status of a specific provider.
        
        Args:
            provider_name: Name of the provider
            
        Returns:
            Provider status dictionary or None if not found
        """
        provider = next((p for p in self.providers if p.config.name == provider_name), None)
        if not provider:
            return None
        
        circuit_breaker = self.circuit_breakers[provider_name]
        
        return {
            'provider': provider.get_health_status(),
            'circuit_breaker': circuit_breaker.get_status(),
            'calls': self.provider_calls.get(provider_name, 0),
            'failures': self.provider_failures.get(provider_name, 0)
        }
    
    def get_all_providers_status(self) -> List[Dict[str, Any]]:
        """
        Get status of all registered providers.
        
        Returns:
            List of provider status dictionaries
        """
        return [
            self.get_provider_status(p.config.name)
            for p in self.providers
        ]
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get orchestrator metrics.
        
        Returns:
            Dictionary with orchestrator metrics
        """
        cache_hit_rate = (
            (self.cache_hits / self.total_requests * 100)
            if self.total_requests > 0
            else 0.0
        )
        
        return {
            'total_requests': self.total_requests,
            'cache_hits': self.cache_hits,
            'cache_misses': self.cache_misses,
            'cache_hit_rate': round(cache_hit_rate, 2),
            'provider_calls': self.provider_calls,
            'provider_failures': self.provider_failures,
            'registered_providers': len(self.providers)
        }
    
    def reset_metrics(self):
        """Reset all metrics to zero."""
        self.total_requests = 0
        self.cache_hits = 0
        self.cache_misses = 0
        self.provider_calls = {name: 0 for name in self.provider_calls}
        self.provider_failures = {name: 0 for name in self.provider_failures}
        logger.info("Orchestrator metrics reset")
    
    def __repr__(self) -> str:
        """String representation of orchestrator."""
        return (
            f"AIOrchestrator("
            f"providers={len(self.providers)}, "
            f"total_requests={self.total_requests}, "
            f"cache_hit_rate={self.cache_hits / max(1, self.total_requests) * 100:.1f}%)"
        )

    def generate(self, request: 'AIRequest') -> 'AIResponse':
        """
        Synchronous wrapper for generate method (for backward compatibility).
        
        Args:
            request: AIRequest object with prompt and parameters
            
        Returns:
            AIResponse object
        """
        import asyncio
        import nest_asyncio
        from .types import AIRequest, AIResponse
        
        # Allow nested event loops
        nest_asyncio.apply()
        
        # Create cache key from prompt hash
        import hashlib
        cache_key = f"ai_gen:{hashlib.md5(request.prompt.encode()).hexdigest()}"
        
        # Run async call in sync context
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        response = loop.run_until_complete(
            self.call(
                prompt=request.prompt,
                cache_key=cache_key,
                use_cache=True,
                max_tokens=request.max_tokens,
                temperature=request.temperature
            )
        )
        
        # Convert ProviderResponse to AIResponse
        return AIResponse(
            provider_name=response.provider_name,
            content=response.content,
            model=response.model,
            success=response.success,
            error=response.error,
            tokens_used=response.tokens_used,
            response_time=response.response_time,
            timestamp=response.timestamp,
            metadata=response.metadata
        )
