"""
Tests for Answer Evaluation Service

This module tests the answer evaluation functionality with AI scoring.

Requirements: 18.1-18.14
"""
import pytest
import uuid
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session
from datetime import datetime

from app.services.evaluation_service import EvaluationService
from app.models.user import User, AccountStatus
from app.models.question import Question
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.models.interview_session import InterviewSession
from app.models.session_question import SessionQuestion
from app.models.answer_draft import AnswerDraft
from app.models.session_summary import SessionSummary
from app.models.resume import Resume


class TestEvaluationService:
    """Test evaluation service"""
    
    def test_evaluate_answer_success(self, db: Session):
        """Test successful answer evaluation"""
        # Create user
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        user = User(
            email=unique_email,
            password_hash="hashed_password",
            name="Test User",
            target_role="Software Engineer",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create question
        question = Question(
            question_text="Explain the SOLID principles",
            category="Technical",
            difficulty="Medium",
            role="Software Engineer",
            expected_answer_points=[
                "Single Responsibility Principle",
                "Open/Closed Principle",
                "Liskov Substitution Principle",
                "Interface Segregation Principle",
                "Dependency Inversion Principle"
            ],
            time_limit_seconds=300
        )
        db.add(question)
        db.commit()
        
        # Create interview session
        from app.models.interview_session import SessionStatus
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
        db.refresh(session)
        
        # Create answer
        answer = Answer(
            session_id=session.id,
            question_id=question.id,
            user_id=user.id,
            answer_text="SOLID principles are five design principles: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion.",
            time_taken=120,
            submitted_at=datetime.utcnow()
        )
        db.add(answer)
        db.commit()
        db.refresh(answer)
        
        # Mock AI response
        mock_ai_response = """{
            "content_quality": 75,
            "clarity": 80,
            "confidence": 70,
            "technical_accuracy": 85,
            "strengths": ["Mentioned all five principles", "Clear structure", "Concise explanation"],
            "improvements": ["Could provide examples", "Could explain each principle in more detail"],
            "suggestions": ["Add real-world examples for each principle", "Explain the benefits of each principle"],
            "example_answer": "SOLID principles are five object-oriented design principles..."
        }"""
        
        # Mock AI orchestrator
        with patch.object(EvaluationService, '__init__', lambda self, db: setattr(self, 'db', db) or setattr(self, 'ai_orchestrator', Mock()) or setattr(self, 'cache_service', Mock())):
            service = EvaluationService(db)
            service.ai_orchestrator.generate = Mock(return_value=mock_ai_response)
            service.cache_service.get = Mock(return_value=None)
            service.cache_service.set = Mock()
            
            # Evaluate answer
            result = service.evaluate_answer(answer.id)
            
            # Assertions
            assert result['answer_id'] == answer.id
            assert 'evaluation_id' in result
            assert result['scores']['content_quality'] == 75
            assert result['scores']['clarity'] == 80
            assert result['scores']['confidence'] == 70
            assert result['scores']['technical_accuracy'] == 85
            
            # Check overall score calculation (weighted average)
            expected_overall = (75 * 0.4) + (80 * 0.2) + (70 * 0.2) + (85 * 0.2)
            assert result['scores']['overall_score'] == round(expected_overall, 2)
            
            assert len(result['feedback']['strengths']) == 3
            assert len(result['feedback']['improvements']) == 2
            assert len(result['feedback']['suggestions']) == 2
            assert result['feedback']['example_answer'] is not None
            
            # Verify evaluation stored in database
            evaluation = db.query(Evaluation).filter(Evaluation.answer_id == answer.id).first()
            assert evaluation is not None
            assert evaluation.overall_score == round(expected_overall, 2)
            
            # Verify answer updated with evaluation_id
            db.refresh(answer)
            assert answer.evaluation_id == evaluation.id
    
    def test_evaluate_answer_with_cache_hit(self, db: Session):
        """Test evaluation with cache hit"""
        # Create user
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        user = User(
            email=unique_email,
            password_hash="hashed_password",
            name="Test User",
            target_role="Software Engineer",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
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
        
        # Create interview session
        from app.models.interview_session import SessionStatus
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
        db.refresh(session)
        
        # Create answer
        answer = Answer(
            session_id=session.id,
            question_id=question.id,
            user_id=user.id,
            answer_text="Test answer",
            time_taken=120,
            submitted_at=datetime.utcnow()
        )
        db.add(answer)
        db.commit()
        db.refresh(answer)
        
        # Mock cached evaluation
        cached_data = {
            'content_quality': 80,
            'clarity': 75,
            'confidence': 70,
            'technical_accuracy': 85,
            'overall_score': 78.0,
            'feedback': {
                'strengths': ["Good answer"],
                'improvements': ["Could be better"],
                'suggestions': ["Practice more"],
                'example_answer': "Example"
            }
        }
        
        # Mock cache service
        with patch.object(EvaluationService, '__init__', lambda self, db: setattr(self, 'db', db) or setattr(self, 'ai_orchestrator', Mock()) or setattr(self, 'cache_service', Mock())):
            service = EvaluationService(db)
            service.cache_service.get = Mock(return_value=cached_data)
            
            # Evaluate answer
            result = service.evaluate_answer(answer.id)
            
            # Assertions
            assert result['scores']['overall_score'] == 78.0
            assert result['feedback']['strengths'] == ["Good answer"]
            
            # Verify AI was not called
            service.ai_orchestrator.generate.assert_not_called()
    
    def test_evaluate_answer_not_found(self, db: Session):
        """Test evaluation with non-existent answer"""
        with patch.object(EvaluationService, '__init__', lambda self, db: setattr(self, 'db', db) or setattr(self, 'ai_orchestrator', Mock()) or setattr(self, 'cache_service', Mock())):
            service = EvaluationService(db)
            
            with pytest.raises(ValueError, match="Answer .* not found"):
                service.evaluate_answer(99999)
    
    def test_score_validation(self, db: Session):
        """Test score validation rejects invalid scores"""
        # Create user
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        user = User(
            email=unique_email,
            password_hash="hashed_password",
            name="Test User",
            target_role="Software Engineer",
            account_status=AccountStatus.ACTIVE
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
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
        
        # Create interview session
        from app.models.interview_session import SessionStatus
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
        db.refresh(session)
        
        # Create answer
        answer = Answer(
            session_id=session.id,
            question_id=question.id,
            user_id=user.id,
            answer_text="Test answer",
            time_taken=120,
            submitted_at=datetime.utcnow()
        )
        db.add(answer)
        db.commit()
        db.refresh(answer)
        
        # Mock AI response with invalid score
        mock_ai_response = """{
            "content_quality": 150,
            "clarity": 80,
            "confidence": 70,
            "technical_accuracy": 85,
            "strengths": ["Good"],
            "improvements": ["Better"],
            "suggestions": ["Practice"]
        }"""
        
        with patch.object(EvaluationService, '__init__', lambda self, db: setattr(self, 'db', db) or setattr(self, 'ai_orchestrator', Mock()) or setattr(self, 'cache_service', Mock())):
            service = EvaluationService(db)
            service.ai_orchestrator.generate = Mock(return_value=mock_ai_response)
            service.cache_service.get = Mock(return_value=None)
            
            with pytest.raises(ValueError, match="must be between 0 and 100"):
                service.evaluate_answer(answer.id)
    
    def test_overall_score_calculation(self, db: Session):
        """Test overall score weighted average calculation"""
        with patch.object(EvaluationService, '__init__', lambda self, db: setattr(self, 'db', db)):
            service = EvaluationService(db)
            
            evaluation_data = {
                'content_quality': 80,
                'clarity': 70,
                'confidence': 60,
                'technical_accuracy': 90
            }
            
            overall_score = service._calculate_overall_score(evaluation_data)
            
            # Expected: (80 * 0.4) + (70 * 0.2) + (60 * 0.2) + (90 * 0.2) = 32 + 14 + 12 + 18 = 76
            assert overall_score == 76.0
    
    def test_answer_hash_generation(self, db: Session):
        """Test answer hash generation for caching"""
        with patch.object(EvaluationService, '__init__', lambda self, db: setattr(self, 'db', db)):
            service = EvaluationService(db)
            
            hash1 = service._generate_answer_hash("Test answer", 1)
            hash2 = service._generate_answer_hash("Test answer", 1)
            hash3 = service._generate_answer_hash("Different answer", 1)
            hash4 = service._generate_answer_hash("Test answer", 2)
            
            # Same answer and question should produce same hash
            assert hash1 == hash2
            
            # Different answer should produce different hash
            assert hash1 != hash3
            
            # Different question should produce different hash
            assert hash1 != hash4
    
    def test_feedback_extraction_with_defaults(self, db: Session):
        """Test feedback extraction provides defaults for missing fields"""
        with patch.object(EvaluationService, '__init__', lambda self, db: setattr(self, 'db', db)):
            service = EvaluationService(db)
            
            # Empty evaluation data
            evaluation_data = {}
            
            feedback = service._extract_feedback(evaluation_data)
            
            # Should have default values
            assert len(feedback['strengths']) > 0
            assert len(feedback['improvements']) > 0
            assert len(feedback['suggestions']) > 0
