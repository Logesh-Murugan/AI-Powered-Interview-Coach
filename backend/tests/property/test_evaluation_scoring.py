"""
Property-Based Tests for Evaluation Scoring

This module contains property-based tests using Hypothesis to verify
that evaluation score calculation behaves correctly across a wide range of inputs.

Requirements: 18.9
"""
import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
from sqlalchemy.orm import Session

from app.services.evaluation_service import EvaluationService


# Define valid score ranges (0-100)
VALID_SCORES = st.floats(min_value=0.0, max_value=100.0, allow_nan=False, allow_infinity=False)


class TestEvaluationScoringProperties:
    """Property-based tests for evaluation scoring"""
    
    @given(
        content_quality=VALID_SCORES,
        clarity=VALID_SCORES,
        confidence=VALID_SCORES,
        technical_accuracy=VALID_SCORES
    )
    @settings(
        max_examples=100,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_property_overall_score_within_range(
        self,
        db: Session,
        content_quality: float,
        clarity: float,
        confidence: float,
        technical_accuracy: float
    ):
        """
        Property 1: Overall score is always between 0 and 100
        
        For any valid individual scores (0-100), the calculated overall score
        must also be between 0 and 100.
        
        **Feature: interview-master-ai, Property 1: Overall score within range**
        **Validates: Requirements 18.9**
        
        Args:
            db: Database session fixture
            content_quality: Random score 0-100
            clarity: Random score 0-100
            confidence: Random score 0-100
            technical_accuracy: Random score 0-100
        """
        # Initialize service
        service = EvaluationService(db)
        
        # Create evaluation data
        evaluation_data = {
            'content_quality': content_quality,
            'clarity': clarity,
            'confidence': confidence,
            'technical_accuracy': technical_accuracy
        }
        
        # Calculate overall score
        overall_score = service._calculate_overall_score(evaluation_data)
        
        # Property assertion: overall score must be between 0 and 100
        assert 0.0 <= overall_score <= 100.0, (
            f"Overall score {overall_score} is out of range [0, 100] "
            f"for scores: content_quality={content_quality}, clarity={clarity}, "
            f"confidence={confidence}, technical_accuracy={technical_accuracy}"
        )
    
    @given(
        content_quality=VALID_SCORES,
        clarity=VALID_SCORES,
        confidence=VALID_SCORES,
        technical_accuracy=VALID_SCORES
    )
    @settings(
        max_examples=100,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_property_score_calculation_deterministic(
        self,
        db: Session,
        content_quality: float,
        clarity: float,
        confidence: float,
        technical_accuracy: float
    ):
        """
        Property 2: Score calculation is deterministic
        
        For the same input scores, the overall score calculation should
        always return the same result (same inputs = same output).
        
        **Feature: interview-master-ai, Property 2: Deterministic calculation**
        **Validates: Requirements 18.9**
        
        Args:
            db: Database session fixture
            content_quality: Random score 0-100
            clarity: Random score 0-100
            confidence: Random score 0-100
            technical_accuracy: Random score 0-100
        """
        # Initialize service
        service = EvaluationService(db)
        
        # Create evaluation data
        evaluation_data = {
            'content_quality': content_quality,
            'clarity': clarity,
            'confidence': confidence,
            'technical_accuracy': technical_accuracy
        }
        
        # Calculate overall score twice
        overall_score_1 = service._calculate_overall_score(evaluation_data)
        overall_score_2 = service._calculate_overall_score(evaluation_data)
        
        # Property assertion: same inputs must produce same output
        assert overall_score_1 == overall_score_2, (
            f"Score calculation is not deterministic: "
            f"first={overall_score_1}, second={overall_score_2}"
        )
    
    @given(
        content_quality=VALID_SCORES,
        clarity=VALID_SCORES,
        confidence=VALID_SCORES,
        technical_accuracy=VALID_SCORES
    )
    @settings(
        max_examples=100,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_property_weighted_average_formula(
        self,
        db: Session,
        content_quality: float,
        clarity: float,
        confidence: float,
        technical_accuracy: float
    ):
        """
        Property 3: Overall score respects weighted average formula
        
        The overall score must equal the weighted average:
        (content_quality * 0.4) + (clarity * 0.2) + (confidence * 0.2) + (technical_accuracy * 0.2)
        
        **Feature: interview-master-ai, Property 3: Weighted average formula**
        **Validates: Requirements 18.9**
        
        Args:
            db: Database session fixture
            content_quality: Random score 0-100
            clarity: Random score 0-100
            confidence: Random score 0-100
            technical_accuracy: Random score 0-100
        """
        # Initialize service
        service = EvaluationService(db)
        
        # Create evaluation data
        evaluation_data = {
            'content_quality': content_quality,
            'clarity': clarity,
            'confidence': confidence,
            'technical_accuracy': technical_accuracy
        }
        
        # Calculate overall score using service
        overall_score = service._calculate_overall_score(evaluation_data)
        
        # Calculate expected score manually
        expected_score = (
            content_quality * 0.4 +
            clarity * 0.2 +
            confidence * 0.2 +
            technical_accuracy * 0.2
        )
        expected_score = round(expected_score, 2)
        
        # Property assertion: calculated score must match formula
        assert overall_score == expected_score, (
            f"Overall score {overall_score} does not match expected {expected_score} "
            f"for scores: content_quality={content_quality}, clarity={clarity}, "
            f"confidence={confidence}, technical_accuracy={technical_accuracy}"
        )
    
    @given(
        content_quality=VALID_SCORES
    )
    @settings(
        max_examples=100,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_property_content_quality_has_highest_weight(
        self,
        db: Session,
        content_quality: float
    ):
        """
        Property 4: Content quality has highest impact (40% weight)
        
        When content_quality changes and other scores are constant,
        the overall score should change by 0.4 * delta.
        
        **Feature: interview-master-ai, Property 4: Content quality weight**
        **Validates: Requirements 18.9**
        
        Args:
            db: Database session fixture
            content_quality: Random score 0-100
        """
        # Initialize service
        service = EvaluationService(db)
        
        # Fixed scores for other criteria
        fixed_scores = {
            'clarity': 50.0,
            'confidence': 50.0,
            'technical_accuracy': 50.0
        }
        
        # Calculate score with original content_quality
        evaluation_data_1 = {
            'content_quality': content_quality,
            **fixed_scores
        }
        overall_score_1 = service._calculate_overall_score(evaluation_data_1)
        
        # Calculate score with content_quality + 10 (if within range)
        if content_quality <= 90.0:
            evaluation_data_2 = {
                'content_quality': content_quality + 10.0,
                **fixed_scores
            }
            overall_score_2 = service._calculate_overall_score(evaluation_data_2)
            
            # Expected change: 10 * 0.4 = 4.0
            expected_change = 4.0
            actual_change = overall_score_2 - overall_score_1
            
            # Property assertion: change should match weight (with small tolerance for rounding)
            assert abs(actual_change - expected_change) < 0.01, (
                f"Content quality weight incorrect: expected change {expected_change}, "
                f"got {actual_change}"
            )
    
    @given(
        score=st.floats(min_value=-100.0, max_value=200.0, allow_nan=False, allow_infinity=False)
    )
    @settings(
        max_examples=100,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_property_score_validation_rejects_invalid(
        self,
        db: Session,
        score: float
    ):
        """
        Property 5: Score validation rejects invalid inputs
        
        Scores outside the range [0, 100] should be rejected by validation.
        
        **Feature: interview-master-ai, Property 5: Score validation**
        **Validates: Requirements 18.8**
        
        Args:
            db: Database session fixture
            score: Random score (including invalid values)
        """
        # Initialize service
        service = EvaluationService(db)
        
        # Create evaluation data with the test score
        evaluation_data = {
            'content_quality': score,
            'clarity': score,
            'confidence': score,
            'technical_accuracy': score
        }
        
        # Property assertion: validation should reject invalid scores
        if score < 0.0 or score > 100.0:
            with pytest.raises(ValueError, match="must be between 0 and 100"):
                service._validate_scores(evaluation_data)
        else:
            # Valid scores should not raise exception
            service._validate_scores(evaluation_data)
    
    @given(
        content_quality=VALID_SCORES,
        clarity=VALID_SCORES,
        confidence=VALID_SCORES,
        technical_accuracy=VALID_SCORES
    )
    @settings(
        max_examples=100,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_property_score_precision_two_decimals(
        self,
        db: Session,
        content_quality: float,
        clarity: float,
        confidence: float,
        technical_accuracy: float
    ):
        """
        Property 6: Overall score is rounded to 2 decimal places
        
        The overall score should always have at most 2 decimal places.
        
        **Feature: interview-master-ai, Property 6: Score precision**
        **Validates: Requirements 18.9**
        
        Args:
            db: Database session fixture
            content_quality: Random score 0-100
            clarity: Random score 0-100
            confidence: Random score 0-100
            technical_accuracy: Random score 0-100
        """
        # Initialize service
        service = EvaluationService(db)
        
        # Create evaluation data
        evaluation_data = {
            'content_quality': content_quality,
            'clarity': clarity,
            'confidence': confidence,
            'technical_accuracy': technical_accuracy
        }
        
        # Calculate overall score
        overall_score = service._calculate_overall_score(evaluation_data)
        
        # Property assertion: score should have at most 2 decimal places
        # Convert to string and check decimal places
        score_str = str(overall_score)
        if '.' in score_str:
            decimal_places = len(score_str.split('.')[1])
            assert decimal_places <= 2, (
                f"Overall score {overall_score} has more than 2 decimal places"
            )
