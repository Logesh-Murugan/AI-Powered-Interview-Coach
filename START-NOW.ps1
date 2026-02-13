# Quick Start Script - Start Everything Now!

Write-Host ""
Write-Host "🎉 Database Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting services..." -ForegroundColor Cyan
Write-Host ""

# Start Redis
Write-Host "1. Starting Redis..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\start_redis_windows.ps1" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Backend
Write-Host "2. Starting Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate; uvicorn app.main:app --reload" -WindowStyle Normal

Start-Sleep -Seconds 5

# Start Frontend
Write-Host "3. Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ All services starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor Gray
Write-Host "  Backend:   http://localhost:8000" -ForegroundColor Gray
Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "Opening browser in 5 seconds..." -ForegroundColor Yellow

Start-Sleep -Seconds 5

Start-Process "http://localhost:5173"
Start-Process "http://localhost:8000/docs"

Write-Host ""
Write-Host "✅ Browser opened!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Register a new user" -ForegroundColor Gray
Write-Host "  2. Login with credentials" -ForegroundColor Gray
Write-Host "  3. Test the dashboard" -ForegroundColor Gray
Write-Host ""
Write-Host "Read: HOW-TO-SEE-OUTPUT.md for testing guide" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
