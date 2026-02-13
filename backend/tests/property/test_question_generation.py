"""
Property-Based Tests for Question Generation

This module contains property-based tests using Hypothesis to verify
that question generation behaves correctly across a wide range of inputs.

Requirements: 12.14
"""
import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
from sqlalchemy.orm import Session

from app.services.question_service import QuestionService


# Define valid values for question generation
VALID_ROLES = st.sampled_from([
    "Software Engineer",
    "Data Scientist",
    "Product Manager",
    "DevOps Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Machine Learning Engineer"
])

VALID_DIFFICULTIES = st.sampled_from(["Easy", "Medium", "Hard", "Expert"])

VALID_QUESTION_COUNTS = st.integers(min_value=1, max_value=20)

VALID_CATEGORIES = st.lists(
    st.sampled_from(["Technical", "Behavioral", "Domain_Specific", "System_Design", "Coding"]),
    min_size=0,
    max_size=5,
    unique=True
)


class TestQuestionGenerationProperties:
    """Property-based tests for question generation"""
    
    @given(
        role=VALID_ROLES,
        difficulty=VALID_DIFFICULTIES,
        question_count=VALID_QUESTION_COUNTS
    )
    @settings(
        max_examples=100,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_property_question_count_matches_request(
        self,
        db: Session,
        mocker,
        role: str,
        difficulty: str,
        question_count: int
    ):
        """
        Property 1: Question count matches request
        
        For any valid role, difficulty, and question count (1-20),
        the question generation service should return exactly the
        requested number of questions.
        
        **Feature: interview-master-ai, Property 1: Question count matches request**
        **Validates: Requirements 12.14**
        
        Args:
            db: Database session fixture
            mocker: Pytest mocker fixture
            role: Random valid job role
            difficulty: Random valid difficulty level
            question_count: Random valid question count (1-20)
        """
        # Mock the AI generation to return the correct number of questions
        def mock_generate_with_ai(role, difficulty, question_count, categories=None):
            """Mock AI generation that returns exactly question_count questions"""
            questions = []
            for i in range(question_count):
                questions.append({
                    'id': i + 1,
                    'question_text': f'Test question {i+1} for {role}',
                    'category': 'Technical',
                    'difficulty': difficulty,
                    'role': role,
                    'expected_answer_points': ['Point 1', 'Point 2', 'Point 3'],
                    'time_limit_seconds': 300,
                    'usage_count': 0,
                    'created_at': '2026-02-12T19:00:00'
                })
            return questions
        
        # Mock cache to always miss
        mocker.patch.object(QuestionService, '_get_from_cache', return_value=None)
        mocker.patch.object(QuestionService, '_cache_questions', return_value=None)
        
        # Mock database query to return empty (no existing questions)
        mocker.patch.object(QuestionService, '_get_from_database', return_value=[])
        
        # Mock the AI generation method
        mocker.patch.object(
            QuestionService,
            '_generate_with_ai',
            side_effect=mock_generate_with_ai
        )
        
        # Initialize service and generate questions
        service = QuestionService(db)
        result = service.generate(
            role=role,
            difficulty=difficulty,
            question_count=question_count,
            categories=None
        )
        
        # Property assertion: returned count must match requested count
        assert len(result) == question_count, (
            f"Expected {question_count} questions, but got {len(result)} "
            f"for role='{role}', difficulty='{difficulty}'"
        )
        
        # Additional assertions to ensure data integrity
        for i, question in enumerate(result):
            assert 'question_text' in question, f"Question {i} missing 'question_text'"
            assert 'category' in question, f"Question {i} missing 'category'"
            assert 'difficulty' in question, f"Question {i} missing 'difficulty'"
            assert 'role' in question, f"Question {i} missing 'role'"
            assert question['difficulty'] == difficulty, (
                f"Question {i} has wrong difficulty: {question['difficulty']} != {difficulty}"
            )
            assert question['role'] == role, (
                f"Question {i} has wrong role: {question['role']} != {role}"
            )
    
    @given(
        role=VALID_ROLES,
        difficulty=VALID_DIFFICULTIES,
        question_count=VALID_QUESTION_COUNTS,
        categories=VALID_CATEGORIES
    )
    @settings(
        max_examples=100,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_property_question_count_with_categories(
        self,
        db: Session,
        mocker,
        role: str,
        difficulty: str,
        question_count: int,
        categories: list
    ):
        """
        Property 2: Question count matches request with categories
        
        For any valid role, difficulty, question count, and categories,
        the question generation service should return exactly the
        requested number of questions, regardless of category filters.
        
        **Feature: interview-master-ai, Property 2: Question count with categories**
        **Validates: Requirements 12.14**
        
        Args:
            db: Database session fixture
            mocker: Pytest mocker fixture
            role: Random valid job role
            difficulty: Random valid difficulty level
            question_count: Random valid question count (1-20)
            categories: Random list of valid categories
        """
        # Skip if categories list is empty (tested in other property)
        if not categories:
            return
        
        # Mock the AI generation to return the correct number of questions
        def mock_generate_with_ai(role, difficulty, question_count, categories=None):
            """Mock AI generation that returns exactly question_count questions"""
            questions = []
            for i in range(question_count):
                # Cycle through provided categories
                category = categories[i % len(categories)] if categories else 'Technical'
                questions.append({
                    'id': i + 1,
                    'question_text': f'Test {category} question {i+1}',
                    'category': category,
                    'difficulty': difficulty,
                    'role': role,
                    'expected_answer_points': ['Point 1', 'Point 2', 'Point 3'],
                    'time_limit_seconds': 300,
                    'usage_count': 0,
                    'created_at': '2026-02-12T19:00:00'
                })
            return questions
        
        # Mock cache and database
        mocker.patch.object(QuestionService, '_get_from_cache', return_value=None)
        mocker.patch.object(QuestionService, '_cache_questions', return_value=None)
        mocker.patch.object(QuestionService, '_get_from_database', return_value=[])
        mocker.patch.object(
            QuestionService,
            '_generate_with_ai',
            side_effect=mock_generate_with_ai
        )
        
        # Generate questions with categories
        service = QuestionService(db)
        result = service.generate(
            role=role,
            difficulty=difficulty,
            question_count=question_count,
            categories=categories
        )
        
        # Property assertion: count must match regardless of categories
        assert len(result) == question_count, (
            f"Expected {question_count} questions with categories {categories}, "
            f"but got {len(result)}"
        )
        
        # Verify all questions have valid categories
        for question in result:
            assert question['category'] in categories, (
                f"Question category '{question['category']}' not in {categories}"
            )
