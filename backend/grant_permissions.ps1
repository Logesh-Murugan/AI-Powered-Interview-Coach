# Grant PostgreSQL permissions to user
# This script fixes the "permission denied for schema public" error

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Granting PostgreSQL Permissions" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Run the SQL commands
$sqlCommands = @"
GRANT ALL ON SCHEMA public TO "user";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "user";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "user";
"@

Write-Host "Executing permission grants..." -ForegroundColor Yellow

# Execute the SQL commands
$env:PGPASSWORD = "postgres"
$sqlCommands | psql -U postgres -d interviewmaster

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Permissions granted successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: Run migrations" -ForegroundColor Cyan
    Write-Host "  alembic upgrade head" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Failed to grant permissions" -ForegroundColor Red
    Write-Host "Please check your PostgreSQL password" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
