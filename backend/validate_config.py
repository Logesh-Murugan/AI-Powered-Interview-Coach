"""
Configuration Validation Script
Run this to verify your database and configuration are correct
"""

import sys
from colorama import init, Fore, Style

# Initialize colorama for Windows
init()

def print_success(message):
    print(f"{Fore.GREEN}✅ {message}{Style.RESET_ALL}")

def print_error(message):
    print(f"{Fore.RED}❌ {message}{Style.RESET_ALL}")

def print_warning(message):
    print(f"{Fore.YELLOW}⚠️  {message}{Style.RESET_ALL}")

def print_info(message):
    print(f"{Fore.CYAN}ℹ️  {message}{Style.RESET_ALL}")

def main():
    print(f"\n{Fore.CYAN}{'='*60}")
    print("  Configuration Validation")
    print(f"{'='*60}{Style.RESET_ALL}\n")
    
    # Test 1: Import configuration
    print(f"{Fore.YELLOW}Test 1: Loading configuration...{Style.RESET_ALL}")
    try:
        from app.config import settings
        print_success("Configuration loaded")
        print_info(f"App Name: {settings.APP_NAME}")
        print_info(f"Environment: {settings.ENVIRONMENT}")
        print_info(f"Debug Mode: {settings.DEBUG}")
    except Exception as e:
        print_error(f"Failed to load configuration: {e}")
        return False
    
    # Test 2: Database URL
    print(f"\n{Fore.YELLOW}Test 2: Validating database URL...{Style.RESET_ALL}")
    try:
        db_url = settings.DATABASE_URL
        if "postgresql://" in db_url:
            print_success("Database URL format is correct")
            # Parse URL
            parts = db_url.replace("postgresql://", "").split("@")
            if len(parts) == 2:
                user_pass = parts[0].split(":")
                host_db = parts[1].split("/")
                print_info(f"User: {user_pass[0]}")
                print_info(f"Host: {host_db[0].split(':')[0]}")
                print_info(f"Database: {host_db[1] if len(host_db) > 1 else 'N/A'}")
            
            # Check for special characters
            if "@" in db_url.split("://")[1].split("@")[0]:
                if "%40" not in db_url:
                    print_warning("Password contains @ but not URL encoded")
                    print_info("Consider encoding @ as %40")
                else:
                    print_success("Password is properly URL encoded")
        else:
            print_error("Invalid database URL format")
            return False
    except Exception as e:
        print_error(f"Database URL validation failed: {e}")
        return False
    
    # Test 3: Database connection
    print(f"\n{Fore.YELLOW}Test 3: Testing database connection...{Style.RESET_ALL}")
    try:
        from app.database import engine
        conn = engine.connect()
        print_success("Database connection successful")
        conn.close()
    except Exception as e:
        print_error(f"Database connection failed: {e}")
        print_info("Make sure PostgreSQL is running")
        print_info("Check your DATABASE_URL in .env file")
        return False
    
    # Test 4: Database session
    print(f"\n{Fore.YELLOW}Test 4: Testing database session...{Style.RESET_ALL}")
    try:
        from app.database import SessionLocal
        db = SessionLocal()
        print_success("Database session created")
        db.close()
    except Exception as e:
        print_error(f"Session creation failed: {e}")
        return False
    
    # Test 5: Check tables
    print(f"\n{Fore.YELLOW}Test 5: Checking database tables...{Style.RESET_ALL}")
    try:
        from app.database import engine
        from sqlalchemy import inspect
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        expected_tables = ['users', 'refresh_tokens', 'password_reset_tokens', 'alembic_version']
        
        for table in expected_tables:
            if table in tables:
                print_success(f"Table '{table}' exists")
            else:
                print_warning(f"Table '{table}' not found")
                print_info("Run: alembic upgrade head")
        
        if len(tables) == 0:
            print_warning("No tables found")
            print_info("Run migrations: alembic upgrade head")
        
    except Exception as e:
        print_error(f"Table check failed: {e}")
        return False
    
    # Test 6: Test models
    print(f"\n{Fore.YELLOW}Test 6: Testing database models...{Style.RESET_ALL}")
    try:
        from app.models.user import User
        from app.models.refresh_token import RefreshToken
        from app.models.password_reset_token import PasswordResetToken
        from app.database import SessionLocal
        
        db = SessionLocal()
        
        # Test User model
        user_count = db.query(User).count()
        print_success(f"User model accessible (count: {user_count})")
        
        # Test RefreshToken model
        token_count = db.query(RefreshToken).count()
        print_success(f"RefreshToken model accessible (count: {token_count})")
        
        # Test PasswordResetToken model
        reset_count = db.query(PasswordResetToken).count()
        print_success(f"PasswordResetToken model accessible (count: {reset_count})")
        
        db.close()
    except Exception as e:
        print_error(f"Model test failed: {e}")
        print_info("Make sure migrations are run: alembic upgrade head")
        return False
    
    # Test 7: Redis connection
    print(f"\n{Fore.YELLOW}Test 7: Testing Redis connection...{Style.RESET_ALL}")
    try:
        from app.services.cache_service import CacheService
        cache = CacheService()
        
        # Test set and get
        test_key = "test_validation_key"
        test_value = "test_value"
        cache.set(test_key, test_value, ttl=60)
        retrieved = cache.get(test_key)
        
        if retrieved == test_value:
            print_success("Redis connection successful")
            cache.delete(test_key)
        else:
            print_warning("Redis connection works but data mismatch")
    except Exception as e:
        print_warning(f"Redis connection failed: {e}")
        print_info("Redis is optional for basic testing")
        print_info("Start Redis: .\\start_redis_windows.ps1")
    
    # Test 8: Security settings
    print(f"\n{Fore.YELLOW}Test 8: Checking security settings...{Style.RESET_ALL}")
    try:
        if len(settings.SECRET_KEY) >= 32:
            print_success(f"SECRET_KEY length is adequate ({len(settings.SECRET_KEY)} chars)")
        else:
            print_warning(f"SECRET_KEY is too short ({len(settings.SECRET_KEY)} chars)")
            print_info("Should be at least 32 characters")
        
        if settings.DEBUG:
            print_warning("DEBUG mode is enabled")
            print_info("This is OK for development")
        else:
            print_success("DEBUG mode is disabled")
        
        if settings.ENVIRONMENT == "development":
            print_info("Environment: development")
        elif settings.ENVIRONMENT == "production":
            print_success("Environment: production")
        else:
            print_warning(f"Unknown environment: {settings.ENVIRONMENT}")
    except Exception as e:
        print_error(f"Security check failed: {e}")
    
    # Summary
    print(f"\n{Fore.CYAN}{'='*60}")
    print("  Validation Summary")
    print(f"{'='*60}{Style.RESET_ALL}\n")
    
    print_success("All critical tests passed!")
    print_info("Your configuration is correct and ready to use")
    
    print(f"\n{Fore.CYAN}Next Steps:{Style.RESET_ALL}")
    print("  1. Start Redis: .\\start_redis_windows.ps1")
    print("  2. Start Backend: uvicorn app.main:app --reload")
    print("  3. Start Frontend: cd ..\\frontend; npm run dev")
    print("  4. Open: http://localhost:5173\n")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Validation cancelled{Style.RESET_ALL}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Fore.RED}Unexpected error: {e}{Style.RESET_ALL}")
        sys.exit(1)
