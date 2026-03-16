# 🔧 Quick Troubleshooting Guide

## 🚨 Common Issues & Fast Fixes

### Issue: Backend won't start
```bash
# Solution 1: Activate virtual environment
cd backend
.\venv\Scripts\Activate.ps1

# Solution 2: Reinstall dependencies
pip install -r requirements.txt

# Solution 3: Check database
# Verify PostgreSQL is running in services.msc
```

### Issue: Frontend won't start
```bash
# Solution 1: Reinstall dependencies
cd frontend
rm -rf node_modules
npm install

# Solution 2: Clear cache
npm cache clean --force
npm install
```

### Issue: "Database connection failed"
```bash
# Solution 1: Check PostgreSQL service
# Win + R → services.msc → postgresql-x64-18 → Start

# Solution 2: Verify .env file
# Check DATABASE_URL in backend/.env
# Password with @ should be encoded as %40

# Solution 3: Create database
cd backend
python create_database.py
alembic upgrade head
```

### Issue: "Redis unavailable"
```bash
# Solution: Start Redis
redis-server

# Or check if already running:
# Task Manager → Details → redis-server.exe
```

### Issue: White page / Blank screen
```
Solution 1: Hard refresh
- Press Ctrl + Shift + R

Solution 2: Clear cache
- Press Ctrl + Shift + Delete
- Clear cached images and files

Solution 3: Check console
- Press F12
- Look for errors in Console tab
- Check if backend is running
```

### Issue: "AI provider error"
```
Solution 1: Check API keys
- Open backend/.env
- Verify HUGGINGFACE_API_KEY is set
- Check keys are not expired

Solution 2: Wait and retry
- Circuit breaker will auto-retry
- May take 10-30 seconds

Solution 3: Check quota
- HuggingFace free tier has limits
- Use multiple keys (KEY_2, KEY_3)
```

### Issue: Charts not showing
```
Solution 1: Need data
- Complete at least 1 interview session
- Analytics needs data to display

Solution 2: Refresh
- Hard refresh: Ctrl + Shift + R

Solution 3: Check console
- F12 → Console tab
- Look for Recharts errors
```

### Issue: Email not sending
```
Solution 1: Check configuration
- Open backend/.env
- Verify EMAIL_ENABLED=True
- Check SMTP settings

Solution 2: Gmail App Password
- Use App Password, not regular password
- Generate at: myaccount.google.com/apppasswords

Solution 3: Disable for testing
- Set EMAIL_ENABLED=False
- Tokens will log to console instead
```

---

## 🎯 Quick Health Checks

### Check 1: Services Running
```bash
# PostgreSQL
services.msc → postgresql-x64-18 → Status: Running

# Redis
Task Manager → Details → redis-server.exe

# Backend
http://localhost:8000/health
Should return: {"status": "healthy"}

# Frontend
http://localhost:5173
Should show landing page
```

### Check 2: Environment Files
```bash
# Backend .env exists
ls backend/.env

# Frontend .env exists
ls frontend/.env

# Both should exist and have correct values
```

### Check 3: Dependencies Installed
```bash
# Backend
cd backend
pip list | grep fastapi

# Frontend
cd frontend
npm list react
```

---

## 🔄 Reset Everything (Nuclear Option)

If nothing works, start fresh:

```bash
# 1. Stop all services
# Press Ctrl+C in all terminals

# 2. Backend reset
cd backend
rm -rf venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 3. Frontend reset
cd frontend
rm -rf node_modules
npm install

# 4. Database reset (WARNING: Deletes all data)
cd backend
python create_database.py
alembic upgrade head

# 5. Start everything
# Use START_TESTING.ps1 script
```

---

## 📞 Still Stuck?

1. Check MANUAL_TESTING_GUIDE.md for detailed troubleshooting
2. Check browser console (F12) for errors
3. Check backend terminal for error messages
4. Check frontend terminal for compilation errors
5. Verify all prerequisites are installed:
   - Python 3.11+
   - Node.js 18+
   - PostgreSQL 15+
   - Redis 7+

---

## ✅ Quick Verification Commands

```bash
# Check Python version
python --version  # Should be 3.11+

# Check Node version
node --version  # Should be 18+

# Check PostgreSQL
psql --version  # Should be 15+

# Check Redis
redis-cli --version  # Should be 7+

# Test database connection
psql -U user -d interviewmaster -c "SELECT 1;"

# Test Redis connection
redis-cli ping  # Should return PONG

# Test backend
curl http://localhost:8000/health

# Test frontend
curl http://localhost:5173
```

---

**Remember**: Most issues are solved by:
1. Restarting services
2. Hard refresh (Ctrl+Shift+R)
3. Checking .env files
4. Verifying services are running
