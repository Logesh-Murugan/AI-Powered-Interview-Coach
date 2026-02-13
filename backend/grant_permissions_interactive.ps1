# Grant PostgreSQL permissions to user - Interactive version
# This script fixes the "permission denied for schema public" error

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Granting PostgreSQL Permissions" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Find psql.exe
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

if (-not (Test-Path $psqlPath)) {
    Write-Host "ERROR: psql.exe not found at $psqlPath" -ForegroundColor Red
    Write-Host "Please update the path in this script" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found psql at: $psqlPath" -ForegroundColor Green
Write-Host ""

# Prompt for password
$securePassword = Read-Host "Enter password for postgres user" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# SQL commands to grant permissions
$sqlCommands = @"
GRANT ALL ON SCHEMA public TO "user";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "user";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "user";
"@

Write-Host ""
Write-Host "Executing permission grants..." -ForegroundColor Yellow
Write-Host ""

# Set password environment variable
$env:PGPASSWORD = $password

# Execute the SQL commands
$sqlCommands | & $psqlPath -U postgres -d interviewmaster

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Permissions granted!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: Run migrations" -ForegroundColor Cyan
    Write-Host "  alembic upgrade head" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "FAILED: Could not grant permissions" -ForegroundColor Red
    Write-Host "Please check your PostgreSQL password and try again" -ForegroundColor Yellow
}

# Clear password from memory
$env:PGPASSWORD = ""
$password = ""

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
