# Start PostgreSQL and Redis Services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting PostgreSQL and Redis       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start PostgreSQL
Write-Host "[1/2] Starting PostgreSQL..." -ForegroundColor Yellow

try {
    $pgService = Get-Service -Name "*postgres*" -ErrorAction SilentlyContinue | Select-Object -First 1
    
    if ($pgService) {
        if ($pgService.Status -ne "Running") {
            Start-Service $pgService.Name -ErrorAction Stop
            Write-Host "  PostgreSQL started successfully!" -ForegroundColor Green
            Write-Host "  Service: $($pgService.Name)" -ForegroundColor Gray
        } else {
            Write-Host "  PostgreSQL is already running" -ForegroundColor Green
            Write-Host "  Service: $($pgService.Name)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  PostgreSQL service not found" -ForegroundColor Red
        Write-Host "  Please install PostgreSQL or start it manually" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Could not start PostgreSQL" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "  Try running PowerShell as Administrator" -ForegroundColor Yellow
}

Write-Host ""

# Start Redis
Write-Host "[2/2] Starting Redis..." -ForegroundColor Yellow

if (Test-Path "redis-windows\redis-server.exe") {
    # Check if Redis is already running
    $redisProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
    
    if ($redisProcess) {
        Write-Host "  Redis is already running" -ForegroundColor Green
        Write-Host "  PID: $($redisProcess.Id)" -ForegroundColor Gray
    } else {
        Start-Process -FilePath "redis-windows\redis-server.exe" -WindowStyle Minimized
        Start-Sleep -Seconds 2
        Write-Host "  Redis started successfully!" -ForegroundColor Green
        Write-Host "  Running in minimized window" -ForegroundColor Gray
    }
} else {
    Write-Host "  Redis not found in redis-windows folder" -ForegroundColor Red
    Write-Host "  Please check if redis-windows\redis-server.exe exists" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Services Status Check                " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Verify PostgreSQL
Write-Host "Checking PostgreSQL (port 5432)..." -ForegroundColor Gray
try {
    $pgTest = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($pgTest.TcpTestSucceeded) {
        Write-Host "  PostgreSQL: RUNNING" -ForegroundColor Green
    } else {
        Write-Host "  PostgreSQL: NOT RESPONDING" -ForegroundColor Red
    }
} catch {
    Write-Host "  PostgreSQL: UNKNOWN" -ForegroundColor Yellow
}

# Verify Redis
Write-Host "Checking Redis (port 6379)..." -ForegroundColor Gray
try {
    $redisTest = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($redisTest.TcpTestSucceeded) {
        Write-Host "  Redis: RUNNING" -ForegroundColor Green
    } else {
        Write-Host "  Redis: NOT RESPONDING" -ForegroundColor Red
    }
} catch {
    Write-Host "  Redis: UNKNOWN" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. If both services are running, start the application:" -ForegroundColor White
Write-Host "     cd backend" -ForegroundColor Gray
Write-Host "     uvicorn app.main:app --reload" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. In another terminal:" -ForegroundColor White
Write-Host "     cd frontend" -ForegroundColor Gray
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""
