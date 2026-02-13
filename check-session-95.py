"""
Check session 95 - when was it created and when were answers submitted
"""
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv('backend/.env')

def check_session():
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    
    try:
        # Get session 95 details
        cur.execute("""
            SELECT id, user_id, role, difficulty, status, question_count, 
                   start_time, created_at
            FROM interview_sessions 
            WHERE id = 95
        """)
        session = cur.fetchone()
        
        if not session:
            print("Session 95 not found!")
            return
        
        print(f"Session 95:")
        print(f"  Created: {session[7]}")
        print(f"  Started: {session[6]}")
        print(f"  Role: {session[2]}")
        print(f"  Questions: {session[5]}")
        print()
        
        # Get answers with submission times
        cur.execute("""
            SELECT id, question_id, submitted_at
            FROM answers
            WHERE session_id = 95
            ORDER BY id
        """)
        
        answers = cur.fetchall()
        print(f"Answers: {len(answers)}")
        for ans in answers:
            print(f"  Answer {ans[0]}: submitted at {ans[2]}")
        
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    check_session()
