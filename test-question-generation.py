"""
Test Question Generation Service
Check if the AI service can generate questions
"""
import sys
import os
sys.path.insert(0, 'backend')

from dotenv import load_dotenv
load_dotenv('backend/.env')

# Import after loading env
from app.database import SessionLocal
from app.services.question_service import QuestionService
from app.services.cache_service import CacheService

def test_question_generation():
    """Test question generation"""
    print("=" * 70)
    print("TESTING QUESTION GENERATION SERVICE")
    print("=" * 70)
    print()
    
    db = SessionLocal()
    cache = CacheService()
    
    try:
        print("Step 1: Creating QuestionService...")
        service = QuestionService(db, cache)
        print("✅ QuestionService created")
        print()
        
        print("Step 2: Generating questions...")
        print("   Role: Software Engineer")
        print("   Difficulty: Easy")
        print("   Count: 3")
        print("   Categories: ['Technical', 'Coding']")
        print()
        
        questions = service.generate(
            role="Software Engineer",
            difficulty="Easy",
            question_count=3,
            categories=["Technical", "Coding"]
        )
        
        if questions:
            print(f"✅ Generated {len(questions)} questions")
            print()
            for idx, q in enumerate(questions, 1):
                print(f"Question {idx}:")
                print(f"  ID: {q.get('id')}")
                print(f"  Category: {q.get('category')}")
                print(f"  Difficulty: {q.get('difficulty')}")
                print(f"  Time Limit: {q.get('time_limit_seconds')}s")
                print(f"  Text: {q.get('question_text', '')[:100]}...")
                print()
            
            print("=" * 70)
            print("✅ QUESTION GENERATION WORKS!")
            print("=" * 70)
        else:
            print("❌ No questions generated")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_question_generation()
