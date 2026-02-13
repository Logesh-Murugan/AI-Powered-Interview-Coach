"""
Tests for database setup and models
"""
import pytest
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.models import User, AccountStatus, ExperienceLevel


@pytest.fixture
def test_db():
    """Create a test database"""
    # Use in-memory SQLite for testing
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_user_model_creation(test_db):
    """Test creating a user in the database"""
    user = User(
        email="test@example.com",
        password_hash="hashed_password",
        name="Test User",
        target_role="Software Engineer",
        experience_level=ExperienceLevel.MID,
        account_status=AccountStatus.ACTIVE
    )
    
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    
    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.name == "Test User"
    assert user.account_status == AccountStatus.ACTIVE
    assert user.created_at is not None
    assert user.updated_at is not None


def test_user_soft_delete(test_db):
    """Test soft delete functionality"""
    user = User(
        email="delete@example.com",
        password_hash="hashed_password",
        name="Delete User",
        account_status=AccountStatus.ACTIVE
    )
    
    test_db.add(user)
    test_db.commit()
    
    # Soft delete
    user.soft_delete()
    test_db.commit()
    
    assert user.deleted_at is not None
    assert user.is_deleted is True


def test_user_unique_email(test_db):
    """Test that email must be unique"""
    user1 = User(
        email="unique@example.com",
        password_hash="hash1",
        name="User 1",
        account_status=AccountStatus.ACTIVE
    )
    
    user2 = User(
        email="unique@example.com",
        password_hash="hash2",
        name="User 2",
        account_status=AccountStatus.ACTIVE
    )
    
    test_db.add(user1)
    test_db.commit()
    
    test_db.add(user2)
    with pytest.raises(Exception):  # Should raise IntegrityError
        test_db.commit()


def test_database_tables_exist():
    """Test that all required tables are defined"""
    # Check that User table is in metadata
    table_names = [table.name for table in Base.metadata.tables.values()]
    assert 'users' in table_names


def test_get_db_dependency():
    """Test database dependency injection"""
    db_gen = get_db()
    db = next(db_gen)
    
    assert db is not None
    
    # Cleanup
    try:
        next(db_gen)
    except StopIteration:
        pass  # Expected behavior
