"""
Trigger evaluations for all answers in session 93
"""
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.database import SessionLocal
from app.services.evaluation_service import EvaluationService
from app.models.answer import Answer

def trigger_evaluations():
    db = SessionLocal()
    try:
        # Get all answers for session 93
        answers = db.query(Answer).filter(Answer.session_id == 93).all()
        
        print(f"Found {len(answers)} answers for session 93")
        print()
        
        evaluation_service = EvaluationService(db)
        
        for answer in answers:
            print(f"Evaluating answer {answer.id} (question {answer.question_id})...")
            try:
                result = evaluation_service.evaluate_answer(answer.id)
                print(f"  ✅ Evaluation complete!")
                print(f"     Overall Score: {result['scores']['overall_score']}")
                print(f"     Content Quality: {result['scores']['content_quality']}")
                print(f"     Clarity: {result['scores']['clarity']}")
                print(f"     Confidence: {result['scores']['confidence']}")
                print(f"     Technical Accuracy: {result['scores']['technical_accuracy']}")
                print()
            except Exception as e:
                print(f"  ❌ Evaluation failed: {e}")
                print()
        
        print("All evaluations completed!")
        
    finally:
        db.close()

if __name__ == '__main__':
    trigger_evaluations()
