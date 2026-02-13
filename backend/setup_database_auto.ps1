# Automated Database Setup Script
# This script will create the database and user automatically

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Automated Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Read .env file to get database credentials
$envFile = Get-Content .env
$dbUrl = ($envFile | Select-String "DATABASE_URL=").ToString().Split("=")[1]

# Parse DATABASE_URL
# Format: postgresql://user:password@localhost:5432/dbname
if ($dbUrl -match "postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
    
    Write-Host "Database Configuration:" -ForegroundColor Yellow
    Write-Host "  Host: $dbHost" -ForegroundColor Gray
    Write-Host "  Port: $dbPort" -ForegroundColor Gray
    Write-Host "  Database: $dbName" -ForegroundColor Gray
    Write-Host "  User: $dbUser" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "❌ Could not parse DATABASE_URL from .env" -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is running
Write-Host "Step 1: Checking PostgreSQL service..." -ForegroundColor Yellow
$pgService = Get-Service postgresql* -ErrorAction SilentlyContinue

if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PostgreSQL is stopped. Starting..." -ForegroundColor Yellow
        Start-Service $pgService.Name
        Start-Sleep -Seconds 3
        Write-Host "✅ PostgreSQL started" -ForegroundColor Green
    }
} else {
    Write-Host "❌ PostgreSQL service not found" -ForegroundColor Red
    Write-Host "   Please install PostgreSQL first" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 2: Creating database and user..." -ForegroundColor Yellow

# Create SQL commands file
$sqlCommands = @"
-- Create database if not exists
SELECT 'CREATE DATABASE $dbName'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$dbName')\gexec

-- Create user if not exists
DO
`$`$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$dbUser') THEN
        CREATE USER "$dbUser" WITH PASSWORD '$dbPassword';
    END IF;
END
`$`$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $dbName TO "$dbUser";
"@

$sqlFile = "temp_setup.sql"
$sqlCommands | Out-File -FilePath $sqlFile -Encoding UTF8

# Prompt for postgres password
Write-Host ""
Write-Host "Please enter the password for PostgreSQL 'postgres' user:" -ForegroundColor Cyan
$postgresPassword = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($postgresPassword)
$postgresPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $postgresPasswordPlain

# Run SQL commands
try {
    Write-Host ""
    Write-Host "Creating database and user..." -ForegroundColor Cyan
    
    # Check if psql is available
    $psqlPath = (Get-Command psql -ErrorAction SilentlyContinue).Source
    if (-not $psqlPath) {
        # Try common PostgreSQL installation paths
        $possiblePaths = @(
            "C:\Program Files\PostgreSQL\18\bin\psql.exe",
            "C:\Program Files\PostgreSQL\17\bin\psql.exe",
            "C:\Program Files\PostgreSQL\16\bin\psql.exe",
            "C:\Program Files\PostgreSQL\15\bin\psql.exe"
        )
        
        foreach ($path in $possiblePaths) {
            if (Test-Path $path) {
                $psqlPath = $path
                break
            }
        }
        
        if (-not $psqlPath) {
            Write-Host "❌ psql command not found" -ForegroundColor Red
            Write-Host "   Please add PostgreSQL bin directory to PATH" -ForegroundColor Yellow
            Remove-Item $sqlFile
            exit 1
        }
    }
    
    # Execute SQL file
    & $psqlPath -U postgres -h $dbHost -p $dbPort -f $sqlFile 2>&1 | Out-Null
    
    Write-Host "✅ Database and user created" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error creating database: $_" -ForegroundColor Red
    Remove-Item $sqlFile
    exit 1
} finally {
    # Clean up
    Remove-Item $sqlFile -ErrorAction SilentlyContinue
    $env:PGPASSWORD = $null
}

Write-Host ""
Write-Host "Step 3: Granting schema privileges..." -ForegroundColor Yellow

# Grant schema privileges
$schemaSQL = @"
GRANT ALL ON SCHEMA public TO "$dbUser";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "$dbUser";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "$dbUser";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "$dbUser";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "$dbUser";
"@

$schemaFile = "temp_schema.sql"
$schemaSQL | Out-File -FilePath $schemaFile -Encoding UTF8

$env:PGPASSWORD = $postgresPasswordPlain

try {
    & $psqlPath -U postgres -h $dbHost -p $dbPort -d $dbName -f $schemaFile 2>&1 | Out-Null
    Write-Host "✅ Schema privileges granted" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: Could not grant schema privileges" -ForegroundColor Yellow
} finally {
    Remove-Item $schemaFile -ErrorAction SilentlyContinue
    $env:PGPASSWORD = $null
}

Write-Host ""
Write-Host "Step 4: Testing connection..." -ForegroundColor Yellow

# Test connection with Python
try {
    python -c "from app.database import engine; engine.connect(); print('✅ Connection successful')"
    Write-Host "✅ Database connection verified" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not verify connection with Python" -ForegroundColor Yellow
    Write-Host "   This is OK if you haven't installed Python dependencies yet" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Step 5: Running migrations..." -ForegroundColor Yellow

# Check if alembic is available
try {
    $alembicVersion = alembic --version 2>&1
    
    Write-Host "Running database migrations..." -ForegroundColor Cyan
    alembic upgrade head
    
    Write-Host "✅ Migrations completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Alembic not found or migrations failed" -ForegroundColor Yellow
    Write-Host "   Run manually: alembic upgrade head" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Database Setup Complete! ✅" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database Details:" -ForegroundColor Yellow
Write-Host "  Database: $dbName" -ForegroundColor Gray
Write-Host "  User: $dbUser" -ForegroundColor Gray
Write-Host "  Host: $dbHost" -ForegroundColor Gray
Write-Host "  Port: $dbPort" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Start Redis: .\start_redis_windows.ps1" -ForegroundColor Gray
Write-Host "  2. Start Backend: uvicorn app.main:app --reload" -ForegroundColor Gray
Write-Host "  3. Start Frontend: cd ..\frontend; npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Test connection:" -ForegroundColor Yellow
Write-Host "  psql -U $dbUser -d $dbName" -ForegroundColor Gray
Write-Host ""
