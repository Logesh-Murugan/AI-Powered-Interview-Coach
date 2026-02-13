# Phase 1 & 2 - Expected Visual Outputs

## Quick Visual Reference Guide
This document shows exactly what you should see when testing the application.

---

## 1. Starting the Application

### Terminal Output - Backend
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Database connected successfully
INFO:     Redis connected successfully
```

### Terminal Output - Frontend
```
  VITE v7.2.4  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

## 2. Frontend Pages

### A. Registration Page (http://localhost:5173/register)

**Visual Layout:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│              Interview Master AI                │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │         Create Your Account               │ │
│  │                                           │ │
│  │  Name                                     │ │
│  │  [John Doe                            ]   │ │
│  │                                           │ │
│  │  Email                                    │ │
│  │  [john@example.com                    ]   │ │
│  │                                           │ │
│  │  Password                                 │ │
│  │  [••••••••••••                        ] 👁 │ │
│  │  Password Strength: ████████░░ Strong     │ │
│  │                                           │ │
│  │  Confirm Password                         │ │
│  │  [••••••••••••                        ] 👁 │ │
│  │                                           │ │
│  │  [        Sign Up        ]                │ │
│  │                                           │ │
│  │  Already have an account? Sign In         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Password Strength Indicator Colors:**
- Weak: 🔴 Red (< 6 characters)
- Fair: 🟡 Yellow (6-8 characters, no special chars)
- Good: 🟠 Orange (8+ characters, mixed case)
- Strong: 🟢 Green (8+ characters, mixed case, numbers, special chars)

**Success State:**
```
┌─────────────────────────────────────────┐
│  ✅ Registration successful!            │
│  Redirecting to dashboard...            │
└─────────────────────────────────────────┘
```

**Error State:**
```
┌─────────────────────────────────────────┐
│  ❌ Email already registered            │
└─────────────────────────────────────────┘
```

---

### B. Login Page (http://localhost:5173/login)

**Visual Layout:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│              Interview Master AI                │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │         Welcome Back                      │ │
│  │                                           │ │
│  │  Email                                    │ │
│  │  [john@example.com                    ]   │ │
│  │                                           │ │
│  │  Password                                 │ │
│  │  [••••••••••••                        ] 👁 │ │
│  │                                           │ │
│  │  [ ] Remember me    Forgot Password?     │ │
│  │                                           │ │
│  │  [        Sign In        ]                │ │
│  │                                           │ │
│  │  Don't have an account? Sign Up           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Loading State:**
```
┌─────────────────────────────────────────┐
│  [        ⏳ Signing in...        ]     │
└─────────────────────────────────────────┘
```

**Success State:**
```
┌─────────────────────────────────────────┐
│  ✅ Login successful!                   │
│  Redirecting to dashboard...            │
└─────────────────────────────────────────┘
```

---

### C. Dashboard Page (http://localhost:5173/dashboard)

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Interview Master AI          👤 John Doe ▼  🔔  ⚙️       │
├─────────────────────────────────────────────────────────────┤
│  📊 Dashboard  |  📄 Resumes  |  🎤 Interviews  |  👤 Profile │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Welcome back, John! 👋                                     │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ │
│  │  📄 Resumes     │  │  🎤 Interviews  │  │  📈 Stats  │ │
│  │                 │  │                 │  │            │ │
│  │      0          │  │       0         │  │   Ready    │ │
│  │   Uploaded      │  │   Completed     │  │  to Start  │ │
│  └─────────────────┘  └─────────────────┘  └────────────┘ │
│                                                             │
│  Quick Actions:                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📤 Upload Resume                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🎯 Start Practice Interview                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**User Menu Dropdown:**
```
┌──────────────────────┐
│  👤 Profile          │
│  ⚙️  Settings        │
│  📊 My Stats         │
│  ─────────────────   │
│  🚪 Logout           │
└──────────────────────┘
```

---

### D. Profile Page (http://localhost:5173/profile)

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Interview Master AI          👤 John Doe ▼  🔔  ⚙️       │
├─────────────────────────────────────────────────────────────┤
│  📊 Dashboard  |  📄 Resumes  |  🎤 Interviews  |  👤 Profile │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Your Profile                                               │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Personal Information                                 │ │
│  │                                                       │ │
│  │  Name                                                 │ │
│  │  [John Doe                                        ]   │ │
│  │                                                       │ │
│  │  Email                                                │ │
│  │  [john@example.com                                ]   │ │
│  │  (Cannot be changed)                                  │ │
│  │                                                       │ │
│  │  Target Role                                          │ │
│  │  [Software Engineer                               ▼]  │ │
│  │                                                       │ │
│  │  Experience Level                                     │ │
│  │  [Mid-Level (3-5 years)                           ▼]  │ │
│  │                                                       │ │
│  │  [    Update Profile    ]                             │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Change Password                                      │ │
│  │                                                       │ │
│  │  Current Password                                     │ │
│  │  [••••••••••••                                    ] 👁 │ │
│  │                                                       │ │
│  │  New Password                                         │ │
│  │  [••••••••••••                                    ] 👁 │ │
│  │  Password Strength: ████████░░ Strong                 │ │
│  │                                                       │ │
│  │  Confirm New Password                                 │ │
│  │  [••••••••••••                                    ] 👁 │ │
│  │                                                       │ │
│  │  [    Change Password    ]                            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### E. Password Reset Page (http://localhost:5173/password-reset)

