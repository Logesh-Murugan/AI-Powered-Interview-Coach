# Phase 1 & 2 Testing Guide

## Overview
This guide shows you how to run and test the completed Phase 1 (Infrastructure) and Phase 2 (Authentication) features.

## Prerequisites Checklist

### Required Services
- ✅ PostgreSQL 18 installed and running
- ✅ Redis installed and running
- ✅ Node.js 18+ installed
- ✅ Python 3.11+ installed

### Environment Setup
- ✅ Backend `.env` file configured
- ✅ Frontend `.env` file configured
- ✅ Database migrations run
- ✅ Dependencies installed

---

## Quick Start - Run Everything

### Option 1: Using Docker (Recommended)
```powershell
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Local Development

#### Terminal 1 - Start PostgreSQL
```powershell
cd backend
.\start_postgres_local.ps1
```

#### Terminal 2 - Start Redis
```powershell
cd backend
.\start_redis_windows.ps1
```

#### Terminal 3 - Start Backend
```powershell
cd backend

# Activate virtual environment
.\venv\Scripts\activate

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 4 - Start Frontend
```powershell
cd frontend

# Start development server
npm run dev
```

---

## Testing Phase 1: Infrastructure

### 1. Database Connection Test
```powershell
cd backend
python setup_database.py
```

**Expected Output:**
```
✅ Database connection successful
✅ Tables created: users, refresh_tokens, password_reset_tokens
✅ PostgreSQL version: 18.x
```

### 2. Redis Connection Test
```powershell
cd backend
python -c "from app.services.cache_service import CacheService; cache = CacheService(); cache.set('test', 'value', 60); print('✅ Redis working:', cache.get('test'))"
```

**Expected Output:**
```
✅ Redis working: value
```

### 3. Backend Health Check
Open browser: `http://localhost:8000/health`

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2026-02-09T..."
}
```

### 4. API Documentation
Open browser: `http://localhost:8000/docs`

**Expected Output:**
- Interactive Swagger UI
- All endpoints listed:
  - `/auth/register`
  - `/auth/login`
  - `/auth/logout`
  - `/auth/refresh`
  - `/users/me`
  - `/users/me/password`
  - `/users/password-reset/request`
  - `/users/password-reset/confirm`

---

## Testing Phase 2: Authentication

### 1. User Registration Flow

#### Via Frontend (http://localhost:5173)
1. Navigate to Register page
2. Fill in the form:
   - **Name**: John Doe
   - **Email**: john@example.com
   - **Password**: SecurePass123!
   - **Confirm Password**: SecurePass123!
3. Click "Sign Up"

**Expected Output:**
- ✅ Password strength indicator shows "Strong"
- ✅ Form validation passes
- ✅ Success message appears
- ✅ Redirected to Dashboard
- ✅ User name appears in header

#### Via API (http://localhost:8000/docs)
1. Open `/auth/register` endpoint
2. Click "Try it out"
3. Enter JSON:
```json
{
  "email": "test@example.com",
  "password": "SecurePass123!",
  "name": "Test User"
}
```
4. Click "Execute"

