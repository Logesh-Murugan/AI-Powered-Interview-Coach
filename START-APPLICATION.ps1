# Interview Master AI - Simple Startup Script

Write-Host "========================================"
Write-Host "  Interview Master AI - Starting...   "
Write-Host "========================================"
Write-Host ""

# Start Backend
Write-Host "[1/2] Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; Write-Host 'Backend Server (FastAPI)' -ForegroundColor Cyan; Write-Host 'URL: http://localhost:8000' -ForegroundColor Green; Write-Host 'Docs: http://localhost:8000/docs' -ForegroundColor Green; Write-Host ''; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

Write-Host "  Backend starting on http://localhost:8000" -ForegroundColor Green
Start-Sleep -Seconds 5

# Start Frontend
Write-Host "[2/2] Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; Write-Host 'Frontend Server (Vite + React)' -ForegroundColor Cyan; Write-Host 'URL: http://localhost:5173' -ForegroundColor Green; Write-Host ''; npm run dev"

Write-Host "  Frontend starting on http://localhost:5173" -ForegroundColor Green
Start-Sleep -Seconds 8

# Open Browser
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "========================================"
Write-Host "  Application Started Successfully!   "
Write-Host "========================================"
Write-Host ""
Write-Host "Frontend:  http://localhost:5173"
Write-Host "Backend:   http://localhost:8000"
Write-Host "API Docs:  http://localhost:8000/docs"
Write-Host ""
Write-Host "Two terminal windows opened:"
Write-Host "  1. Backend Server (FastAPI)"
Write-Host "  2. Frontend Server (Vite)"
Write-Host ""
Write-Host "To stop: Press Ctrl+C in each window"
Write-Host ""
