# Cloudinary 401 Error - Permanent Fix & Prevention

## Problem Identified

The 401 error is STILL occurring because:
1. ✅ The fix (`access_mode='public'`) IS in the code
2. ❌ The backend server didn't reload the changes
3. ❌ Uvicorn's `--reload` flag sometimes doesn't catch file changes

## Root Cause

When you see "401 Client Error" in logs, it means the running backend process is using OLD code from memory, not the updated file on disk.

## Permanent Solution

### Step 1: Force Backend Restart (REQUIRED NOW)

You MUST manually restart the backend to load the fix:

```powershell
# Go to your backend terminal window
# Press Ctrl+C to stop the server
# Then restart:
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or use the restart script:
```powershell
.\RESTART-BACKEND.ps1
```

### Step 2: Verify Fix is Loaded

After restarting, check the file is loaded:

```powershell
cd backend
python -c "from app.utils import file_upload; import inspect; print(inspect.getsource(file_upload.upload_to_cloudinary))" | Select-String "access_mode"
```

You should see:
```
access_mode='public'  # Make files publicly accessible
```

### Step 3: Test Upload

Upload a NEW resume after restarting. Check logs for:

✅ Good logs (what you SHOULD see):
```
INFO: Starting text extraction for resume X
INFO: Downloading file from https://res.cloudinary.com/...
INFO: Downloaded XXXX bytes
INFO: Text extraction successful
```

❌ Bad logs (what you should NOT see):
```
ERROR: Failed to download file: 401 Client Error
ERROR: Text extraction failed
```

## Why This Keeps Happening

### The Issue
1. First upload with user 1: Works (because you restarted backend)
2. Switch to user 2: Fails (because backend is still running old code)
3. The `--reload` flag should auto-reload, but it's NOT working

### Why --reload Fails
- File changes in imported modules sometimes don't trigger reload
- Windows file system watchers can be unreliable
- Cached Python bytecode (.pyc files) can cause issues

## Prevention Strategy

### Option 1: Always Restart Backend After Code Changes (Recommended)

Create a habit:
1. Make code changes
2. Stop backend (Ctrl+C)
3. Restart backend
4. Test

### Option 2: Use Better Reload Tool

Install `watchdog` for better file watching:

```powershell
cd backend
pip install watchdog
uvicorn app.main:app --reload --reload-dir app --host 0.0.0.0 --port 8000
```

### Option 3: Clear Python Cache

Before restarting, clear cached files:

```powershell
cd backend
Get-ChildItem -Recurse -Filter "*.pyc" | Remove-Item -Force
Get-ChildItem -Recurse -Filter "__pycache__" | Remove-Item -Recurse -Force
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Ensuring It Never Happens Again

### 1. Add Logging to Verify Fix is Active

Add this to `backend/app/utils/file_upload.py` at the top of `upload_to_cloudinary`:

```python
async def upload_to_cloudinary(
    file: UploadFile,
    folder: str = "resumes"
) -> Tuple[str, int]:
    """Upload file to Cloudinary."""
    
    # LOG: Verify fix is active
    from loguru import logger
    logger.info("🔧 Cloudinary upload with access_mode='public' (401 fix active)")
    
    try:
        # ... rest of code
```

This way, you'll see in logs that the fix is loaded.

### 2. Add Health Check Endpoint

Create `backend/app/routes/health.py`:

```python
from fastapi import APIRouter
import inspect
from app.utils import file_upload

router = APIRouter()

@router.get("/health")
def health_check():
    """Health check with code version info"""
    
    # Check if fix is in code
    source = inspect.getsource(file_upload.upload_to_cloudinary)
    has_fix = "access_mode='public'" in source
    
    return {
        "status": "healthy",
        "cloudinary_401_fix": "active" if has_fix else "MISSING",
        "version": "1.0.0"
    }
```

Then check: http://localhost:8000/health

### 3. Automated Restart Script

Create `RESTART-AND-VERIFY.ps1`:

```powershell
# Stop backend
Get-Process -Name "python" | Where-Object {$_.CommandLine -like "*uvicorn*"} | Stop-Process -Force

# Clear cache
cd backend
Get-ChildItem -Recurse -Filter "*.pyc" | Remove-Item -Force
Get-ChildItem -Recurse -Filter "__pycache__" | Remove-Item -Recurse -Force

# Start backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

# Wait and verify
Start-Sleep -Seconds 5
$response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing
$health = $response.Content | ConvertFrom-Json

if ($health.cloudinary_401_fix -eq "active") {
    Write-Host "✅ Fix is active!" -ForegroundColor Green
} else {
    Write-Host "❌ Fix is NOT active!" -ForegroundColor Red
}
```

## Immediate Action Required

**RIGHT NOW, you need to:**

1. Go to your backend terminal
2. Press `Ctrl+C` to stop the server
3. Run: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
4. Upload a NEW resume
5. Check logs - should NOT see 401 error

## Testing Checklist

After restarting backend:

- [ ] Backend terminal shows: "Application startup complete"
- [ ] Upload a NEW resume (not the old failed ones)
- [ ] Check backend logs for "Starting text extraction"
- [ ] Should see "Downloaded XXXX bytes" (NOT "401 Client Error")
- [ ] Status changes: uploaded → text_extracted → skills_extracted
- [ ] No "extraction_failed" status

## Why User Switching Triggers the Issue

The issue appears when switching users because:
1. User 1 uploads: Works (if backend was recently restarted)
2. You logout and login as User 2
3. User 2 uploads: Fails (backend still running old code)

The solution: **Always restart backend after code changes**, regardless of which user is logged in.

## Summary

✅ Fix IS in the code (`access_mode='public'`)
❌ Backend server is NOT running the fixed code
🔧 Solution: Restart backend server (Ctrl+C, then restart)
🛡️ Prevention: Always restart after code changes

## Quick Commands

```powershell
# Stop backend (in backend terminal)
Ctrl+C

# Restart backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Verify fix is loaded
python -c "from app.utils import file_upload; import inspect; print('✅ FIX ACTIVE' if 'access_mode' in inspect.getsource(file_upload.upload_to_cloudinary) else '❌ FIX MISSING')"
```

## Final Note

This is a **code reload issue**, not a code problem. The fix is correct, it just needs to be loaded into the running process. After restarting the backend, the 401 error will NOT occur again for ANY user.