**Expected Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User",
    "is_active": true,
    "created_at": "2026-02-09T..."
  }
}
```

### 2. User Login Flow

#### Via Frontend
1. Navigate to Login page (http://localhost:5173/login)
2. Enter credentials:
   - **Email**: john@example.com
   - **Password**: SecurePass123!
3. Click "Sign In"

**Expected Output:**
- ✅ Loading spinner appears
- ✅ Success message
- ✅ Redirected to Dashboard
- ✅ User authenticated

#### Via API
1. Open `/auth/login` endpoint
2. Enter credentials:
```json
{
  "email": "test@example.com",
  "password": "SecurePass123!"
}
```

**Expected Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

### 3. Protected Routes Test

#### Test 1: Access Without Login
1. Open browser in incognito mode
2. Navigate to: http://localhost:5173/dashboard

**Expected Output:**
- ✅ Redirected to login page
- ✅ URL shows: http://localhost:5173/login

#### Test 2: Access With Login
1. Login first
2. Navigate to: http://localhost:5173/dashboard

**Expected Output:**
- ✅ Dashboard page loads
- ✅ User name in header
- ✅ No redirect

#### Test 3: Token Validation
1. Login to application
2. Open DevTools (F12) → Application → Local Storage
3. Check stored items:

**Expected Storage:**
```
access_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
refresh_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
user: {"id":1,"email":"test@example.com","name":"Test User"}
```

### 4. Token Refresh Test

#### Automatic Refresh Test
1. Login to application
2. Wait 15 minutes (or manually expire token)
3. Navigate to any protected route

**Expected Output:**
- ✅ Brief loading spinner
- ✅ New access token obtained
- ✅ Page loads successfully
- ✅ No redirect to login

#### Manual Refresh via API
1. Copy refresh_token from login response
2. Open `/auth/refresh` endpoint
3. Send request:
```json
{
  "refresh_token": "your_refresh_token_here"
}
```

**Expected Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 5. Password Reset Flow

#### Step 1: Request Reset
1. Navigate to Login page
2. Click "Forgot Password?"
3. Enter email: test@example.com
4. Click "Send Reset Link"

**Expected Output:**
- ✅ Success message: "Password reset link sent"
- ✅ Check backend logs for reset token

**Backend Logs:**
```
INFO: Password reset requested for: test@example.com
INFO: Reset token: abc123def456 (expires in 1 hour)
```

#### Step 2: Confirm Reset (Via API)
1. Copy reset token from logs
2. Open `/users/password-reset/confirm` endpoint
3. Send request:
```json
{
  "token": "abc123def456",
  "new_password": "NewSecurePass123!"
}
```

**Expected Response (200 OK):**
```json
{
  "message": "Password reset successful"
}
```

#### Step 3: Login with New Password
1. Navigate to Login page
2. Enter email and new password
3. Click "Sign In"

**Expected Output:**
- ✅ Login successful
- ✅ Redirected to Dashboard

### 6. User Profile Test

#### Get Current User
1. Login to application
2. Open `/users/me` endpoint (with Authorization header)
3. Click "Execute"

**Expected Response (200 OK):**
```json
{
  "id": 1,
  "email": "test@example.com",
  "name": "Test User",
  "target_role": null,
  "experience_level": null,
  "is_active": true,
  "created_at": "2026-02-09T...",
  "updated_at": "2026-02-09T..."
}
```

#### Update Profile
1. Open `/users/me` PUT endpoint
2. Send request:
```json
{
  "name": "Updated Name",
  "target_role": "Software Engineer",
  "experience_level": "mid"
}
```

**Expected Response (200 OK):**
```json
{
  "id": 1,
  "email": "test@example.com",
  "name": "Updated Name",
  "target_role": "Software Engineer",
  "experience_level": "mid",
  "is_active": true
}
```

### 7. Change Password Test

1. Login to application
2. Navigate to Profile page
3. Open `/users/me/password` endpoint
4. Send request:
```json
{
  "current_password": "SecurePass123!",
  "new_password": "NewPassword456!"
}
```

**Expected Response (200 OK):**
```json
{
  "message": "Password updated successfully"
}
```

### 8. Logout Test

#### Via Frontend
1. Click user menu in header
2. Click "Logout"

**Expected Output:**
- ✅ Redirected to login page
- ✅ Local storage cleared
- ✅ Cannot access protected routes

#### Via API
1. Open `/auth/logout` endpoint
2. Click "Execute" (with Authorization header)

**Expected Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Frontend UI Testing Checklist

### Registration Page (http://localhost:5173/register)
- [ ] Form displays correctly
- [ ] Password strength indicator works
- [ ] Validation errors show for invalid input
- [ ] Success message on registration
- [ ] Redirect to dashboard after registration
- [ ] "Already have an account?" link works

### Login Page (http://localhost:5173/login)
- [ ] Form displays correctly
- [ ] Validation errors show for invalid input
- [ ] Success message on login
- [ ] Redirect to dashboard after login
- [ ] "Forgot Password?" link works
- [ ] "Don't have an account?" link works

### Password Reset Page (http://localhost:5173/password-reset)
- [ ] Email input displays
- [ ] Success message after request
- [ ] "Back to Login" link works

### Dashboard Page (http://localhost:5173/dashboard)
- [ ] Requires authentication
- [ ] User name displays in header
- [ ] Welcome message shows
- [ ] Navigation menu works

### Profile Page (http://localhost:5173/profile)
- [ ] Requires authentication
- [ ] User data displays
- [ ] Edit profile form works
- [ ] Change password form works
- [ ] Success messages show

---

## Backend API Testing Checklist

### Health & Status
- [ ] `GET /health` returns healthy status
- [ ] `GET /docs` shows API documentation
- [ ] `GET /redoc` shows alternative docs

### Authentication Endpoints
- [ ] `POST /auth/register` creates new user
- [ ] `POST /auth/login` returns tokens
- [ ] `POST /auth/refresh` refreshes access token
- [ ] `POST /auth/logout` invalidates tokens

### User Endpoints
- [ ] `GET /users/me` returns current user (requires auth)
- [ ] `PUT /users/me` updates user profile (requires auth)
- [ ] `PUT /users/me/password` changes password (requires auth)
- [ ] `POST /users/password-reset/request` sends reset email
- [ ] `POST /users/password-reset/confirm` resets password

---

## Database Verification

### Check Users Table
```sql
-- Connect to PostgreSQL
psql -U interview_user -d interview_coach_db

