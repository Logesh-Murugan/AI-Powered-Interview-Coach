# How to Start PostgreSQL and Redis on Windows

## Quick Commands

### Start PostgreSQL
```powershell
# Method 1: Start as Windows Service
net start postgresql-x64-16

# Method 2: If service name is different
Get-Service -Name "*postgres*"
net start <service-name>

# Method 3: Using pg_ctl (if installed manually)
pg_ctl -D "C:\Program Files\PostgreSQL\16\data" start
```

### Start Redis
```powershell
# Method 1: Using the redis-windows folder in project
cd redis-windows
.\redis-server.exe

# Method 2: Start in background
Start-Process -FilePath "redis-windows\redis-server.exe" -WindowStyle Minimized
```

---

## Detailed Instructions

## PostgreSQL Setup

### Step 1: Check if PostgreSQL is Installed

```powershell
# Check if psql command works
psql --version

# Check if PostgreSQL service exists
Get-Service -Name "*postgres*"
```

### Step 2: Start PostgreSQL Service

**Option A: Using Services GUI**
1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Find "postgresql-x64-16" (or similar)
4. Right-click → Start

**Option B: Using Command Line**
```powershell
# Start the service
net start postgresql-x64-16

# Or use the exact service name from Get-Service
Get-Service -Name "*postgres*" | Start-Service
```

### Step 3: Verify PostgreSQL is Running

```powershell
# Check service status
Get-Service -Name "*postgres*"

# Should show: Status = Running

# Test connection
psql -U postgres -c "SELECT version();"
```

### Step 4: Create Database (If Not Exists)

```powershell
# Connect to PostgreSQL
psql -U postgres

# In psql prompt:
CREATE DATABASE interview_db;
\q
```

---

## Redis Setup

### Step 1: Check if Redis Folder Exists

```powershell
# Check if redis-windows folder exists in project
Test-Path redis-windows\redis-server.exe
```

### Step 2: Start Redis

**Option A: Start in Current Terminal (Foreground)**
```powershell
cd redis-windows
.\redis-server.exe
```

Keep this terminal open. Redis will run here.

**Option B: Start in Background (Minimized)**
```powershell
Start-Process -FilePath "redis-windows\redis-server.exe" -WindowStyle Minimized
```

**Option C: Use the Provided Script**
```powershell
cd backend
.\start_redis_windows.ps1
```

### Step 3: Verify Redis is Running

Open a NEW terminal:
```powershell
# Test Redis connection
cd redis-windows
.\redis-cli.exe ping

# Should return: PONG
```

---

## Complete Startup Script

Save this as `START-SERVICES.ps1`:

```powershell
# Start PostgreSQL and Redis Services

Write-Host "Starting PostgreSQL..." -ForegroundColor Yellow

# Start PostgreSQL service
try {
    $pgService = Get-Service -Name "*postgres*" | Select-Object -First 1
    if ($pgService.Status -ne "Running") {
        Start-Service $pgService.Name
        Write-Host "  PostgreSQL started!" -ForegroundColor Green
    } else {
        Write-Host "  PostgreSQL already running" -ForegroundColor Green
    }
} catch {
    Write-Host "  Could not start PostgreSQL service" -ForegroundColor Red
    Write-Host "  Please start it manually from Services" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting Redis..." -ForegroundColor Yellow

# Start Redis
if (Test-Path "redis-windows\redis-server.exe") {
    Start-Process -FilePath "redis-windows\redis-server.exe" -WindowStyle Minimized
    Write-Host "  Redis started!" -ForegroundColor Green
} else {
    Write-Host "  Redis not found in redis-windows folder" -ForegroundColor Red
}

Write-Host ""
Write-Host "Services started!" -ForegroundColor Green
Write-Host ""
Write-Host "PostgreSQL: localhost:5432"
Write-Host "Redis: localhost:6379"
Write-Host ""
```

---

## Troubleshooting

### PostgreSQL Issues

