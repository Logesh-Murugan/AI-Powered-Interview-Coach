# Stop Redis on Windows

Write-Host "Stopping Redis..." -ForegroundColor Cyan

$redisProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue

if ($redisProcess) {
    Stop-Process -Name "redis-server" -Force
    Write-Host "✓ Redis stopped" -ForegroundColor Green
} else {
    Write-Host "⚠ Redis is not running" -ForegroundColor Yellow
}
