# TASK-003: Redis Setup Instructions

## Overview
This document provides instructions for setting up Redis for InterviewMaster AI caching layer.

## Option 1: Using Docker (Recommended for Development)

### Start Redis with Docker:
```bash
docker run --name interviewmaster-redis \
  -p 6379:6379 \
  -d redis:7
```

### Verify it's running:
```bash
docker ps
redis-cli ping
```

### Update .env file:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
```

## Option 2: Install Redis Locally

### Windows:
1. Download from https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`
3. Or use WSL2 and follow Linux instructions

### macOS (using Homebrew):
```bash
brew install redis
brew services start redis
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## Option 3: Redis Cloud (Production)

For production, consider using a managed Redis service:
- **Redis Cloud**: https://redis.com/redis-enterprise-cloud/
- **AWS ElastiCache**: https://aws.amazon.com/elasticache/
- **Azure Cache for Redis**: https://azure.microsoft.com/en-us/services/cache/

Update `.env` with connection details:
```env
REDIS_HOST=your-redis-host.cloud.redislabs.com
REDIS_PORT=12345
REDIS_DB=0
REDIS_PASSWORD=your-password
```

## Verify Setup

### 1. Test Redis connection:
```bash
redis-cli ping
# Should return: PONG
```

### 2. Test from Python:
```python
from app.services.cache_service import cache_service

# Check availability
print(cache_service.is_available())  # Should be True

# Test set/get
cache_service.set("test", {"data": "value"}, timedelta(seconds=60))
print(cache_service.get("test"))  # Should return: {'data': 'value'}
```

### 3. Check health endpoint:
```bash
curl http://localhost:8000/health
# Should show: "cache": "connected"
```

### 4. Check cache metrics:
```bash
curl http://localhost:8000/cache/metrics
```

## Cache Configuration

The cache service uses a multi-layer caching strategy:

### L1 Cache: Hot data (1-5 minutes)
- User sessions
- Interview state
- Frequently accessed, changes often

### L2 Cache: Warm data (15-60 minutes)
- User profiles
- User preferences
- Question sets
- Moderately accessed, stable

### L3 Cache: Cold data (1-24 hours)
- Resume analysis
- Analytics summaries
- Interview history
- Infrequently accessed, very stable

### L4 Cache: Frozen data (7-30 days)
- AI responses
- Question bank
- Skill taxonomy
- Rarely changes, expensive to compute

## Troubleshooting

### Connection refused:
- Ensure Redis is running: `redis-cli ping`
- Check port 6379 is not in use: `netstat -an | grep 6379`
- Check firewall settings

### Authentication failed:
- Verify REDIS_PASSWORD in `.env` matches Redis configuration
- Check Redis config file: `redis.conf`

### Permission denied:
- On Linux, ensure Redis has proper permissions
- Check Redis logs: `sudo journalctl -u redis`

### Graceful Degradation:
The cache service is designed to fail gracefully:
- If Redis is unavailable, operations return safe defaults
- Application continues to work without caching
- Cache misses are logged but don't break functionality

## Performance Tuning

### Connection Pooling:
The cache service uses connection pooling with:
- Max connections: 20
- Socket timeout: 5 seconds
- Connect timeout: 5 seconds

### Memory Management:
Configure Redis memory limits in `redis.conf`:
```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### Persistence:
For development, persistence is optional. For production:
```conf
save 900 1
save 300 10
save 60 10000
```

## Monitoring

### Cache Metrics Endpoint:
```bash
GET /cache/metrics
```

Returns:
```json
{
  "available": true,
  "hits": 150,
  "misses": 50,
  "total_requests": 200,
  "hit_rate": 75.0
}
```

### Redis CLI Commands:
```bash
# Check memory usage
redis-cli INFO memory

# Monitor commands in real-time
redis-cli MONITOR

# Get all keys (use with caution in production)
redis-cli KEYS *

# Check specific key
redis-cli GET "user:profile:123"

# Check TTL
redis-cli TTL "user:profile:123"
```

## Current Status

✓ Cache service implemented with graceful degradation
✓ Multi-layer caching strategy (L1-L4)
✓ Cache key builder with consistent patterns
✓ Connection pooling configured
✓ Cache metrics tracking
✓ Comprehensive test suite
⏳ Waiting for Redis instance to run full tests

## Next Steps

Once Redis is set up:
1. Start Redis: `docker run -d -p 6379:6379 redis:7`
2. Run tests: `pytest tests/test_cache.py -v`
3. Check health: `curl http://localhost:8000/health`
4. Proceed to TASK-004 (Frontend Setup)
