# InterviewMaster AI - Quick Start Script for Testing
# This script helps you start all services for manual testing

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  InterviewMaster AI - Testing Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is running
Write-Host "[1/5] Checking PostgreSQL..." -ForegroundColor Yellow
$postgresService = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
if ($postgresService -and $postgresService.Status -eq "Running") {
    Write-Host "  ✓ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "  ✗ PostgreSQL is not running" -ForegroundColor Red
    Write-Host "  Please start PostgreSQL service manually" -ForegroundColor Yellow
    Write-Host "  Run: services.msc and start 'postgresql-x64-18'" -ForegroundColor Yellow
    exit 1
}

# Check if Redis is running
Write-Host "[2/5] Checking Redis..." -ForegroundColor Yellow
$redisProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
if ($redisProcess) {
    Write-Host "  ✓ Redis is running" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Redis is not running" -ForegroundColor Yellow
    Write-Host "  Starting Redis in a new window..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "redis-server"
    Start-Sleep -Seconds 2
}

# Check backend virtual environment
Write-Host "[3/5] Checking backend setup..." -ForegroundColor Yellow
if (Test-Path "backend\venv\Scripts\Activate.ps1") {
    Write-Host "  ✓ Backend virtual environment exists" -ForegroundColor Green
} else {
    Write-Host "  ✗ Backend virtual environment not found" -ForegroundColor Red
    Write-Host "  Please run: cd backend; python -m venv venv" -ForegroundColor Yellow
    exit 1
}

# Check frontend node_modules
Write-Host "[4/5] Checking frontend setup..." -ForegroundColor Yellow
if (Test-Path "frontend\node_modules") {
    Write-Host "  ✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Frontend dependencies not found" -ForegroundColor Yellow
    Write-Host "  Installing dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

# Start backend
Write-Host "[5/5] Starting services..." -ForegroundColor Yellow
Write-Host "  Starting backend in new window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 3

# Start frontend
Write-Host "  Starting frontend in new window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Services Starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Please wait 10-15 seconds for services to start..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:    http://localhost:5173" -ForegroundColor White
Write-Host "  Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs:    http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Health:      http://localhost:8000/health" -ForegroundColor White
Write-Host ""
Write-Host "Testing Guide: MANUAL_TESTING_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to open testing guide..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open testing guide
Start-Process "MANUAL_TESTING_GUIDE.md"

Write-Host ""
Write-Host "Happy Testing! 🚀" -ForegroundColor Green
