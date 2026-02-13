"""
Check session 94 details
"""
import psycopg2
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv('backend/.env')

def check_session():
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    
    try:
        # Check session 94
        cur.execute("SELECT id, user_id, role, difficulty, status, question_count, start_time FROM interview_sessions WHERE id = 94")
        session = cur.fetchone()
        
        if not session:
            print("Session 94 not found!")
            return
        
        print(f"Session 94:")
        print(f"  User ID: {session[1]}")
        print(f"  Role: {session[2]}")
        print(f"  Difficulty: {session[3]}")
        print(f"  Status: {session[4]}")
        print(f"  Question Count: {session[5]}")
        print()
        
        # Check answers
        cur.execute("""
            SELECT a.id, a.question_id, a.answer_text, a.submitted_at,
                   e.id as eval_id, e.overall_score
            FROM answers a
            LEFT JOIN evaluations e ON e.answer_id = a.id
            WHERE a.session_id = 94
            ORDER BY a.id
        """)
        
        answers = cur.fetchall()
        print(f"Answers: {len(answers)}")
        print()
        
        for ans in answers:
            print(f"Answer ID: {ans[0]}")
            print(f"  Question ID: {ans[1]}")
            print(f"  Answer: {ans[2][:50]}...")
            print(f"  Submitted: {ans[3]}")
            if ans[4]:
                print(f"  Evaluation ID: {ans[4]}")
                print(f"  Score: {ans[5]}")
            else:
                print(f"  NO EVALUATION")
            print()
        
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    check_session()
