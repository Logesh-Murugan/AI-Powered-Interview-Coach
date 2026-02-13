"""
Demo script to test AI Orchestrator functionality.

This script demonstrates:
1. Provider registration
2. Provider selection
3. Fallback chain
4. Circuit breaker integration
5. Cache integration
6. Metrics tracking
"""

import asyncio
from loguru import logger

from app.services.ai.orchestrator import AIOrchestrator
from app.services.ai.groq_provider import GroqProvider
from app.services.ai.huggingface_provider import HuggingFaceProvider
from app.services.ai.types import ProviderConfig, ProviderType
from app.config import settings


async def main():
    """Run orchestrator demo."""
    
    logger.info("=" * 80)
    logger.info("AI Orchestrator Demo")
    logger.info("=" * 80)
    
    # Initialize orchestrator
    orchestrator = AIOrchestrator()
    logger.info(f"✓ Orchestrator initialized: {orchestrator}")
    
    # Register Groq providers (3 API keys)
    groq_keys = [
        settings.GROQ_API_KEY,
        settings.GROQ_API_KEY_2,
        settings.GROQ_API_KEY_3
    ]
    
    for i, api_key in enumerate(groq_keys, 1):
        if api_key:
            config = ProviderConfig(
                name=f"groq_{i}",
                provider_type=ProviderType.GROQ,
                api_key=api_key,
                model="llama-3.3-70b-versatile",
                priority=i,
                quota_limit=14400,
                enabled=True
            )
            provider = GroqProvider(config)
            orchestrator.register_provider(provider)
            logger.info(f"✓ Registered Groq provider {i}")
    
    # Register HuggingFace providers (2 API keys)
    hf_keys = [
        settings.HUGGINGFACE_API_KEY,
        settings.HUGGINGFACE_API_KEY_2
    ]
    
    for i, api_key in enumerate(hf_keys, 1):
        if api_key:
            config = ProviderConfig(
                name=f"huggingface_{i}",
                provider_type=ProviderType.HUGGINGFACE,
                api_key=api_key,
                model="mistralai/Mistral-7B-Instruct-v0.2",
                priority=4 + i,  # Priority 5-6 (lower priority than Groq 1-3)
                quota_limit=30000,
                enabled=True
            )
            provider = HuggingFaceProvider(config)
            orchestrator.register_provider(provider)
            logger.info(f"✓ Registered HuggingFace provider {i}")
    
    logger.info(f"\n✓ Total providers registered: {len(orchestrator.providers)}")
    
    # Test 1: Simple question generation
    logger.info("\n" + "=" * 80)
    logger.info("Test 1: Simple Question Generation")
    logger.info("=" * 80)
    
    prompt = """Generate 1 technical interview question for a Software Engineer position.
    
Return in JSON format:
{
    "question": "the question text",
    "category": "Technical",
    "difficulty": "Medium"
}"""
    
    response = await orchestrator.call(prompt, cache_key="test_question_1")
    
    if response.success:
        logger.info(f"✓ Question generated successfully!")
        logger.info(f"  Provider: {response.provider_name}")
        logger.info(f"  Model: {response.model}")
        logger.info(f"  Response time: {response.response_time:.2f}s")
        logger.info(f"  Tokens used: {response.tokens_used}")
        logger.info(f"  Content preview: {response.content[:200]}...")
    else:
        logger.error(f"✗ Question generation failed: {response.error}")
    
    # Test 2: Cache hit
    logger.info("\n" + "=" * 80)
    logger.info("Test 2: Cache Hit (Same Question)")
    logger.info("=" * 80)
    
    response2 = await orchestrator.call(prompt, cache_key="test_question_1")
    
    if response2.success:
        logger.info(f"✓ Response retrieved from cache!")
        logger.info(f"  Provider: {response2.provider_name}")
        logger.info(f"  Content matches: {response2.content == response.content}")
    
    # Test 3: Different question (cache miss)
    logger.info("\n" + "=" * 80)
    logger.info("Test 3: Different Question (Cache Miss)")
    logger.info("=" * 80)
    
    prompt2 = """Generate 1 behavioral interview question for a Product Manager position.
    
Return in JSON format:
{
    "question": "the question text",
    "category": "Behavioral",
    "difficulty": "Medium"
}"""
    
    response3 = await orchestrator.call(prompt2, cache_key="test_question_2")
    
    if response3.success:
        logger.info(f"✓ New question generated!")
        logger.info(f"  Provider: {response3.provider_name}")
        logger.info(f"  Response time: {response3.response_time:.2f}s")
    
    # Test 4: Provider status
    logger.info("\n" + "=" * 80)
    logger.info("Test 4: Provider Status")
    logger.info("=" * 80)
    
    statuses = orchestrator.get_all_providers_status()
    for status in statuses:
        provider_info = status['provider']
        cb_info = status['circuit_breaker']
        logger.info(f"\nProvider: {provider_info['config']['name']}")
        logger.info(f"  Health: {provider_info['health_score']:.2f}")
        logger.info(f"  Healthy: {provider_info['is_healthy']}")
        logger.info(f"  Avg Response Time: {provider_info['average_response_time']:.2f}s")
        logger.info(f"  Circuit Breaker: {cb_info['state']}")
        logger.info(f"  Calls: {status['calls']}")
        logger.info(f"  Failures: {status['failures']}")
    
    # Test 5: Metrics
    logger.info("\n" + "=" * 80)
    logger.info("Test 5: Orchestrator Metrics")
    logger.info("=" * 80)
    
    metrics = orchestrator.get_metrics()
    logger.info(f"\nTotal Requests: {metrics['total_requests']}")
    logger.info(f"Cache Hits: {metrics['cache_hits']}")
    logger.info(f"Cache Misses: {metrics['cache_misses']}")
    logger.info(f"Cache Hit Rate: {metrics['cache_hit_rate']}%")
    logger.info(f"Registered Providers: {metrics['registered_providers']}")
    
    logger.info("\nProvider Calls:")
    for provider_name, calls in metrics['provider_calls'].items():
        logger.info(f"  {provider_name}: {calls}")
    
    logger.info("\nProvider Failures:")
    for provider_name, failures in metrics['provider_failures'].items():
        logger.info(f"  {provider_name}: {failures}")
    
    # Test 6: Fallback scenario (simulate provider failure)
    logger.info("\n" + "=" * 80)
    logger.info("Test 6: Fallback Scenario")
    logger.info("=" * 80)
    logger.info("(Simulating provider failure by opening circuit breaker)")
    
    # Open circuit breaker for first provider
    if orchestrator.providers:
        first_provider_name = orchestrator.providers[0].config.name
        circuit_breaker = orchestrator.circuit_breakers[first_provider_name]
        
        # Trigger circuit breaker
        for _ in range(5):
            circuit_breaker.record_failure()
        
        logger.info(f"✓ Circuit breaker opened for {first_provider_name}")
        logger.info(f"  State: {circuit_breaker.state.value}")
        
        # Make another call - should fallback to next provider
        response4 = await orchestrator.call(prompt, cache_key="test_question_fallback")
        
        if response4.success:
            logger.info(f"✓ Fallback successful!")
            logger.info(f"  Used provider: {response4.provider_name}")
            logger.info(f"  (Skipped {first_provider_name} due to open circuit)")
        else:
            logger.error(f"✗ Fallback failed: {response4.error}")
    
    # Final summary
    logger.info("\n" + "=" * 80)
    logger.info("Demo Complete!")
    logger.info("=" * 80)
    logger.info(f"\nFinal Orchestrator State: {orchestrator}")
    
    final_metrics = orchestrator.get_metrics()
    logger.info(f"Total Requests: {final_metrics['total_requests']}")
    logger.info(f"Cache Hit Rate: {final_metrics['cache_hit_rate']}%")
    logger.info(f"Success Rate: {(final_metrics['total_requests'] - sum(final_metrics['provider_failures'].values())) / max(1, final_metrics['total_requests']) * 100:.1f}%")


if __name__ == "__main__":
    asyncio.run(main())
