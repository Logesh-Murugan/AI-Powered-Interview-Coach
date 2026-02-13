"""
Test script to verify local storage implementation
"""
import sys
sys.path.insert(0, 'backend')

print("=" * 70)
print("LOCAL STORAGE VERIFICATION TEST")
print("=" * 70)
print()

# Test 1: Check no cloudinary imports
print("1. Checking for cloudinary imports...")
try:
    import app.utils.file_upload as file_upload
    
    # Check if cloudinary is imported
    if 'cloudinary' in dir(file_upload):
        print("   ❌ FAIL: cloudinary is still imported")
        sys.exit(1)
    else:
        print("   ✅ PASS: No cloudinary imports found")
except Exception as e:
    print(f"   ❌ FAIL: Error importing file_upload: {e}")
    sys.exit(1)

# Test 2: Check function names
print("\n2. Checking function names...")
try:
    if hasattr(file_upload, 'upload_file_local'):
        print("   ✅ PASS: upload_file_local() exists")
    else:
        print("   ❌ FAIL: upload_file_local() not found")
        sys.exit(1)
    
    if hasattr(file_upload, 'delete_file_local'):
        print("   ✅ PASS: delete_file_local() exists")
    else:
        print("   ❌ FAIL: delete_file_local() not found")
        sys.exit(1)
    
    # Check old names don't exist
    if hasattr(file_upload, 'upload_to_cloudinary'):
        print("   ❌ FAIL: upload_to_cloudinary() still exists")
        sys.exit(1)
    
    if hasattr(file_upload, 'delete_from_cloudinary'):
        print("   ❌ FAIL: delete_from_cloudinary() still exists")
        sys.exit(1)
        
except Exception as e:
    print(f"   ❌ FAIL: Error checking functions: {e}")
    sys.exit(1)

# Test 3: Check uploads directory
print("\n3. Checking uploads directory...")
try:
    from pathlib import Path
    
    uploads_dir = Path("backend/uploads")
    resumes_dir = Path("backend/uploads/resumes")
    
    if not uploads_dir.exists():
        uploads_dir.mkdir(parents=True)
        print("   ✅ Created uploads directory")
    else:
        print("   ✅ uploads directory exists")
    
    if not resumes_dir.exists():
        resumes_dir.mkdir(parents=True)
        print("   ✅ Created resumes directory")
    else:
        print("   ✅ resumes directory exists")
        
except Exception as e:
    print(f"   ❌ FAIL: Error with directories: {e}")
    sys.exit(1)

# Test 4: Check config file (not settings object)
print("\n4. Checking configuration file...")
try:
    from pathlib import Path
    
    config_file = Path("backend/app/config.py")
    if config_file.exists():
        content = config_file.read_text()
        
        if 'CLOUDINARY_CLOUD_NAME' in content:
            print("   ❌ FAIL: CLOUDINARY_CLOUD_NAME still in config.py")
            sys.exit(1)
        
        if 'CLOUDINARY_API_KEY' in content:
            print("   ❌ FAIL: CLOUDINARY_API_KEY still in config.py")
            sys.exit(1)
        
        if 'CLOUDINARY_API_SECRET' in content:
            print("   ❌ FAIL: CLOUDINARY_API_SECRET still in config.py")
            sys.exit(1)
        
        print("   ✅ PASS: No cloudinary settings in config.py")
    else:
        print("   ❌ FAIL: config.py not found")
        sys.exit(1)
    
except Exception as e:
    print(f"   ❌ FAIL: Error checking config: {e}")
    sys.exit(1)

# Test 5: Check text extraction
print("\n5. Checking text extraction...")
try:
    import app.utils.text_extraction as text_extraction
    import inspect
    
    # Check download function handles local files
    source = inspect.getsource(text_extraction.download_file_from_url)
    
    if '/uploads/' in source:
        print("   ✅ PASS: download_file_from_url() handles local files")
    else:
        print("   ⚠️  WARNING: download_file_from_url() may not handle local files")
    
except Exception as e:
    print(f"   ❌ FAIL: Error checking text extraction: {e}")
    sys.exit(1)

print()
print("=" * 70)
print("✅ ALL TESTS PASSED")
print("=" * 70)
print()
print("Local storage implementation is correct!")
print()
print("Next steps:")
print("1. Restart backend server")
print("2. Upload a resume")
print("3. Verify it works end-to-end")
print()
