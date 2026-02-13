"""
Tests for Interview Session Models

This module tests the interview session, session questions, answers,
answer drafts, evaluations, and session summaries models.

Requirements: 14.1-14.10, 15.1-15.7, 16.1-16.10, 17.1-17.7, 18.1-18.14, 19.1-19.12
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.user import User, AccountStatus, ExperienceLevel
from app.models.question import Question
from app.models.interview_session import InterviewSession, SessionStatus
from app.models.session_question import SessionQuestion
from app.models.answer import Answer
from app.models.answer_draft import AnswerDraft
from app.models.evaluation import Evaluation
from app.models.session_summary import SessionSummary


class TestInterviewSessionModel:
    """Test InterviewSession model"""
    
    def test_create_interview_session(self, db: Session):
        """Test creating an interview session"""
        # Create user with unique email
        import uuid
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        user = User(
            email=unique_email,
            password_hash="hashed_password",
            name="Test User",
            target_role="Software Engineer",
            experience_level=ExperienceLevel.MID,
            account_status=AccountStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        
        # Create interview session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.IN_PROGRESS,
            question_count=5,
            categories=["Technical", "Behavioral"],
            start_time=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Assertions
        assert session.id is not None
        assert session.user_id == user.id
        assert session.role == "Software Engineer"
        assert session.difficulty == "Medium"
        assert session.status == SessionStatus.IN_PROGRESS
        assert session.question_count == 5
        assert session.categories == ["Technical", "Behavioral"]
        assert session.start_time is not None
        assert session.end_time is None
        assert session.created_at is not None
    
    def test_session_to_dict(self, db: Session):
        """Test session to_dict method"""
        user = User(
            email="test2@example.com",
            password_hash="hashed_password",
            name="Test User 2",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        
        session = InterviewSession(
            user_id=user.id,
            role="Data Scientist",
            difficulty="Hard",
            status=SessionStatus.COMPLETED,
            question_count=10,
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        
        session_dict = session.to_dict()
        
        assert session_dict['id'] == session.id
        assert session_dict['user_id'] == user.id
        assert session_dict['role'] == "Data Scientist"
        assert session_dict['difficulty'] == "Hard"
        assert session_dict['status'] == "completed"
        assert session_dict['question_count'] == 10


class TestSessionQuestionModel:
    """Test SessionQuestion model"""
    
    def test_create_session_question(self, db: Session):
        """Test creating a session question"""
        # Create user
        user = User(
            email="test3@example.com",
            password_hash="hashed_password",
            name="Test User 3",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        
        # Create session
        session = InterviewSession(
            user_id=user.id,
            role="Product Manager",
            difficulty="Easy",
            status=SessionStatus.IN_PROGRESS,
            question_count=3,
            start_time=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        
        # Create question
        question = Question(
            question_text="Tell me about a time you led a product launch.",
            category="Behavioral",
            difficulty="Easy",
            role="Product Manager",
            expected_answer_points=["Situation", "Task", "Action", "Result"],
            time_limit_seconds=300
        )
        db.add(question)
        db.commit()
        
        # Create session question
        session_question = SessionQuestion(
            session_id=session.id,
            question_id=question.id,
            display_order=1,
            status="pending"
        )
        db.add(session_question)
        db.commit()
        db.refresh(session_question)
        
        # Assertions
        assert session_question.id is not None
        assert session_question.session_id == session.id
        assert session_question.question_id == question.id
        assert session_question.display_order == 1
        assert session_question.status == "pending"
        assert session_question.question_displayed_at is None
        assert session_question.answer_id is None


class TestAnswerModel:
    """Test Answer model"""
    
    def test_create_answer(self, db: Session):
        """Test creating an answer"""
        # Create user
        user = User(
            email="test4@example.com",
            password_hash="hashed_password",
            name="Test User 4",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        
        # Create session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.IN_PROGRESS,
            question_count=5,
            start_time=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        
        # Create question
        question = Question(
            question_text="Explain the difference between REST and GraphQL.",
            category="Technical",
            difficulty="Medium",
            role="Software Engineer",
            expected_answer_points=["REST basics", "GraphQL basics", "Key differences"],
            time_limit_seconds=300
        )
        db.add(question)
        db.commit()
        
        # Create answer
        answer = Answer(
            session_id=session.id,
            question_id=question.id,
            user_id=user.id,
            answer_text="REST is an architectural style that uses HTTP methods...",
            time_taken=180,
            submitted_at=datetime.utcnow()
        )
        db.add(answer)
        db.commit()
        db.refresh(answer)
        
        # Assertions
        assert answer.id is not None
        assert answer.session_id == session.id
        assert answer.question_id == question.id
        assert answer.user_id == user.id
        assert len(answer.answer_text) > 0
        assert answer.time_taken == 180
        assert answer.submitted_at is not None


class TestAnswerDraftModel:
    """Test AnswerDraft model"""
    
    def test_create_answer_draft(self, db: Session):
        """Test creating an answer draft"""
        # Create user
        user = User(
            email="test5@example.com",
            password_hash="hashed_password",
            name="Test User 5",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        
        # Create session
        session = InterviewSession(
            user_id=user.id,
            role="Data Scientist",
            difficulty="Hard",
            status=SessionStatus.IN_PROGRESS,
            question_count=5,
            start_time=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        
        # Create question
        question = Question(
            question_text="Explain gradient descent optimization.",
            category="Technical",
            difficulty="Hard",
            role="Data Scientist",
            expected_answer_points=["Definition", "Algorithm", "Applications"],
            time_limit_seconds=300
        )
        db.add(question)
        db.commit()
        
        # Create answer draft
        draft = AnswerDraft(
            session_id=session.id,
            question_id=question.id,
            user_id=user.id,
            draft_text="Gradient descent is an optimization algorithm...",
            last_saved_at=datetime.utcnow()
        )
        db.add(draft)
        db.commit()
        db.refresh(draft)
        
        # Assertions
        assert draft.id is not None
        assert draft.session_id == session.id
        assert draft.question_id == question.id
        assert draft.user_id == user.id
        assert len(draft.draft_text) > 0
        assert draft.last_saved_at is not None


class TestEvaluationModel:
    """Test Evaluation model"""
    
    def test_create_evaluation(self, db: Session):
        """Test creating an evaluation"""
        # Create user
        user = User(
            email="test6@example.com",
            password_hash="hashed_password",
            name="Test User 6",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        
        # Create session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.IN_PROGRESS,
            question_count=5,
            start_time=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        
        # Create question
        question = Question(
            question_text="Describe your experience with microservices.",
            category="Technical",
            difficulty="Medium",
            role="Software Engineer",
            expected_answer_points=["Architecture", "Benefits", "Challenges"],
            time_limit_seconds=300
        )
        db.add(question)
        db.commit()
        
        # Create answer
        answer = Answer(
            session_id=session.id,
            question_id=question.id,
            user_id=user.id,
            answer_text="I have worked with microservices architecture...",
            time_taken=200,
            submitted_at=datetime.utcnow()
        )
        db.add(answer)
        db.commit()
        
        # Create evaluation
        evaluation = Evaluation(
            answer_id=answer.id,
            content_quality=85.0,
            clarity=80.0,
            confidence=75.0,
            technical_accuracy=90.0,
            overall_score=83.0,
            strengths=["Clear explanation", "Good examples", "Technical depth"],
            improvements=["Add more specific metrics", "Discuss trade-offs"],
            suggestions=["Mention specific tools used", "Quantify impact"],
            example_answer="An ideal answer would include...",
            provider_name="groq",
            evaluated_at=datetime.utcnow()
        )
        db.add(evaluation)
        db.commit()
        db.refresh(evaluation)
        
        # Assertions
        assert evaluation.id is not None
        assert evaluation.answer_id == answer.id
        assert evaluation.content_quality == 85.0
        assert evaluation.clarity == 80.0
        assert evaluation.confidence == 75.0
        assert evaluation.technical_accuracy == 90.0
        assert evaluation.overall_score == 83.0
        assert len(evaluation.strengths) == 3
        assert len(evaluation.improvements) == 2
        assert len(evaluation.suggestions) == 2
        assert evaluation.provider_name == "groq"


class TestSessionSummaryModel:
    """Test SessionSummary model"""
    
    def test_create_session_summary(self, db: Session):
        """Test creating a session summary"""
        # Create user
        user = User(
            email="test7@example.com",
            password_hash="hashed_password",
            name="Test User 7",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        
        # Create session
        session = InterviewSession(
            user_id=user.id,
            role="Product Manager",
            difficulty="Medium",
            status=SessionStatus.COMPLETED,
            question_count=5,
            start_time=datetime.utcnow() - timedelta(hours=1),
            end_time=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        
        # Create session summary
        summary = SessionSummary(
            session_id=session.id,
            overall_session_score=82.5,
            avg_content_quality=85.0,
            avg_clarity=80.0,
            avg_confidence=78.0,
            avg_technical_accuracy=87.0,
            score_trend=5.2,
            previous_session_score=78.3,
            top_strengths=["Clear communication", "Good examples", "Structured answers"],
            top_improvements=["Add more metrics", "Discuss trade-offs", "Mention tools"],
            category_performance={"Technical": 85.0, "Behavioral": 80.0},
            radar_chart_data={"content": 85, "clarity": 80, "confidence": 78, "technical": 87},
            line_chart_data=[{"date": "2026-02-01", "score": 75}, {"date": "2026-02-12", "score": 82.5}],
            total_questions=5,
            total_time_seconds=1500,
            generated_at=datetime.utcnow()
        )
        db.add(summary)
        db.commit()
        db.refresh(summary)
        
        # Assertions
        assert summary.id is not None
        assert summary.session_id == session.id
        assert summary.overall_session_score == 82.5
        assert summary.avg_content_quality == 85.0
        assert summary.score_trend == 5.2
        assert len(summary.top_strengths) == 3
        assert len(summary.top_improvements) == 3
        assert "Technical" in summary.category_performance
        assert summary.total_questions == 5
        assert summary.total_time_seconds == 1500


class TestModelRelationships:
    """Test relationships between models"""
    
    def test_session_to_questions_relationship(self, db: Session):
        """Test session to session_questions relationship"""
        # Create user
        user = User(
            email="test8@example.com",
            password_hash="hashed_password",
            name="Test User 8",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        
        # Create session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.IN_PROGRESS,
            question_count=2,
            start_time=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        
        # Create questions
        q1 = Question(
            question_text="Question 1",
            category="Technical",
            difficulty="Medium",
            role="Software Engineer",
            expected_answer_points=["Point 1", "Point 2", "Point 3"],
            time_limit_seconds=300
        )
        q2 = Question(
            question_text="Question 2",
            category="Behavioral",
            difficulty="Medium",
            role="Software Engineer",
            expected_answer_points=["Point 1", "Point 2", "Point 3"],
            time_limit_seconds=300
        )
        db.add_all([q1, q2])
        db.commit()
        
        # Create session questions
        sq1 = SessionQuestion(session_id=session.id, question_id=q1.id, display_order=1, status="pending")
        sq2 = SessionQuestion(session_id=session.id, question_id=q2.id, display_order=2, status="pending")
        db.add_all([sq1, sq2])
        db.commit()
        
        # Test relationship
        db.refresh(session)
        assert len(session.session_questions) == 2
        assert session.session_questions[0].display_order in [1, 2]
        assert session.session_questions[1].display_order in [1, 2]
    
    def test_cascade_delete(self, db: Session):
        """Test cascade delete from session to related records"""
        # Create user
        user = User(
            email="test9@example.com",
            password_hash="hashed_password",
            name="Test User 9",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        
        # Create session
        session = InterviewSession(
            user_id=user.id,
            role="Software Engineer",
            difficulty="Medium",
            status=SessionStatus.IN_PROGRESS,
            question_count=1,
            start_time=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        
        # Create question
        question = Question(
            question_text="Test question",
            category="Technical",
            difficulty="Medium",
            role="Software Engineer",
            expected_answer_points=["Point 1", "Point 2", "Point 3"],
            time_limit_seconds=300
        )
        db.add(question)
        db.commit()
        
        # Create session question
        sq = SessionQuestion(session_id=session.id, question_id=question.id, display_order=1, status="pending")
        db.add(sq)
        db.commit()
        
        session_id = session.id
        sq_id = sq.id
        
        # Delete session
        db.delete(session)
        db.commit()
        
        # Verify cascade delete
        deleted_sq = db.query(SessionQuestion).filter(SessionQuestion.id == sq_id).first()
        assert deleted_sq is None
