# Restart Backend Server Script
# This script helps restart the backend server to apply the resume analysis fix

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resume Analysis Fix - Backend Restart" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend")) {
    Write-Host "❌ Error: backend directory not found" -ForegroundColor Red
    Write-Host "Please run this script from the Ai_powered_interview_coach directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found backend directory" -ForegroundColor Green
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Python not found" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Checking for running backend processes..." -ForegroundColor Yellow

# Try to find and kill existing uvicorn processes
$uvicornProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*uvicorn*"
}

if ($uvicornProcesses) {
    Write-Host "Found $($uvicornProcesses.Count) running backend process(es)" -ForegroundColor Yellow
    Write-Host "Stopping existing backend server..." -ForegroundColor Yellow
    $uvicornProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "✅ Stopped existing backend server" -ForegroundColor Green
} else {
    Write-Host "No running backend processes found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The server will start in a new window." -ForegroundColor Yellow
Write-Host "Look for these messages in the logs:" -ForegroundColor Yellow
Write-Host "  ✅ 'Agent LLM initialized with orchestrator'" -ForegroundColor Green
Write-Host "  ✅ 'TOTAL: 3/3 providers registered'" -ForegroundColor Green
Write-Host "  ✅ 'Uvicorn running on http://0.0.0.0:8000'" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C in the new window to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

Write-Host "✅ Backend server started in new window" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Wait for server to start (check new window)" -ForegroundColor White
Write-Host "2. Open http://localhost:5173/dashboard" -ForegroundColor White
Write-Host "3. Upload a resume and click 'Analyze'" -ForegroundColor White
Write-Host "4. Verify analysis status is 'success' (not 'fallback')" -ForegroundColor White
Write-Host ""
Write-Host "For detailed testing instructions, see:" -ForegroundColor Cyan
Write-Host "  - TEST_RESUME_ANALYSIS.md" -ForegroundColor White
Write-Host "  - RESUME_ANALYSIS_FIX.md" -ForegroundColor White
Write-Host ""
