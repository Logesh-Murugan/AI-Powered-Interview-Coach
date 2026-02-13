# Where to Check Everything - Manual Guide

## 🔍 You're Right to Question This!

Let me show you **exactly** where to check each piece of information.

---

## 1️⃣ Check Your Configuration File

### Location: `backend/.env`

**Open this file and look for:**
```env
DATABASE_URL=postgresql://user:lok%40king7@localhost:5432/interviewmaster
```

**This tells you what your app WANTS to use:**
- Username: `user`
- Password: `lok%40king7` (which is `lok@king7` URL-encoded)
- Database: `interviewmaster`
- Host: `localhost`
- Port: `5432`

**How to check:**
```powershell
# View your .env file
cat backend\.env
```

---

## 2️⃣ Check What Actually Exists in PostgreSQL

### Method 1: Check if PostgreSQL is Running

```powershell
# Check PostgreSQL service
Get-Service postgresql*
```

**Expected Output:**
```
Status   Name               DisplayName
------   ----               -----------
Running  postgresql-x64-18  postgresql-x64-18 - PostgreSQL Server 18
```

If it says "Stopped", start it:
```powershell
Start-Service postgresql-x64-18
```

---

### Method 2: List All Databases

```powershell
# Connect to PostgreSQL
psql -U postgres

# List all databases
\l

# Or use SQL
SELECT datname FROM pg_database WHERE datistemplate = false;
```

**What to look for:**
```
     datname
-----------------
 postgres
 interviewmaster  ← Your project database (if it exists)
 template0
 template1
```

**If you DON'T see `interviewmaster`**, it means the database doesn't exist yet!

---

### Method 3: Check if Your User Exists

```powershell
# Still in psql
SELECT usename FROM pg_user;
```

**What to look for:**
```
  usename
-----------
 postgres
 user      ← Your project user (if it exists)
```

**If you DON'T see `user`**, it means the user doesn't exist yet!

---

### Method 4: Check Tables in Your Database

```powershell
# Connect to your specific database
psql -U user -d interviewmaster

# List tables
\dt

# Or use SQL
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

**What to look for:**
```
           List of relations
 Schema |           Name            | Type  | Owner
--------+---------------------------+-------+-------
 public | alembic_version           | table | user
 public | users                     | table | user
 public | refresh_tokens            | table | user
 public | password_reset_tokens     | table | user
```

**If you see "No relations found"**, it means tables don't exist yet (need to run migrations)!

---

## 3️⃣ Automated Check Script

**Run this to check everything automatically:**

```powershell
.\CHECK-DATABASE-STATUS.ps1
```

This will show you:
- ✅ What's in your `.env` file
- ✅ If PostgreSQL is running
- ✅ If your database exists
- ✅ If your user exists
- ✅ What tables exist

---

## 4️⃣ What Each Status Means

### Scenario A: Nothing Exists Yet ❌

**You'll see:**
```
❌ Database 'interviewmaster' DOES NOT EXIST
❌ User 'user' DOES NOT EXIST
```

**What to do:**
1. Follow **SIMPLE-DATABASE-SETUP.md**
2. Create database and user manually
3. Run migrations

---

### Scenario B: Database Exists, No Tables ⚠️

**You'll see:**
```
✅ Database 'interviewmaster' EXISTS
✅ User 'user' EXISTS
⚠️  No tables found
```

**What to do:**
```powershell
cd backend
.\venv\Scripts\activate
alembic upgrade head
```

---

### Scenario C: Everything Exists ✅

**You'll see:**
```
✅ Database 'interviewmaster' EXISTS
✅ User 'user' EXISTS
✅ Tables: users, refresh_tokens, password_reset_tokens
```

**What to do:**
Start testing! Everything is ready.

---

## 5️⃣ Quick Manual Checks

### Check 1: Can you connect to the database?

```powershell
psql -U user -d interviewmaster
```

**If successful:** You'll see `interviewmaster=>`  
**If failed:** Error message (database or user doesn't exist)

---

### Check 2: Can Python connect?

```powershell
cd backend
python -c "from app.database import engine; engine.connect(); print('✅ Connected')"
```

**If successful:** `✅ Connected`  
**If failed:** Error message with details

---

### Check 3: Do migrations show tables?

```powershell
cd backend
alembic current
```

**If successful:** Shows current migration version  
**If failed:** "Can't locate revision" (need to run migrations)

---

## 6️⃣ The Truth About Your Setup

### What I Told You (from .env file):
```
Database: interviewmaster
User: user
Password: lok@king7
```

### What Actually Exists:
**You need to check!** Run:
```powershell
.\CHECK-DATABASE-STATUS.ps1
```

This will tell you the **real** status.

---

## 7️⃣ Most Likely Scenario

Based on your question, I suspect:

### Your .env file says:
```
DATABASE_URL=postgresql://user:lok%40king7@localhost:5432/interviewmaster
```

### But in PostgreSQL:
- ❌ Database `interviewmaster` doesn't exist yet
- ❌ User `user` doesn't exist yet
- ❌ Tables don't exist yet

**This is NORMAL!** You just need to create them.

---

## 8️⃣ How to Create Everything

### Option 1: Manual (Recommended)

**Open SQL Shell (psql):**
1. Press Windows Key
2. Type "SQL Shell"
3. Press Enter for all prompts
4. Enter your postgres password

**Run these commands:**
```sql
-- Check what exists
\l                          -- List databases
\du                         -- List users

-- Create database
CREATE DATABASE interviewmaster;

-- Create user
CREATE USER "user" WITH PASSWORD 'lok@king7';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE interviewmaster TO "user";

-- Connect to database
\c interviewmaster

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO "user";

-- Exit
\q
```

**Then run migrations:**
```powershell
cd backend
.\venv\Scripts\activate
alembic upgrade head
```

---

### Option 2: Automated Script

```powershell
cd backend
.\setup_database_auto.ps1
```

---

## 9️⃣ Verify Everything Works

After creating database and user:

```powershell
# Check database exists
psql -U user -d interviewmaster -c "SELECT current_database();"

# Check tables exist
psql -U user -d interviewmaster -c "\dt"

# Check Python can connect
cd backend
python -c "from app.database import engine; engine.connect(); print('✅ Works')"
```

---

## 🎯 Summary

### To Check Configuration:
```powershell
cat backend\.env
```

### To Check What Actually Exists:
```powershell
.\CHECK-DATABASE-STATUS.ps1
```

### To Create Everything:
```powershell
# Follow SIMPLE-DATABASE-SETUP.md
# Or run: .\backend\setup_database_auto.ps1
```

### To Verify It Works:
```powershell
psql -U user -d interviewmaster
```

---

## ❓ Still Confused?

Run this command and share the output:
```powershell
.\CHECK-DATABASE-STATUS.ps1
```

This will show you **exactly** what exists and what doesn't.

---

**The information I gave you was from your `.env` file, but it doesn't mean those things exist in PostgreSQL yet. You need to create them first!**
