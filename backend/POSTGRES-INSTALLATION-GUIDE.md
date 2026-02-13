# PostgreSQL Installation Guide

## Understanding the Situation

### Why TASK-002 Was Marked Complete Without PostgreSQL?

TASK-002 focused on **database infrastructure setup**, not running PostgreSQL:

✅ **What Was Completed:**
- Database models created (User, BaseModel)
- SQLAlchemy configuration (connection pooling, sessions)
- Alembic migrations configured
- Migration files created
- Tests written and passing (using SQLite)
- Documentation created

⏳ **What's Optional:**
- Actually running PostgreSQL
- Running migrations on PostgreSQL
- Using PostgreSQL for development

### Why Tests Pass Without PostgreSQL?

The database tests use **in-memory SQLite** for testing:

```python
@pytest.fixture
def test_db():
    # Use in-memory SQLite for testing
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
```

**This is a best practice because:**
- ✅ Tests run fast (no external database)
- ✅ Tests are isolated (fresh database each time)
- ✅ Tests work anywhere (no setup needed)
- ✅ CI/CD works without database setup

### Redis vs PostgreSQL: Key Difference

| Aspect | Redis (TASK-003) | PostgreSQL (TASK-002) |
|--------|------------------|----------------------|
| **Tests** | Require actual Redis | Use SQLite in-memory |
| **Why?** | Can't mock Redis behavior | SQLAlchemy abstracts DB |
| **Without it** | Tests skip | Tests pass |
| **For development** | Recommended | Recommended |
| **For production** | Required | Required |

## Should You Install PostgreSQL?

**Answer: Yes, but you have options!**

### For Testing: ✅ Already Working
- Tests use SQLite (already passing)
- No PostgreSQL needed for tests

### For Development: 🔶 Recommended
- Better matches production
- Test PostgreSQL-specific features
- More realistic development

### For Production: ✅ Required
- PostgreSQL is production database
- Must be configured before deployment

## Installation Options

### Option 1: Docker (Recommended - Easiest)

**Pros:**
- ✅ Easiest to set up
- ✅ Easy to start/stop
- ✅ No system installation
- ✅ Easy to reset/recreate
- ✅ Matches production environment

**Cons:**
- ❌ Requires Docker Desktop
- ❌ Uses more resources

**Setup:**
```powershell
# Run the Docker script
cd backend
.\start_postgres_docker.ps1

# Verify
docker ps

# Run migrations
alembic upgrade head
```

### Option 2: Local Installation

**Pros:**
- ✅ Native performance
- ✅ Persistent across reboots
- ✅ Can use pgAdmin GUI
- ✅ No Docker needed

**Cons:**
- ❌ More complex installation
- ❌ System-wide installation
- ❌ Harder to reset

**Setup:**
```powershell
# Run the local installation guide
cd backend
.\start_postgres_local.ps1

# Follow the instructions to download and install
```

### Option 3: Continue with SQLite (Development Only)

**Pros:**
- ✅ Already working
- ✅ No installation needed
- ✅ Simple and fast
- ✅ Good for learning/prototyping

**Cons:**
- ❌ Different from production
- ❌ Missing PostgreSQL features
- ❌ Not recommended for production

**Setup:**
```env
# In .env file, use SQLite
DATABASE_URL=sqlite:///./interviewmaster.db
```

## Detailed Installation Steps

### Docker Installation (Recommended)

1. **Ensure Docker Desktop is running**
   ```powershell
   docker ps
   ```

2. **Run the setup script**
   ```powershell
   cd backend
   .\start_postgres_docker.ps1
   ```

3. **Verify PostgreSQL is running**
   ```powershell
   docker ps
   # Should show: interviewmaster-postgres
   ```

4. **Run migrations**
   ```powershell
   alembic upgrade head
   ```

5. **Verify database**
   ```powershell
   python setup_database.py
   ```

### Local Installation

1. **Download PostgreSQL**
   - Go to: https://www.postgresql.org/download/windows/
   - Download PostgreSQL 15 installer
   - Run the installer

2. **During Installation**
   - Choose installation directory (default is fine)
   - Select components:
     - ✅ PostgreSQL Server
     - ✅ pgAdmin 4
     - ✅ Command Line Tools
   - Set password for 'postgres' user (remember this!)
   - Use default port: 5432
   - Use default locale

