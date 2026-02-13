"""
Demo script to test HuggingFace provider
"""
import time
from app.services.ai.huggingface_provider import create_huggingface_provider
from app.config import settings


def test_huggingface():
    """Test HuggingFace provider with a sample prompt."""
    print("=" * 80)
    print("HUGGINGFACE PROVIDER TEST")
    print("=" * 80)
    
    # Create provider
    provider = create_huggingface_provider(api_key=settings.HUGGINGFACE_API_KEY)
    
    print(f"\nProvider: {provider.config.name}")
    print(f"Model: {provider.config.model}")
    print(f"Priority: {provider.config.priority}")
    print(f"Quota: {provider.config.quota_limit} characters/month")
    print(f"Timeout: {provider.config.timeout}s")
    print(f"API URL: {provider.config.api_url}")
    
    # Test prompt
    prompt = """Generate one technical interview question for a Senior Python Developer role.
    
Format:
Question: [the question]
Expected Answer: [brief answer]
Difficulty: Hard"""
    
    print(f"\n{'=' * 80}")
    print("PROMPT:")
    print(prompt)
    print(f"{'=' * 80}\n")
    
    # Make API call (using sync version)
    print("Calling HuggingFace API (sync)...")
    start_time = time.time()
    
    try:
        response = provider.call_sync(prompt, temperature=0.7, max_tokens=500)
        
        elapsed = time.time() - start_time
        
        print(f"\n{'=' * 80}")
        print("RESPONSE:")
        print(f"{'=' * 80}")
        print(response.content)
        print(f"{'=' * 80}\n")
        
        print(f"✅ Success: {response.success}")
        print(f"⏱️  Response Time: {elapsed:.2f}s")
        print(f"🔢 Estimated Tokens: {response.tokens_used}")
        print(f"📊 Model: {response.model}")
        
        # Check health
        health_status = provider.get_health_status()
        print(f"\n{'=' * 80}")
        print("PROVIDER HEALTH:")
        print(f"{'=' * 80}")
        print(f"Health Score: {health_status['health_score']}/1.0")
        print(f"Is Healthy: {health_status['is_healthy']}")
        print(f"Total Requests: {health_status['total_requests']}")
        print(f"Successful Requests: {health_status['successful_requests']}")
        print(f"Failed Requests: {health_status['failed_requests']}")
        print(f"Success Rate: {health_status['successful_requests'] / max(health_status['total_requests'], 1):.1%}")
        print(f"Average Response Time: {health_status['average_response_time']:.2f}s")
        print(f"Quota Remaining: {health_status['quota_remaining']:.1%}")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        
        # Check health after error
        health_status = provider.get_health_status()
        print(f"\nHealth Score: {health_status['health_score']}/1.0")
        print(f"Is Healthy: {health_status['is_healthy']}")


if __name__ == "__main__":
    test_huggingface()