**Visual Layout:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│              Interview Master AI                │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │         Reset Your Password               │ │
│  │                                           │ │
│  │  Enter your email address and we'll send │ │
│  │  you a link to reset your password.      │ │
│  │                                           │ │
│  │  Email                                    │ │
│  │  [john@example.com                    ]   │ │
│  │                                           │ │
│  │  [    Send Reset Link    ]                │ │
│  │                                           │ │
│  │  ← Back to Login                          │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Success State:**
```
┌─────────────────────────────────────────────────┐
│  ✅ Password reset link sent!                   │
│  Check your email for instructions.             │
└─────────────────────────────────────────────────┘
```

---

### F. Protected Route - Loading State

**When validating token:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│                                                 │
│                    ⏳                           │
│              Loading...                         │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 3. API Documentation (http://localhost:8000/docs)

**Swagger UI Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  FastAPI - Interview Master AI                              │
│  Version: 1.0.0                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔐 auth                                                    │
│  ├─ POST /auth/register        Register new user           │
│  ├─ POST /auth/login           Login user                  │
│  ├─ POST /auth/refresh         Refresh access token        │
│  └─ POST /auth/logout          Logout user                 │
│                                                             │
│  👤 users                                                   │
│  ├─ GET  /users/me             Get current user            │
│  ├─ PUT  /users/me             Update user profile         │
│  ├─ PUT  /users/me/password    Change password             │
│  ├─ POST /users/password-reset/request  Request reset      │
│  └─ POST /users/password-reset/confirm  Confirm reset      │
│                                                             │
│  ❤️  health                                                 │
│  └─ GET  /health               Health check                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Expanded Endpoint Example:**
```
POST /auth/login
Login user

Request body (application/json)
{
  "email": "string",
  "password": "string"
}

Responses
200 Successful Response
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer",
  "user": {
    "id": 0,
    "email": "string",
    "name": "string"
  }
}

401 Unauthorized
{
  "detail": "Invalid credentials"
}
```

---

## 4. Browser DevTools - Network Tab

### Successful Login Request

**Request:**
```
POST http://localhost:8000/auth/login
Status: 200 OK
Time: 145ms

Request Headers:
  Content-Type: application/json
  Accept: application/json

Request Payload:
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```
Response Headers:
  Content-Type: application/json
  Access-Control-Allow-Origin: http://localhost:5173

Response Body:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwiZXhwIjoxNzM5MTIzNDU2fQ.abc123...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidHlwZSI6InJlZnJlc2giLCJleHAiOjE3Mzk3MjgyNTZ9.def456...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "is_active": true,
    "created_at": "2026-02-09T10:30:00.123456"
  }
}
```

---

## 5. Browser DevTools - Local Storage

**After Login:**
```
Application → Local Storage → http://localhost:5173

Key                 Value
─────────────────────────────────────────────────────────
access_token        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
refresh_token       eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
user                {"id":1,"email":"john@example.com","name":"John Doe"}
```

**After Logout:**
```
Application → Local Storage → http://localhost:5173

(Empty - all keys cleared)
```

---

## 6. Browser DevTools - Console

### Successful Operations
```
[Auth] Login successful
[Auth] User authenticated: john@example.com
[Router] Navigating to: /dashboard
[API] GET /users/me - 200 OK (45ms)
[Cache] User profile cached
```

### Token Refresh
```
[Auth] Access token expired
[Auth] Attempting token refresh...
[API] POST /auth/refresh - 200 OK (98ms)
[Auth] Token refreshed successfully
[Redux] Credentials updated
```

### Errors
```
❌ [Auth] Login failed: Invalid credentials
❌ [API] POST /auth/login - 401 Unauthorized
```

---

## 7. Database Content

### Users Table
```sql
interview_coach_db=# SELECT * FROM users;

 id |       email        |    name    | password_hash | target_role | experience_level | is_active |         created_at         |         updated_at
