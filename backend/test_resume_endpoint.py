"""
Manual test script for resume upload endpoint
Run this after starting the server with: uvicorn app.main:app --reload
"""
import requests
import io

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

# Test credentials (use existing user or create one)
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "Test123!@#"


def login():
    """Login and get access token"""
    response = requests.post(
        f"{API_URL}/auth/login",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token")
    else:
        print(f"Login failed: {response.status_code}")
        print(response.json())
        return None


def test_resume_upload(access_token):
    """Test resume upload endpoint"""
    # Create a fake PDF file
    fake_pdf_content = b"%PDF-1.4\n%Test PDF content\nThis is a test resume."
    
    files = {
        'file': ('test_resume.pdf', io.BytesIO(fake_pdf_content), 'application/pdf')
    }
    
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    response = requests.post(
        f"{API_URL}/resumes/upload",
        files=files,
        headers=headers
    )
    
    print(f"\nUpload Response Status: {response.status_code}")
    print(f"Upload Response: {response.json()}")
    
    return response.json() if response.status_code == 201 else None


def test_get_resumes(access_token):
    """Test get all resumes endpoint"""
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    response = requests.get(
        f"{API_URL}/resumes/",
        headers=headers
    )
    
    print(f"\nGet Resumes Status: {response.status_code}")
    print(f"Get Resumes Response: {response.json()}")


def test_get_resume_by_id(access_token, resume_id):
    """Test get resume by ID endpoint"""
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    response = requests.get(
        f"{API_URL}/resumes/{resume_id}",
        headers=headers
    )
    
    print(f"\nGet Resume By ID Status: {response.status_code}")
    print(f"Get Resume By ID Response: {response.json()}")


def main():
    """Run all tests"""
    print("=" * 60)
    print("RESUME UPLOAD ENDPOINT TEST")
    print("=" * 60)
    
    # Step 1: Login
    print("\n1. Logging in...")
    access_token = login()
    
    if not access_token:
        print("❌ Login failed. Please check credentials.")
        return
    
    print("✅ Login successful!")
    
    # Step 2: Upload resume
    print("\n2. Uploading resume...")
    upload_result = test_resume_upload(access_token)
    
    if not upload_result:
        print("❌ Upload failed.")
        return
    
    print("✅ Upload successful!")
    resume_id = upload_result.get('resume_id')
    
    # Step 3: Get all resumes
    print("\n3. Getting all resumes...")
    test_get_resumes(access_token)
    
    # Step 4: Get specific resume
    if resume_id:
        print(f"\n4. Getting resume by ID ({resume_id})...")
        test_get_resume_by_id(access_token, resume_id)
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
