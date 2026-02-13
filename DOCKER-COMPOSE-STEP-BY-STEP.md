# Docker Compose Setup - Step by Step Guide

## Prerequisites Check

Before starting, verify you have Docker installed:

```powershell
# Check Docker version
docker --version
# Should show: Docker version 20.x.x or higher

# Check Docker Compose version
docker-compose --version
# Should show: Docker Compose version v2.x.x or higher

# Check Docker is running
docker info
# Should show Docker system information
```

If Docker is not installed, download from: https://www.docker.com/products/docker-desktop/

---

## Step-by-Step Setup

### Step 1: Verify Project Structure

Make sure you're in the project root directory:

```powershell
cd D:\Ai_powered_interview_coach
```

Verify these files exist:
```powershell
dir docker-compose.yml
dir backend\Dockerfile
dir frontend\Dockerfile
dir .dockerignore
```

All files should be present ✅

---

### Step 2: Stop Local Services (Important!)

Since Docker will use the same ports, stop your local services first:

```powershell
# Stop local PostgreSQL (if running)
Stop-Service -Name postgresql-x64-18

# Stop local Redis (if running)
cd backend
.\stop_redis_windows.ps1

# Stop backend server (if running)
# Press Ctrl+C in the terminal where uvicorn is running

# Stop frontend server (if running)
# Press Ctrl+C in the terminal where npm run dev is running
```

---

### Step 3: Create Environment File (Optional but Recommended)

Create a `.env` file in the project root for API keys:

```powershell
# Create .env file
New-Item -Path .env -ItemType File -Force
```

Edit `.env` and add your API keys (optional for now):
```env
# AI Provider API Keys (optional - can add later)
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Cloudinary (optional - for file uploads later)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Note**: You can skip this step for now and add API keys later when needed.

---

### Step 4: Build Docker Images

Build all Docker images (this will take 5-10 minutes the first time):

```powershell
# Build all images
docker-compose build

# You'll see output like:
# [+] Building 180.5s (15/15) FINISHED
# => [backend internal] load build definition
# => [frontend internal] load build definition
# ...
```

**What's happening:**
- Docker downloads base images (Python 3.11, Node 18, PostgreSQL 18, Redis 7)
- Installs all dependencies
- Creates optimized images

**Expected time**: 5-10 minutes (first time only)

---

### Step 5: Start All Services

Start all services in detached mode (background):

```powershell
docker-compose up -d
```

**Output you should see:**
```
[+] Running 5/5
 ✔ Network interviewmaster-network        Created
 ✔ Volume "postgres_data"                 Created
 ✔ Volume "redis_data"                    Created
 ✔ Container interviewmaster-postgres     Started
 ✔ Container interviewmaster-redis        Started
 ✔ Container interviewmaster-backend      Started
 ✔ Container interviewmaster-frontend     Started
```

**What's happening:**
- Creates Docker network for services to communicate
- Creates volumes for data persistence
- Starts PostgreSQL (port 5432)
- Starts Redis (port 6379)
- Starts Backend (port 8000)
- Starts Frontend (port 5173)

**Expected time**: 40-60 seconds for all services to be healthy

---

### Step 6: Check Service Status

Verify all services are running and healthy:

```powershell
docker-compose ps
```

**Expected output:**
```
NAME                        STATUS              PORTS
interviewmaster-backend     Up (healthy)        0.0.0.0:8000->8000/tcp
interviewmaster-frontend    Up (healthy)        0.0.0.0:5173->5173/tcp
interviewmaster-postgres    Up (healthy)        0.0.0.0:5432->5432/tcp
interviewmaster-redis       Up (healthy)        0.0.0.0:6379->6379/tcp
```

All services should show **"Up (healthy)"** ✅

**If services show "starting"**: Wait 30-60 seconds and check again.

---

### Step 7: Run Database Migrations

Initialize the database with migrations:

```powershell
# Enter the backend container
docker-compose exec backend bash

# Inside the container, run migrations
alembic upgrade head

# You should see:
# INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
# INFO  [alembic.runtime.migration] Will assume transactional DDL.
# INFO  [alembic.runtime.migration] Running upgrade  -> 001, create users table

# Exit the container
exit
```

**What's happening:**
- Creates the `users` table in PostgreSQL
- Sets up database schema
- Applies all migrations

---

### Step 8: Verify Backend is Working

Test the backend health endpoint:

```powershell
curl http://localhost:8000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "development",
  "database": "connected",
  "cache": "connected"
}
```

✅ Backend is working!

---

### Step 9: Verify Frontend is Working

Open your browser and visit:

```
http://localhost:5173
```

**You should see:**
- The InterviewMaster AI login page
- Material-UI styled interface
- No errors in browser console

✅ Frontend is working!

---

### Step 10: Verify Database Connection

Test PostgreSQL connection:

```powershell
# Connect to PostgreSQL
docker-compose exec postgres psql -U user -d interviewmaster

# Inside PostgreSQL, list tables
\dt

# You should see:
#              List of relations
#  Schema |      Name       | Type  | Owner
# --------+-----------------+-------+-------
#  public | alembic_version | table | user
#  public | users           | table | user

# Exit PostgreSQL
\q
```

✅ Database is working!

---

### Step 11: Verify Redis Connection

Test Redis connection:

```powershell
# Connect to Redis
docker-compose exec redis redis-cli

# Inside Redis, test ping
ping

# You should see: PONG

# Exit Redis
exit
```

✅ Redis is working!

---

### Step 12: View Logs (Optional)

Check logs to see what's happening:

```powershell
# View all logs
docker-compose logs

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
docker-compose logs redis

