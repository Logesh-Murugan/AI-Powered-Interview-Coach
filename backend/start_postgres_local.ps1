# PostgreSQL Setup Script for Local Installation
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Local Installation Guide" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will guide you through installing PostgreSQL locally." -ForegroundColor Yellow
Write-Host ""

# Check if PostgreSQL is already installed
$pgPath = "C:\Program Files\PostgreSQL"
$pgInstalled = Test-Path $pgPath

if ($pgInstalled) {
    Write-Host "PostgreSQL appears to be installed at: $pgPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "To create the database, run these commands in psql:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  psql -U postgres" -ForegroundColor Cyan
    Write-Host "  CREATE DATABASE interviewmaster;" -ForegroundColor Cyan
    Write-Host "  CREATE USER user WITH PASSWORD 'password';" -ForegroundColor Cyan
    Write-Host "  GRANT ALL PRIVILEGES ON DATABASE interviewmaster TO user;" -ForegroundColor Cyan
    Write-Host "  \q" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Then update your .env file:" -ForegroundColor Yellow
    Write-Host "  DATABASE_URL=postgresql://user:password@localhost:5432/interviewmaster" -ForegroundColor Cyan
    exit 0
}

Write-Host "PostgreSQL is not installed." -ForegroundColor Yellow
Write-Host ""
Write-Host "Installation Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Download PostgreSQL 15 from:" -ForegroundColor Yellow
Write-Host "   https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Run the installer:" -ForegroundColor Yellow
Write-Host "   - Choose installation directory" -ForegroundColor Gray
Write-Host "   - Select components (PostgreSQL Server, pgAdmin, Command Line Tools)" -ForegroundColor Gray
Write-Host "   - Set password for 'postgres' user (remember this!)" -ForegroundColor Gray
Write-Host "   - Use default port 5432" -ForegroundColor Gray
Write-Host "   - Use default locale" -ForegroundColor Gray
Write-Host ""
Write-Host "3. After installation, create database:" -ForegroundColor Yellow
Write-Host "   - Open 'SQL Shell (psql)' from Start Menu" -ForegroundColor Gray
Write-Host "   - Press Enter for default values (server, database, port, username)" -ForegroundColor Gray
Write-Host "   - Enter the password you set during installation" -ForegroundColor Gray
Write-Host "   - Run these commands:" -ForegroundColor Gray
Write-Host ""
Write-Host "     CREATE DATABASE interviewmaster;" -ForegroundColor Cyan
Write-Host "     CREATE USER user WITH PASSWORD 'password';" -ForegroundColor Cyan
Write-Host "     GRANT ALL PRIVILEGES ON DATABASE interviewmaster TO user;" -ForegroundColor Cyan
Write-Host "     \q" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Update .env file:" -ForegroundColor Yellow
Write-Host "   DATABASE_URL=postgresql://user:password@localhost:5432/interviewmaster" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Run migrations:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   alembic upgrade head" -ForegroundColor Cyan
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
