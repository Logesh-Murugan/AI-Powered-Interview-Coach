"""
Test All API Keys - Comprehensive Verification
Tests all 5 API keys (3 Groq + 2 HuggingFace) to ensure they work perfectly.
"""

import asyncio
import time
from app.config import settings
from app.services.ai.groq_provider import create_groq_provider
from app.services.ai.huggingface_provider import create_huggingface_provider

# ANSI color codes for pretty output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
CYAN = '\033[96m'
RESET = '\033[0m'
BOLD = '\033[1m'

def print_header(text):
    """Print a formatted header."""
    print(f"\n{BOLD}{BLUE}{'='*70}{RESET}")
    print(f"{BOLD}{BLUE}{text.center(70)}{RESET}")
    print(f"{BOLD}{BLUE}{'='*70}{RESET}\n")

def print_success(text):
    """Print success message."""
    print(f"{GREEN}✅ {text}{RESET}")

def print_error(text):
    """Print error message."""
    print(f"{RED}❌ {text}{RESET}")

def print_info(text):
    """Print info message."""
    print(f"{CYAN}ℹ️  {text}{RESET}")

def print_warning(text):
    """Print warning message."""
    print(f"{YELLOW}⚠️  {text}{RESET}")

async def test_groq_key(key_name: str, api_key: str, key_number: int):
    """Test a single Groq API key."""
    print(f"\n{BOLD}Testing {key_name}...{RESET}")
    
    if not api_key:
        print_error(f"{key_name} is not configured")
        return False
    
    # Mask the API key for display
    masked_key = f"{api_key[:10]}...{api_key[-10:]}"
    print_info(f"API Key: {masked_key}")
    
    try:
        # Create provider using helper function
        provider = create_groq_provider(api_key=api_key)
        print_info(f"Provider initialized: {provider.config.name}")
        
        # Test API call
        prompt = "Say 'Hello from Groq!' in exactly 5 words."
        print_info(f"Sending test prompt...")
        
        start_time = time.time()
        response = await provider.call(prompt)
        elapsed_time = time.time() - start_time
        
        # Check response
        if response.success:
            print_success(f"API call successful!")
            print_info(f"Response time: {elapsed_time:.2f}s")
            print_info(f"Response: {response.content[:100]}...")
            print_info(f"Tokens used: {response.tokens_used}")
            print_info(f"Health score: {provider.health.health_score:.2f}")
            return True
        else:
            print_error(f"API call failed: {response.error}")
            return False
            
    except Exception as e:
        print_error(f"Error testing {key_name}: {str(e)}")
        return False

async def test_huggingface_key(key_name: str, api_key: str, key_number: int):
    """Test a single HuggingFace API key."""
    print(f"\n{BOLD}Testing {key_name}...{RESET}")
    
    if not api_key:
        print_error(f"{key_name} is not configured")
        return False
    
    # Mask the API key for display
    masked_key = f"{api_key[:10]}...{api_key[-10:]}"
    print_info(f"API Key: {masked_key}")
    
    try:
        # Create provider using helper function
        provider = create_huggingface_provider(api_key=api_key)
        print_info(f"Provider initialized: {provider.config.name}")
        
        # Test API call
        prompt = "Say 'Hello from HuggingFace!' in exactly 5 words."
        print_info(f"Sending test prompt...")
        
        start_time = time.time()
        response = await provider.call(prompt)
        elapsed_time = time.time() - start_time
        
        # Check response
        if response.success:
            print_success(f"API call successful!")
            print_info(f"Response time: {elapsed_time:.2f}s")
            print_info(f"Response: {response.content[:100]}...")
            print_info(f"Tokens used: {response.tokens_used}")
            print_info(f"Health score: {provider.health.health_score:.2f}")
            return True
        else:
            print_error(f"API call failed: {response.error}")
            return False
            
    except Exception as e:
        print_error(f"Error testing {key_name}: {str(e)}")
        return False

