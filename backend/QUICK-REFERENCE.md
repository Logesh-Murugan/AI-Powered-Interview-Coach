# Quick Reference Card

## 🚀 Start Everything

```powershell
# 1. Start Redis
cd backend
.\start_redis_windows.ps1

# 2. Start PostgreSQL (if installed)
Start-Service -Name postgresql-x64-18

# 3. Start server
uvicorn app.main:app --reload
```

## 🧪 Run Tests

```powershell
# All tests
pytest --cov=app

# Specific tests
pytest tests/test_cache.py -v
pytest tests/test_database.py -v
```

## 🔍 Check Status

```powershell
# Health check
curl http://localhost:8000/health

# Cache metrics
curl http://localhost:8000/cache/metrics

# Redis status
.\redis-windows\redis-cli.exe ping

# PostgreSQL status (if installed)
Get-Service -Name postgresql*
```

## 📦 PostgreSQL Setup (Optional)

```powershell
# 1. Install PostgreSQL 18
# Download from: https://www.postgresql.org/download/windows/

# 2. Run setup script
psql -U postgres -f setup_postgres.sql

# 3. Update .env
# DATABASE_URL=postgresql://user:password@localhost:5432/interviewmaster

# 4. Run migrations
alembic upgrade head
```

## 🛑 Stop Everything

```powershell
# Stop Redis
.\stop_redis_windows.ps1

# Stop PostgreSQL
Stop-Service -Name postgresql-x64-18

# Stop server
# Press Ctrl+C in the uvicorn terminal
```

## 📊 Current Status

- ✅ Backend: Running
- ✅ Redis: Running (port 6379)
- ✅ PostgreSQL 18: Running (port 5432)
- ✅ Tests: 21 passing
- ✅ Coverage: 84%

## 📚 Documentation

- `SETUP-POSTGRES-18.md` - PostgreSQL installation
- `REDIS-INSTALLATION-GUIDE.md` - Redis installation
- `COMPLETE-SETUP-SUMMARY.md` - Full summary
- `TASK-00X-COMPLETE.md` - Task details

## 🆘 Troubleshooting

**Redis not working?**
```powershell
.\start_redis_windows.ps1
```

**PostgreSQL not working?**
```powershell
Start-Service -Name postgresql-x64-18
```

**Tests failing?**
```powershell
pytest -v  # See detailed errors
```

## 🎯 Next Steps

1. ✅ PostgreSQL 18 installed and configured
2. Continue to TASK-004 (Frontend)
3. Or start building features!