# Follow logs in real-time
docker-compose logs -f backend
```

**Press Ctrl+C to stop following logs**

---

## Testing Your Setup

### Test 1: Backend API Documentation

Visit the API docs:
```
http://localhost:8000/docs
```

You should see the FastAPI Swagger UI with all endpoints.

### Test 2: Make Code Changes (Hot Reload)

**Backend test:**
1. Open `backend/app/main.py`
2. Change the health check response
3. Save the file
4. Check logs: `docker-compose logs -f backend`
5. You should see: "Detected file change, reloading..."
6. Test: `curl http://localhost:8000/health`

**Frontend test:**
1. Open `frontend/src/App.tsx`
2. Make a small change
3. Save the file
4. Browser should auto-refresh
5. Changes should appear immediately

✅ Hot reload is working!

---

## Common Commands

### Starting and Stopping

```powershell
# Start all services
docker-compose up -d

# Stop all services
docker-compose stop

# Stop and remove containers (keeps data)
docker-compose down

# Stop and remove everything including data
docker-compose down -v

# Restart a specific service
docker-compose restart backend
```

### Viewing Information

```powershell
# Check status
docker-compose ps

# View logs
docker-compose logs -f

# View resource usage
docker stats
```

### Accessing Services

```powershell
# Backend shell
docker-compose exec backend bash

# Frontend shell
docker-compose exec frontend sh

# PostgreSQL shell
docker-compose exec postgres psql -U user -d interviewmaster

# Redis CLI
docker-compose exec redis redis-cli
```

### Rebuilding

```powershell
# Rebuild all images
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build
```

---

## Troubleshooting

### Problem 1: Port Already in Use

**Error**: "Bind for 0.0.0.0:8000 failed: port is already allocated"

**Solution**:
```powershell
# Find what's using the port
netstat -ano | findstr :8000

# Stop the process or change the port in docker-compose.yml
```

### Problem 2: Services Not Healthy

**Error**: Services stuck in "starting" state

**Solution**:
```powershell
# Check logs for errors
docker-compose logs backend

# Wait longer (up to 2 minutes for first start)
# Or restart services
docker-compose restart
```

### Problem 3: Database Connection Failed

**Error**: "could not connect to server"

**Solution**:
```powershell
# Check PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Problem 4: Frontend Not Loading

**Error**: "Cannot GET /"

**Solution**:
```powershell
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Problem 5: Changes Not Reflecting

**Error**: Code changes not showing up

**Solution**:
```powershell
# Check volume mounts in docker-compose.yml
# Restart the service
docker-compose restart backend

# Or rebuild
docker-compose up -d --build
```

---

## Stopping and Cleaning Up

### Normal Stop (Keeps Data)

```powershell
# Stop all services
docker-compose down
```

This stops containers but keeps:
- Database data (postgres_data volume)
- Redis data (redis_data volume)

### Clean Stop (Removes Everything)

```powershell
# Stop and remove all data
docker-compose down -v

# Remove unused images
docker image prune -a

# Full cleanup
docker system prune -a --volumes
```

**Warning**: This deletes all data! Use only when you want a fresh start.

---

## Daily Development Workflow

### Morning (Start Work)

```powershell
# 1. Navigate to project
cd D:\Ai_powered_interview_coach

# 2. Start all services
docker-compose up -d

# 3. Wait for services to be healthy (30-60 seconds)
docker-compose ps

# 4. Open browser
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/docs

# 5. Start coding!
```

### During Development

```powershell
# View logs if needed
docker-compose logs -f backend

# Run tests
docker-compose exec backend pytest

# Access database
docker-compose exec postgres psql -U user -d interviewmaster

# Check Redis cache
docker-compose exec redis redis-cli
```

### Evening (End Work)

```powershell
# Stop services (keeps data)
docker-compose down

# Or leave running (uses ~400MB RAM)
```

---

## Next Steps

After Docker Compose is working:

1. ✅ All services running
2. ✅ Database migrations applied
3. ✅ Hot reload working
4. ✅ Can access frontend and backend

**You're ready to:**
- Start Phase 2 development (Authentication)
- Add new features
- Run tests
- Deploy to production

---

## Quick Reference Card

```powershell
# START
docker-compose up -d

# STOP
docker-compose down

# STATUS
docker-compose ps

# LOGS
docker-compose logs -f

# REBUILD
docker-compose up -d --build

# CLEAN START
docker-compose down -v && docker-compose up -d

# BACKEND SHELL
docker-compose exec backend bash

# DATABASE
docker-compose exec postgres psql -U user -d interviewmaster

# REDIS
docker-compose exec redis redis-cli
```

---

## Success Checklist

- [ ] Docker Desktop installed and running
- [ ] All files present (docker-compose.yml, Dockerfiles)
- [ ] Local services stopped (PostgreSQL, Redis)
- [ ] Images built successfully (`docker-compose build`)
- [ ] Services started (`docker-compose up -d`)
- [ ] All services healthy (`docker-compose ps`)
- [ ] Database migrations applied (`alembic upgrade head`)
- [ ] Backend health check passes (http://localhost:8000/health)
- [ ] Frontend loads (http://localhost:5173)
- [ ] Database accessible (`psql`)
- [ ] Redis accessible (`redis-cli`)
- [ ] Hot reload working (test with code change)

**If all checked ✅ - You're ready to develop!**

---

**Need Help?**
- Check logs: `docker-compose logs -f`
- Check status: `docker-compose ps`
- Restart: `docker-compose restart`
- Clean start: `docker-compose down -v && docker-compose up -d`

**Last Updated**: February 8, 2026
