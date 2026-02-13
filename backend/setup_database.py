"""
Database setup script for development
Creates the database and runs migrations
"""
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError, ProgrammingError
from app.config import settings


def create_database():
    """Create the database if it doesn't exist"""
    # Parse database URL to get database name
    db_url = settings.DATABASE_URL
    
    # For PostgreSQL, connect to 'postgres' database to create our database
    if db_url.startswith('postgresql'):
        # Extract connection info without database name
        parts = db_url.rsplit('/', 1)
        base_url = parts[0]
        db_name = parts[1] if len(parts) > 1 else 'interviewmaster'
        
        # Connect to postgres database
        admin_url = f"{base_url}/postgres"
        
        try:
            engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
            with engine.connect() as conn:
                # Check if database exists
                result = conn.execute(
                    text(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'")
                )
                exists = result.fetchone()
                
                if not exists:
                    print(f"Creating database '{db_name}'...")
                    conn.execute(text(f"CREATE DATABASE {db_name}"))
                    print(f"✓ Database '{db_name}' created successfully")
                else:
                    print(f"✓ Database '{db_name}' already exists")
            
            engine.dispose()
            return True
            
        except OperationalError as e:
            print(f"✗ Failed to connect to PostgreSQL: {e}")
            print("\nPlease ensure PostgreSQL is running and credentials are correct.")
            print("You can install PostgreSQL or use Docker:")
            print("  docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15")
            return False
    
    elif db_url.startswith('sqlite'):
        print("✓ Using SQLite - database will be created automatically")
        return True
    
    else:
        print(f"✗ Unsupported database type: {db_url}")
        return False


def test_connection():
    """Test database connection"""
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✓ Database connection successful")
        engine.dispose()
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Database Setup for InterviewMaster AI")
    print("=" * 60)
    print(f"\nDatabase URL: {settings.DATABASE_URL}")
    print()
    
    # Create database
    if not create_database():
        sys.exit(1)
    
    # Test connection
    if not test_connection():
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("Database setup complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Run migrations: alembic upgrade head")
    print("2. Start the server: uvicorn app.main:app --reload")
    print()
