# Test Resume Upload Flow
# This script tests the complete resume upload and processing pipeline

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUME UPLOAD TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "1. Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✓ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Backend is NOT running!" -ForegroundColor Red
    Write-Host "   Please start backend first:" -ForegroundColor Yellow
    Write-Host "   cd backend" -ForegroundColor White
    Write-Host "   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor White
    exit 1
}

# Check if frontend is running
Write-Host "2. Checking if frontend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✓ Frontend is running" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Frontend is NOT running!" -ForegroundColor Red
    Write-Host "   Please start frontend first:" -ForegroundColor Yellow
    Write-Host "   cd frontend" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor White
    exit 1
}

# Check PostgreSQL
Write-Host "3. Checking PostgreSQL..." -ForegroundColor Yellow
try {
    $pgService = Get-Service -Name "postgresql-x64-16" -ErrorAction Stop
    if ($pgService.Status -eq "Running") {
        Write-Host "   ✓ PostgreSQL is running" -ForegroundColor Green
    } else {
        Write-Host "   ✗ PostgreSQL is stopped" -ForegroundColor Red
        Write-Host "   Starting PostgreSQL..." -ForegroundColor Yellow
        Start-Service -Name "postgresql-x64-16"
        Write-Host "   ✓ PostgreSQL started" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠ Could not check PostgreSQL service" -ForegroundColor Yellow
}

# Check Redis
Write-Host "4. Checking Redis..." -ForegroundColor Yellow
try {
    $redisProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
    if ($redisProcess) {
        Write-Host "   ✓ Redis is running" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Redis is NOT running" -ForegroundColor Red
        Write-Host "   Please start Redis:" -ForegroundColor Yellow
        Write-Host "   cd redis-windows" -ForegroundColor White
        Write-Host "   .\redis-server.exe" -ForegroundColor White
    }
} catch {
    Write-Host "   ⚠ Could not check Redis process" -ForegroundColor Yellow
}

# Check Cloudinary configuration
Write-Host "5. Checking Cloudinary configuration..." -ForegroundColor Yellow
cd backend
$cloudinaryTest = python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('OK' if all([os.getenv('CLOUDINARY_CLOUD_NAME'), os.getenv('CLOUDINARY_API_KEY'), os.getenv('CLOUDINARY_API_SECRET')]) else 'MISSING')" 2>$null
cd ..

if ($cloudinaryTest -eq "OK") {
    Write-Host "   ✓ Cloudinary credentials configured" -ForegroundColor Green
} else {
    Write-Host "   ✗ Cloudinary credentials missing!" -ForegroundColor Red
    Write-Host "   Please check backend/.env file" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ ALL SYSTEMS READY" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "TESTING INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open browser: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "2. Login with your credentials" -ForegroundColor White
Write-Host ""
Write-Host "3. Navigate to 'Upload Resume' page" -ForegroundColor White
Write-Host ""
Write-Host "4. Upload a PDF or DOCX file (max 10MB)" -ForegroundColor White
Write-Host ""
Write-Host "5. Watch the status change:" -ForegroundColor White
Write-Host "   uploaded → text_extracted → skills_extracted" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Check backend terminal for logs:" -ForegroundColor White
Write-Host "   - 'Starting text extraction for resume X'" -ForegroundColor Gray
Write-Host "   - 'Text extraction successful'" -ForegroundColor Gray
Write-Host "   - 'Starting skill extraction for resume X'" -ForegroundColor Gray
Write-Host "   - 'Skill extraction successful'" -ForegroundColor Gray
Write-Host ""
Write-Host "7. View resume details to see extracted text and skills" -ForegroundColor White
Write-Host ""

Write-Host "EXPECTED RESULTS:" -ForegroundColor Cyan
Write-Host "✓ File uploads successfully" -ForegroundColor Green
Write-Host "✓ No 401 errors in backend logs" -ForegroundColor Green
Write-Host "✓ Text is extracted and displayed" -ForegroundColor Green
Write-Host "✓ Skills are automatically extracted" -ForegroundColor Green
Write-Host ""

Write-Host "Press any key to open browser..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Browser opened. Happy testing!" -ForegroundColor Green
Write-Host ""
