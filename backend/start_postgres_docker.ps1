# PostgreSQL Setup Script using Docker
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Setup for InterviewMaster AI" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker ps | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

# Check if container already exists
$containerExists = docker ps -a --filter "name=interviewmaster-postgres" --format "{{.Names}}"

if ($containerExists) {
    Write-Host "PostgreSQL container already exists" -ForegroundColor Yellow
    
    # Check if it's running
    $containerRunning = docker ps --filter "name=interviewmaster-postgres" --format "{{.Names}}"
    
    if ($containerRunning) {
        Write-Host "PostgreSQL is already running!" -ForegroundColor Green
        Write-Host "Connection: postgresql://user:password@localhost:5432/interviewmaster" -ForegroundColor Cyan
        exit 0
    } else {
        Write-Host "Starting existing container..." -ForegroundColor Cyan
        docker start interviewmaster-postgres
        Start-Sleep -Seconds 3
        Write-Host "PostgreSQL started!" -ForegroundColor Green
        exit 0
    }
}

# Create new container
Write-Host "Creating PostgreSQL container..." -ForegroundColor Cyan
Write-Host ""

docker run --name interviewmaster-postgres `
    -e POSTGRES_USER=user `
    -e POSTGRES_PASSWORD=password `
    -e POSTGRES_DB=interviewmaster `
    -p 5432:5432 `
    -d postgres:15

Start-Sleep -Seconds 5

# Verify it's running
$containerRunning = docker ps --filter "name=interviewmaster-postgres" --format "{{.Names}}"

if ($containerRunning) {
    Write-Host "PostgreSQL started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Connection Details:" -ForegroundColor Yellow
    Write-Host "  Host: localhost" -ForegroundColor Gray
    Write-Host "  Port: 5432" -ForegroundColor Gray
    Write-Host "  Database: interviewmaster" -ForegroundColor Gray
    Write-Host "  User: user" -ForegroundColor Gray
    Write-Host "  Password: password" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Connection String:" -ForegroundColor Yellow
    Write-Host "  postgresql://user:password@localhost:5432/interviewmaster" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To stop PostgreSQL:" -ForegroundColor Yellow
    Write-Host "  docker stop interviewmaster-postgres" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To start again later:" -ForegroundColor Yellow
    Write-Host "  docker start interviewmaster-postgres" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Run migrations: alembic upgrade head" -ForegroundColor Cyan
    Write-Host "  2. Verify: python setup_database.py" -ForegroundColor Cyan
} else {
    Write-Host "Failed to start PostgreSQL" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "PostgreSQL is ready!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
