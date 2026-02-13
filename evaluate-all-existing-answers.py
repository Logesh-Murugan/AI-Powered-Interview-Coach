"""
Retroactively evaluate all existing answers that don't have evaluations
"""
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Import after adding to path
from app.database import SessionLocal
from app.services.evaluation_service import EvaluationService
import psycopg2

def get_unevaluated_answers():
    """Get all answer IDs that don't have evaluations"""
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT a.id, a.session_id, a.question_id
            FROM answers a
            LEFT JOIN evaluations e ON e.answer_id = a.id
            WHERE e.id IS NULL
            ORDER BY a.id
        """)
        
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()

def evaluate_answers():
    """Evaluate all unevaluated answers"""
    # Get unevaluated answers
    unevaluated = get_unevaluated_answers()
    
    if not unevaluated:
        print("No unevaluated answers found!")
        return
    
    print(f"Found {len(unevaluated)} answers without evaluations")
    print()
    
    # Create database session
    db = SessionLocal()
    
    try:
        evaluation_service = EvaluationService(db)
        
        success_count = 0
        fail_count = 0
        
        for answer_id, session_id, question_id in unevaluated:
            print(f"Evaluating answer {answer_id} (session {session_id}, question {question_id})...")
            
            try:
                result = evaluation_service.evaluate_answer(answer_id)
                print(f"  SUCCESS! Overall Score: {result['scores']['overall_score']}")
                print(f"    Content Quality: {result['scores']['content_quality']}")
                print(f"    Clarity: {result['scores']['clarity']}")
                print(f"    Confidence: {result['scores']['confidence']}")
                print(f"    Technical Accuracy: {result['scores']['technical_accuracy']}")
                success_count += 1
            except Exception as e:
                print(f"  FAILED: {e}")
                fail_count += 1
            
            print()
        
        print("=" * 60)
        print(f"EVALUATION COMPLETE")
        print(f"  Success: {success_count}")
        print(f"  Failed: {fail_count}")
        print(f"  Total: {len(unevaluated)}")
        print("=" * 60)
        
    finally:
        db.close()

if __name__ == '__main__':
    print("=" * 60)
    print("RETROACTIVE ANSWER EVALUATION")
    print("=" * 60)
    print()
    
    evaluate_answers()
