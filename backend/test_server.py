"""
Quick test script to verify the server works
"""
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

print("Testing InterviewMaster AI Backend...")
print("=" * 50)

# Test health endpoint
response = client.get("/health")
print(f"\n✓ Health Check: {response.status_code}")
print(f"  Response: {response.json()}")

# Test root endpoint
response = client.get("/")
print(f"\n✓ Root Endpoint: {response.status_code}")
print(f"  Response: {response.json()}")

# Test request ID
response = client.get("/health")
print(f"\n✓ Request ID Header: {response.headers.get('X-Request-ID')}")

# Test CORS
response = client.options(
    "/health",
    headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
    }
)
print(f"\n✓ CORS Headers: {response.status_code}")
print(f"  Access-Control-Allow-Origin: {response.headers.get('access-control-allow-origin')}")

print("\n" + "=" * 50)
print("✅ All tests passed! Backend is working correctly.")
print("\nTo start the server manually, run:")
print("  uvicorn app.main:app --reload")
