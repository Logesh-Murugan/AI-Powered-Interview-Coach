# PostgreSQL 18 Setup Guide for InterviewMaster AI

## Quick Setup Steps

### 1. Download and Install PostgreSQL 18

1. **Download PostgreSQL 18**:
   - Go to: https://www.postgresql.org/download/windows/
   - Or direct link: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - Choose PostgreSQL 18 for Windows

2. **Run the Installer**:
   - Double-click the downloaded `.exe` file
   - Click "Next" through the welcome screen

3. **Installation Settings**:
   - **Installation Directory**: Use default (`C:\Program Files\PostgreSQL\18`)
   - **Select Components**: Check all:
     - ✅ PostgreSQL Server
     - ✅ pgAdmin 4 (GUI tool)
     - ✅ Stack Builder (optional)
     - ✅ Command Line Tools
   - **Data Directory**: Use default
   - **Password**: Set a password for the `postgres` superuser
     - ⚠️ **IMPORTANT**: Remember this password!
     - Suggestion: Use `postgres` for development
   - **Port**: Use default `5432`
   - **Locale**: Use default

4. **Complete Installation**:
   - Click "Next" and wait for installation
   - Uncheck "Launch Stack Builder" at the end
   - Click "Finish"

### 2. Create the Database

After installation, open **SQL Shell (psql)** from the Start Menu:

```
Server [localhost]: (press Enter)
Database [postgres]: (press Enter)
Port [5432]: (press Enter)
Username [postgres]: (press Enter)
Password for user postgres: (enter the password you set)
```

Then run these commands:

```sql
-- Create the database
CREATE DATABASE interviewmaster;

-- Create the user
CREATE USER "user" WITH PASSWORD 'password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE interviewmaster TO "user";

-- Connect to the new database
\c interviewmaster

-- Grant schema privileges (PostgreSQL 15+ requires these)
GRANT ALL ON SCHEMA public TO "user";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "user";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "user";

-- Exit
\q
```

### 3. Update Your .env File

Open `backend/.env` and update the DATABASE_URL:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/interviewmaster
```

### 4. Run Migrations

```powershell
cd backend
alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 001, Create users table
```

### 5. Verify Setup

```powershell
python setup_database.py
```

Expected output:
```
✓ Database 'interviewmaster' already exists
✓ Database connection successful
```

## Verify Everything Works

### Test 1: Check PostgreSQL Service

```powershell
# Check if PostgreSQL is running
Get-Service -Name postgresql*
```

Should show: `Status: Running`

### Test 2: Connect with psql

```powershell
# Connect to database
psql -U user -d interviewmaster

# List tables
\dt

# Should show:
#  Schema |  Name  | Type  | Owner
# --------+--------+-------+-------
#  public | users  | table | user

# Exit
\q
```

### Test 3: Check Health Endpoint

```powershell
# Start the server
uvicorn app.main:app --reload

# In another terminal
curl http://localhost:8000/health
```

Should show:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "development",
  "database": "connected",
  "cache": "connected"
}
```

### Test 4: Run All Tests

```powershell
pytest --cov=app --cov-report=term
```

All tests should pass with 84% coverage.

## Common Issues and Solutions

### Issue 1: "Password authentication failed"

**Solution**: Update `.env` with the correct password:
```env
DATABASE_URL=postgresql://user:your_password@localhost:5432/interviewmaster
```

### Issue 2: "Database does not exist"

**Solution**: Create it manually:
```powershell
psql -U postgres
CREATE DATABASE interviewmaster;
\q
```

### Issue 3: "Port 5432 already in use"

**Solution**: Another PostgreSQL instance is running. Stop it:
```powershell
# Find the service
Get-Service -Name postgresql*

# Stop it
Stop-Service -Name postgresql-x64-18
```

### Issue 4: "psql command not found"

**Solution**: Add PostgreSQL to PATH:
1. Open System Properties → Environment Variables
2. Edit PATH variable
3. Add: `C:\Program Files\PostgreSQL\18\bin`
4. Restart terminal

### Issue 5: Migration fails with "permission denied"

**Solution**: Grant schema permissions:
```sql
psql -U postgres -d interviewmaster
GRANT ALL ON SCHEMA public TO "user";
\q
```

## Managing PostgreSQL

### Start PostgreSQL Service

```powershell
Start-Service -Name postgresql-x64-18
```

### Stop PostgreSQL Service

```powershell
Stop-Service -Name postgresql-x64-18
```

### Check Service Status

```powershell
Get-Service -Name postgresql-x64-18
```

### Using pgAdmin 4 (GUI)

1. Open pgAdmin 4 from Start Menu
2. Enter master password (if prompted)
3. Expand "Servers" → "PostgreSQL 18"
4. Enter password for postgres user
5. Navigate to: Databases → interviewmaster → Schemas → public → Tables
6. You should see the `users` table

## Quick Reference

### Connection Details
```
Host: localhost
Port: 5432
Database: interviewmaster
Username: user
Password: password
```

### Connection String
```
postgresql://user:password@localhost:5432/interviewmaster
```

### Useful Commands

```powershell
# Connect to database
psql -U user -d interviewmaster

# List databases
\l

# List tables
\dt

# Describe table
\d users

# Run SQL query
SELECT * FROM users;

# Exit
\q
```

### Alembic Commands

```powershell
# Run migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current version
alembic current

# Show migration history
alembic history
```

## Next Steps

Once PostgreSQL is set up:

1. ✅ PostgreSQL 18 installed and running
2. ✅ Database `interviewmaster` created
3. ✅ User `user` created with permissions
4. ✅ Migrations run successfully
5. ✅ Health check shows "database": "connected"
6. ✅ Ready to continue with development!

You can now proceed to the next tasks (TASK-004: Frontend Setup).

## Summary

PostgreSQL 18 is fully compatible with this project. The setup process is:

1. Install PostgreSQL 18
2. Create database and user
3. Update .env file
4. Run migrations
5. Verify with health check

All done! Your database is ready for development.
