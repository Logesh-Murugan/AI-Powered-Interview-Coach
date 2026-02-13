"""
Tests for Session Summary Service

Requirements: 19.1-19.12
"""
import pytest
from sqlalchemy.orm import Session
from datetime import datetime

from app.services.session_summary_service import SessionSummaryService
from app.models.user import User
from app.models.interview_session import InterviewSession, SessionStatus
from app.models.question import Question
from app.models.session_question import SessionQuestion
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.models.session_summary import SessionSummary


class TestSessionSummaryService:
    """Test session summary service"""
    
    def test_generate_summary_success(self, db: Session):
        """
        Test successful session summary generation.
        
        **Feature: interview-master-ai, Test 1: Generate summary success**
        **Validates: Requirements 19.1-19.12**
        """
        import uuid
        # Create user
        user = User(
            email=f"test-{uuid.uuid4()}@example.com",
            password_hash="hashed",
            name="Test User",
            target_role="Software Engineer"
        )
        db.add(user)
        db.flush()
        
        # Create completed session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.COMPLETED,
            question_count=3
        )
        db.add(session)
        db.flush()
        
        # Create questions
        questions = []
        for i in range(3):
            question = Question(
                question_text=f"Test question {i+1}",
                category="Technical",
                difficulty="Medium",
                role="Software Engineer",
                expected_answer_points=["Point 1", "Point 2", "Point 3"],
                time_limit_seconds=300
            )
            db.add(question)
            db.flush()
            questions.append(question)
            
            # Link question to session
            sq = SessionQuestion(
                session_id=session.id,
                question_id=question.id,
                display_order=i+1,
                status="answered"
            )
            db.add(sq)
        
        db.flush()
        
        # Create answers and evaluations
        for i, question in enumerate(questions):
            answer = Answer(
                session_id=session.id,
                question_id=question.id,
                user_id=user.id,
                answer_text=f"Test answer {i+1}",
                time_taken=300
            )
            db.add(answer)
            db.flush()
            
            evaluation = Evaluation(
                answer_id=answer.id,
                content_quality=80.0 + i,
                clarity=75.0 + i,
                confidence=82.0 + i,
                technical_accuracy=77.0 + i,
                overall_score=78.5 + i,
                strengths=["Clear communication", "Good examples"],
                improvements=["Add more detail", "Improve structure"],
                suggestions=["Practice more", "Review concepts"]
            )
            db.add(evaluation)
            db.flush()
        
        db.commit()
        
        # Generate summary
        service = SessionSummaryService(db)
        summary = service.generate_summary(session.id, user.id)
        
        # Assertions
        assert summary['session_id'] == session.id
        assert 'overall_session_score' in summary
        assert summary['overall_session_score'] > 0
        assert 'avg_content_quality' in summary
        assert 'avg_clarity' in summary
        assert 'avg_confidence' in summary
        assert 'avg_technical_accuracy' in summary
        assert 'top_strengths' in summary
        assert len(summary['top_strengths']) > 0
        assert 'top_improvements' in summary
        assert len(summary['top_improvements']) > 0
        assert 'category_performance' in summary
        assert 'Technical' in summary['category_performance']
        assert summary['total_questions'] == 3
        assert summary['total_time_seconds'] == 900
        assert 'radar_chart_data' in summary
        assert 'line_chart_data' in summary
    
    def test_generate_summary_session_not_found(self, db: Session):
        """
        Test summary generation with non-existent session.
        
        **Feature: interview-master-ai, Test 2: Session not found**
        **Validates: Requirements 19.1**
        """
        service = SessionSummaryService(db)
        
        with pytest.raises(ValueError, match="not found"):
            service.generate_summary(999, 1)
    
    def test_generate_summary_session_not_completed(self, db: Session):
        """
        Test summary generation with incomplete session.
        
        **Feature: interview-master-ai, Test 3: Session not completed**
        **Validates: Requirements 19.1**
        """
        import uuid
        # Create user
        user = User(
            email=f"test-{uuid.uuid4()}@example.com",
            password_hash="hashed",
            name="Test User"
        )
        db.add(user)
        db.flush()
        
        # Create in-progress session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.IN_PROGRESS,
            question_count=3
        )
        db.add(session)
        db.commit()
        
        service = SessionSummaryService(db)
        
        with pytest.raises(ValueError, match="not completed"):
            service.generate_summary(session.id, user.id)
    
    def test_generate_summary_with_score_trend(self, db: Session):
        """
        Test summary generation with score trend calculation.
        
        **Feature: interview-master-ai, Test 4: Score trend calculation**
        **Validates: Requirements 19.5, 19.6**
        """
        import uuid
        # Create user
        user = User(
            email=f"test-{uuid.uuid4()}@example.com",
            password_hash="hashed",
            name="Test User",
            target_role="Software Engineer"
        )
        db.add(user)
        db.flush()
        
        # Create first session
        session1 = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.COMPLETED,
            question_count=2
        )
        db.add(session1)
        db.flush()
        
        # Create questions and evaluations for session 1
        for i in range(2):
            question = Question(
                question_text=f"Question {i+1}",
                category="Technical",
                difficulty="Medium",
                role="Software Engineer",
                expected_answer_points=["Point 1", "Point 2", "Point 3"],
                time_limit_seconds=300
            )
            db.add(question)
            db.flush()
            
            sq = SessionQuestion(
                session_id=session1.id,
                question_id=question.id,
                display_order=i+1,
                status="answered"
            )
            db.add(sq)
            db.flush()
            
            answer = Answer(
                session_id=session1.id,
                question_id=question.id,
                user_id=user.id,
                answer_text=f"Answer {i+1}",
                time_taken=300
            )
            db.add(answer)
            db.flush()
            
            evaluation = Evaluation(
                answer_id=answer.id,
                content_quality=70.0,
                clarity=70.0,
                confidence=70.0,
                technical_accuracy=70.0,
                overall_score=70.0,
                strengths=["Good effort"],
                improvements=["Need more detail"],
                suggestions=["Practice more"]
            )
            db.add(evaluation)
            db.flush()
        
        db.commit()
        
        # Generate summary for session 1
        service = SessionSummaryService(db)
        summary1 = service.generate_summary(session1.id, user.id)
        
        assert summary1['overall_session_score'] == 70.0
        assert summary1['score_trend'] is None  # No previous session
        
        # Create second session
        session2 = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.COMPLETED,
            question_count=2
        )
        db.add(session2)
        db.flush()
        
        # Create questions and evaluations for session 2 (higher scores)
        for i in range(2):
            question = Question(
                question_text=f"Question {i+3}",
                category="Technical",
                difficulty="Medium",
                role="Software Engineer",
                expected_answer_points=["Point 1", "Point 2", "Point 3"],
                time_limit_seconds=300
            )
            db.add(question)
            db.flush()
            
            sq = SessionQuestion(
                session_id=session2.id,
                question_id=question.id,
                display_order=i+1,
                status="answered"
            )
            db.add(sq)
            db.flush()
            
            answer = Answer(
                session_id=session2.id,
                question_id=question.id,
                user_id=user.id,
                answer_text=f"Answer {i+3}",
                time_taken=300
            )
            db.add(answer)
            db.flush()
            
            evaluation = Evaluation(
                answer_id=answer.id,
                content_quality=80.0,
                clarity=80.0,
                confidence=80.0,
                technical_accuracy=80.0,
                overall_score=80.0,
                strengths=["Much better"],
                improvements=["Keep improving"],
                suggestions=["Continue practice"]
            )
            db.add(evaluation)
            db.flush()
        
        db.commit()
        
        # Generate summary for session 2
        summary2 = service.generate_summary(session2.id, user.id)
        
        assert summary2['overall_session_score'] == 80.0
        assert summary2['previous_session_score'] == 70.0
        assert summary2['score_trend'] is not None
        # Trend should be positive (improvement)
        assert summary2['score_trend'] > 0
        # Calculate expected trend: ((80 - 70) / 70) * 100 = 14.29%
        expected_trend = ((80.0 - 70.0) / 70.0) * 100
        assert abs(summary2['score_trend'] - expected_trend) < 0.1
    
    def test_generate_summary_returns_existing(self, db: Session):
        """
        Test that existing summary is returned instead of regenerating.
        
        **Feature: interview-master-ai, Test 5: Return existing summary**
        **Validates: Requirements 19.1-19.12**
        """
        import uuid
        # Create user
        user = User(
            email=f"test-{uuid.uuid4()}@example.com",
            password_hash="hashed",
            name="Test User"
        )
        db.add(user)
        db.flush()
        
        # Create completed session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.COMPLETED,
            question_count=1
        )
        db.add(session)
        db.flush()
        
        # Create question, answer, and evaluation
        question = Question(
            question_text="Test question",
            category="Technical",
            difficulty="Medium",
            role="Software Engineer",
            expected_answer_points=["Point 1", "Point 2", "Point 3"],
            time_limit_seconds=300
        )
        db.add(question)
        db.flush()
        
        sq = SessionQuestion(
            session_id=session.id,
            question_id=question.id,
            display_order=1,
            status="answered"
        )
        db.add(sq)
        db.flush()
        
        answer = Answer(
            session_id=session.id,
            question_id=question.id,
            user_id=user.id,
            answer_text="Test answer",
            time_taken=300
        )
        db.add(answer)
        db.flush()
        
        evaluation = Evaluation(
            answer_id=answer.id,
            content_quality=75.0,
            clarity=75.0,
            confidence=75.0,
            technical_accuracy=75.0,
            overall_score=75.0,
            strengths=["Good"],
            improvements=["Better"],
            suggestions=["Practice"]
        )
        db.add(evaluation)
        db.flush()
        
        db.commit()
        
        # Generate summary first time
        service = SessionSummaryService(db)
        summary1 = service.generate_summary(session.id, user.id)
        summary1_id = summary1['id']
        
        # Generate summary second time
        summary2 = service.generate_summary(session.id, user.id)
        
        # Should return same summary
        assert summary2['id'] == summary1_id
        assert summary2['overall_session_score'] == summary1['overall_session_score']
