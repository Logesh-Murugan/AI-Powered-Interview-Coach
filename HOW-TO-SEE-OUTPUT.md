# How to See the Output - Simple Guide

## 🎯 Goal
See your working authentication system in action!

---

## 🚀 Fastest Way (1 Command)

```powershell
.\START-PHASE-2-TESTING.ps1
```

This script will:
1. ✅ Check and start PostgreSQL
2. ✅ Check and start Redis
3. ✅ Start backend server
4. ✅ Start frontend server
5. ✅ Open browser windows
6. ✅ Show you what to test

**Then just follow the on-screen instructions!**

---

## 📱 What You'll See

### 1. Frontend (http://localhost:5173)

**Registration Page:**
```
┌─────────────────────────────────┐
│   Create Your Account           │
│                                 │
│   Name:     [John Doe      ]    │
│   Email:    [john@test.com ]    │
│   Password: [••••••••••••  ]    │
│   Strength: ████████░░ Strong   │
│                                 │
│   [    Sign Up    ]             │
└─────────────────────────────────┘
```

**After Registration:**
```
┌─────────────────────────────────┐
│   Welcome back, John! 👋        │
│                                 │
│   📄 Resumes: 0                 │
│   🎤 Interviews: 0              │
│                                 │
│   [📤 Upload Resume]            │
│   [🎯 Start Interview]          │
└─────────────────────────────────┘
```

### 2. Backend API (http://localhost:8000/docs)

**Swagger UI:**
```
┌─────────────────────────────────────┐
│  FastAPI - Interview Master AI      │
│                                     │
│  🔐 auth                            │
│  ├─ POST /auth/register             │
│  ├─ POST /auth/login                │
│  ├─ POST /auth/refresh              │
│  └─ POST /auth/logout               │
│                                     │
│  👤 users                           │
│  ├─ GET  /users/me                  │
│  ├─ PUT  /users/me                  │
│  └─ PUT  /users/me/password         │
└─────────────────────────────────────┘
```

### 3. Browser DevTools (F12)

**Local Storage:**
```
access_token:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
refresh_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
user:          {"id":1,"email":"john@test.com","name":"John Doe"}
```

**Network Tab:**
```
POST /auth/login     200 OK  145ms
GET  /users/me       200 OK   45ms
```

---

## 🧪 Quick Tests (5 Minutes)

### Test 1: Register User (1 min)
1. Open http://localhost:5173
2. Click "Sign Up"
3. Fill form and submit
4. **See:** Dashboard with your name

### Test 2: Login (1 min)
1. Logout (user menu → Logout)
2. Click "Sign In"
3. Enter credentials
4. **See:** Dashboard again

### Test 3: Protected Route (1 min)
1. Open incognito window
2. Go to http://localhost:5173/dashboard
3. **See:** Redirected to login page ✅

### Test 4: API Test (1 min)
1. Open http://localhost:8000/docs
2. Click `/auth/register`
3. Click "Try it out"
4. Enter test data
5. **See:** 201 response with tokens

### Test 5: Database Check (1 min)
```powershell
psql -U interview_user -d interview_coach_db -c "SELECT email, name FROM users;"
```
**See:** Your registered users

---

## 📸 Screenshots of Expected Output

### Frontend - Registration Success
```
✅ Registration successful!
Redirecting to dashboard...
```

### Frontend - Dashboard
```
Welcome back, John! 👋

📊 Dashboard  |  📄 Resumes  |  🎤 Interviews  |  👤 Profile

Quick Actions:
[📤 Upload Resume]
[🎯 Start Practice Interview]
```

### Backend - Health Check
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2026-02-09T10:30:00.123456"
}
```

### Backend - Login Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "john@test.com",
    "name": "John Doe",
    "is_active": true
  }
}
```

---

## 🎬 Video Walkthrough (If You Were Recording)

1. **Start Services** (0:00-0:30)
   - Run START-PHASE-2-TESTING.ps1
   - Show services starting

2. **Register User** (0:30-1:00)
   - Open frontend
   - Fill registration form
   - Show password strength indicator
   - Submit and see dashboard

3. **Test Protected Routes** (1:00-1:30)
   - Open incognito
   - Try to access dashboard
   - Show redirect to login

4. **Test API** (1:30-2:00)
   - Open Swagger UI
   - Test login endpoint
   - Show response with tokens

5. **Check Database** (2:00-2:30)
   - Run SQL query
   - Show user data
   - Show refresh tokens

---

## 📋 Checklist - What to Look For

### Frontend ✅
- [ ] Clean, modern UI
- [ ] Forms work correctly
- [ ] Password strength indicator
- [ ] Success/error messages
- [ ] Smooth navigation
- [ ] User name in header
- [ ] Logout works

### Backend ✅
- [ ] API docs load
- [ ] All endpoints listed
- [ ] Health check returns healthy
- [ ] Endpoints return correct data
- [ ] Response times < 200ms
- [ ] Proper error messages

### Security ✅
- [ ] Passwords are hidden
- [ ] Tokens in local storage
- [ ] Protected routes redirect
- [ ] Token refresh works
- [ ] Logout clears tokens

### Database ✅
- [ ] Users stored correctly
- [ ] Passwords are hashed
- [ ] Refresh tokens tracked
- [ ] Timestamps present

---

## 🆘 If Something Doesn't Work

### Backend won't start?
```powershell
# Check PostgreSQL
Get-Service postgresql*

# Check Redis
redis-cli ping

# Restart backend
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload
```

### Frontend shows error?
```powershell
# Check backend is running
curl http://localhost:8000/health

# Restart frontend
cd frontend
npm run dev
```

### Can't login?
```powershell
# Clear browser storage
# F12 → Application → Local Storage → Clear All

# Register new user
# Try login again
```

---

## 📚 More Details

Want more information? Check these files:

1. **QUICK-TEST-CHECKLIST.md** - 5-minute testing guide
2. **PHASE-2-TESTING-GUIDE.md** - Complete testing instructions
3. **PHASE-2-VISUAL-OUTPUTS.md** - Detailed visual reference
4. **PHASE-2-COMPLETE-SUMMARY.md** - Full summary

---

## 🎉 Success!

If you can:
- ✅ Register a user
- ✅ Login successfully
- ✅ See the dashboard
- ✅ Access protected routes
- ✅ View API docs

**Then Phase 1 & 2 are working perfectly!**

---

## 🚀 Next Steps

1. Test everything using this guide
2. Verify all features work
3. Read PHASE-2-COMPLETE-SUMMARY.md
4. Start Phase 3: Resume Upload & Parsing

---

**Quick Start Command:**
```powershell
.\START-PHASE-2-TESTING.ps1
```

**Frontend:** http://localhost:5173
**Backend:** http://localhost:8000/docs
**Health:** http://localhost:8000/health
