"""
Verify Resume model and database schema
"""
from app.database import engine
from sqlalchemy import inspect

def verify_resume_table():
    """Verify resumes table structure"""
    inspector = inspect(engine)
    
    print("=" * 60)
    print("RESUME TABLE VERIFICATION")
    print("=" * 60)
    
    # Check if table exists
    tables = inspector.get_table_names()
    print(f"\n✓ All tables: {tables}")
    
    if 'resumes' not in tables:
        print("\n✗ ERROR: resumes table not found!")
        return False
    
    print("\n✓ resumes table exists")
    
    # Check columns
    print("\n" + "=" * 60)
    print("COLUMNS:")
    print("=" * 60)
    columns = inspector.get_columns('resumes')
    for col in columns:
        print(f"  ✓ {col['name']:<30} {col['type']}")
    
    # Check required columns
    required_columns = [
        'id', 'created_at', 'updated_at', 'deleted_at',
        'user_id', 'filename', 'file_url', 'file_size',
        'extracted_text', 'skills', 'experience', 'education',
        'status', 'total_experience_months', 'seniority_level'
    ]
    
    column_names = [col['name'] for col in columns]
    missing_columns = [col for col in required_columns if col not in column_names]
    
    if missing_columns:
        print(f"\n✗ ERROR: Missing columns: {missing_columns}")
        return False
    
    print(f"\n✓ All {len(required_columns)} required columns present")
    
    # Check indexes
    print("\n" + "=" * 60)
    print("INDEXES:")
    print("=" * 60)
    indexes = inspector.get_indexes('resumes')
    for idx in indexes:
        print(f"  ✓ {idx['name']:<40} {idx['column_names']}")
    
    # Check for GIN index on skills
    print("\n" + "=" * 60)
    print("CHECKING GIN INDEX ON SKILLS:")
    print("=" * 60)
    
    # Query for GIN index
    from sqlalchemy import text
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'resumes' 
            AND indexdef LIKE '%USING gin%'
        """))
        gin_indexes = result.fetchall()
        
        if gin_indexes:
            for idx in gin_indexes:
                print(f"  ✓ {idx[0]}")
                print(f"    {idx[1]}")
        else:
            print("  ✗ ERROR: No GIN index found on skills column!")
            return False
    
    # Check foreign key
    print("\n" + "=" * 60)
    print("FOREIGN KEYS:")
    print("=" * 60)
    foreign_keys = inspector.get_foreign_keys('resumes')
    for fk in foreign_keys:
        print(f"  ✓ {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
    
    if not foreign_keys:
        print("  ✗ ERROR: No foreign key to users table!")
        return False
    
    print("\n" + "=" * 60)
    print("✓ ALL CHECKS PASSED!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    try:
        success = verify_resume_table()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
