"""
Check if session 93 has questions in the database
"""
import sys
import os
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv('backend/.env')

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.database import SessionLocal
from app.models.interview_session import InterviewSession
from app.models.session_question import SessionQuestion
from app.models.question import Question

def check_session():
    db = SessionLocal()
    try:
        # Get session 93
        session = db.query(InterviewSession).filter(InterviewSession.id == 93).first()
        
        if not session:
            print("❌ Session 93 not found!")
            return
        
        print(f"✅ Session 93 found:")
        print(f"   User ID: {session.user_id}")
        print(f"   Role: {session.role}")
        print(f"   Difficulty: {session.difficulty}")
        print(f"   Status: {session.status}")
        print(f"   Question Count: {session.question_count}")
        print(f"   Start Time: {session.start_time}")
        print()
        
        # Get session questions
        session_questions = db.query(SessionQuestion).filter(
            SessionQuestion.session_id == 93
        ).order_by(SessionQuestion.display_order).all()
        
        print(f"📝 Session Questions: {len(session_questions)} found")
        print()
        
        for sq in session_questions:
            question = db.query(Question).filter(Question.id == sq.question_id).first()
            print(f"Question {sq.display_order}:")
            print(f"   ID: {sq.question_id}")
            print(f"   Status: {sq.status}")
            print(f"   Display Order: {sq.display_order}")
            if question:
                print(f"   Text: {question.question_text[:100]}...")
                print(f"   Category: {question.category}")
                print(f"   Difficulty: {question.difficulty}")
            else:
                print(f"   ❌ Question record not found!")
            print()
        
    finally:
        db.close()

if __name__ == '__main__':
    check_session()
