# Restart Backend Server - Simple Version
# No emojis, just works

Write-Host "========================================"
Write-Host "RESTART BACKEND SERVER"
Write-Host "========================================"
Write-Host ""

# Step 1: Stop existing backend
Write-Host "1. Stopping existing backend..."

$pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue

if ($pythonProcesses) {
    foreach ($proc in $pythonProcesses) {
        try {
            if ($proc.CommandLine -like "*uvicorn*") {
                Write-Host "   Stopping process ID: $($proc.Id)"
                Stop-Process -Id $proc.Id -Force
            }
        } catch {
            # Process might not have CommandLine property, skip it
        }
    }
    Start-Sleep -Seconds 2
    Write-Host "   Backend stopped"
} else {
    Write-Host "   No running backend found"
}

# Step 2: Clear Python cache
Write-Host ""
Write-Host "2. Clearing Python cache..."

try {
    Get-ChildItem -Path "backend" -Recurse -Filter "*.pyc" -ErrorAction SilentlyContinue | Remove-Item -Force
    Get-ChildItem -Path "backend" -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
    Write-Host "   Cache cleared"
} catch {
    Write-Host "   Could not clear cache (not critical)"
}

# Step 3: Verify fix is in the file
Write-Host ""
Write-Host "3. Verifying fix is in code..."

$fileContent = Get-Content "backend\app\utils\file_upload.py" -Raw
if ($fileContent -like "*access_mode=*public*") {
    Write-Host "   Fix found in file - OK"
} else {
    Write-Host "   ERROR: Fix NOT found in file!"
    exit 1
}

# Step 4: Start backend in new window
Write-Host ""
Write-Host "4. Starting backend server..."

$backendPath = Join-Path $PSScriptRoot "backend"

$startupScript = @"
Write-Host "========================================"
Write-Host "BACKEND SERVER"
Write-Host "========================================"
Write-Host ""
Write-Host "Backend URL: http://localhost:8000"
Write-Host "API Docs: http://localhost:8000/docs"
Write-Host ""
Write-Host "Watch for this log message on upload:"
Write-Host "  'Cloudinary upload starting with access_mode=public (401 fix active)'"
Write-Host ""
Write-Host "If you see that message, the fix is loaded!"
Write-Host ""
Write-Host "Press Ctrl+C to stop the server"
Write-Host ""

cd "$backendPath"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"@

$scriptPath = Join-Path $env:TEMP "start-backend-simple.ps1"
$startupScript | Out-File -FilePath $scriptPath -Encoding UTF8

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $scriptPath

Write-Host "   Backend starting in new window"

# Step 5: Wait for backend to start
Write-Host ""
Write-Host "5. Waiting for backend to start..."

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
        Write-Host "   Attempt $attempt/$maxAttempts..."
    }
}

if ($backendReady) {
    Write-Host "   Backend is ready!"
} else {
    Write-Host "   Backend is taking longer than expected"
    Write-Host "   Check the backend window for any errors"
}

Write-Host ""
Write-Host "========================================"
Write-Host "BACKEND RESTARTED"
Write-Host "========================================"
Write-Host ""
Write-Host "IMPORTANT: What to look for when uploading:"
Write-Host ""
Write-Host "1. In backend logs, you should see:"
Write-Host "   'Cloudinary upload starting with access_mode=public (401 fix active)'"
Write-Host ""
Write-Host "2. You should NOT see:"
Write-Host "   'Failed to download file: 401 Client Error'"
Write-Host ""
Write-Host "3. Status should change:"
Write-Host "   uploaded -> text_extracted -> skills_extracted"
Write-Host ""
Write-Host "Now upload a NEW resume to test!"
Write-Host "Go to: http://localhost:5173/resumes/upload"
Write-Host ""
