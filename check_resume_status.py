"""
Check resume status in database
"""
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Add backend to path
sys.path.insert(0, 'backend')

load_dotenv('backend/.env')

# Get database URL
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in .env")
    sys.exit(1)

# Create engine
engine = create_engine(DATABASE_URL)

print("=" * 70)
print("RESUME STATUS CHECK")
print("=" * 70)

# Check recent resumes
print("\nRecent Resumes:")
print("-" * 70)

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT id, filename, status, file_size, 
               TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
        FROM resumes 
        ORDER BY created_at DESC 
        LIMIT 5
    """))
    
    rows = result.fetchall()
    
    if not rows:
        print("No resumes found in database")
    else:
        for row in rows:
            print(f"\nID: {row[0]}")
            print(f"Filename: {row[1]}")
            print(f"Status: {row[2]}")
            print(f"Size: {row[3]} bytes")
            print(f"Created: {row[4]}")
            print("-" * 70)

# Check if any have extracted text
print("\nResumes with Extracted Text:")
print("-" * 70)

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT id, filename, 
               LENGTH(extracted_text) as text_length,
               LEFT(extracted_text, 100) as preview
        FROM resumes 
        WHERE extracted_text IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 3
    """))
    
    rows = result.fetchall()
    
    if not rows:
        print("No resumes with extracted text found")
    else:
        for row in rows:
            print(f"\nID: {row[0]}")
            print(f"Filename: {row[1]}")
            print(f"Text Length: {row[2]} characters")
            print(f"Preview: {row[3]}...")
            print("-" * 70)

# Check if any have skills
print("\nResumes with Extracted Skills:")
print("-" * 70)

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT id, filename, skills
        FROM resumes 
        WHERE skills IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 3
    """))
    
    rows = result.fetchall()
    
    if not rows:
        print("No resumes with extracted skills found")
    else:
        for row in rows:
            print(f"\nID: {row[0]}")
            print(f"Filename: {row[1]}")
            print(f"Skills: {row[2]}")
            print("-" * 70)

print("\n" + "=" * 70)
print("Check complete!")
print("=" * 70)