**Problem: Service not found**
```powershell
# List all services with 'postgres' in name
Get-Service -Name "*postgres*"

# Use the exact name shown
net start <exact-service-name>
```

**Problem: Access denied**
```powershell
# Run PowerShell as Administrator
# Right-click PowerShell → Run as Administrator
net start postgresql-x64-16
```

**Problem: Service won't start**
```powershell
# Check PostgreSQL logs
# Usually in: C:\Program Files\PostgreSQL\16\data\log\

# Or check Event Viewer
eventvwr.msc
# Navigate to: Windows Logs → Application
# Look for PostgreSQL errors
```

**Problem: Port 5432 already in use**
```powershell
# Find what's using port 5432
netstat -ano | findstr :5432

# Kill the process (use PID from above)
taskkill /PID <PID> /F
```

### Redis Issues

**Problem: redis-server.exe not found**
```powershell
# Check if file exists
Test-Path redis-windows\redis-server.exe

# If not, download Redis for Windows:
# https://github.com/microsoftarchive/redis/releases
# Extract to redis-windows folder
```

**Problem: Port 6379 already in use**
```powershell
# Find what's using port 6379
netstat -ano | findstr :6379

# Kill the process
taskkill /PID <PID> /F
```

**Problem: Redis crashes immediately**
```powershell
# Run Redis with config file
cd redis-windows
.\redis-server.exe redis.windows.conf
```

---

## Verification Commands

### Check if Services are Running

```powershell
# Check PostgreSQL
Test-NetConnection -ComputerName localhost -Port 5432

# Check Redis
Test-NetConnection -ComputerName localhost -Port 6379

# Both should show: TcpTestSucceeded : True
```

### Test Database Connection

```powershell
# Test PostgreSQL connection
psql -U postgres -d interview_db -c "SELECT 1;"

# Should return: 1
```

### Test Redis Connection

```powershell
# Test Redis
cd redis-windows
.\redis-cli.exe ping

# Should return: PONG
```

---

## Auto-Start on Windows Boot (Optional)

### PostgreSQL
Already set to auto-start if installed as service.

To verify:
```powershell
Get-Service -Name "*postgres*" | Select-Object Name, StartType

# StartType should be: Automatic
```

### Redis
Create a scheduled task:

1. Open Task Scheduler (`taskschd.msc`)
2. Create Basic Task
3. Name: "Start Redis"
4. Trigger: At startup
5. Action: Start a program
6. Program: `C:\path\to\redis-windows\redis-server.exe`
7. Finish

---

## Quick Reference

### Start Everything
```powershell
# 1. Start PostgreSQL
net start postgresql-x64-16

# 2. Start Redis
Start-Process -FilePath "redis-windows\redis-server.exe" -WindowStyle Minimized

# 3. Verify
Test-NetConnection localhost -Port 5432
Test-NetConnection localhost -Port 6379
```

### Stop Everything
```powershell
# Stop PostgreSQL
net stop postgresql-x64-16

# Stop Redis
taskkill /IM redis-server.exe /F
```

### Check Status
```powershell
# PostgreSQL status
Get-Service -Name "*postgres*"

# Redis status (check if process is running)
Get-Process -Name redis-server -ErrorAction SilentlyContinue
```

---

## After Services are Running

Once PostgreSQL and Redis are running, you can start the application:

```powershell
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Then open: http://localhost:5173

---

## Need Help?

If services still won't start:

1. **Check if installed**: 
   - PostgreSQL: `psql --version`
   - Redis: `Test-Path redis-windows\redis-server.exe`

2. **Check ports are free**:
   ```powershell
   netstat -ano | findstr :5432
   netstat -ano | findstr :6379
   ```

3. **Run as Administrator**: Right-click PowerShell → Run as Administrator

4. **Check logs**:
   - PostgreSQL: `C:\Program Files\PostgreSQL\16\data\log\`
   - Redis: Check terminal output

5. **Restart computer**: Sometimes services need a fresh start
