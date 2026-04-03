"""
AI Orchestrator - Intelligent Provider Selection and Routing (HuggingFace-only)
"""

from typing import List, Optional, Dict, Any
from loguru import logger

from .base_provider import AIProvider
from .circuit_breaker import CircuitBreaker
from .types import ProviderResponse, ProviderConfig
from app.services.cache_service import CacheService


class AIOrchestrator:
    """Central orchestrator for AI provider management."""

    def __init__(self, cache_service: Optional[CacheService] = None):
        self.providers: List[AIProvider] = []
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        self.cache_service = cache_service or CacheService()

        self.total_requests = 0
        self.cache_hits = 0
        self.cache_misses = 0
        self.provider_calls: Dict[str, int] = {}
        self.provider_failures: Dict[str, int] = {}

        self._register_default_providers()
        logger.info("AI Orchestrator initialized")

    def _register_default_providers(self):
        """Register HuggingFace providers (three tokens supported)."""
        from app.config import settings

        logger.info("=" * 70)
        logger.info("?? INITIALIZING AI PROVIDER SYSTEM (HuggingFace only)")
        logger.info("=" * 70)

        def _key_valid(key: Optional[str]) -> bool:
            return bool(key and str(key).strip())

        hf_configs = [
            {
                "key": getattr(settings, "HUGGINGFACE_API_KEY", None),
                "model": "meta-llama/Meta-Llama-3-8B-Instruct",
                "name": "hf_primary",
            },
            {
                "key": getattr(settings, "HUGGINGFACE_API_KEY_2", None),
                "model": "meta-llama/Meta-Llama-3-8B-Instruct",
                "name": "hf_secondary",
            },
            {
                "key": getattr(settings, "HUGGINGFACE_API_KEY_3", None),
                "model": "meta-llama/Meta-Llama-3-8B-Instruct",
                "name": "hf_tertiary",
            },
        ]

        hf_count = 0
        for idx, config in enumerate(hf_configs, 1):
            api_key = config["key"]
            if _key_valid(api_key):
                try:
                    from .providers.huggingface_provider import HuggingFaceProvider

                    provider = HuggingFaceProvider(
                        api_key=api_key,
                        model=config["model"],
                        priority=1,
                        name=config["name"],
                    )
                    self.register_provider(provider)
                    hf_count += 1
                    logger.info(f"  ? #{idx}: {config['model']}")
                except Exception as e:
                    logger.error(f"  ? #{idx} Failed: {str(e)[:120]}")
            else:
                logger.warning(f"  ??  #{idx}: HuggingFace key not configured")

        total_providers = hf_count
        logger.info("\n" + "=" * 70)
        logger.info("?? PROVIDER REGISTRATION SUMMARY")
        logger.info("=" * 70)
        logger.info(f"  HuggingFace:  {hf_count}/3 providers")
        logger.info("  " + "-" * 50)
        logger.info(f"  TOTAL:        {total_providers}/3 providers registered")
        logger.info("=" * 70)

        if total_providers == 0:
            logger.error("\n? CRITICAL: NO PROVIDERS REGISTERED! Add HF tokens in backend/.env.")
        elif total_providers < 2:
            logger.warning(f"\n??  WARNING: Only {total_providers} provider active; add more HF tokens for redundancy.")
        else:
            logger.info("\n?? High availability: HuggingFace providers ready.")

        logger.info("")

    def register_provider(self, provider: AIProvider, circuit_breaker_config: Optional[Dict[str, Any]] = None):
        self.providers.append(provider)
        self.providers.sort(key=lambda p: p.config.priority)

        cb_config = circuit_breaker_config or {}
        circuit_breaker = CircuitBreaker(
            name=provider.config.name,
            failure_threshold=cb_config.get("failure_threshold", 5),
            timeout_duration=cb_config.get("timeout_duration", 60),
            success_threshold=cb_config.get("success_threshold", 1),
        )
        self.circuit_breakers[provider.config.name] = circuit_breaker

        self.provider_calls[provider.config.name] = 0
        self.provider_failures[provider.config.name] = 0

        logger.info(
            f"Registered provider: {provider.config.name} "
            f"(priority: {provider.config.priority}, model: {provider.config.model})"
        )

    async def call(self, prompt: str, cache_key: Optional[str] = None, use_cache: bool = True, **kwargs) -> ProviderResponse:
        self.total_requests += 1

        if use_cache and cache_key:
            cached_response = self._check_cache(cache_key)
            if cached_response:
                self.cache_hits += 1
                logger.info(f"Cache hit for key: {cache_key}")
                return cached_response
            self.cache_misses += 1

        provider = self._select_provider()
        if not provider:
            error_msg = "No healthy providers available"
            logger.error(error_msg)
            return ProviderResponse(provider_name="none", content="", model="", success=False, error=error_msg)

        response = await self._call_with_fallback(prompt=prompt, exclude_providers=[], **kwargs)

        if response.success and use_cache and cache_key:
            self._cache_response(cache_key, response)

        return response

    async def _call_with_fallback(self, prompt: str, exclude_providers: List[str], **kwargs) -> ProviderResponse:
        available_providers = [
            p
            for p in self.providers
            if p.config.name not in exclude_providers and p.config.enabled and self._can_use_provider(p)
        ]

        if not available_providers:
            error_msg = "No available providers for fallback"
            logger.error(error_msg)
            return ProviderResponse(provider_name="none", content="", model="", success=False, error=error_msg)

        for provider in available_providers:
            circuit_breaker = self.circuit_breakers[provider.config.name]
            if not circuit_breaker.can_request():
                logger.warning(
                    f"Circuit breaker is {circuit_breaker.state.value} for {provider.config.name}, skipping"
                )
                continue

            try:
                logger.info(f"Calling provider: {provider.config.name}")
                self.provider_calls[provider.config.name] += 1
                response = await provider.call_with_tracking(prompt, **kwargs)

                if response.success:
                    circuit_breaker.record_success()
                    logger.info(
                        f"Provider {provider.config.name} succeeded (response_time: {response.response_time:.2f}s)"
                    )
                    return response

                circuit_breaker.record_failure()
                self.provider_failures[provider.config.name] += 1
                logger.warning(f"Provider {provider.config.name} returned error: {response.error}")

            except Exception as e:
                circuit_breaker.record_failure()
                self.provider_failures[provider.config.name] += 1
                logger.error(f"Provider {provider.config.name} failed with exception: {str(e)}")

        error_msg = "All providers failed"
        logger.error(error_msg)
        return ProviderResponse(provider_name="none", content="", model="", success=False, error=error_msg)

    def _select_provider(self) -> Optional[AIProvider]:
        best_provider = None
        best_score = -1

        for provider in self.providers:
            if not provider.config.enabled:
                continue
            circuit_breaker = self.circuit_breakers[provider.config.name]
            if not circuit_breaker.can_request():
                continue
            score = self._calculate_provider_score(provider)
            if score > best_score:
                best_score = score
                best_provider = provider

        if best_provider:
            logger.info(f"Selected provider: {best_provider.config.name} (score: {best_score:.3f})")
        return best_provider

    def _calculate_provider_score(self, provider: AIProvider) -> float:
        health_score = provider.get_health_score()
        quota_remaining = provider.health.quota_remaining
        avg_response_time = provider.health.average_response_time
        response_time_score = max(0.0, 1.0 - (avg_response_time / 10.0))
        return (health_score * 0.4) + (quota_remaining * 0.3) + (response_time_score * 0.3)

    def _can_use_provider(self, provider: AIProvider) -> bool:
        if not provider.config.enabled:
            return False
        circuit_breaker = self.circuit_breakers[provider.config.name]
        if not circuit_breaker.can_request():
            return False
        if not provider.is_healthy():
            return False
        return True

    def _check_cache(self, cache_key: str) -> Optional[ProviderResponse]:
        try:
            cached_data = self.cache_service.get(cache_key)
            if cached_data:
                return ProviderResponse(**cached_data)
            return None
        except Exception as e:
            logger.warning(f"Cache check failed: {str(e)}")
            return None

    def _cache_response(self, cache_key: str, response: ProviderResponse):
        try:
            cache_data = {
                "provider_name": response.provider_name,
                "content": response.content,
                "model": response.model,
                "success": response.success,
                "error": response.error,
                "tokens_used": response.tokens_used,
                "response_time": response.response_time,
                "metadata": response.metadata,
            }
            from datetime import timedelta
            self.cache_service.set(cache_key, cache_data, ttl=timedelta(days=30))
            logger.debug(f"Cached response for key: {cache_key}")
        except Exception as e:
            logger.warning(f"Cache set failed: {str(e)}")

    def get_provider_status(self, provider_name: str) -> Optional[Dict[str, Any]]:
        provider = next((p for p in self.providers if p.config.name == provider_name), None)
        if not provider:
            return None
        circuit_breaker = self.circuit_breakers[provider_name]
        return {
            "provider": provider.get_health_status(),
            "circuit_breaker": circuit_breaker.get_status(),
            "calls": self.provider_calls.get(provider_name, 0),
            "failures": self.provider_failures.get(provider_name, 0),
        }

    def get_all_providers_status(self) -> List[Dict[str, Any]]:
        return [self.get_provider_status(p.config.name) for p in self.providers]

    def get_metrics(self) -> Dict[str, Any]:
        cache_hit_rate = (self.cache_hits / self.total_requests * 100) if self.total_requests > 0 else 0.0
        return {
            "total_requests": self.total_requests,
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "cache_hit_rate": round(cache_hit_rate, 2),
            "provider_calls": self.provider_calls,
            "provider_failures": self.provider_failures,
            "registered_providers": len(self.providers),
        }

    def reset_metrics(self):
        self.total_requests = 0
        self.cache_hits = 0
        self.cache_misses = 0
        self.provider_calls = {name: 0 for name in self.provider_calls}
        self.provider_failures = {name: 0 for name in self.provider_failures}
        logger.info("Orchestrator metrics reset")

    def __repr__(self) -> str:
        return (
            f"AIOrchestrator("
            f"providers={len(self.providers)}, "
            f"total_requests={self.total_requests}, "
            f"cache_hit_rate={self.cache_hits / max(1, self.total_requests) * 100:.1f}%)"
        )

    def generate(self, request: "AIRequest", max_retries: int = 3) -> "AIResponse":
        """
        Generate AI response with retry limits.
        
        Args:
            request: AI request with prompt and parameters
            max_retries: Maximum number of provider attempts (default: 3)
            
        Returns:
            AIResponse with generated content or error
        """
        import asyncio
        import nest_asyncio
        from .types import AIRequest, AIResponse
        import hashlib

        nest_asyncio.apply()
        cache_key = f"ai_gen:{hashlib.md5(request.prompt.encode()).hexdigest()}"
        
        # Check cache first
        cached_response = self._check_cache(cache_key)
        if cached_response and cached_response.success:
            self.cache_hits += 1
            logger.info(f"Cache hit for request")
            return AIResponse(
                provider_name=cached_response.provider_name,
                content=cached_response.content,
                model=cached_response.model,
                success=True,
                error=None,
                tokens_used=cached_response.tokens_used,
                response_time=0,
                timestamp=cached_response.timestamp,
                metadata={"cached": True}
            )
        
        self.cache_misses += 1
        self.total_requests += 1
        
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        # Try providers with retry limit
        errors = []
        attempts = 0
        
        for provider in self.providers:
            if attempts >= max_retries:
                logger.warning(f"Reached max retries ({max_retries})")
                break
            
            if not self._can_use_provider(provider):
                continue
            
            attempts += 1
            
            try:
                self.provider_calls[provider.config.name] = \
                    self.provider_calls.get(provider.config.name, 0) + 1
                
                response = loop.run_until_complete(
                    provider.call_with_tracking(
                        prompt=request.prompt,
                        max_tokens=request.max_tokens,
                        temperature=request.temperature,
                    )
                )
                
                if response.success:
                    # Cache successful response
                    self._cache_response(cache_key, response)
                    
                    return AIResponse(
                        provider_name=response.provider_name,
                        content=response.content,
                        model=response.model,
                        success=True,
                        error=None,
                        tokens_used=response.tokens_used,
                        response_time=response.response_time,
                        timestamp=response.timestamp,
                        metadata=response.metadata,
                    )
                else:
                    errors.append(f"{provider.config.name}: {response.error}")
                    
            except Exception as e:
                error_msg = f"{provider.config.name}: {str(e)}"
                logger.warning(f"Provider failed: {error_msg}")
                errors.append(error_msg)
                self.provider_failures[provider.config.name] = \
                    self.provider_failures.get(provider.config.name, 0) + 1
                continue
        
        # All providers failed
        final_error = f"All {attempts} provider(s) failed: {'; '.join(errors)}"
        logger.error(final_error)
        
        return AIResponse(
            provider_name="orchestrator",
            content="",
            model="none",
            success=False,
            error=final_error,
            tokens_used=0,
            response_time=0,
            timestamp=None,
            metadata={"attempts": attempts, "errors": errors},
        )

    def generate_without_cache(self, request: "AIRequest") -> "AIResponse":
        import asyncio
        import nest_asyncio
        from .types import AIRequest, AIResponse

        nest_asyncio.apply()
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        response = loop.run_until_complete(
            self.call(
                prompt=request.prompt,
                cache_key=None,
                use_cache=False,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
            )
        )
        return AIResponse(
            provider_name=response.provider_name,
            content=response.content,
            model=response.model,
            success=response.success,
            error=response.error,
            tokens_used=response.tokens_used,
            response_time=response.response_time,
            timestamp=response.timestamp,
            metadata=response.metadata,
        )
