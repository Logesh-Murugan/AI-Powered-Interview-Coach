# Phase 2 Testing - Quick Start Script
# This script helps you quickly start and test Phase 1 & 2 features

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Interview Master AI - Phase 2 Testing" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a service is running
function Test-ServiceRunning {
    param($ProcessName)
    return (Get-Process -Name $ProcessName -ErrorAction SilentlyContinue) -ne $null
}

# Function to check if port is in use
function Test-PortInUse {
    param($Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
    return $connection
}

Write-Host "Step 1: Checking Prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check PostgreSQL
if (Test-ServiceRunning "postgres") {
    Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL is not running" -ForegroundColor Red
    Write-Host "   Starting PostgreSQL..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-File", ".\backend\start_postgres_local.ps1" -WindowStyle Minimized
    Start-Sleep -Seconds 3
}

# Check Redis
if (Test-ServiceRunning "redis-server") {
    Write-Host "✅ Redis is running" -ForegroundColor Green
} else {
    Write-Host "❌ Redis is not running" -ForegroundColor Red
    Write-Host "   Starting Redis..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-File", ".\backend\start_redis_windows.ps1" -WindowStyle Minimized
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Step 2: Starting Backend..." -ForegroundColor Yellow
Write-Host ""

# Check if backend is already running
if (Test-PortInUse 8000) {
    Write-Host "✅ Backend is already running on port 8000" -ForegroundColor Green
} else {
    Write-Host "Starting backend server..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList @"
cd backend; .\venv\Scripts\activate; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"@ -WindowStyle Normal
    Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    if (Test-PortInUse 8000) {
        Write-Host "✅ Backend started successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend failed to start" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Step 3: Starting Frontend..." -ForegroundColor Yellow
Write-Host ""

# Check if frontend is already running
if (Test-PortInUse 5173) {
    Write-Host "✅ Frontend is already running on port 5173" -ForegroundColor Green
} else {
    Write-Host "Starting frontend server..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList @"
cd frontend; npm run dev
"@ -WindowStyle Normal
    Write-Host "⏳ Waiting for frontend to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8
    
    if (Test-PortInUse 5173) {
        Write-Host "✅ Frontend started successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend failed to start" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Services Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test backend health
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5
    if ($response.status -eq "healthy") {
        Write-Host "✅ Backend Health: $($response.status)" -ForegroundColor Green
        Write-Host "   Database: $($response.database)" -ForegroundColor Gray
        Write-Host "   Redis: $($response.redis)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Backend Health Check Failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Access URLs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend:      http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend API:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs:      http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "ReDoc:         http://localhost:8000/redoc" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Quick Test Commands" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Backend Health:" -ForegroundColor Yellow
Write-Host "  curl http://localhost:8000/health" -ForegroundColor Gray
Write-Host ""
Write-Host "Test User Registration:" -ForegroundColor Yellow
Write-Host '  curl -X POST http://localhost:8000/auth/register -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"SecurePass123!\",\"name\":\"Test User\"}"' -ForegroundColor Gray
Write-Host ""
Write-Host "Test User Login:" -ForegroundColor Yellow
Write-Host '  curl -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"SecurePass123!\"}"' -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Testing Checklist" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend Tests:" -ForegroundColor Yellow
Write-Host "  [ ] Open http://localhost:5173" -ForegroundColor Gray
Write-Host "  [ ] Register a new user" -ForegroundColor Gray
Write-Host "  [ ] Login with credentials" -ForegroundColor Gray
Write-Host "  [ ] Access dashboard" -ForegroundColor Gray
Write-Host "  [ ] Update profile" -ForegroundColor Gray
Write-Host "  [ ] Change password" -ForegroundColor Gray
Write-Host "  [ ] Logout" -ForegroundColor Gray
Write-Host ""
Write-Host "Backend Tests:" -ForegroundColor Yellow
Write-Host "  [ ] Open http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "  [ ] Test /auth/register endpoint" -ForegroundColor Gray
Write-Host "  [ ] Test /auth/login endpoint" -ForegroundColor Gray
Write-Host "  [ ] Test /auth/refresh endpoint" -ForegroundColor Gray
Write-Host "  [ ] Test /users/me endpoint" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Documentation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing Guide:     PHASE-2-TESTING-GUIDE.md" -ForegroundColor Gray
Write-Host "Visual Outputs:    PHASE-2-VISUAL-OUTPUTS.md" -ForegroundColor Gray
Write-Host "Quick Reference:   backend/QUICK-REFERENCE.md" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Ready to Test! 🚀" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to open browser
$openBrowser = Read-Host "Open browser windows? (Y/N)"
if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
    Write-Host ""
    Write-Host "Opening browser windows..." -ForegroundColor Cyan
    Start-Process "http://localhost:5173"
    Start-Sleep -Seconds 1
    Start-Process "http://localhost:8000/docs"
    Write-Host "✅ Browser windows opened" -ForegroundColor Green
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
