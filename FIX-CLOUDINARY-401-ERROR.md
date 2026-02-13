# Fix Cloudinary 401 Error - Resume Upload Issue

## Problem Analysis

**Error**: `401 Client Error: OK for url: https://res.cloudinary.com/...`

**What's Happening**:
1. ✅ Resume uploads successfully to Cloudinary
2. ✅ URL is saved to database
3. ❌ Background task tries to download file for text extraction
4. ❌ Cloudinary returns 401 Unauthorized

**Root Cause**: Cloudinary URLs are expiring or authentication is missing

## Solution Options

### Option 1: Check Cloudinary Configuration (Recommended)

Check your `backend/.env` file for Cloudinary settings:

```env
# Should have these variables:
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Action**: Make sure all three are set correctly from your Cloudinary dashboard.

### Option 2: Use Signed URLs

The URLs need to be signed for download access. This is usually automatic if API credentials are correct.

### Option 3: Make Uploads Public (Quick Fix)

If you want to test quickly, you can make the uploads public in Cloudinary settings:

1. Go to Cloudinary Dashboard
2. Settings → Security
3. Enable "Resource access control" → "Public"
4. Or set upload preset to public

### Option 4: Store File Locally Instead (Alternative)

If Cloudinary continues to have issues, we can store files locally:

**Pros**:
- No external dependencies
- No authentication issues
- Faster for development

**Cons**:
- Files stored on server disk
- Need to manage storage space
- Not suitable for production scaling

## Quick Fix Steps

### Step 1: Verify Cloudinary Credentials

```powershell
# Check if .env has Cloudinary settings
cd backend
Get-Content .env | Select-String "CLOUDINARY"
```

You should see:
```
CLOUDINARY_CLOUD_NAME=dclusp263
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### Step 2: Test Cloudinary Connection

Create a test file `backend/test_cloudinary.py`:

```python
import os
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET'),
    secure=True
)

print("Cloudinary Configuration:")
print(f"Cloud Name: {cloudinary.config().cloud_name}")
print(f"API Key: {cloudinary.config().api_key}")
print(f"API Secret: {'*' * 10 if cloudinary.config().api_secret else 'NOT SET'}")

# Test upload
try:
    result = cloudinary.uploader.upload(
        "test.txt",  # Create a simple test file first
        folder="test",
        resource_type="raw"
    )
    print("\n✅ Upload successful!")
    print(f"URL: {result['secure_url']}")
    
    # Test download
    import requests
    response = requests.get(result['secure_url'])
    if response.status_code == 200:
        print("✅ Download successful!")
    else:
        print(f"❌ Download failed: {response.status_code}")
        
except Exception as e:
    print(f"❌ Error: {e}")
```

Run it:
```powershell
cd backend
python test_cloudinary.py
```

### Step 3: Fix Configuration

If credentials are missing or wrong:

1. Go to https://cloudinary.com/console
2. Copy your credentials
3. Update `backend/.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

4. Restart backend server

### Step 4: Alternative - Use Local Storage

If Cloudinary continues to have issues, we can switch to local storage:

**Edit `backend/app/utils/file_upload.py`**:

Add a local storage option:

```python
def save_file_locally(file: UploadFile, user_id: int) -> dict:
    """Save file to local uploads directory"""
    import shutil
    from pathlib import Path
    
    # Create uploads directory
    upload_dir = Path("uploads/resumes")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    timestamp = int(time.time())
    random_str = secrets.token_hex(6)
    filename = f"{user_id}_{timestamp}_{random_str}_{file.filename}"
    file_path = upload_dir / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {
        'file_url': f"/uploads/resumes/{filename}",
        'file_path': str(file_path),
        'filename': file.filename,
        'file_size': file_path.stat().st_size
    }
```

## Temporary Workaround

For now, the resume upload IS working - it's just the text extraction that's failing. You can:

1. **Upload resumes** - They will be saved ✅
2. **View resume list** - You'll see uploaded files ✅
3. **Text extraction** - Will show "extraction_failed" status ⚠️

The core functionality works, just without automatic text extraction.

## Recommended Action

**For Development**: Use local storage (simpler, no external dependencies)

**For Production**: Fix Cloudinary credentials (scalable, CDN benefits)

## Check Current Status

```powershell
# Check if Cloudinary env vars are set
cd backend
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('CLOUDINARY_CLOUD_NAME:', os.getenv('CLOUDINARY_CLOUD_NAME')); print('CLOUDINARY_API_KEY:', os.getenv('CLOUDINARY_API_KEY')[:10] + '...' if os.getenv('CLOUDINARY_API_KEY') else 'NOT SET'); print('CLOUDINARY_API_SECRET:', 'SET' if os.getenv('CLOUDINARY_API_SECRET') else 'NOT SET')"
```

## Next Steps

1. Check Cloudinary credentials in `.env`
2. If missing, add them from Cloudinary dashboard
3. Restart backend server
4. Try uploading again

Or let me know if you want to switch to local file storage instead!
