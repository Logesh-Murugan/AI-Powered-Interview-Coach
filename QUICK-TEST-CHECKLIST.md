# Quick Test Checklist - Phase 1 & 2

## 🚀 Quick Start

```powershell
# Run this script to start everything
.\START-PHASE-2-TESTING.ps1
```

---

## ✅ 5-Minute Testing Checklist

### 1. Start Services (2 minutes)
```powershell
# Terminal 1 - Backend
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Expected:**
- Backend: `Uvicorn running on http://0.0.0.0:8000`
- Frontend: `Local: http://localhost:5173/`

---

### 2. Test Backend (1 minute)

**Open:** http://localhost:8000/docs

**Quick Test:**
- [ ] Swagger UI loads
- [ ] See 8+ endpoints listed
- [ ] Click "Try it out" on `/health`
- [ ] Response: `{"status": "healthy"}`

---

### 3. Test Frontend (2 minutes)

**Open:** http://localhost:5173

#### A. Register User
- [ ] Click "Sign Up"
- [ ] Fill form: Name, Email, Password
- [ ] Password strength shows "Strong" (green)
- [ ] Click "Sign Up"
- [ ] Redirected to Dashboard
- [ ] See "Welcome back, [Name]!"

#### B. Test Protected Route
- [ ] Open incognito: http://localhost:5173/dashboard
- [ ] Redirected to login page ✅

#### C. Login
- [ ] Enter email and password
- [ ] Click "Sign In"
- [ ] Redirected to Dashboard ✅

#### D. Logout
- [ ] Click user menu (top right)
- [ ] Click "Logout"
- [ ] Redirected to login ✅

---

## 🎯 What You Should See

### Frontend Pages

```
✅ Registration Page
   - Clean form with Material-UI
   - Password strength indicator
   - Form validation

✅ Login Page
   - Email and password fields
   - "Forgot Password?" link
   - "Sign Up" link

✅ Dashboard
   - User name in header
   - Welcome message
   - Quick action buttons

✅ Profile Page
   - User information
   - Edit profile form
   - Change password form
```

### Backend API

```
✅ API Documentation (http://localhost:8000/docs)
   - Interactive Swagger UI
   - All endpoints listed
   - Try it out functionality

✅ Health Check (http://localhost:8000/health)
   {
     "status": "healthy",
     "database": "connected",
     "redis": "connected"
   }
```

### Browser DevTools

```
✅ Local Storage (after login)
   - access_token: eyJhbGci...
   - refresh_token: eyJhbGci...
   - user: {"id":1,"email":"..."}

✅ Network Tab
   - POST /auth/login → 200 OK
   - GET /users/me → 200 OK
   - Response times < 200ms

✅ Console
   - No errors
   - Auth logs visible
```

---

## 🔍 Quick Verification Commands

### Test Backend Health
```powershell
curl http://localhost:8000/health
```
**Expected:** `{"status":"healthy"}`

### Test User Registration
```powershell
curl -X POST http://localhost:8000/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"SecurePass123!","name":"Test User"}'
```
**Expected:** `{"access_token":"...","user":{...}}`

### Test User Login
```powershell
curl -X POST http://localhost:8000/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
```
**Expected:** `{"access_token":"...","refresh_token":"..."}`

### Check Database
```sql
psql -U interview_user -d interview_coach_db -c "SELECT id, email, name FROM users;"
```
**Expected:** List of registered users

### Check Redis
```powershell
redis-cli KEYS *
```
**Expected:** `user:*:profile` keys

---

## ❌ Common Issues

### Issue: Backend won't start
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

### Issue: Frontend shows network error
```powershell
# Check backend is running
curl http://localhost:8000/health

# Check frontend .env
cat frontend\.env
# Should have: VITE_API_BASE_URL=http://localhost:8000
```

### Issue: Cannot login
```powershell
# Clear browser local storage
# F12 → Application → Local Storage → Clear All

# Try registering new user
# Then login with new credentials
```

---

## 📊 Success Criteria

### All Green? You're Ready! ✅

- [x] Backend starts without errors
- [x] Frontend starts without errors
- [x] Can register new user
- [x] Can login with credentials
- [x] Dashboard loads after login
- [x] Protected routes redirect to login
- [x] Can logout successfully
- [x] API docs accessible
- [x] Health check returns healthy
- [x] Database contains users
- [x] Redis caches data

---

## 📚 Full Documentation

For detailed testing:
- **PHASE-2-TESTING-GUIDE.md** - Complete testing guide
- **PHASE-2-VISUAL-OUTPUTS.md** - Visual reference
- **PHASE-2-COMPLETE-SUMMARY.md** - Full summary

---

## 🎉 Next Steps

Once all checks pass:
1. ✅ Phase 1 & 2 are complete
2. 🚀 Ready for Phase 3: Resume Upload & Parsing
3. 📝 Start with TASK-018: Resume Model

---

**Quick Start:** `.\START-PHASE-2-TESTING.ps1`
**API Docs:** http://localhost:8000/docs
**Frontend:** http://localhost:5173
