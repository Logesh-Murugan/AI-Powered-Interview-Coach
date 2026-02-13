# Easiest Database Setup - No psql Required!

## 🎯 The Problem

You got this error:
```
psql : The term 'psql' is not recognized...
```

This means the `psql` command is not in your PATH, even though PostgreSQL is installed.

---

## ✅ Solution: Use Python Instead!

I created a Python script that creates the database without needing `psql`.

### Step 1: Run the Python Script

```powershell
cd backend
python create_database.py
```

### Step 2: Enter Your postgres Password

When prompted, enter the password you set when installing PostgreSQL.

### Step 3: Done!

The script will:
- ✅ Create database `interviewmaster`
- ✅ Create user `user` with password `lok@king7`
- ✅ Grant all permissions
- ✅ Test the connection

---

## 🔧 Alternative: Fix psql PATH

If you want to use `psql` commands in the future:

```powershell
.\FIX-PSQL-PATH.ps1
```

This will add PostgreSQL to your PATH.

---

## 📋 After Database is Created

### Run Migrations

```powershell
cd backend
.\venv\Scripts\activate
alembic upgrade head
```

**Expected Output:**
```
INFO  [alembic.runtime.migration] Running upgrade  -> 001_create_users_table
INFO  [alembic.runtime.migration] Running upgrade 001 -> 002_create_refresh_tokens_table
INFO  [alembic.runtime.migration] Running upgrade 002 -> 003_create_password_reset_tokens_table
```

### Verify It Works

```powershell
cd backend
python -c "from app.database import engine; engine.connect(); print('✅ Database connected!')"
```

**Expected Output:**
```
✅ Database connected!
```

---

## 🚀 Start Testing

Once database is ready:

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

Then open: http://localhost:5173

---

## 🆘 If Python Script Fails

### Error: "No module named 'psycopg2'"

**Solution:**
```powershell
cd backend
.\venv\Scripts\activate
pip install psycopg2-binary
python create_database.py
```

### Error: "Connection failed"

**Possible causes:**
1. Wrong postgres password
2. PostgreSQL not running
3. Wrong port

**Check PostgreSQL is running:**
```powershell
Get-Service postgresql*
```

Should show "Running". If not:
```powershell
Start-Service postgresql-x64-18
```

---

## 📊 What You Have

### PostgreSQL Versions Installed:
- ✅ PostgreSQL 17 (Running)
- ✅ PostgreSQL 18 (Running)

**Note:** You have TWO versions running! This is OK, but they use different ports:
- PostgreSQL 17: Usually port 5432
- PostgreSQL 18: Usually port 5433

Your `.env` uses port 5432, so it will connect to PostgreSQL 17.

---

## 🎯 Quick Summary

### The Easiest Way:
```powershell
cd backend
python create_database.py
```

### Then Run Migrations:
```powershell
alembic upgrade head
```

### Then Start Everything:
```powershell
.\START-PHASE-2-TESTING.ps1
```

---

## ✅ Success Indicators

After running `python create_database.py`, you should see:

```
========================================
  Database Setup Complete! ✅
========================================

Database Details:
  Database: interviewmaster
  User: user
  Password: lok@king7
  Host: localhost
  Port: 5432

Next Steps:
  1. Run migrations: alembic upgrade head
  2. Start Redis: .\start_redis_windows.ps1
  3. Start Backend: uvicorn app.main:app --reload
  4. Start Frontend: cd ..\frontend; npm run dev
```

---

**This is the EASIEST way - no psql command needed!**
