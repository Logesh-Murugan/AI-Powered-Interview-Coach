"""
Check if session 93 has evaluations in the database
"""
import psycopg2
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv('backend/.env')

def check_evaluations():
    # Connect to database
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    
    try:
        # Check answers for session 93
        cur.execute("""
            SELECT a.id, a.question_id, a.answer_text, a.time_taken, a.submitted_at
            FROM answers a
            WHERE a.session_id = 93
            ORDER BY a.id
        """)
        
        answers = cur.fetchall()
        print(f"📝 Answers for Session 93: {len(answers)} found")
        print()
        
        for ans in answers:
            print(f"Answer ID: {ans[0]}")
            print(f"   Question ID: {ans[1]}")
            print(f"   Answer Text: {ans[2][:100]}...")
            print(f"   Time Taken: {ans[3]} seconds")
            print(f"   Submitted At: {ans[4]}")
            
            # Check if evaluation exists
            cur.execute("""
                SELECT id, overall_score, content_quality, clarity, confidence, 
                       technical_accuracy, strengths, improvements, suggestions, evaluated_at
                FROM evaluations
                WHERE answer_id = %s
            """, (ans[0],))
            
            evaluation = cur.fetchone()
            if evaluation:
                print(f"   ✅ Evaluation ID: {evaluation[0]}")
                print(f"      Overall Score: {evaluation[1]}")
                print(f"      Content Quality: {evaluation[2]}")
                print(f"      Clarity: {evaluation[3]}")
                print(f"      Confidence: {evaluation[4]}")
                print(f"      Technical Accuracy: {evaluation[5]}")
                print(f"      Evaluated At: {evaluation[9]}")
            else:
                print(f"   ❌ No evaluation found!")
            print()
        
        # Check total evaluations
        cur.execute("SELECT COUNT(*) FROM evaluations WHERE answer_id IN (SELECT id FROM answers WHERE session_id = 93)")
        eval_count = cur.fetchone()[0]
        print(f"Total Evaluations: {eval_count}")
        
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    check_evaluations()
