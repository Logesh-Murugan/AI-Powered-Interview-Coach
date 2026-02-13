# Fix psql PATH Issue
# This script adds PostgreSQL to your PATH so you can use psql command

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fix psql Command" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Issue: psql command not found" -ForegroundColor Yellow
Write-Host "Solution: Add PostgreSQL to PATH" -ForegroundColor Yellow
Write-Host ""

# Find PostgreSQL installations
$pgPaths = @(
    "C:\Program Files\PostgreSQL\18\bin",
    "C:\Program Files\PostgreSQL\17\bin",
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin"
)

$foundPath = $null

Write-Host "Searching for PostgreSQL..." -ForegroundColor Cyan
foreach ($path in $pgPaths) {
    if (Test-Path $path) {
        Write-Host "✅ Found: $path" -ForegroundColor Green
        if ($null -eq $foundPath) {
            $foundPath = $path
        }
    }
}

if ($null -eq $foundPath) {
    Write-Host "❌ PostgreSQL bin directory not found" -ForegroundColor Red
    Write-Host "   Please check your PostgreSQL installation" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Using: $foundPath" -ForegroundColor Cyan
Write-Host ""

# Add to current session PATH
Write-Host "Step 1: Adding to current session..." -ForegroundColor Yellow
$env:Path += ";$foundPath"
Write-Host "✅ Added to current PowerShell session" -ForegroundColor Green

# Test if psql works now
Write-Host ""
Write-Host "Step 2: Testing psql command..." -ForegroundColor Yellow
try {
    $version = & "$foundPath\psql.exe" --version
    Write-Host "✅ psql command works!" -ForegroundColor Green
    Write-Host "   Version: $version" -ForegroundColor Gray
} catch {
    Write-Host "❌ psql still not working" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Adding to permanent PATH..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  This requires Administrator privileges" -ForegroundColor Yellow
Write-Host ""

$addPermanent = Read-Host "Add to permanent PATH? (Y/N)"

if ($addPermanent -eq "Y" -or $addPermanent -eq "y") {
    try {
        # Check if running as administrator
        $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
        
        if ($isAdmin) {
            $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
            if ($currentPath -notlike "*$foundPath*") {
                [Environment]::SetEnvironmentVariable("Path", "$currentPath;$foundPath", "Machine")
                Write-Host "✅ Added to permanent PATH" -ForegroundColor Green
                Write-Host "   Restart PowerShell for changes to take effect" -ForegroundColor Yellow
            } else {
                Write-Host "✅ Already in permanent PATH" -ForegroundColor Green
            }
        } else {
            Write-Host "❌ Not running as Administrator" -ForegroundColor Red
            Write-Host ""
            Write-Host "To add permanently, run this command as Administrator:" -ForegroundColor Yellow
            Write-Host ""
            Write-Host '[Environment]::SetEnvironmentVariable("Path", $env:Path + ";' + $foundPath + '", "Machine")' -ForegroundColor Cyan
        }
    } catch {
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  PATH added only for this session" -ForegroundColor Yellow
    Write-Host "   You'll need to run this script again in new PowerShell windows" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Now you can use psql commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  psql --version" -ForegroundColor Cyan
Write-Host "  psql -U postgres" -ForegroundColor Cyan
Write-Host "  psql -U user -d interviewmaster" -ForegroundColor Cyan
Write-Host ""

Write-Host "Create your database:" -ForegroundColor Yellow
Write-Host "  1. Run: psql -U postgres" -ForegroundColor Cyan
Write-Host "  2. Follow: SIMPLE-DATABASE-SETUP.md" -ForegroundColor Cyan
Write-Host ""
