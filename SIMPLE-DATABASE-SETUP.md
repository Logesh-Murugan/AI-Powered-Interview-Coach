# Simple Database Setup - 3 Steps

## 🎯 Goal
Get your PostgreSQL database working in 3 simple steps.

---

## Step 1: Open SQL Shell

1. Press **Windows Key**
2. Type: **SQL Shell**
3. Click: **SQL Shell (psql)**

You'll see:
```
Server [localhost]:
Database [postgres]:
Port [5432]:
Username [postgres]:
Password for user postgres:
```

**Just press Enter for each prompt** until it asks for password.
Then enter your PostgreSQL password (the one you set during installation).

---

## Step 2: Run These Commands

Copy and paste these commands **one by one** into the SQL Shell:

```sql
CREATE DATABASE interviewmaster;
```
Press Enter. You should see: `CREATE DATABASE`

```sql
CREATE USER "user" WITH PASSWORD 'lok@king7';
```
Press Enter. You should see: `CREATE ROLE`

```sql
GRANT ALL PRIVILEGES ON DATABASE interviewmaster TO "user";
```
Press Enter. You should see: `GRANT`

```sql
\c interviewmaster
```
Press Enter. You should see: `You are now connected to database "interviewmaster"`

```sql
GRANT ALL ON SCHEMA public TO "user";
```
Press Enter. You should see: `GRANT`

```sql
\q
```
Press Enter. This exits SQL Shell.

---

## Step 3: Run Migrations

Open PowerShell in your project folder:

```powershell
cd backend
.\venv\Scripts\activate
alembic upgrade head
```

You should see:
```
INFO  [alembic.runtime.migration] Running upgrade  -> 001_create_users_table
INFO  [alembic.runtime.migration] Running upgrade 001 -> 002_create_refresh_tokens_table
INFO  [alembic.runtime.migration] Running upgrade 002 -> 003_create_password_reset_tokens_table
```

---

## ✅ Done!

Your database is ready. Now start the application:

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

Open: http://localhost:5173

---

## 🆘 If Something Goes Wrong

### Can't find SQL Shell?

**Option A:** Use PowerShell instead:
```powershell
psql -U postgres
```
Then run the SQL commands from Step 2.

**Option B:** Use Docker (easiest):
```powershell
docker run -d --name postgres-interview -e POSTGRES_USER=user -e POSTGRES_PASSWORD=lok@king7 -e POSTGRES_DB=interviewmaster -p 5432:5432 postgres:18
```

### "psql: command not found"?

Add PostgreSQL to PATH:
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"
```

Then try again.

### "password authentication failed"?

Your password in `.env` is: `lok@king7`

Make sure you use this exact password when creating the user in Step 2.

### "database already exists"?

That's OK! Skip the CREATE DATABASE command and continue with the rest.

---

## 🔍 Verify It Works

```powershell
# Test connection
psql -U user -d interviewmaster -c "SELECT 1;"

# Should show:
#  ?column?
# ----------
#         1
```

If you see this, your database is working! ✅

---

## 📝 What You Just Did

1. Created a database called `interviewmaster`
2. Created a user called `user` with password `lok@king7`
3. Gave the user permission to access the database
4. Created tables (users, refresh_tokens, password_reset_tokens)

---

**Next:** Start the application and test it!
See: **HOW-TO-SEE-OUTPUT.md**
