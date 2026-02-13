# Redis Setup Script for Windows
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Redis Setup for InterviewMaster AI" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Redis is already running
$redisRunning = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
if ($redisRunning) {
    Write-Host "Redis is already running!" -ForegroundColor Green
    Write-Host "PID: $($redisRunning.Id)" -ForegroundColor Gray
    exit 0
}

# Check if Redis is installed
$redisPath = "redis-windows"
$redisExe = "$redisPath\redis-server.exe"

if (Test-Path $redisExe) {
    Write-Host "Redis found at: $redisPath" -ForegroundColor Green
} else {
    Write-Host "Redis not found. Downloading..." -ForegroundColor Yellow
    Write-Host ""
    
    # Create directory
    New-Item -ItemType Directory -Force -Path $redisPath | Out-Null
    
    # Download Redis for Windows
    $redisUrl = "https://github.com/microsoftarchive/redis/releases/download/win-3.2.100/Redis-x64-3.2.100.zip"
    $zipFile = "$redisPath\redis.zip"
    
    Write-Host "Downloading Redis from GitHub..." -ForegroundColor Cyan
    try {
        Invoke-WebRequest -Uri $redisUrl -OutFile $zipFile -UseBasicParsing
        Write-Host "Download complete" -ForegroundColor Green
    } catch {
        Write-Host "Download failed: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please download Redis manually from:" -ForegroundColor Yellow
        Write-Host "https://github.com/microsoftarchive/redis/releases" -ForegroundColor Cyan
        exit 1
    }
    
    # Extract
    Write-Host "Extracting Redis..." -ForegroundColor Cyan
    try {
        Expand-Archive -Path $zipFile -DestinationPath $redisPath -Force
        Remove-Item $zipFile
        Write-Host "Extraction complete" -ForegroundColor Green
    } catch {
        Write-Host "Extraction failed: $_" -ForegroundColor Red
        exit 1
    }
}

# Start Redis
Write-Host ""
Write-Host "Starting Redis server..." -ForegroundColor Cyan
Write-Host "Host: localhost" -ForegroundColor Gray
Write-Host "Port: 6379" -ForegroundColor Gray
Write-Host ""

try {
    Start-Process -FilePath $redisExe -ArgumentList "redis.windows.conf" -WorkingDirectory $redisPath -WindowStyle Minimized
    Start-Sleep -Seconds 2
    
    # Verify Redis is running
    $redisRunning = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
    if ($redisRunning) {
        Write-Host "Redis started successfully!" -ForegroundColor Green
        Write-Host "PID: $($redisRunning.Id)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "To stop Redis, run:" -ForegroundColor Yellow
        Write-Host "Stop-Process -Name redis-server" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To test connection:" -ForegroundColor Yellow
        Write-Host ".\redis-windows\redis-cli.exe ping" -ForegroundColor Cyan
    } else {
        Write-Host "Redis failed to start" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Failed to start Redis: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Redis is ready! You can now run tests." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
