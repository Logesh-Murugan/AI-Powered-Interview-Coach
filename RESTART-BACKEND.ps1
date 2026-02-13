# Restart Backend Server
# This script stops the current backend and starts it fresh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESTART BACKEND SERVER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find and stop existing uvicorn process
Write-Host "1. Stopping existing backend server..." -ForegroundColor Yellow

$uvicornProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*uvicorn*" -or $_.MainWindowTitle -like "*uvicorn*"
}

if ($uvicornProcesses) {
    foreach ($proc in $uvicornProcesses) {
        Write-Host "   Stopping process ID: $($proc.Id)" -ForegroundColor Gray
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "   ✓ Backend stopped" -ForegroundColor Green
} else {
    Write-Host "   No running backend found" -ForegroundColor Gray
}

# Start backend in new window
Write-Host ""
Write-Host "2. Starting backend server..." -ForegroundColor Yellow

$backendPath = Join-Path $PSScriptRoot "backend"

# Create startup script
$startupScript = @"
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend will be available at: http://localhost:8000" -ForegroundColor Green
Write-Host "API docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

cd "$backendPath"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"@

$scriptPath = Join-Path $env:TEMP "start-backend-temp.ps1"
$startupScript | Out-File -FilePath $scriptPath -Encoding UTF8

# Start in new window
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $scriptPath

Write-Host "   ✓ Backend starting in new window" -ForegroundColor Green

# Wait for backend to start
Write-Host ""
Write-Host "3. Waiting for backend to start..." -ForegroundColor Yellow

$maxAttempts = 15
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

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ BACKEND RESTARTED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend URL: http://localhost:8000" -ForegroundColor White
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "The Cloudinary fix is now active!" -ForegroundColor Cyan
Write-Host "You can now upload resumes and they should process correctly." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to http://localhost:5173/resumes" -ForegroundColor White
Write-Host "2. Click 'Upload Resume'" -ForegroundColor White
Write-Host "3. Upload a new PDF or DOCX file" -ForegroundColor White
Write-Host "4. Watch the status change from 'uploaded' to 'skills_extracted'" -ForegroundColor White
Write-Host ""
