# Complete Startup Guide - Interview Master AI

## Step-by-Step Instructions

### Step 1: Start PostgreSQL and Redis

Run this command:
```powershell
.\START-SERVICES.ps1
```

This will:
- ✅ Start PostgreSQL service
- ✅ Start Redis server
- ✅ Verify both are running

**Expected Output:**
```
========================================
  Starting PostgreSQL and Redis       
========================================

[1/2] Starting PostgreSQL...
  ✓ PostgreSQL started successfully!

[2/2] Starting Redis...
  ✓ Redis started successfully!

========================================
  Services Status Check                
========================================

Checking PostgreSQL (port 5432)...
  ✓ PostgreSQL: RUNNING

Checking Redis (port 6379)...
  ✓ Redis: RUNNING
```

### Step 2: Start Backend Server

Open a NEW terminal and run:
```powershell
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

Keep this terminal open!

### Step 3: Start Frontend Server

Open ANOTHER NEW terminal and run:
```powershell
cd frontend
npm run dev
```

**Expected Output:**
```
  VITE v7.3.1  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
```

Keep this terminal open too!

### Step 4: Open Browser

Go to: **http://localhost:5173**

You should see the Login page!

---

## Quick Troubleshooting

### If PostgreSQL won't start:

```powershell
# Check if service exists
Get-Service -Name "*postgres*"

# Start manually
net start postgresql-x64-16

# Or run as Administrator
# Right-click PowerShell → Run as Administrator
```

### If Redis won't start:

```powershell
# Start manually
cd redis-windows
.\redis-server.exe

# Keep this terminal open
```

### If Backend shows database error:

```powershell
# Check PostgreSQL is running
Test-NetConnection localhost -Port 5432

# Check database exists
psql -U postgres -c "\l"

# Create database if needed
psql -U postgres -c "CREATE DATABASE interview_db;"
```

### If Backend shows Redis error:

```powershell
# Check Redis is running
Test-NetConnection localhost -Port 6379

# Test Redis connection
cd redis-windows
.\redis-cli.exe ping
# Should return: PONG
```

---

## Summary of Commands

### Start Everything:
```powershell
# Terminal 1: Start services
.\START-SERVICES.ps1

# Terminal 2: Start backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3: Start frontend
cd frontend
npm run dev

# Browser: Open http://localhost:5173
```

### Stop Everything:
```powershell
# In each terminal: Press Ctrl+C

# Stop PostgreSQL (optional)
net stop postgresql-x64-16

# Stop Redis (optional)
taskkill /IM redis-server.exe /F
```

---

## URLs

- **Application**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

## First Time Use

1. **Register Account**
   - Click "Register"
   - Enter: Name, Email, Password
   - Click "Register" button

2. **Login**
   - Enter your email and password
   - Click "Login"

3. **Start Interview**
   - Click "Start Interview" button
   - Fill in job role (e.g., "Software Engineer")
   - Select difficulty (Easy, Medium, Hard, Expert)
   - Choose number of questions (1-20)
   - Click "Start Interview"

4. **Answer Questions**
   - Read the question
   - Type your answer
   - Click "Submit Answer"
   - Repeat for all questions

5. **View Results**
   - See your performance summary
   - Check detailed scores
   - Review feedback

---

## Need More Help?

See detailed guides:
- **START-POSTGRESQL-REDIS.md** - Detailed PostgreSQL and Redis setup
- **HOW-TO-RUN-APPLICATION.md** - Complete application guide
- **QUICK-START-GUIDE.md** - Quick reference

---

## Common Issues

**Issue**: "Port already in use"
```powershell
# Find what's using the port
netstat -ano | findstr :8000
netstat -ano | findstr :5173

# Kill the process
taskkill /PID <PID> /F
```

**Issue**: "Module not found" in frontend
```powershell
cd frontend
npm install
npm run dev
```

**Issue**: "Database connection failed"
```powershell
# Check backend/.env file
# Make sure DATABASE_URL is correct:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/interview_db
```

**Issue**: "Redis connection failed"
```powershell
# Start Redis manually
cd redis-windows
.\redis-server.exe
```

---

That's it! You're ready to use Interview Master AI! 🚀
