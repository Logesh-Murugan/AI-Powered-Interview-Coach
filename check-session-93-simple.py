"""
Check if session 93 has questions in the database - Simple version
"""
import psycopg2
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv('backend/.env')

def check_session():
    # Connect to database
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    
    try:
        # Check session 93
        cur.execute("SELECT id, user_id, role, difficulty, status, question_count, start_time FROM interview_sessions WHERE id = 93")
        session = cur.fetchone()
        
        if not session:
            print("❌ Session 93 not found!")
            return
        
        print(f"✅ Session 93 found:")
        print(f"   User ID: {session[1]}")
        print(f"   Role: {session[2]}")
        print(f"   Difficulty: {session[3]}")
        print(f"   Status: {session[4]}")
        print(f"   Question Count: {session[5]}")
        print(f"   Start Time: {session[6]}")
        print()
        
        # Check session_questions
        cur.execute("""
            SELECT sq.id, sq.question_id, sq.display_order, sq.status, 
                   q.question_text, q.category, q.difficulty
            FROM session_questions sq
            LEFT JOIN questions q ON sq.question_id = q.id
            WHERE sq.session_id = 93
            ORDER BY sq.display_order
        """)
        
        questions = cur.fetchall()
        print(f"📝 Session Questions: {len(questions)} found")
        print()
        
        for q in questions:
            print(f"Question {q[2]}:")
            print(f"   Session Question ID: {q[0]}")
            print(f"   Question ID: {q[1]}")
            print(f"   Status: {q[3]}")
            if q[4]:
                print(f"   Text: {q[4][:100]}...")
                print(f"   Category: {q[5]}")
                print(f"   Difficulty: {q[6]}")
            else:
                print(f"   ❌ Question record not found!")
            print()
        
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    check_session()
