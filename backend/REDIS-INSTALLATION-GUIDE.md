# Redis Installation Guide for Windows

This guide will help you install and run Redis to pass all cache-related tests.

## Why Tests Are Skipped

The Redis tests are skipped because:
1. Redis is not installed on your system
2. The cache service checks `cache.is_available()` before running tests
3. If Redis is not available, tests are automatically skipped with `pytest.skip()`

This is **intentional design** - the application works without Redis (graceful degradation), but tests need Redis to verify caching functionality.

## Installation Options

### Option 1: PowerShell Script (Easiest)

Run the provided PowerShell script:

```powershell
cd backend
.\start_redis_windows.ps1
```

This will:
- Download Redis for Windows (if not already downloaded)
- Extract it to `backend/redis-windows/`
- Start Redis server on port 6379
- Run in the background

To stop Redis:
```powershell
.\stop_redis_windows.ps1
```

### Option 2: Docker Desktop (Recommended for Development)

1. **Install Docker Desktop**:
   - Download from: https://www.docker.com/products/docker-desktop/
   - Install and start Docker Desktop
   - Wait for Docker to fully start (check system tray icon)

2. **Start Redis container**:
   ```powershell
   docker run --name interviewmaster-redis -p 6379:6379 -d redis:7
   ```

3. **Verify it's running**:
   ```powershell
   docker ps
   redis-cli ping
   ```

4. **Stop Redis**:
   ```powershell
   docker stop interviewmaster-redis
   ```

5. **Start again later**:
   ```powershell
   docker start interviewmaster-redis
   ```

### Option 3: Manual Installation

1. **Download Redis for Windows**:
   - Go to: https://github.com/microsoftarchive/redis/releases
   - Download: `Redis-x64-3.2.100.zip`
   - Extract to a folder (e.g., `C:\Redis`)

2. **Start Redis**:
   ```powershell
   cd C:\Redis
   .\redis-server.exe redis.windows.conf
   ```

3. **Keep the window open** (Redis runs in foreground)

### Option 4: WSL2 (Windows Subsystem for Linux)

If you have WSL2 installed:

```bash
# In WSL2 terminal
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

## Verify Redis is Running

### Method 1: Using redis-cli
```powershell
redis-cli ping
# Should return: PONG
```

### Method 2: Using Python
```powershell
cd backend
python -c "from app.services.cache_service import cache_service; print('Redis available:', cache_service.is_available())"
# Should return: Redis available: True
```

### Method 3: Check health endpoint
```powershell
# Start the server
uvicorn app.main:app --reload

# In another terminal
curl http://localhost:8000/health
# Should show: "cache": "connected"
```

## Run Tests with Redis

Once Redis is running:

```powershell
cd backend

# Run only cache tests
pytest tests/test_cache.py -v

# Run all tests with coverage
pytest --cov=app --cov-report=term

# You should see:
# - 12 cache tests PASSED (instead of skipped)
# - Coverage increases to ~85%
```

## Expected Test Output (With Redis)

```
tests/test_cache.py::test_cache_availability PASSED
tests/test_cache.py::test_cache_set_and_get PASSED          ✓ Now passing!
tests/test_cache.py::test_cache_get_nonexistent PASSED      ✓ Now passing!
tests/test_cache.py::test_cache_delete PASSED               ✓ Now passing!
tests/test_cache.py::test_cache_exists PASSED               ✓ Now passing!
tests/test_cache.py::test_cache_ttl PASSED                  ✓ Now passing!
tests/test_cache.py::test_cache_delete_pattern PASSED       ✓ Now passing!
tests/test_cache.py::test_cache_metrics PASSED              ✓ Now passing!
tests/test_cache.py::test_cache_key_builder PASSED
tests/test_cache.py::test_cache_ttl_values PASSED
tests/test_cache.py::test_cache_graceful_degradation PASSED
tests/test_cache.py::test_cache_json_serialization PASSED   ✓ Now passing!

======================== 12 passed ========================
```

## Troubleshooting

### Issue: "Connection refused"
**Solution**: Redis is not running. Start Redis using one of the methods above.

### Issue: "Port 6379 already in use"
**Solution**: Another Redis instance is running. Stop it first:
```powershell
# Find the process
Get-Process -Name "redis-server"

# Stop it
Stop-Process -Name "redis-server" -Force
```

### Issue: Docker not starting
**Solution**: 
1. Open Docker Desktop
2. Wait for it to fully start (green icon in system tray)
3. Try the docker command again

### Issue: "redis-cli not found"
**Solution**: 
- If using PowerShell script: Use `.\redis-windows\redis-cli.exe ping`
- If using Docker: Use `docker exec interviewmaster-redis redis-cli ping`
- If manual install: Add Redis folder to PATH

### Issue: Tests still skipping
**Solution**:
1. Verify Redis is running: `redis-cli ping`
2. Check connection in Python:
   ```python
   from app.services.cache_service import cache_service
   print(cache_service.is_available())  # Should be True
   ```
3. Check .env file has correct Redis settings:
   ```
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

## Quick Start Commands

### Start Redis (PowerShell Script):
```powershell
cd backend
.\start_redis_windows.ps1
```

### Run Tests:
```powershell
pytest tests/test_cache.py -v
```

### Check Coverage:
```powershell
pytest --cov=app --cov-report=term
```

### Stop Redis:
```powershell
.\stop_redis_windows.ps1
```

## Redis Configuration

The cache service uses these settings (from `.env`):
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
```

You can change these if needed, but defaults work for local development.

## Production Deployment

For production, use a managed Redis service:
- **Redis Cloud**: https://redis.com/redis-enterprise-cloud/
- **AWS ElastiCache**: https://aws.amazon.com/elasticache/
- **Azure Cache for Redis**: https://azure.microsoft.com/services/cache/

Update `.env` with production credentials:
```env
REDIS_HOST=your-redis-host.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your-secure-password
```

## Summary

1. **Install Redis** using one of the methods above
2. **Verify it's running**: `redis-cli ping` should return `PONG`
3. **Run tests**: `pytest tests/test_cache.py -v`
4. **All 12 tests should pass** (no more skips!)
5. **Coverage increases** from 69% to ~85%

The application works without Redis (graceful degradation), but Redis significantly improves performance and enables all caching features.
