"""
Tests for database setup and models
"""
import pytest
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, AccountStatus, ExperienceLevel
from app.models.base import Base
import uuid
from app.main import app


@pytest.fixture(autouse=True)
def setup(db: Session):
    """Override get_db dependency to use test database session"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()


def test_user_model_creation(db: Session):
    """Test creating a user in the database"""
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
    db.refresh(user)
    
    assert user.id is not None
    assert user.email == unique_email
    assert user.name == "Test User"
    assert user.account_status == AccountStatus.ACTIVE
    assert user.created_at is not None
    assert user.updated_at is not None


def test_user_soft_delete(db: Session):
    """Test soft delete functionality"""
    unique_email = f"delete_{uuid.uuid4().hex[:8]}@example.com"
    user = User(
        email=unique_email,
        password_hash="hashed_password",
        name="Delete User",
        account_status=AccountStatus.ACTIVE
    )
    
    db.add(user)
    db.commit()
    
    # Soft delete
    user.soft_delete()
    db.commit()
    
    assert user.deleted_at is not None
    assert user.is_deleted is True


def test_user_unique_email(db: Session):
    """Test that email must be unique"""
    unique_email = f"unique_{uuid.uuid4().hex[:8]}@example.com"
    user1 = User(
        email=unique_email,
        password_hash="hash1",
        name="User 1",
        account_status=AccountStatus.ACTIVE
    )
    
    user2 = User(
        email=unique_email,
        password_hash="hash2",
        name="User 2",
        account_status=AccountStatus.ACTIVE
    )
    
    db.add(user1)
    db.commit()
    
    db.add(user2)
    with pytest.raises(Exception):  # Should raise IntegrityError
        db.commit()


def test_database_tables_exist(db: Session):
    """Test that all required tables are defined"""
    # Check that User table is in metadata
    table_names = [table.name for table in Base.metadata.tables.values()]
    assert 'users' in table_names


def test_get_db_dependency(db: Session):
    """Test database dependency injection"""
    db_gen = get_db()
    db = next(db_gen)
    
    assert db is not None
    
    # Cleanup
    try:
        next(db_gen)
    except StopIteration:
        pass  # Expected behavior
