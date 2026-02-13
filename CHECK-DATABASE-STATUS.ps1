# Check Database Status Script
# This script will show you exactly what exists in your PostgreSQL

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Database Status Checker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check what's in your .env file
Write-Host "Step 1: Checking your .env file..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "backend\.env") {
    $envContent = Get-Content "backend\.env"
    $dbUrl = ($envContent | Select-String "DATABASE_URL=").ToString()
    
    Write-Host "Your .env file says:" -ForegroundColor Cyan
    Write-Host $dbUrl -ForegroundColor Gray
    Write-Host ""
    
    # Parse the URL
    if ($dbUrl -match "postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
        Write-Host "Parsed Configuration:" -ForegroundColor Cyan
        Write-Host "  Username: $($matches[1])" -ForegroundColor Gray
        Write-Host "  Password: $($matches[2])" -ForegroundColor Gray
        Write-Host "  Host: $($matches[3])" -ForegroundColor Gray
        Write-Host "  Port: $($matches[4])" -ForegroundColor Gray
        Write-Host "  Database: $($matches[5])" -ForegroundColor Gray
        
        $dbUser = $matches[1]
        $dbHost = $matches[3]
        $dbPort = $matches[4]
        $dbName = $matches[5]
    }
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Checking if PostgreSQL is running..." -ForegroundColor Yellow
Write-Host ""

$pgService = Get-Service postgresql* -ErrorAction SilentlyContinue

if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Host "✅ PostgreSQL service is running" -ForegroundColor Green
        Write-Host "   Service: $($pgService.Name)" -ForegroundColor Gray
    } else {
        Write-Host "❌ PostgreSQL service is stopped" -ForegroundColor Red
        Write-Host "   Run: Start-Service $($pgService.Name)" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "❌ PostgreSQL service not found" -ForegroundColor Red
    Write-Host "   Is PostgreSQL installed?" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 3: Checking what databases actually exist..." -ForegroundColor Yellow
Write-Host ""

# Try to list databases
Write-Host "Attempting to connect to PostgreSQL..." -ForegroundColor Cyan
Write-Host "You may be prompted for the 'postgres' user password" -ForegroundColor Yellow
Write-Host ""

try {
    # List all databases
    $databases = psql -U postgres -t -c "SELECT datname FROM pg_database WHERE datistemplate = false;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Existing databases:" -ForegroundColor Cyan
        $databases | ForEach-Object {
            $dbname = $_.Trim()
            if ($dbname) {
                if ($dbname -eq $dbName) {
                    Write-Host "  ✅ $dbname (This is your project database!)" -ForegroundColor Green
                } else {
                    Write-Host "  - $dbname" -ForegroundColor Gray
                }
            }
        }
    } else {
        Write-Host "❌ Could not list databases" -ForegroundColor Red
        Write-Host "   Error: $databases" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error connecting to PostgreSQL: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 4: Checking if your project database exists..." -ForegroundColor Yellow
Write-Host ""

$dbExists = psql -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$dbName';" 2>&1

if ($LASTEXITCODE -eq 0 -and $dbExists.Trim() -eq "1") {
    Write-Host "✅ Database '$dbName' EXISTS" -ForegroundColor Green
    
    # Check tables in the database
    Write-Host ""
    Write-Host "Step 5: Checking tables in '$dbName'..." -ForegroundColor Yellow
    Write-Host ""
    
    $tables = psql -U $dbUser -d $dbName -t -c "\dt" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Tables in database:" -ForegroundColor Cyan
        Write-Host $tables -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Could not list tables (database might be empty)" -ForegroundColor Yellow
        Write-Host "   This is normal if you haven't run migrations yet" -ForegroundColor Gray
    }
    
} else {
    Write-Host "❌ Database '$dbName' DOES NOT EXIST" -ForegroundColor Red
    Write-Host ""
    Write-Host "You need to create it! Run these commands:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  psql -U postgres" -ForegroundColor Cyan
    Write-Host "  CREATE DATABASE $dbName;" -ForegroundColor Cyan
    Write-Host "  CREATE USER `"$dbUser`" WITH PASSWORD 'your-password';" -ForegroundColor Cyan
    Write-Host "  GRANT ALL PRIVILEGES ON DATABASE $dbName TO `"$dbUser`";" -ForegroundColor Cyan
    Write-Host "  \q" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Step 6: Checking if user exists..." -ForegroundColor Yellow
Write-Host ""

$userExists = psql -U postgres -t -c "SELECT 1 FROM pg_user WHERE usename='$dbUser';" 2>&1

if ($LASTEXITCODE -eq 0 -and $userExists.Trim() -eq "1") {
    Write-Host "✅ User '$dbUser' EXISTS" -ForegroundColor Green
} else {
    Write-Host "❌ User '$dbUser' DOES NOT EXIST" -ForegroundColor Red
    Write-Host ""
    Write-Host "You need to create it! Run:" -ForegroundColor Yellow
    Write-Host "  psql -U postgres" -ForegroundColor Cyan
    Write-Host "  CREATE USER `"$dbUser`" WITH PASSWORD 'your-password';" -ForegroundColor Cyan
    Write-Host "  \q" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Configuration in .env file:" -ForegroundColor Yellow
Write-Host "  Database: $dbName" -ForegroundColor Gray
Write-Host "  User: $dbUser" -ForegroundColor Gray
Write-Host "  Host: $dbHost" -ForegroundColor Gray
Write-Host "  Port: $dbPort" -ForegroundColor Gray
Write-Host ""

Write-Host "What actually exists in PostgreSQL:" -ForegroundColor Yellow
if ($dbExists.Trim() -eq "1") {
    Write-Host "  ✅ Database '$dbName' exists" -ForegroundColor Green
} else {
    Write-Host "  ❌ Database '$dbName' does NOT exist" -ForegroundColor Red
}

if ($userExists.Trim() -eq "1") {
    Write-Host "  ✅ User '$dbUser' exists" -ForegroundColor Green
} else {
    Write-Host "  ❌ User '$dbUser' does NOT exist" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow

if ($dbExists.Trim() -ne "1" -or $userExists.Trim() -ne "1") {
    Write-Host "  1. Follow SIMPLE-DATABASE-SETUP.md to create database and user" -ForegroundColor Gray
    Write-Host "  2. Run migrations: cd backend; alembic upgrade head" -ForegroundColor Gray
    Write-Host "  3. Start testing: .\START-PHASE-2-TESTING.ps1" -ForegroundColor Gray
} else {
    Write-Host "  1. Run migrations: cd backend; alembic upgrade head" -ForegroundColor Gray
    Write-Host "  2. Start testing: .\START-PHASE-2-TESTING.ps1" -ForegroundColor Gray
}

Write-Host ""