----+-------------------+------------+---------------+-------------+------------------+-----------+---------------------------+---------------------------
  1 | john@example.com  | John Doe   | $2b$12$...   | NULL        | NULL             | t         | 2026-02-09 10:30:00.12345 | 2026-02-09 10:30:00.12345
  2 | jane@example.com  | Jane Smith | $2b$12$...   | SWE         | mid              | t         | 2026-02-09 11:15:00.67890 | 2026-02-09 11:15:00.67890
```

### Refresh Tokens Table
```sql
interview_coach_db=# SELECT * FROM refresh_tokens;

 id | user_id |          token           |        expires_at          | is_revoked |         created_at
----+---------+-------------------------+---------------------------+------------+---------------------------
  1 |       1 | eyJhbGciOiJIUzI1NiI... | 2026-02-16 10:30:00.12345 | f          | 2026-02-09 10:30:00.12345
  2 |       2 | eyJhbGciOiJIUzI1NiI... | 2026-02-16 11:15:00.67890 | f          | 2026-02-09 11:15:00.67890
```

### Password Reset Tokens Table
```sql
interview_coach_db=# SELECT * FROM password_reset_tokens;

 id | user_id |     token      |        expires_at          | is_used |         created_at
----+---------+---------------+---------------------------+---------+---------------------------
  1 |       1 | abc123def456  | 2026-02-09 11:30:00.12345 | f       | 2026-02-09 10:30:00.12345
```

---

## 8. Redis Cache Content

```
127.0.0.1:6379> KEYS *
1) "user:1:profile"
2) "user:2:profile"

127.0.0.1:6379> GET user:1:profile
"{\"id\":1,\"email\":\"john@example.com\",\"name\":\"John Doe\",\"target_role\":null,\"experience_level\":null,\"is_active\":true}"

127.0.0.1:6379> TTL user:1:profile
(integer) 3456  # seconds remaining
```

---

## 9. Backend Logs

### Successful Registration
```
INFO:     127.0.0.1:54321 - "POST /auth/register HTTP/1.1" 201 Created
INFO:     User registered: john@example.com (ID: 1)
INFO:     Access token generated for user: 1
INFO:     Refresh token generated for user: 1
```

### Successful Login
```
INFO:     127.0.0.1:54322 - "POST /auth/login HTTP/1.1" 200 OK
INFO:     User logged in: john@example.com (ID: 1)
INFO:     Access token generated for user: 1
INFO:     Refresh token generated for user: 1
```

### Token Refresh
```
INFO:     127.0.0.1:54323 - "POST /auth/refresh HTTP/1.1" 200 OK
INFO:     Token refreshed for user: 1
INFO:     New access token generated
```

### Failed Login
```
WARNING:  127.0.0.1:54324 - "POST /auth/login HTTP/1.1" 401 Unauthorized
WARNING:  Failed login attempt: john@example.com
WARNING:  Reason: Invalid password
```

### Password Reset Request
```
INFO:     127.0.0.1:54325 - "POST /users/password-reset/request HTTP/1.1" 200 OK
INFO:     Password reset requested for: john@example.com
INFO:     Reset token generated: abc123def456 (expires in 1 hour)
```

---

## 10. Health Check Response

### Browser (http://localhost:8000/health)
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "version": "1.0.0",
  "timestamp": "2026-02-09T10:30:00.123456"
}
```

### Terminal (curl)
```powershell
PS> curl http://localhost:8000/health

StatusCode        : 200
StatusDescription : OK
Content           : {"status":"healthy","database":"connected","redis":"connected"...}
```

---

## Summary Checklist

### ✅ What You Should See

**Frontend:**
- [ ] Clean, modern UI with Material-UI components
- [ ] Smooth page transitions
- [ ] Form validation with helpful error messages
- [ ] Password strength indicator
- [ ] Loading states during API calls
- [ ] Success/error notifications
- [ ] Protected routes redirect to login
- [ ] User menu with profile and logout

**Backend:**
- [ ] API documentation at /docs
- [ ] All endpoints responding correctly
- [ ] Proper HTTP status codes
- [ ] JWT tokens in responses
- [ ] Detailed error messages
- [ ] Request/response logging

**Database:**
- [ ] Users stored with hashed passwords
- [ ] Refresh tokens tracked
- [ ] Password reset tokens managed
- [ ] Timestamps on all records

**Redis:**
- [ ] User profiles cached
- [ ] Cache expiration working
- [ ] Fast response times

**Security:**
- [ ] Passwords never visible in logs
- [ ] Tokens stored securely
- [ ] CORS configured correctly
- [ ] Authentication required for protected routes

---

**Last Updated**: 2026-02-09
**Status**: Phase 1 & 2 Complete ✅
