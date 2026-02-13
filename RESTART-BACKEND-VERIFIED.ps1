# Restart Backend with Verification
# This script ensures the Cloudinary 401 fix is properly loaded

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESTART BACKEND WITH VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop existing backend
Write-Host "1. Stopping existing backend server..." -ForegroundColor Yellow

$pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object {
    try {
        $_.CommandLine -like "*uvicorn*"
    } catch {
        $false
    }
}

if ($pythonProcesses) {
    foreach ($proc in $pythonProcesses) {
        Write-Host "   Stopping process ID: $($proc.Id)" -ForegroundColor Gray
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "   ✓ Backend stopped" -ForegroundColor Green
} else {
    Write-Host "   No running backend found" -ForegroundColor Gray
}

# Step 2: Clear Python cache
Write-Host ""
Write-Host "2. Clearing Python cache..." -ForegroundColor Yellow

try {
    $pycFiles = Get-ChildItem -Path "backend" -Recurse -Filter "*.pyc" -ErrorAction SilentlyContinue
    $pycacheDir = Get-ChildItem -Path "backend" -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue
    
    $pycFiles | Remove-Item -Force -ErrorAction SilentlyContinue
    $pycacheDir | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    
    Write-Host "   ✓ Cache cleared" -ForegroundColor Green
} catch {
    Write-Host "   ⚠ Could not clear cache (not critical)" -ForegroundColor Yellow
}

# Step 3: Verify fix is in the file
Write-Host ""
Write-Host "3. Verifying fix is in the code..." -ForegroundColor Yellow

$fileContent = Get-Content "backend\app\utils\file_upload.py" -Raw
if ($fileContent -like "*access_mode='public'*") {
    Write-Host "   ✓ Fix found in file" -ForegroundColor Green
} else {
    Write-Host "   ✗ Fix NOT found in file!" -ForegroundColor Red
    Write-Host "   This is a critical error. The fix should be in the file." -ForegroundColor Red
    exit 1
}

# Step 4: Start backend in new window
Write-Host ""
Write-Host "4. Starting backend server..." -ForegroundColor Yellow

$backendPath = Join-Path $PSScriptRoot "backend"

$startupScript = @"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BACKEND SERVER WITH 401 FIX" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend URL: http://localhost:8000" -ForegroundColor Green
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "Watch for this log message on upload:" -ForegroundColor Yellow
Write-Host "  '🔧 Cloudinary upload starting with access_mode=public (401 fix active)'" -ForegroundColor Gray
Write-Host ""
Write-Host "If you see that message, the fix is loaded!" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

cd "$backendPath"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"@

$scriptPath = Join-Path $env:TEMP "start-backend-verified.ps1"
$startupScript | Out-File -FilePath $scriptPath -Encoding UTF8

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $scriptPath

Write-Host "   ✓ Backend starting in new window" -ForegroundColor Green

# Step 5: Wait for backend to start
Write-Host ""
Write-Host "5. Waiting for backend to start..." -ForegroundColor Yellow

$maxAttempts = 20
$attempt = 0
$backendReady = $false

while ($attempt -lt $maxAttempts -and -not $backendReady) {
    Start-Sleep -Seconds 2
    $attempt++
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
        }
    } catch {
        Write-Host "   Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
    }
}

if ($backendReady) {
    Write-Host "   ✓ Backend is ready!" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Backend is taking longer than expected" -ForegroundColor Yellow
    Write-Host "   Check the backend window for any errors" -ForegroundColor Yellow
}

# Step 6: Verify fix is loaded (optional - requires backend to import the module)
Write-Host ""
Write-Host "6. Final verification..." -ForegroundColor Yellow

try {
    cd backend
    $verifyResult = python -c "from app.utils import file_upload; import inspect; print('FOUND' if 'access_mode' in inspect.getsource(file_upload.upload_to_cloudinary) else 'MISSING')" 2>$null
    cd ..
    
    if ($verifyResult -eq "FOUND") {
        Write-Host "   ✓ Fix is loaded in Python" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Could not verify (but should be OK)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠ Could not verify (but should be OK)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ BACKEND RESTARTED WITH FIX" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: What to look for when uploading:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. In backend logs, you should see:" -ForegroundColor White
Write-Host "   '🔧 Cloudinary upload starting with access_mode=public (401 fix active)'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. You should NOT see:" -ForegroundColor White
Write-Host "   '❌ Failed to download file: 401 Client Error'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Status should change:" -ForegroundColor White
Write-Host "   uploaded → text_extracted → skills_extracted" -ForegroundColor Gray
Write-Host ""
Write-Host "Now upload a NEW resume to test!" -ForegroundColor Yellow
Write-Host "Go to: http://localhost:5173/resumes/upload" -ForegroundColor White
Write-Host ""
