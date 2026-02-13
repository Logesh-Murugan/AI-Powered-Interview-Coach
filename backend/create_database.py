"""
Create Database Without psql
This script creates the database and user using Python (no psql required!)
"""

import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from getpass import getpass

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_info(message):
    print(f"ℹ️  {message}")

def print_warning(message):
    print(f"⚠️  {message}")

def main():
    print("\n" + "="*60)
    print("  Create Database - No psql Required!")
    print("="*60 + "\n")
    
    # Get postgres password
    print("Enter the password for PostgreSQL 'postgres' user:")
    postgres_password = getpass()
    
    # Database configuration
    db_name = "interviewmaster"
    db_user = "user"
    db_password = "lok@king7"  # Your password from .env
    
    print(f"\nCreating database: {db_name}")
    print(f"Creating user: {db_user}\n")
    
    try:
        # Connect to PostgreSQL as postgres user
        print("Step 1: Connecting to PostgreSQL...")
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            user="postgres",
            password=postgres_password,
            database="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        print_success("Connected to PostgreSQL")
        
        # Check if database exists
        print("\nStep 2: Checking if database exists...")
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (db_name,)
        )
        db_exists = cursor.fetchone()
        
        if db_exists:
            print_warning(f"Database '{db_name}' already exists")
        else:
            # Create database
            print(f"Creating database '{db_name}'...")
            cursor.execute(f'CREATE DATABASE "{db_name}"')
            print_success(f"Database '{db_name}' created")
        
        # Check if user exists
        print("\nStep 3: Checking if user exists...")
        cursor.execute(
            "SELECT 1 FROM pg_user WHERE usename = %s",
            (db_user,)
        )
        user_exists = cursor.fetchone()
        
        if user_exists:
            print_warning(f"User '{db_user}' already exists")
        else:
            # Create user
            print(f"Creating user '{db_user}'...")
            cursor.execute(
                f"CREATE USER \"{db_user}\" WITH PASSWORD %s",
                (db_password,)
            )
            print_success(f"User '{db_user}' created")
        
        # Grant privileges
        print("\nStep 4: Granting privileges...")
        cursor.execute(
            f'GRANT ALL PRIVILEGES ON DATABASE "{db_name}" TO "{db_user}"'
        )
        print_success("Privileges granted")
        
        cursor.close()
        conn.close()
        
        # Connect to the new database to grant schema privileges
        print("\nStep 5: Granting schema privileges...")
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            user="postgres",
            password=postgres_password,
            database=db_name
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        cursor.execute(f'GRANT ALL ON SCHEMA public TO "{db_user}"')
        cursor.execute(
            f'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "{db_user}"'
        )
        cursor.execute(
            f'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "{db_user}"'
        )
        cursor.execute(
            f'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "{db_user}"'
        )
        cursor.execute(
            f'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "{db_user}"'
        )
        print_success("Schema privileges granted")
        
        cursor.close()
        conn.close()
        
        # Test connection with new user
        print("\nStep 6: Testing connection with new user...")
        test_conn = psycopg2.connect(
            host="localhost",
            port=5432,
            user=db_user,
            password=db_password,
            database=db_name
        )
        test_conn.close()
        print_success("Connection test successful")
        
        print("\n" + "="*60)
        print("  Database Setup Complete! ✅")
        print("="*60 + "\n")
        
        print("Database Details:")
        print(f"  Database: {db_name}")
        print(f"  User: {db_user}")
        print(f"  Password: {db_password}")
        print(f"  Host: localhost")
        print(f"  Port: 5432\n")
        
        print("Next Steps:")
        print("  1. Run migrations: alembic upgrade head")
        print("  2. Start Redis: .\\start_redis_windows.ps1")
        print("  3. Start Backend: uvicorn app.main:app --reload")
        print("  4. Start Frontend: cd ..\\frontend; npm run dev\n")
        
        return True
        
    except psycopg2.OperationalError as e:
        print_error(f"Connection failed: {e}")
        print_info("Make sure PostgreSQL is running")
        print_info("Check your postgres password")
        return False
        
    except psycopg2.Error as e:
        print_error(f"Database error: {e}")
        return False
        
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        return False

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup cancelled")
        sys.exit(1)
