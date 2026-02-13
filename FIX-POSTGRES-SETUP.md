# Fix PostgreSQL Setup - Step by Step

## The Error You Got

The error happened because you accidentally typed ``` (markdown code block markers) in PowerShell. That's not a command - it's just documentation formatting.

---

## ✅ Solution: Set Up PostgreSQL Database

### Step 1: Check if PostgreSQL is Running

```powershell
# Check if PostgreSQL service is running
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

### Step 2: Create the Database

Open a **NEW PowerShell window** and run:

```powershell
# Connect to PostgreSQL as postgres user
psql -U postgres
```

**You'll be prompted for password** - enter the password you set when installing PostgreSQL.

Then run these SQL commands **one by one**:

```sql
-- Create the database
CREATE DATABASE interviewmaster;

-- Create the user (use your password from .env)
CREATE USER "user" WITH PASSWORD 'lok@king7';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE interviewmaster TO "user";

-- Connect to the database
\c interviewmaster

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO "user";

-- Exit psql
\q
```

---

### Step 3: Verify Database Connection

```powershell
cd backend

# Test connection
python -c "from app.database import engine; print('✅ Database connected!' if engine else '❌ Failed')"
```

---

### Step 4: Run Database Migrations

```powershell
cd backend

# Activate virtual environment
.\venv\Scripts\activate

# Run migrations
alembic upgrade head
```

**Expected Output:**
```
INFO  [alembic.runtime.migration] Running upgrade  -> 001_create_users_table
INFO  [alembic.runtime.migration] Running upgrade 001 -> 002_create_refresh_tokens_table
INFO  [alembic.runtime.migration] Running upgrade 002 -> 003_create_password_reset_tokens_table
```

---

### Step 5: Verify Tables Created

```powershell
# Connect to your database
psql -U user -d interviewmaster

# List tables
\dt

# Expected output:
#  Schema |         Name              | Type  | Owner
# --------+---------------------------+-------+-------
#  public | alembic_version           | table | user
#  public | users                     | table | user
#  public | refresh_tokens            | table | user
#  public | password_reset_tokens     | table | user

# Exit
\q
```

---

## 🔧 Alternative: Use Docker (Easier!)

If PostgreSQL setup is giving you trouble, use Docker instead:

```powershell
# Start PostgreSQL with Docker
docker run -d `
  --name postgres-interview `
  -e POSTGRES_USER=user `
  -e POSTGRES_PASSWORD=lok@king7 `
  -e POSTGRES_DB=interviewmaster `
  -p 5432:5432 `
  postgres:18

# Wait 5 seconds for it to start
Start-Sleep -Seconds 5

# Test connection
docker exec -it postgres-interview psql -U user -d interviewmaster -c "SELECT version();"
```

Then update your `.env`:
```
DATABASE_URL=postgresql://user:lok@king7@localhost:5432/interviewmaster
```

---

## 🚀 Quick Start After Database Setup

Once database is ready:

```powershell
# Terminal 1 - Start Redis
cd backend
.\start_redis_windows.ps1

# Terminal 2 - Start Backend
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload

# Terminal 3 - Start Frontend
cd frontend
npm run dev
```

Then open: http://localhost:5173

---

## 🆘 Common Issues

### Issue 1: "psql: command not found"

**Solution:** Add PostgreSQL to PATH:
```powershell
# Add to PATH temporarily
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"

# Or permanently (run as Administrator)
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\PostgreSQL\18\bin", "Machine")
```

### Issue 2: "password authentication failed"

**Solution:** Check your password in `.env` matches what you're using:
```powershell
# Your .env has:
DATABASE_URL=postgresql://user:lok@king7@localhost:5432/interviewmaster

# So password is: lok@king7
# Username is: user
```

### Issue 3: "database does not exist"

**Solution:** Create it:
```powershell
psql -U postgres -c "CREATE DATABASE interviewmaster;"
```

### Issue 4: "role 'user' does not exist"

**Solution:** Create the user:
```powershell
psql -U postgres -c "CREATE USER \"user\" WITH PASSWORD 'lok@king7';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE interviewmaster TO \"user\";"
```

---

## ✅ Verification Checklist

Run these commands to verify everything works:

```powershell
# 1. Check PostgreSQL service
Get-Service postgresql*
# Should show: Running

# 2. Test database connection
psql -U user -d interviewmaster -c "SELECT 1;"
# Should show: 1

# 3. Check tables exist
psql -U user -d interviewmaster -c "\dt"
# Should show: users, refresh_tokens, password_reset_tokens

# 4. Test backend connection
cd backend
python -c "from app.database import engine; print('✅ Connected')"
# Should show: ✅ Connected
```

---

## 📝 Your Current Configuration

Based on your `.env` file:
- **Database Name:** interviewmaster
- **Username:** user
- **Password:** lok@king7
- **Host:** localhost
- **Port:** 5432

---

## 🎯 Next Steps

Once database is working:

1. ✅ Database setup complete
2. Start Redis: `.\backend\start_redis_windows.ps1`
3. Start Backend: `cd backend; .\venv\Scripts\activate; uvicorn app.main:app --reload`
4. Start Frontend: `cd frontend; npm run dev`
5. Open: http://localhost:5173

---

**Need Help?** Run this command to see detailed status:
```powershell
cd backend
python setup_database.py
```
