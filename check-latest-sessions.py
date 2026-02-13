"""
Check latest interview sessions
"""
import psycopg2
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv('backend/.env')

def check_sessions():
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    
    try:
        # Get latest 5 sessions
        cur.execute("""
            SELECT id, user_id, role, difficulty, status, question_count, start_time
            FROM interview_sessions
            ORDER BY id DESC
            LIMIT 5
        """)
        
        sessions = cur.fetchall()
        print(f"Latest {len(sessions)} sessions:")
        print()
        
        for sess in sessions:
            print(f"Session {sess[0]}:")
            print(f"  User: {sess[1]}")
            print(f"  Role: {sess[2]}")
            print(f"  Difficulty: {sess[3]}")
            print(f"  Status: {sess[4]}")
            print(f"  Questions: {sess[5]}")
            print(f"  Started: {sess[6]}")
            
            # Check if has evaluations
            cur.execute("""
                SELECT COUNT(*)
                FROM evaluations e
                JOIN answers a ON e.answer_id = a.id
                WHERE a.session_id = %s
            """, (sess[0],))
            
            eval_count = cur.fetchone()[0]
            print(f"  Evaluations: {eval_count}")
            print()
        
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    check_sessions()
