"""
Trigger evaluations for session 93 using the API
"""
import requests
import psycopg2
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv('backend/.env')

def get_auth_token():
    """Login and get auth token"""
    response = requests.post(
        'http://localhost:8000/api/v1/auth/login',
        json={
            'email': 'test@example.com',  # Update with actual user email
            'password': 'Test123!@#'  # Update with actual password
        }
    )
    if response.status_code == 200:
        return response.json()['access_token']
    else:
        print(f"Login failed: {response.status_code}")
        print(response.text)
        return None

def get_answer_ids():
    """Get answer IDs from database"""
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT id FROM answers WHERE session_id = 93 ORDER BY id")
        answer_ids = [row[0] for row in cur.fetchall()]
        return answer_ids
    finally:
        cur.close()
        conn.close()

def trigger_evaluation(answer_id, token):
    """Trigger evaluation for an answer"""
    headers = {'Authorization': f'Bearer {token}'}
    
    response = requests.post(
        f'http://localhost:8000/api/v1/evaluations/answers/{answer_id}/evaluate',
        headers=headers
    )
    
    return response

def main():
    print("Getting answer IDs...")
    answer_ids = get_answer_ids()
    print(f"Found {len(answer_ids)} answers: {answer_ids}")
    print()
    
    print("Getting auth token...")
    token = get_auth_token()
    if not token:
        print("Failed to get auth token")
        return
    print("✅ Got auth token")
    print()
    
    for answer_id in answer_ids:
        print(f"Triggering evaluation for answer {answer_id}...")
        try:
            response = trigger_evaluation(answer_id, token)
            if response.status_code in [200, 201]:
                result = response.json()
                print(f"  ✅ Evaluation complete!")
                print(f"     Overall Score: {result['scores']['overall_score']}")
            else:
                print(f"  ❌ Failed: {response.status_code}")
                print(f"     {response.text}")
        except Exception as e:
            print(f"  ❌ Error: {e}")
        print()
    
    print("All evaluations completed!")

if __name__ == '__main__':
    main()
