# Quick Start Guide - Start Both Servers

## Prerequisites
- PostgreSQL running on port 5432
- Redis running on port 6379

## Step 1: Start Backend Server

Open a terminal and run:

```powershell
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO: Registered Groq provider #1
INFO: Registered Groq provider #2
INFO: Registered Groq provider #3
INFO: Registered HuggingFace provider #1
INFO: Registered HuggingFace provider #2
INFO: AI Orchestrator initialized
INFO: Application startup complete
INFO: Uvicorn running on http://0.0.0.0:8000
```

**Verify backend is running:**
- Open http://localhost:8000/health
- Should see: `{"status":"healthy","version":"1.0.0",...}`

## Step 2: Start Frontend Server

Open a NEW terminal and run:

```powershell
cd frontend
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Verify frontend is running:**
- Open http://localhost:5173
- Should see the login page

## Step 3: Test Interview Creation

1. **Login or Register**
   - Go to http://localhost:5173/login
   - Login with existing account or register new one

2. **Navigate to Start Interview**
   - Click "Start Interview" from dashboard
   - Or go directly to http://localhost:5173/interviews

3. **Fill the Form**
   - Target Role: Software Engineer
   - Difficulty: Easy
   - Number of Questions: 5
   - Categories: Technical, Coding

4. **Click "Start Interview"**
   - Should show "Creating Session..." loading indicator
   - Backend will generate questions using AI (takes 5-10 seconds)
   - Should navigate to `/interviews/{session_id}/session`
   - First question should display with timer

## Troubleshooting

### Backend Not Starting

**Error**: "Port 8000 is already in use"
```powershell
# Find and kill the process
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Error**: "Database connection failed"
```powershell
# Check PostgreSQL is running
pg_isready -h localhost -p 5432
```

**Error**: "Redis connection failed"
```powershell
# Check Redis is running
redis-cli ping
# Should return: PONG
```

### Frontend Not Starting

**Error**: "Port 5173 is already in use"
```powershell
# Kill the process
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Error**: "Module not found"
```powershell
cd frontend
npm install
```

### Interview Creation Fails

**Error**: "Failed to create interview session"

1. **Check backend logs** for errors
2. **Check API keys** in `backend/.env`:
   ```
   GROQ_API_KEY=gsk_...
   GROQ_API_KEY_2=gsk_...
   GROQ_API_KEY_3=gsk_...
   ```
3. **Check providers are registered**:
   - Look for "Registered Groq provider #1" in backend logs
4. **Check network**:
   - Open browser console (F12)
   - Look for failed API calls
   - Check if backend is reachable

### 404 Page Not Found

**Cause**: Backend is not running or API call failed

**Solution**:
1. Verify backend is running on port 8000
2. Check http://localhost:8000/health
3. Check browser console for API errors
4. Restart backend if needed

## Quick Commands

### Start Everything
```powershell
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Stop Everything
- Press `Ctrl+C` in each terminal

### Restart Backend Only
```powershell
# In backend terminal, press Ctrl+C, then:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Restart Frontend Only
```powershell
# In frontend terminal, press Ctrl+C, then:
npm run dev
```

## URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Next Steps

After both servers are running:

1. ✅ Login or register
2. ✅ Upload a resume (optional)
3. ✅ Start an interview session
4. ✅ Answer questions
5. ✅ View evaluation and summary

---

**Status**: Ready to start
**Date**: February 13, 2026
