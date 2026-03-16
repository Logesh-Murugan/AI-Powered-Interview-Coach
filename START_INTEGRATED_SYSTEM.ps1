# Start Integrated Speech-to-Text System
# PowerShell script to launch both backend and frontend

Write-Host "🚀 Starting AI-Powered Interview Coach with Speech-to-Text Integration" -ForegroundColor Green
Write-Host "=" * 70

# Check if we're in the right directory
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ Error: Please run this script from the Ai_powered_interview_coach directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)"
    exit 1
}

Write-Host "📋 System Status Check" -ForegroundColor Yellow
Write-Host "-" * 30

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

# Check backend dependencies
Write-Host "`n🔧 Checking Backend Dependencies" -ForegroundColor Yellow
Write-Host "-" * 30

Set-Location backend

try {
    python -c "import whisper, librosa, fastapi; print('✓ Core dependencies available')" 2>$null
    Write-Host "✓ Backend dependencies: Available" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Some backend dependencies missing. Installing..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

# Check frontend dependencies
Write-Host "`n⚛️  Checking Frontend Dependencies" -ForegroundColor Yellow
Write-Host "-" * 30

Set-Location ../frontend

if (Test-Path "node_modules") {
    Write-Host "✓ Frontend dependencies: Available" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend dependencies missing. Installing..." -ForegroundColor Yellow
    npm install
}

Set-Location ..

Write-Host "`n🚀 Starting Services" -ForegroundColor Yellow
Write-Host "-" * 30

# Start backend in background
Write-Host "Starting backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend in background
Write-Host "Starting frontend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

# Wait for services to start
Write-Host "`n⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if services are running
Write-Host "`n🔍 Service Status Check" -ForegroundColor Yellow
Write-Host "-" * 30

try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✓ Backend: Running on http://localhost:8000" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend: Starting up... (may take a moment)" -ForegroundColor Yellow
}

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✓ Frontend: Running on http://localhost:5173" -ForegroundColor Green
} catch {
    try {
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5174" -TimeoutSec 5 -UseBasicParsing
        Write-Host "✓ Frontend: Running on http://localhost:5174" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Frontend: Starting up... (may take a moment)" -ForegroundColor Yellow
    }
}

Write-Host "`n🎯 Testing Instructions" -ForegroundColor Green
Write-Host "=" * 30
Write-Host "1. Open browser and go to: http://localhost:5173 or http://localhost:5174"
Write-Host "2. Register/login to your account"
Write-Host "3. Start a new interview session"
Write-Host "4. Test both modes:"
Write-Host "   📝 Text Mode: Type your answer (original functionality)"
Write-Host "   🎤 Speech Mode: Record your answer (NEW feature)"
Write-Host "5. Verify speech-to-text conversion works"
Write-Host "6. Check that both modes get AI evaluation"

Write-Host "`n🔗 Useful Links" -ForegroundColor Cyan
Write-Host "-" * 15
Write-Host "Frontend:     http://localhost:5173 or http://localhost:5174"
Write-Host "Backend API:  http://localhost:8000/docs"
Write-Host "Media Health: http://localhost:8000/api/v1/media/health"

Write-Host "`n📚 Documentation" -ForegroundColor Magenta
Write-Host "-" * 17
Write-Host "Integration Guide:    INTEGRATED_SPEECH_TEXT_WORKFLOW.md"
Write-Host "Testing Guide:        FINAL_TESTING_DEPLOYMENT_GUIDE.md"
Write-Host "Audio Evaluation:     AUDIO_EVALUATION_EXPLAINED.md"

Write-Host "`n🎉 System Ready for Testing!" -ForegroundColor Green
Write-Host "The integrated speech-to-text system is now running."
Write-Host "Press Ctrl+C to stop this script (services will continue running)"

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 30
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - System running..." -ForegroundColor Gray
    }
} catch {
    Write-Host "`n👋 Stopping system monitoring. Services are still running in background." -ForegroundColor Yellow
}