3. **Create Database**
   - Open "SQL Shell (psql)" from Start Menu
   - Press Enter for defaults (server, database, port, username)
   - Enter the password you set
   - Run these commands:
   ```sql
   CREATE DATABASE interviewmaster;
   CREATE USER user WITH PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE interviewmaster TO user;
   \q
   ```

4. **Update .env file**
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/interviewmaster
   ```

5. **Run migrations**
   ```powershell
   cd backend
   alembic upgrade head
   ```

## Verify Setup

### Method 1: Using setup_database.py
```powershell
cd backend
python setup_database.py
```

Expected output:
```
✓ Database 'interviewmaster' already exists
✓ Database connection successful
```

### Method 2: Using psql
```powershell
psql -U user -d interviewmaster -c "\dt"
```

Should show:
```
 Schema |  Name  | Type  | Owner
--------+--------+-------+-------
 public | users  | table | user
```

### Method 3: Check health endpoint
```powershell
# Start server
uvicorn app.main:app --reload

# In another terminal
curl http://localhost:8000/health
```

Should show:
```json
{
  "status": "healthy",
  "database": "connected",
  "cache": "connected"
}
```

## Managing PostgreSQL

### Docker Commands

```powershell
# Start PostgreSQL
docker start interviewmaster-postgres

# Stop PostgreSQL
docker stop interviewmaster-postgres

# View logs
docker logs interviewmaster-postgres

# Connect to PostgreSQL
docker exec -it interviewmaster-postgres psql -U user -d interviewmaster

# Remove container (data will be lost!)
docker rm -f interviewmaster-postgres
```

### Local Installation Commands

```powershell
# Start PostgreSQL (usually auto-starts)
# Check Services: services.msc → postgresql-x64-15

# Connect with psql
psql -U user -d interviewmaster

# Connect with pgAdmin
# Open pgAdmin from Start Menu
```

## Troubleshooting

### Issue: "Connection refused"
**Solution:**
- Docker: Ensure Docker Desktop is running
- Local: Check PostgreSQL service is running
- Verify port 5432 is not blocked

### Issue: "Password authentication failed"
**Solution:**
- Check .env file has correct credentials
- Docker: user/password (as in script)
- Local: Use the password you set during installation

### Issue: "Database does not exist"
**Solution:**
```sql
-- Connect as postgres user
psql -U postgres

-- Create database
CREATE DATABASE interviewmaster;
```

### Issue: "Port 5432 already in use"
**Solution:**
```powershell
# Find what's using the port
netstat -ano | findstr :5432

# Stop the process or use different port
```

## Comparison: SQLite vs PostgreSQL

| Feature | SQLite (Current) | PostgreSQL (Recommended) |
|---------|------------------|-------------------------|
| **Setup** | ✅ None needed | 🔶 Requires installation |
| **Performance** | ✅ Fast for small data | ✅ Fast for large data |
| **Concurrent writes** | ❌ Limited | ✅ Excellent |
| **Production ready** | ❌ No | ✅ Yes |
| **Features** | 🔶 Basic | ✅ Advanced |
| **Testing** | ✅ Perfect | ✅ Good |
| **Development** | ✅ Good | ✅ Better |

## Recommendation

### For Learning/Testing:
- ✅ **Continue with SQLite** (already working)
- Tests pass, application works
- No installation needed

### For Serious Development:
- ✅ **Use Docker PostgreSQL**
- Run: `.\start_postgres_docker.ps1`
- Matches production environment
- Easy to manage

### For Production:
- ✅ **Use managed PostgreSQL**
- AWS RDS, Azure Database, or similar
- Automatic backups, scaling, monitoring

## Summary

**Current Status:**
- ✅ Database infrastructure complete (TASK-002)
- ✅ Tests passing with SQLite
- ✅ Application works without PostgreSQL
- 🔶 PostgreSQL recommended but optional for development

**To Install PostgreSQL:**
1. Choose Docker (easier) or Local (more features)
2. Run the appropriate script
3. Run migrations: `alembic upgrade head`
4. Verify: `python setup_database.py`

**Bottom Line:**
- **Tests don't need PostgreSQL** (use SQLite)
- **Development benefits from PostgreSQL** (more realistic)
- **Production requires PostgreSQL** (must have)

You can continue development with SQLite and add PostgreSQL later when needed!
