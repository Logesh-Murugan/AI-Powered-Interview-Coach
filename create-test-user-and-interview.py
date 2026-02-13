"""
Create Test User and Interview Session
Complete end-to-end test
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_complete_flow():
    """Test complete flow: register -> login -> create interview"""
    
    print("=" * 70)
    print("COMPLETE INTERVIEW FLOW TEST")
    print("=" * 70)
    print()
    
    # Step 1: Register a new user
    print("Step 1: Registering new user...")
    register_data = {
        "email": f"testuser{hash('test')}@example.com",  # Unique email
        "password": "Test123!@#",
        "name": "Test User"
    }
    
    try:
        register_response = requests.post(
            f"{BASE_URL}/auth/register",
            json=register_data
        )
        
        if register_response.status_code == 201:
            print("✅ User registered successfully")
            user_data = register_response.json()
            print(f"   Email: {register_data['email']}")
        elif register_response.status_code == 409:
            print("⚠️  User already exists, will try to login")
        else:
            print(f"❌ Registration failed: {register_response.status_code}")
            print(f"   Response: {register_response.text}")
            return
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return
    
    print()
    
    # Step 2: Login
    print("Step 2: Logging in...")
    login_data = {
        "email": register_data["email"],
        "password": register_data["password"]
    }
    
    try:
        login_response = requests.post(
            f"{BASE_URL}/auth/login",
            json=login_data
        )
        
        if login_response.status_code == 200:
            print("✅ Login successful")
            tokens = login_response.json()
            access_token = tokens.get('access_token')
            print(f"   Access token: {access_token[:30]}...")
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"   Response: {login_response.text}")
            return
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    print()
    
    # Step 3: Create interview session
    print("Step 3: Creating interview session...")
    interview_data = {
        "role": "Software Engineer",
        "difficulty": "Easy",
        "question_count": 5,
        "categories": ["Technical", "Coding"]
    }
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        interview_response = requests.post(
            f"{BASE_URL}/interviews",
            json=interview_data,
            headers=headers
        )
        
        print(f"   Status Code: {interview_response.status_code}")
        
        if interview_response.status_code == 201:
            print("✅ Interview session created successfully")
            session_data = interview_response.json()
            print(f"   Session ID: {session_data.get('session_id')}")
            print(f"   Role: {session_data.get('role')}")
            print(f"   Difficulty: {session_data.get('difficulty')}")
            print(f"   Status: {session_data.get('status')}")
            print()
            print("   First Question:")
            first_q = session_data.get('first_question', {})
            print(f"   - Question #{first_q.get('question_number')}")
            print(f"   - Category: {first_q.get('category')}")
            print(f"   - Difficulty: {first_q.get('difficulty')}")
            print(f"   - Time Limit: {first_q.get('time_limit_seconds')}s")
            print(f"   - Text: {first_q.get('question_text', '')[:80]}...")
            print()
            print("=" * 70)
            print("✅ ALL TESTS PASSED - INTERVIEW FLOW WORKS!")
            print("=" * 70)
        else:
            print(f"❌ Interview creation failed: {interview_response.status_code}")
            print(f"   Response: {interview_response.text}")
            
            # Parse error details
            try:
                error_data = interview_response.json()
                print("\n   Error Details:")
                print(f"   {json.dumps(error_data, indent=2)}")
            except:
                pass
    except Exception as e:
        print(f"❌ Interview creation error: {e}")
        if hasattr(e, 'response'):
            print(f"   Response: {e.response.text if e.response else 'No response'}")
        return


if __name__ == "__main__":
    test_complete_flow()
