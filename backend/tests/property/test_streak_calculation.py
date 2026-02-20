"""
Property-based tests for streak calculation logic.

Property 15: Streak calculation logic
Validates: Requirements 23.4, 23.6

This test suite uses Hypothesis to generate random test cases and verify
that streak calculation maintains its invariants across all inputs.
"""
import pytest
from hypothesis import given, strategies as st, assume, settings, HealthCheck
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.services.streak_service import StreakService
from app.models.user import User


# Custom strategies for generating test data
@st.composite
def time_gaps(draw):
    """Generate time gaps in hours (0-100 hours)."""
    return draw(st.floats(min_value=0.0, max_value=100.0, allow_nan=False, allow_infinity=False))


@st.composite
def streak_counts(draw):
    """Generate valid streak counts (0-100)."""
    return draw(st.integers(min_value=0, max_value=100))


class TestStreakCalculationProperties:
    """Property-based tests for streak calculation."""
    
    @given(
        hours_gap=st.floats(min_value=0.0, max_value=24.0, allow_nan=False, allow_infinity=False),
        initial_streak=st.integers(min_value=1, max_value=50)
    )
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_property_streak_increments_within_24_hours(
        self,
        db: Session,
        test_user: User,
        hours_gap: float,
        initial_streak: int
    ):
        """
        Property: Practicing within 24 hours always increments streak by exactly 1.
        
        Validates: Requirement 23.4
        """
        service = StreakService(db)
        
        # Set up user with initial streak
        current_time = datetime.utcnow()
        test_user.last_practice_date = current_time - timedelta(hours=hours_gap)
        test_user.current_streak = str(initial_streak)
        db.commit()
        
        # Calculate new streak
        new_streak = service._calculate_new_streak(
            current_time,
            test_user.last_practice_date,
            initial_streak
        )
        
        # Property: Streak should increment by exactly 1
        assert new_streak == initial_streak + 1, \
            f"Expected {initial_streak + 1}, got {new_streak} for gap of {hours_gap:.2f} hours"
    
    @given(
        hours_gap=st.floats(min_value=24.01, max_value=48.0, allow_nan=False, allow_infinity=False),
        initial_streak=st.integers(min_value=1, max_value=50)
    )
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_property_grace_period_resets_to_one(
        self,
        db: Session,
        test_user: User,
        hours_gap: float,
        initial_streak: int
    ):
        """
        Property: Gap between 24-48 hours resets streak to 1 (grace period).
        
        Validates: Requirement 23.5
        """
        service = StreakService(db)
        
        # Set up user with initial streak
        current_time = datetime.utcnow()
        test_user.last_practice_date = current_time - timedelta(hours=hours_gap)
        test_user.current_streak = str(initial_streak)
        db.commit()
        
        # Calculate new streak
        new_streak = service._calculate_new_streak(
            current_time,
            test_user.last_practice_date,
            initial_streak
        )
        
        # Property: Streak should reset to 1 (grace period)
        assert new_streak == 1, \
            f"Expected 1 (grace period), got {new_streak} for gap of {hours_gap:.2f} hours"
    
    @given(
        hours_gap=st.floats(min_value=48.01, max_value=100.0, allow_nan=False, allow_infinity=False),
        initial_streak=st.integers(min_value=1, max_value=50)
    )
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_property_long_gap_resets_to_zero(
        self,
        db: Session,
        test_user: User,
        hours_gap: float,
        initial_streak: int
    ):
        """
        Property: Gap over 48 hours resets streak to 0 (broken).
        
        Validates: Requirement 23.6
        """
        service = StreakService(db)
        
        # Set up user with initial streak
        current_time = datetime.utcnow()
        test_user.last_practice_date = current_time - timedelta(hours=hours_gap)
        test_user.current_streak = str(initial_streak)
        db.commit()
        
        # Calculate new streak
        new_streak = service._calculate_new_streak(
            current_time,
            test_user.last_practice_date,
            initial_streak
        )
        
        # Property: Streak should reset to 0 (broken)
        assert new_streak == 0, \
            f"Expected 0 (broken), got {new_streak} for gap of {hours_gap:.2f} hours"
    
    @given(
        hours_gap=st.floats(min_value=0.0, max_value=100.0, allow_nan=False, allow_infinity=False),
        initial_streak=st.integers(min_value=0, max_value=50)
    )
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_property_streak_always_non_negative(
        self,
        db: Session,
        test_user: User,
        hours_gap: float,
        initial_streak: int
    ):
        """
        Property: Streak is always non-negative (>= 0).
        """
        service = StreakService(db)
        
        # Set up user
        current_time = datetime.utcnow()
        last_practice = current_time - timedelta(hours=hours_gap) if hours_gap > 0 else None
        
        # Calculate new streak
        new_streak = service._calculate_new_streak(
            current_time,
            last_practice,
            initial_streak
        )
        
        # Property: Streak must be non-negative
        assert new_streak >= 0, \
            f"Streak cannot be negative, got {new_streak}"
    
    def test_property_boundary_exactly_24_hours(self, db: Session, test_user: User):
        """
        Property: Exactly 24 hours should increment streak.
        
        Tests boundary condition at exactly 24 hours.
        """
        service = StreakService(db)
        
        current_time = datetime.utcnow()
        test_user.last_practice_date = current_time - timedelta(hours=24)
        test_user.current_streak = "5"
        db.commit()
        
        new_streak = service._calculate_new_streak(
            current_time,
            test_user.last_practice_date,
            5
        )
        
        # At exactly 24 hours, should still increment
        assert new_streak == 6, \
            f"At exactly 24 hours, expected increment to 6, got {new_streak}"
    
    def test_property_boundary_exactly_48_hours(self, db: Session, test_user: User):
        """
        Property: Exactly 48 hours should reset to 1 (grace period).
        
        Tests boundary condition at exactly 48 hours.
        """
        service = StreakService(db)
        
        current_time = datetime.utcnow()
        test_user.last_practice_date = current_time - timedelta(hours=48)
        test_user.current_streak = "10"
        db.commit()
        
        new_streak = service._calculate_new_streak(
            current_time,
            test_user.last_practice_date,
            10
        )
        
        # At exactly 48 hours, should reset to 1 (still in grace period)
        assert new_streak == 1, \
            f"At exactly 48 hours, expected reset to 1, got {new_streak}"
    
    def test_property_first_practice_always_one(self, db: Session, test_user: User):
        """
        Property: First practice (no last_practice_date) always sets streak to 1.
        """
        service = StreakService(db)
        
        current_time = datetime.utcnow()
        
        # Calculate streak with no previous practice
        new_streak = service._calculate_new_streak(
            current_time,
            None,  # No previous practice
            0
        )
        
        # Property: First practice always results in streak of 1
        assert new_streak == 1, \
            f"First practice should set streak to 1, got {new_streak}"
    
    @given(
        initial_streak=st.integers(min_value=1, max_value=50)
    )
    @settings(max_examples=50, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_property_consecutive_practices_build_streak(
        self,
        db: Session,
        test_user: User,
        initial_streak: int
    ):
        """
        Property: Multiple consecutive practices within 24h build streak linearly.
        """
        service = StreakService(db)
        
        current_time = datetime.utcnow()
        current_streak = initial_streak
        
        # Simulate 5 consecutive practices, each 20 hours apart
        for i in range(5):
            last_practice = current_time - timedelta(hours=20)
            new_streak = service._calculate_new_streak(
                current_time,
                last_practice,
                current_streak
            )
            
            # Property: Each practice should increment by 1
            assert new_streak == current_streak + 1, \
                f"Practice {i+1}: Expected {current_streak + 1}, got {new_streak}"
            
            current_streak = new_streak
            current_time = current_time + timedelta(hours=20)
        
        # Final streak should be initial + 5
        assert current_streak == initial_streak + 5
    
    @given(
        hours_gap=st.floats(min_value=0.0, max_value=100.0, allow_nan=False, allow_infinity=False),
        initial_streak=st.integers(min_value=0, max_value=50)
    )
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_property_streak_deterministic(
        self,
        db: Session,
        test_user: User,
        hours_gap: float,
        initial_streak: int
    ):
        """
        Property: Same inputs always produce same output (deterministic).
        """
        service = StreakService(db)
        
        current_time = datetime.utcnow()
        last_practice = current_time - timedelta(hours=hours_gap) if hours_gap > 0 else None
        
        # Calculate streak twice with same inputs
        streak1 = service._calculate_new_streak(current_time, last_practice, initial_streak)
        streak2 = service._calculate_new_streak(current_time, last_practice, initial_streak)
        
        # Property: Results should be identical
        assert streak1 == streak2, \
            f"Streak calculation not deterministic: {streak1} != {streak2}"
    
    def test_property_streak_transitions(self, db: Session, test_user: User):
        """
        Property: Test all state transitions in streak calculation.
        
        Tests the complete state machine:
        - 0 -> 1 (first practice or after break)
        - N -> N+1 (within 24h)
        - N -> 1 (24-48h grace)
        - N -> 0 (over 48h)
        """
        service = StreakService(db)
        current_time = datetime.utcnow()
        
        # Transition: None -> 1 (first practice)
        streak = service._calculate_new_streak(current_time, None, 0)
        assert streak == 1, "First practice should be 1"
        
        # Transition: 1 -> 2 (within 24h)
        last_practice = current_time - timedelta(hours=20)
        streak = service._calculate_new_streak(current_time, last_practice, 1)
        assert streak == 2, "Practice within 24h should increment"
        
        # Transition: 5 -> 1 (grace period)
        last_practice = current_time - timedelta(hours=30)
        streak = service._calculate_new_streak(current_time, last_practice, 5)
        assert streak == 1, "Grace period should reset to 1"
        
        # Transition: 10 -> 0 (broken)
        last_practice = current_time - timedelta(hours=50)
        streak = service._calculate_new_streak(current_time, last_practice, 10)
        assert streak == 0, "Long gap should break streak"
    
    @given(
        streak_sequence=st.lists(
            st.floats(min_value=0.0, max_value=30.0, allow_nan=False, allow_infinity=False),
            min_size=3,
            max_size=10
        )
    )
    @settings(max_examples=50, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_property_streak_sequence_consistency(
        self,
        db: Session,
        test_user: User,
        streak_sequence: list
    ):
        """
        Property: A sequence of practices maintains streak consistency.
        
        Tests that multiple practices in sequence follow the rules consistently.
        """
        service = StreakService(db)
        
        current_time = datetime.utcnow()
        current_streak = 0
        
        for hours_gap in streak_sequence:
            last_practice = current_time - timedelta(hours=hours_gap)
            new_streak = service._calculate_new_streak(
                current_time,
                last_practice,
                current_streak
            )
            
            # Verify streak follows rules
            if hours_gap <= 24:
                assert new_streak == current_streak + 1
            elif hours_gap <= 48:
                assert new_streak == 1
            else:
                assert new_streak == 0
            
            current_streak = new_streak
            current_time = current_time + timedelta(hours=hours_gap)


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user for property tests."""
    user = User(
        email="property_test@example.com",
        password_hash="hashed_password",
        name="Property Test User",
        account_status="active"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
