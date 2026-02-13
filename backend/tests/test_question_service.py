"""
Tests for QuestionService

Requirements: 12.1-12.15, 13.1-13.10
"""
import pytest
import json
from datetime import datetime
from sqlalchemy.orm import Session

from app.services.question_service import QuestionService
from app.models.question import Question
from app.services.cache_service import CacheService


class TestQuestionService:
    """Test suite for QuestionService"""
    
    def test_generate_checks_cache_first(self, db: Session, mocker):
        """
        Test that generate() checks Redis cache first.
        
        Requirements: 12.1, 12.2, 12.3
        """
        # Mock cache to return questions
        mock_cache = mocker.Mock(spec=CacheService)
        cached_questions = [
            {
                'id': 1,
                'question_text': 'Describe your experience with Python',
                'category': 'Technical',
                'difficulty': 'Medium',
                'role': 'Software Engineer',
                'expected_answer_points': ['Point 1', 'Point 2', 'Point 3'],
                'time_limit_seconds': 300
            }
        ]
        mock_cache.get.return_value = json.dumps(cached_questions)
        
        service = QuestionService(db, cache=mock_cache)
        
        # Call generate
        result = service.generate('Software Engineer', 'Medium', 1)
        
        # Verify cache was checked
        mock_cache.get.assert_called_once()
        assert result == cached_questions
    
    def test_generate_checks_database_on_cache_miss(self, db: Session, mocker):
        """
        Test that generate() checks database when cache misses.
        
        Requirements: 12.4, 12.5
        """
        # Create question in database
        question = Question(
            question_text='Tell me about a challenging project',
            category='Behavioral',
            difficulty='Medium',
            role='Software Engineer',
            expected_answer_points=['Challenge', 'Approach', 'Result'],
            time_limit_seconds=300
        )
        db.add(question)
        db.commit()
        
        # Mock cache to return None (cache miss)
        mock_cache = mocker.Mock(spec=CacheService)
        mock_cache.get.return_value = None
        
        service = QuestionService(db, cache=mock_cache)
        
        # Call generate
        result = service.generate('Software Engineer', 'Medium', 1)
        
        # Verify database was queried and result returned
        assert len(result) == 1
        assert result[0]['question_text'] == 'Tell me about a challenging project'
        
        # Verify result was cached
        mock_cache.set.assert_called_once()
    
    def test_generate_calls_ai_when_no_cache_or_db(self, db: Session, mocker):
        """
        Test that generate() calls AI when cache and database miss.
        
        Requirements: 12.6-12.13
        """
        # Mock cache to return None
        mock_cache = mocker.Mock(spec=CacheService)
        mock_cache.get.return_value = None
        
        # Mock orchestrator
        mock_orchestrator = mocker.Mock()
        ai_response = mocker.Mock()
        ai_response.success = True
        ai_response.content = json.dumps([
            {
                'question_text': 'What is your experience with microservices?',
                'category': 'Technical',
                'difficulty': 'Medium',
                'expected_answer_points': ['Architecture', 'Communication', 'Deployment'],
                'time_limit_seconds': 300
            }
        ])
        mock_orchestrator.generate.return_value = ai_response
        
        service = QuestionService(db, cache=mock_cache)
        service.orchestrator = mock_orchestrator
        
        # Call generate
        result = service.generate('Software Engineer', 'Medium', 1)
        
        # Verify AI was called
        mock_orchestrator.generate.assert_called_once()
        
        # Verify question was stored in database
        stored_question = db.query(Question).first()
        assert stored_question is not None
        assert stored_question.question_text == 'What is your experience with microservices?'
        
        # Verify result was cached
        mock_cache.set.assert_called_once()
    
    def test_validate_question_success(self, db: Session):
        """
        Test question validation with valid question.
        
        Requirements: 13.1-13.10
        """
        service = QuestionService(db)
        
        valid_question = {
            'question_text': 'Describe a time when you had to debug a complex issue',
            'category': 'Behavioral',
            'difficulty': 'Medium',
            'expected_answer_points': ['Problem', 'Approach', 'Solution', 'Learning'],
            'time_limit_seconds': 300
        }
        
        assert service._validate_question(valid_question) is True
    
    def test_validate_question_missing_field(self, db: Session):
        """
        Test question validation fails with missing field.
        
        Requirements: 13.2
        """
        service = QuestionService(db)
        
        invalid_question = {
            'question_text': 'What is your experience?',
            'category': 'Technical',
            # Missing difficulty, expected_answer_points, time_limit_seconds
        }
        
        assert service._validate_question(invalid_question) is False
    
    def test_validate_question_text_too_short(self, db: Session):
        """
        Test question validation fails with short question text.
        
        Requirements: 13.3
        """
        service = QuestionService(db)
        
        invalid_question = {
            'question_text': 'Short',  # Less than 10 characters
            'category': 'Technical',
            'difficulty': 'Medium',
            'expected_answer_points': ['Point 1', 'Point 2', 'Point 3'],
            'time_limit_seconds': 300
        }
        
        assert service._validate_question(invalid_question) is False
    
    def test_validate_question_invalid_category(self, db: Session):
        """
        Test question validation fails with invalid category.
        
        Requirements: 13.5
        """
        service = QuestionService(db)
        
        invalid_question = {
            'question_text': 'What is your experience with Python programming?',
            'category': 'InvalidCategory',  # Not in VALID_CATEGORIES
            'difficulty': 'Medium',
            'expected_answer_points': ['Point 1', 'Point 2', 'Point 3'],
            'time_limit_seconds': 300
        }
        
        assert service._validate_question(invalid_question) is False
    
    def test_validate_question_insufficient_answer_points(self, db: Session):
        """
        Test question validation fails with insufficient answer points.
        
        Requirements: 13.6
        """
        service = QuestionService(db)
        
        invalid_question = {
            'question_text': 'What is your experience with Python programming?',
            'category': 'Technical',
            'difficulty': 'Medium',
            'expected_answer_points': ['Point 1', 'Point 2'],  # Less than 3
            'time_limit_seconds': 300
        }
        
        assert service._validate_question(invalid_question) is False
    
    def test_validate_question_invalid_time_limit(self, db: Session):
        """
        Test question validation fails with invalid time limit.
        
        Requirements: 13.7
        """
        service = QuestionService(db)
        
        invalid_question = {
            'question_text': 'What is your experience with Python programming?',
            'category': 'Technical',
            'difficulty': 'Medium',
            'expected_answer_points': ['Point 1', 'Point 2', 'Point 3'],
            'time_limit_seconds': 60  # Less than MIN_TIME_LIMIT (120)
        }
        
        assert service._validate_question(invalid_question) is False
    
    def test_construct_cache_key_consistent(self, db: Session):
        """
        Test that cache key construction is consistent.
        
        Requirements: 12.1
        """
        service = QuestionService(db)
        
        key1 = service._construct_cache_key('Software Engineer', 'Medium', 5, ['Technical', 'Behavioral'])
        key2 = service._construct_cache_key('Software Engineer', 'Medium', 5, ['Behavioral', 'Technical'])
        
        # Keys should be identical (categories sorted)
        assert key1 == key2
        assert 'software_engineer' in key1
        assert 'medium' in key1
        assert '5' in key1
    
    def test_generate_validates_difficulty(self, db: Session):
        """
        Test that generate() validates difficulty parameter.
        """
        service = QuestionService(db)
        
        with pytest.raises(ValueError, match="Invalid difficulty"):
            service.generate('Software Engineer', 'InvalidDifficulty', 1)
    
    def test_generate_validates_question_count(self, db: Session):
        """
        Test that generate() validates question_count parameter.
        """
        service = QuestionService(db)
        
        with pytest.raises(ValueError, match="question_count must be between 1 and 20"):
            service.generate('Software Engineer', 'Medium', 0)
        
        with pytest.raises(ValueError, match="question_count must be between 1 and 20"):
            service.generate('Software Engineer', 'Medium', 25)
    
    def test_generate_validates_categories(self, db: Session):
        """
        Test that generate() validates categories parameter.
        """
        service = QuestionService(db)
        
        with pytest.raises(ValueError, match="Invalid categories"):
            service.generate('Software Engineer', 'Medium', 1, categories=['InvalidCategory'])
    
    def test_cache_ttl_is_30_days(self, db: Session, mocker):
        """
        Test that questions are cached with 30-day TTL.
        
        Requirements: 12.10, 12.12
        """
        mock_cache = mocker.Mock(spec=CacheService)
        mock_cache.get.return_value = None
        
        # Create question in database
        question = Question(
            question_text='Test question',
            category='Technical',
            difficulty='Medium',
            role='Software Engineer',
            expected_answer_points=['Point 1', 'Point 2', 'Point 3'],
            time_limit_seconds=300
        )
        db.add(question)
        db.commit()
        
        service = QuestionService(db, cache=mock_cache)
        service.generate('Software Engineer', 'Medium', 1)
        
        # Verify cache.set was called with 30-day TTL
        mock_cache.set.assert_called_once()
        call_args = mock_cache.set.call_args
        assert call_args[1]['ttl'] == 30 * 24 * 60 * 60  # 30 days in seconds
