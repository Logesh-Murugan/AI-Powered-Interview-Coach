"""
Test AI Providers Status
Check if Groq and HuggingFace providers are working
"""
import sys
import os
sys.path.insert(0, 'backend')

from dotenv import load_dotenv
load_dotenv('backend/.env')

from app.services.ai.orchestrator import AIOrchestrator
from app.services.cache_service import CacheService

def test_providers():
    """Test AI providers"""
    print("=" * 70)
    print("TESTING AI PROVIDERS")
    print("=" * 70)
    print()
    
    cache = CacheService()
    orchestrator = AIOrchestrator(cache)
    
    print("Registered Providers:")
    for provider in orchestrator.providers:
        print(f"\n  Provider: {provider.config.name}")
        print(f"  Priority: {provider.config.priority}")
        print(f"  Model: {provider.config.model}")
        
        # Check health
        health = provider.get_health_score()
        print(f"  Health Score: {health}")
        
        # Check circuit breaker
        cb_status = provider.circuit_breaker.state
        print(f"  Circuit Breaker: {cb_status}")
        
        # Check quota
        quota_pct = provider.check_quota()
        print(f"  Quota Remaining: {quota_pct}%")
        
        # Try a simple call
        print(f"  Testing call...")
        try:
            response = provider.call("Say 'Hello'", max_tokens=10)
            if response.success:
                print(f"  ✅ Provider is working!")
                print(f"     Response: {response.content[:50]}...")
            else:
                print(f"  ❌ Provider failed: {response.error}")
        except Exception as e:
            print(f"  ❌ Provider error: {e}")
    
    print()
    print("=" * 70)

if __name__ == "__main__":
    test_providers()