async def main():
    """Main test function."""
    print_header("API KEYS VERIFICATION TEST")
    print_info("Testing all 5 API keys (3 Groq + 2 HuggingFace)")
    print_info("This will take approximately 30-60 seconds...")
    
    results = {
        'groq': [],
        'huggingface': []
    }
    
    # Test Groq keys
    print_header("GROQ API KEYS (3 keys)")
    
    groq_keys = [
        ("GROQ_API_KEY", settings.GROQ_API_KEY, 1),
        ("GROQ_API_KEY_2", settings.GROQ_API_KEY_2, 2),
        ("GROQ_API_KEY_3", settings.GROQ_API_KEY_3, 3),
    ]
    
    for key_name, api_key, key_number in groq_keys:
        result = await test_groq_key(key_name, api_key, key_number)
        results['groq'].append((key_name, result))
        await asyncio.sleep(1)  # Small delay between tests
    
    # Test HuggingFace keys
    print_header("HUGGINGFACE API KEYS (2 keys)")
    
    hf_keys = [
        ("HUGGINGFACE_API_KEY", settings.HUGGINGFACE_API_KEY, 1),
        ("HUGGINGFACE_API_KEY_2", settings.HUGGINGFACE_API_KEY_2, 2),
    ]
    
    for key_name, api_key, key_number in hf_keys:
        result = await test_huggingface_key(key_name, api_key, key_number)
        results['huggingface'].append((key_name, result))
        await asyncio.sleep(1)  # Small delay between tests
    
    # Print summary
    print_header("TEST SUMMARY")
    
    # Groq results
    print(f"\n{BOLD}Groq API Keys (3 keys):{RESET}")
    groq_success = sum(1 for _, result in results['groq'] if result)
    for key_name, result in results['groq']:
        if result:
            print_success(f"{key_name}: Working perfectly")
        else:
            print_error(f"{key_name}: Failed")
    
    # HuggingFace results
    print(f"\n{BOLD}HuggingFace API Keys (2 keys):{RESET}")
    hf_success = sum(1 for _, result in results['huggingface'] if result)
    for key_name, result in results['huggingface']:
        if result:
            print_success(f"{key_name}: Working perfectly")
        else:
            print_error(f"{key_name}: Failed")
    
    # Overall summary
    total_keys = 5
    total_success = groq_success + hf_success
    
    print(f"\n{BOLD}Overall Results:{RESET}")
    print_info(f"Total API keys tested: {total_keys}")
    print_info(f"Successful: {total_success}")
    print_info(f"Failed: {total_keys - total_success}")
    
    if total_success == total_keys:
        print(f"\n{BOLD}{GREEN}{'='*70}{RESET}")
        print(f"{BOLD}{GREEN}{'🎉 ALL API KEYS WORKING PERFECTLY! 🎉'.center(70)}{RESET}")
        print(f"{BOLD}{GREEN}{'='*70}{RESET}\n")
        
        print_info("Your configuration:")
        print_info(f"  • Groq: {groq_success}/3 keys working")
        print_info(f"  • HuggingFace: {hf_success}/2 keys working")
        print_info(f"  • Total capacity: ~43,700 requests/day")
        print_info(f"  • Status: ✅ Production ready!")
    else:
        print(f"\n{BOLD}{YELLOW}{'='*70}{RESET}")
        print(f"{BOLD}{YELLOW}{'⚠️  SOME API KEYS FAILED ⚠️'.center(70)}{RESET}")
        print(f"{BOLD}{YELLOW}{'='*70}{RESET}\n")
        
        print_warning(f"{total_keys - total_success} API key(s) failed")
        print_info("Please check the error messages above")
        print_info("You may need to:")
        print_info("  • Verify the API keys in .env file")
        print_info("  • Check your internet connection")
        print_info("  • Verify API key quotas")

if __name__ == "__main__":
    asyncio.run(main())
