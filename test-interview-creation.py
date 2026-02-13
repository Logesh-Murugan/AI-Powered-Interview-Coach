"""
Test Interview Session Creation
Quick script to test if the interview creation endpoint is working
"""
import requests
import json

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
LOGIN_URL = f"{BASE_URL}/auth/login"
INTERVIEW_URL = f"{BASE_URL}/interviews"

# Test credentials (use your actual test user)
TEST_USER = {
    "email": "test@example.com",
    "password": "Test123!@#"
}

# Interview session data
INTERVIEW_DATA = {
    "role": "Software Engineer",
    "difficulty": "Easy",
    "question_count": 5,
    "categories": ["Technical", "Coding"]
}

def test_interview_creation():
    """Test the interview creation endpoint"""
    
    print("=" * 60)
    print("TESTING INTERVIEW SESSION CREATION")
    print("=" * 60)
    print()
    
    # Step 1: Login to get access token
    print("Step 1: Logging in...")
    try:
        login_response = requests.post(LOGIN_URL, json=TEST_USER)
        login_response.raise_for_status()
        login_data = login_response.json()
        access_token = login_data.get('access_token')
        
        if not access_token:
            print("❌ FAIL: No access token in login response")
            print(f"Response: {json.dumps(login_data, indent=2)}")
            return
        
        print(f"✅ Login successful")
        print(f"   Access token: {access_token[:20]}...")
        print()
        
    except requests.exceptions.RequestException as e:
        print(f"❌ FAIL: Login failed")
        print(f"   Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Response: {e.response.text}")
        return
    
    # Step 2: Create interview session
    print("Step 2: Creating interview session...")
    print(f"   Data: {json.dumps(INTERVIEW_DATA, indent=2)}")
    print()
    
    try:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        interview_response = requests.post(
            INTERVIEW_URL,
            json=INTERVIEW_DATA,
            headers=headers
        )
        
        print(f"   Status Code: {interview_response.status_code}")
        print()
        
        if interview_response.status_code == 201:
            interview_data = interview_response.json()
            print("✅ SUCCESS: Interview session created")
            print(f"   Session ID: {interview_data.get('session_id')}")
            print(f"   Role: {interview_data.get('role')}")
            print(f"   Difficulty: {interview_data.get('difficulty')}")
            print(f"   Status: {interview_data.get('status')}")
            print(f"   Question Count: {interview_data.get('question_count')}")
            print()
            print("   First Question:")
            first_q = interview_data.get('first_question', {})
            print(f"   - ID: {first_q.get('id')}")
            print(f"   - Text: {first_q.get('question_text', '')[:100]}...")
            print(f"   - Category: {first_q.get('category')}")
            print(f"   - Time Limit: {first_q.get('time_limit_seconds')}s")
            print()
            print("=" * 60)
            print("✅ ALL TESTS PASSED")
            print("=" * 60)
        else:
            print(f"❌ FAIL: Unexpected status code {interview_response.status_code}")
            print(f"   Response: {interview_response.text}")
            print()
            
            # Try to parse error details
            try:
                error_data = interview_response.json()
                print("   Error Details:")
                print(f"   {json.dumps(error_data, indent=2)}")
            except:
                pass
        
    except requests.exceptions.RequestException as e:
        print(f"❌ FAIL: Interview creation failed")
        print(f"   Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Status Code: {e.response.status_code}")
            print(f"   Response: {e.response.text}")
        return


if __name__ == "__main__":
    test_interview_creation()
