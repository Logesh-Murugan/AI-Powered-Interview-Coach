# TASK-002: Database Setup Instructions

## Overview
This document provides instructions for setting up PostgreSQL database for InterviewMaster AI.

## Option 1: Using Docker (Recommended for Development)

### Start PostgreSQL with Docker:
```bash
docker run --name interviewmaster-postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=interviewmaster \
  -p 5432:5432 \
  -d postgres:15
```

### Verify it's running:
```bash
docker ps
```

### Update .env file:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/interviewmaster
```

## Option 2: Install PostgreSQL Locally

### Windows:
1. Download from https://www.postgresql.org/download/windows/
2. Run installer and follow prompts
3. Remember the password you set for 'postgres' user
4. Create database:
```bash
psql -U postgres
CREATE DATABASE interviewmaster;
CREATE USER user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE interviewmaster TO user;
\q
```

### macOS (using Homebrew):
```bash
brew install postgresql@15
brew services start postgresql@15
createdb interviewmaster
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb interviewmaster
```

## Option 3: Use SQLite for Quick Testing

Update `.env` file:
```env
DATABASE_URL=sqlite:///./interviewmaster.db
```

**Note**: SQLite is not recommended for production but works for development.

## Setup Steps

### 1. Create the database:
```bash
cd backend
python setup_database.py
```

### 2. Run migrations:
```bash
alembic upgrade head
```

### 3. Verify setup:
```bash
# Check tables were created
psql -U user -d interviewmaster -c "\dt"

# Or with SQLite
sqlite3 interviewmaster.db ".tables"
```

## Troubleshooting

### Connection refused:
- Ensure PostgreSQL is running: `docker ps` or `systemctl status postgresql`
- Check port 5432 is not in use: `netstat -an | grep 5432`

### Authentication failed:
- Verify credentials in `.env` match your PostgreSQL setup
- Check `pg_hba.conf` allows password authentication

### Permission denied:
- Grant proper permissions: `GRANT ALL PRIVILEGES ON DATABASE interviewmaster TO user;`

## Current Status

✓ Database models created (User, BaseModel)
✓ Alembic initialized and configured
✓ Migration scripts ready
⏳ Waiting for database connection to run migrations

## Next Steps

Once database is set up:
1. Run `alembic upgrade head` to create tables
2. Verify with `psql -U user -d interviewmaster -c "\dt"`
3. Proceed to TASK-003 (Redis Setup)
