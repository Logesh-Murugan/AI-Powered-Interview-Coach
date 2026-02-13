"""
Fix User Password
The user exists but has wrong password. This script resets it.
"""

import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from getpass import getpass

def main():
    print("\n" + "="*60)
    print("  Fix User Password")
    print("="*60 + "\n")
    
    print("The database and user exist, but the password is wrong.")
    print("This script will reset the password to match your .env file.\n")
    
    # Get postgres password
    print("Enter the password for PostgreSQL 'postgres' user:")
    postgres_password = getpass()
    
    # User configuration
    db_user = "user"
    new_password = "lok@king7"  # Password from .env
    
    try:
        # Connect to PostgreSQL
        print("\nConnecting to PostgreSQL...")
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            user="postgres",
            password=postgres_password,
            database="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        print("✅ Connected")
        
        # Reset password
        print(f"\nResetting password for user '{db_user}'...")
        cursor.execute(
            f"ALTER USER \"{db_user}\" WITH PASSWORD %s",
            (new_password,)
        )
        print("✅ Password reset successful")
        
        cursor.close()
        conn.close()
        
        # Test connection with new password
        print("\nTesting connection with new password...")
        test_conn = psycopg2.connect(
            host="localhost",
            port=5432,
            user=db_user,
            password=new_password,
            database="interviewmaster"
        )
        test_conn.close()
        print("✅ Connection test successful!")
        
        print("\n" + "="*60)
        print("  Password Fixed! ✅")
        print("="*60 + "\n")
        
        print("Your database is now ready!")
        print(f"  Database: interviewmaster")
        print(f"  User: {db_user}")
        print(f"  Password: {new_password}\n")
        
        print("Next Steps:")
        print("  1. Run migrations: alembic upgrade head")
        print("  2. Start testing: cd ..; .\\START-PHASE-2-TESTING.ps1\n")
        
        return True
        
    except psycopg2.OperationalError as e:
        print(f"❌ Connection failed: {e}")
        print("ℹ️  Check your postgres password")
        return False
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Cancelled")
        sys.exit(1)
