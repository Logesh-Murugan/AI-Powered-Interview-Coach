"""
Check if there are questions in the database
"""
import sys
import os
sys.path.insert(0, 'backend')

# Load environment variables
from dotenv import load_dotenv
load_dotenv('backend/.env')

from app.database import SessionLocal
from app.models.question import Question

def check_questions():
    """Check questions in database"""
    db = SessionLocal()
    
    try:
        # Count total questions
        total = db.query(Question).count()
        print(f"Total questions in database: {total}")
        
        if total > 0:
            # Show some examples
            questions = db.query(Question).limit(5).all()
            print("\nSample questions:")
            for q in questions:
                print(f"  - ID: {q.id}, Role: {q.role}, Difficulty: {q.difficulty}, Category: {q.category}")
                print(f"    Text: {q.question_text[:80]}...")
        else:
            print("\n⚠️  No questions found in database!")
            print("   The AI service will need to generate questions on-the-fly.")
            print("   This requires:")
            print("   1. Valid API keys (Groq or HuggingFace)")
            print("   2. Working AI orchestrator")
            print("   3. Network connectivity")
        
    finally:
        db.close()

if __name__ == "__main__":
    check_questions()
