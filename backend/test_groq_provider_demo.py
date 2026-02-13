"""
Demo script to test Groq provider with real API
"""
import asyncio
import os
from dotenv import load_dotenv
from app.services.ai.groq_provider import GroqProvider

# Load environment variables
load_dotenv()

async def test_groq_provider():
    """Test Groq provider with a simple prompt"""
    
    # Get API key from environment
    api_key = os.getenv("GROQ_API_KEY")
    
    if not api_key:
        print("❌ GROQ_API_KEY not found in .env file")
        return
    
    print("=" * 80)
    print("GROQ PROVIDER TEST")
    print("=" * 80)
    print()
    
    # Create provider
    print("1. Creating Groq provider...")
    provider = GroqProvider(api_key=api_key)
    print(f"   ✅ Provider created: {provider.config.name}")
    print(f"   Model: {provider.config.model}")
    print(f"   Priority: {provider.config.priority}")
    print(f"   Quota: {provider.config.quota_limit} requests/day")
    print()
    
    # Test prompt
    prompt = "Generate a technical interview question about Python list comprehensions. Include the question and a brief explanation of what you're testing."
    
    print("2. Sending test prompt...")
    print(f"   Prompt: {prompt[:100]}...")
    print()
    
    # Make API call with tracking
    print("3. Calling Groq API...")
    response = await provider.call_with_tracking(prompt, temperature=0.7, max_tokens=500)
    print()
    
    # Display results
    print("=" * 80)
    print("RESPONSE")
    print("=" * 80)
    print(f"Success: {response.success}")
    print(f"Provider: {response.provider_name}")
    print(f"Model: {response.model}")
    print(f"Tokens Used: {response.tokens_used}")
    print(f"Response Time: {response.response_time:.2f}s")
    print()
    print("Content:")
    print("-" * 80)
    print(response.content)
    print("-" * 80)
    print()
    
    # Display health metrics
    print("=" * 80)
    print("PROVIDER HEALTH")
    print("=" * 80)
    health = provider.get_health_status()
    print(f"Is Healthy: {health['is_healthy']}")
    print(f"Health Score: {health['health_score']}")
    print(f"Total Requests: {health['total_requests']}")
    print(f"Successful Requests: {health['successful_requests']}")
    print(f"Average Response Time: {health['average_response_time']:.3f}s")
    print()
    
    print("=" * 80)
    print("TEST COMPLETE ✅")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(test_groq_provider())
