# Quick Start: Redis for Tests

## TL;DR - Get Redis Running in 30 Seconds

```powershell
# Navigate to backend folder
cd backend

# Start Redis (downloads and starts automatically)
.\start_redis_windows.ps1

# Run tests
pytest tests/test_cache.py -v

# All 12 tests should PASS! ✅
```

## What Just Happened?

The script:
1. ✅ Downloaded Redis for Windows (if not already present)
2. ✅ Extracted it to `backend/redis-windows/`
3. ✅ Started Redis server on port 6379
4. ✅ Redis is now running in the background

## Verify Redis is Working

```powershell
# Method 1: Using redis-cli
.\redis-windows\redis-cli.exe ping
# Should return: PONG

# Method 2: Check health endpoint
curl http://localhost:8000/health
# Should show: "cache": "connected"
```

## Run Tests

```powershell
# Run only cache tests
pytest tests/test_cache.py -v
# Result: 12 passed ✅

# Run all tests with coverage
pytest --cov=app --cov-report=term
# Result: 21 passed, 84% coverage ✅
```

## Stop Redis

```powershell
# Option 1: Use stop script
.\stop_redis_windows.ps1

# Option 2: Manual stop
Stop-Process -Name redis-server
```

## Restart Redis Later

```powershell
# Just run the start script again
.\start_redis_windows.ps1
```

## Troubleshooting

### Redis won't start?
```powershell
# Check if already running
Get-Process -Name redis-server

# If running, stop it first
Stop-Process -Name redis-server -Force

# Then start again
.\start_redis_windows.ps1
```

### Tests still failing?
```powershell
# Verify Redis connection
python -c "from app.services.cache_service import cache_service; print(cache_service.is_available())"
# Should print: True
```

## That's It!

Redis is now running and all cache tests pass. The application will use Redis for caching, significantly improving performance.

**Coverage**: 84% (exceeds 80% requirement) ✅
**All Tests**: 21 passed ✅
**Redis Tests**: 12 passed (no more skips!) ✅