-- View users
SELECT id, email, name, is_active, created_at FROM users;

-- Expected output:
--  id |        email        |    name     | is_active |         created_at
-- ----+--------------------+-------------+-----------+----------------------------
--   1 | test@example.com   | Test User   | t         | 2026-02-09 10:30:00.123456
```

### Check Refresh Tokens Table
```sql
SELECT id, user_id, expires_at, is_revoked FROM refresh_tokens;

-- Expected output:
--  id | user_id |        expires_at          | is_revoked
-- ----+---------+---------------------------+------------
--   1 |       1 | 2026-02-16 10:30:00.123456 | f
```

### Check Password Reset Tokens Table
```sql
SELECT id, user_id, token, expires_at, is_used FROM password_reset_tokens;

-- Expected output:
--  id | user_id |     token      |        expires_at          | is_used
-- ----+---------+---------------+---------------------------+---------
--   1 |       1 | abc123def456  | 2026-02-09 11:30:00.123456 | f
```

---

## Redis Verification

### Check Cached Data
```powershell
# Connect to Redis CLI
redis-cli

# Check keys
KEYS *

# Expected output:
# 1) "user:1:profile"
# 2) "session:abc123"

# Get user profile cache
GET user:1:profile

# Expected output:
# "{\"id\":1,\"email\":\"test@example.com\",\"name\":\"Test User\"}"
```

---

## Common Issues & Solutions

### Issue 1: Cannot Connect to Database
**Symptoms:** `Connection refused` or `Database not found`

**Solutions:**
```powershell
# Check if PostgreSQL is running
Get-Service postgresql*

# Start PostgreSQL
.\backend\start_postgres_local.ps1

# Verify connection
psql -U interview_user -d interview_coach_db
```

### Issue 2: Cannot Connect to Redis
**Symptoms:** `Connection refused` or `Redis not available`

**Solutions:**
```powershell
# Start Redis
.\backend\start_redis_windows.ps1

# Test connection
redis-cli ping
# Expected: PONG
```

### Issue 3: Frontend Cannot Connect to Backend
**Symptoms:** `Network Error` or `CORS Error`

**Solutions:**
1. Check backend is running on port 8000
2. Check frontend `.env` has correct API URL:
```
VITE_API_BASE_URL=http://localhost:8000
```
3. Restart both servers

### Issue 4: Token Expired Immediately
**Symptoms:** Redirected to login right after login

**Solutions:**
1. Check system time is correct
2. Check JWT secret is set in backend `.env`
3. Clear browser local storage
4. Login again

### Issue 5: Database Migrations Failed
**Symptoms:** `Table does not exist` errors

**Solutions:**
```powershell
cd backend

# Reset database
alembic downgrade base
alembic upgrade head

# Or recreate database
python setup_database.py
```

---

## Performance Benchmarks

### Expected Response Times
- Health check: < 50ms
- User registration: < 200ms
- User login: < 150ms
- Token refresh: < 100ms
- Get user profile: < 50ms (cached)
- Update user profile: < 150ms

### Load Testing (Optional)
```powershell
# Install Apache Bench
# Test login endpoint
ab -n 1000 -c 10 -p login.json -T application/json http://localhost:8000/auth/login

# Expected results:
# - Requests per second: > 100
# - Mean response time: < 200ms
# - Failed requests: 0
```

---

## Next Steps

### Phase 2 Complete ✅
All authentication features are working. You should be able to:
- Register new users
- Login and logout
- Access protected routes
- Refresh tokens automatically
- Reset passwords
- Update user profiles

### Ready for Phase 3: Resume Upload & Parsing
Once you've verified everything works, you can proceed to:
- TASK-018: Resume Model and Database Schema
- TASK-019: Resume Upload Endpoint
- TASK-020: PDF/DOCX Text Extraction
- TASK-021: Skill Extraction with NLP

---

## Support & Documentation

### Quick Reference Files
- `backend/QUICK-REFERENCE.md` - Backend commands
- `frontend/QUICK-START.md` - Frontend setup
- `DOCKER-QUICK-START.md` - Docker commands
- `READY-TO-DEVELOP.md` - Development guide

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Logs Location
- Backend logs: Console output
- Frontend logs: Browser DevTools Console
- PostgreSQL logs: `C:\Program Files\PostgreSQL\18\data\log\`
- Redis logs: `backend\redis-windows\redis.log`

---

**Last Updated**: 2026-02-09
**Phase Status**: Phase 1 & 2 Complete ✅
