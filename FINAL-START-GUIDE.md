# Final Start Guide - Step by Step

## 🎯 Current Status

✅ Database: Working  
✅ Password: Fixed  
✅ Migrations: Complete  
✅ jwt-decode: Installed  
❌ Services: Need to start  

---

## 🚀 Start Services (3 Terminals)

### Terminal 1: Start Backend

```powershell
cd D:\Ai_powered_interview_coach\backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Wait for this message:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Terminal 2: Start Redis

```powershell
cd D:\Ai_powered_interview_coach\backend
.\start_redis_windows.ps1
```

**Wait for this message:**
```
Redis server started successfully
```

### Terminal 3: Start Frontend

```powershell
cd D:\Ai_powered_interview_coach\frontend
npm run dev
```

**Wait for this message:**
```
Local: http://localhost:5173/
```

---

## 🌐 Access Application

Once all 3 services are running:

1. **Frontend**: http://localhost:5173
2. **Backend API**: http://localhost:8000
3. **API Docs**: http://localhost:8000/docs
4. **Health Check**: http://localhost:8000/health

---

## ✅ Verify Everything Works

### 1. Check Backend Health

Open: http://localhost:8000/health

**Expected:**
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected"
}
```

### 2. Check API Docs

Open: http://localhost:8000/docs

**Expected:** Interactive Swagger UI with all endpoints

### 3. Check Frontend

Open: http://localhost:5173

**Expected:** Login/Register page loads without errors

---

## 🧪 Test Registration

1. Go to http://localhost:5173
2. Click "Sign Up"
3. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: SecurePass123!
4. Click "Sign Up"

**Expected:** Redirected to dashboard with "Welcome back, Test User!"

---

## 🆘 Troubleshooting

### Frontend Shows Import Error?

The error you saw means the frontend started before jwt-decode was installed.

**Solution:**
1. Stop frontend (Ctrl+C in Terminal 3)
2. Run: `npm install jwt-decode`
3. Start again: `npm run dev`

### Backend Shows "This page isn't working"?

This means backend isn't running.

**Solution:**
1. Go to Terminal 1
2. Make sure you see "Uvicorn running on http://0.0.0.0:8000"
3. If not, start it: `uvicorn app.main:app --reload`

### Frontend Shows Network Error?

This means frontend can't reach backend.

**Solution:**
1. Check backend is running on port 8000
2. Check http://localhost:8000/health
3. Restart both frontend and backend

---

## 📋 Quick Checklist

Before testing, make sure:

- [ ] Terminal 1: Backend running (see "Uvicorn running")
- [ ] Terminal 2: Redis running (see "Redis server started")
- [ ] Terminal 3: Frontend running (see "Local: http://localhost:5173")
- [ ] Browser: http://localhost:5173 loads
- [ ] Browser: http://localhost:8000/docs loads
- [ ] No errors in any terminal

---

## 🎉 Success Indicators

### Backend Terminal Should Show:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Frontend Terminal Should Show:
```
VITE v7.2.4  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Browser Should Show:
- Clean login/register page
- No red error messages
- Password strength indicator works

---

## 🔄 If You Need to Restart

### Stop All Services:
- Press `Ctrl+C` in each terminal

### Start Again:
1. Terminal 1: Backend
2. Terminal 2: Redis  
3. Terminal 3: Frontend

---

**You're almost there! Just start the 3 services and test!**
