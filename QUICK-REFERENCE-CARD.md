# Quick Reference Card

## 🚀 Start Everything (1 Command)

```powershell
.\START-PHASE-2-TESTING.ps1
```

---

## 🔧 Manual Start

```powershell
# Terminal 1 - Redis
cd backend
.\start_redis_windows.ps1

# Terminal 2 - Backend  
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload

# Terminal 3 - Frontend
cd frontend
npm run dev
```

---

## 🌐 Access URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |

---

## 🗄️ Database Commands

```powershell
# Connect to database
psql -U user -d interviewmaster

# List tables
\dt

# View users
SELECT * FROM users;

# Exit
\q
```

---

## 🧪 Validation

```powershell
# Validate configuration
cd backend
python validate_config.py

# Test database connection
python -c "from app.database import engine; engine.connect(); print('✅ Connected')"

# Check migrations
alembic current
```

---

## 📝 Your Configuration

```
Database: interviewmaster
User: user
Password: lok@king7 (URL encoded: lok%40king7)
Host: localhost
Port: 5432
```

---

## 🆘 Quick Fixes

### Backend won't start?
```powershell
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Database error?
```powershell
cd backend
alembic upgrade head
```

### Redis error?
```powershell
cd backend
.\start_redis_windows.ps1
```

### Frontend error?
```powershell
cd frontend
npm install
npm run dev
```

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| HOW-TO-SEE-OUTPUT.md | Simple testing guide |
| SIMPLE-DATABASE-SETUP.md | 3-step database setup |
| CONFIGURATION-COMPLETE.md | Configuration summary |
| PHASE-2-TESTING-GUIDE.md | Complete testing guide |
| QUICK-TEST-CHECKLIST.md | 5-minute checklist |

---

## ✅ Success Indicators

**Backend Running:**
```
INFO: Uvicorn running on http://0.0.0.0:8000
INFO: Application startup complete
```

**Frontend Running:**
```
Local: http://localhost:5173/
```

**Database Connected:**
```
✅ Database connection successful
```

---

## 🎯 Quick Test

1. Open http://localhost:5173
2. Click "Sign Up"
3. Register a user
4. See dashboard ✅

---

**Need Help?** Read: `HOW-TO-SEE-OUTPUT.md`
