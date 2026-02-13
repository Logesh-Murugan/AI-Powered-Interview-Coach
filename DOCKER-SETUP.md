# Docker Setup Guide - InterviewMaster AI

## Overview
This guide explains how to run the InterviewMaster AI platform using Docker Compose for local development.

## Prerequisites

- Docker Desktop 4.0+ installed
- Docker Compose V2 installed
- 4GB+ RAM available for Docker
- 10GB+ disk space

## Quick Start

### 1. Start All Services
```bash
docker-compose up -d
```

This will start:
- PostgreSQL 18 on port 5432
- Redis 7 on port 6379
- FastAPI Backend on port 8000
- React Frontend on port 5173

### 2. Check Service Status
```bash
docker-compose ps
```

Expected output:
```
NAME                        STATUS              PORTS
interviewmaster-backend     Up (healthy)        0.0.0.0:8000->8000/tcp
interviewmaster-frontend    Up (healthy)        0.0.0.0:5173->5173/tcp
interviewmaster-postgres    Up (healthy)        0.0.0.0:5432->5432/tcp
interviewmaster-redis       Up (healthy)        0.0.0.0:6379->6379/tcp
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### 4. View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### 5. Stop All Services
```bash
docker-compose down
```

### 6. Stop and Remove Volumes (Clean Slate)
```bash
docker-compose down -v
```

## Detailed Setup

### Environment Variables

Create a `.env` file in the project root with your API keys:

```env
# AI Provider API Keys
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Database Migrations

Run database migrations after first startup:

```bash
# Enter backend container
docker-compose exec backend bash

# Run migrations
alembic upgrade head

# Exit container
exit
```

### Hot Reloading

Both backend and frontend support hot reloading:

- **Backend**: Changes to Python files automatically reload the FastAPI server
- **Frontend**: Changes to React files automatically refresh the browser

### Accessing Services

#### PostgreSQL Database
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U user -d interviewmaster

# Or from host machine
psql -h localhost -p 5432 -U user -d interviewmaster
```

#### Redis Cache
```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Test Redis
docker-compose exec redis redis-cli ping
# Expected: PONG
```

#### Backend Shell
```bash
# Enter backend container
docker-compose exec backend bash

# Run Python shell
python

# Run tests
pytest

# Run linting
flake8 .
```

#### Frontend Shell
```bash
# Enter frontend container
docker-compose exec frontend sh

# Run tests
npm test

# Run linting
npm run lint

# Build for production
npm run build
```

## Service Configuration

### PostgreSQL
- **Image**: postgres:18-alpine
- **Port**: 5432
- **Database**: interviewmaster
- **User**: user
- **Password**: password
- **Volume**: postgres_data

### Redis
- **Image**: redis:7-alpine
- **Port**: 6379
- **Persistence**: AOF enabled
- **Volume**: redis_data

### Backend (FastAPI)
- **Base Image**: python:3.11-slim
- **Port**: 8000
- **Hot Reload**: Enabled
- **Volume Mount**: ./backend:/app

### Frontend (React + Vite)
- **Base Image**: node:18-alpine
- **Port**: 5173
- **Hot Reload**: Enabled
- **Volume Mount**: ./frontend:/app

## Health Checks

All services have health checks configured:

### Backend Health Check
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "development",
  "database": "connected",
  "cache": "connected"
}
```

### Frontend Health Check
```bash
curl http://localhost:5173
```

Should return HTML content.

### PostgreSQL Health Check
```bash
docker-compose exec postgres pg_isready -U user -d interviewmaster
```

Expected: `postgres:5432 - accepting connections`

### Redis Health Check
```bash
docker-compose exec redis redis-cli ping
```

Expected: `PONG`

## Troubleshooting

### Services Won't Start

1. **Check Docker is running**:
   ```bash
   docker info
   ```

2. **Check port conflicts**:
   ```bash
   # Windows
   netstat -ano | findstr :8000
   netstat -ano | findstr :5173
   netstat -ano | findstr :5432
   netstat -ano | findstr :6379
   ```

3. **View service logs**:
   ```bash
   docker-compose logs backend
   ```

### Database Connection Issues

1. **Wait for PostgreSQL to be ready**:
   ```bash
   docker-compose exec postgres pg_isready -U user
   ```

2. **Check database exists**:
   ```bash
   docker-compose exec postgres psql -U user -l
   ```

3. **Recreate database**:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### Backend Won't Start

1. **Check Python dependencies**:
   ```bash
   docker-compose exec backend pip list
   ```

2. **Rebuild backend image**:
   ```bash
   docker-compose build backend
   docker-compose up -d backend
   ```

3. **Check environment variables**:
   ```bash
   docker-compose exec backend env | grep DATABASE_URL
   ```

### Frontend Won't Start

1. **Check Node modules**:
   ```bash
   docker-compose exec frontend ls -la node_modules
   ```

2. **Rebuild frontend image**:
   ```bash
   docker-compose build frontend
   docker-compose up -d frontend
   ```

3. **Clear npm cache**:
   ```bash
   docker-compose exec frontend npm cache clean --force
   ```

### Hot Reload Not Working

1. **Backend**: Check volume mount in docker-compose.yml
2. **Frontend**: Ensure Vite is configured for Docker networking

### Performance Issues

1. **Increase Docker resources**:
   - Docker Desktop → Settings → Resources
   - Increase CPU and Memory allocation

2. **Check container resource usage**:
   ```bash
   docker stats
   ```

## Development Workflow

### Making Code Changes

1. **Backend Changes**:
   - Edit files in `backend/` directory
   - FastAPI auto-reloads on file changes
   - Check logs: `docker-compose logs -f backend`

2. **Frontend Changes**:
   - Edit files in `frontend/src/` directory
   - Vite auto-reloads on file changes
   - Check logs: `docker-compose logs -f frontend`

### Running Tests

```bash
# Backend tests
docker-compose exec backend pytest --cov=app --cov-report=term

# Frontend tests
docker-compose exec frontend npm test

# All tests
docker-compose exec backend pytest && docker-compose exec frontend npm test
```

### Database Migrations

```bash
# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker-compose exec backend alembic upgrade head

# Rollback migration
docker-compose exec backend alembic downgrade -1
```

### Debugging

1. **Backend Debugging**:
   ```bash
   # Add breakpoint in code
   import pdb; pdb.set_trace()
   
   # Attach to container
   docker attach interviewmaster-backend
   ```

2. **Frontend Debugging**:
   - Use browser DevTools
   - Check console logs
   - Use React DevTools extension

## Production Deployment

For production deployment, use separate docker-compose files:

```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d

# With environment file
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

## Useful Commands

### Container Management
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose stop

# Restart service
docker-compose restart backend

# Remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Rebuild images
docker-compose build

# Rebuild specific service
docker-compose build backend
```

### Logs and Monitoring
```bash
# View logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs -f backend
```

### Exec Commands
```bash
# Backend shell
docker-compose exec backend bash

# Frontend shell
docker-compose exec frontend sh

# PostgreSQL shell
docker-compose exec postgres psql -U user -d interviewmaster

# Redis CLI
docker-compose exec redis redis-cli
```

### Cleanup
```bash
# Remove stopped containers
docker-compose rm

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Full cleanup
docker system prune -a --volumes
```

## Network Configuration

Services communicate via the `interviewmaster-network` bridge network:

- Backend → PostgreSQL: `postgres:5432`
- Backend → Redis: `redis:6379`
- Frontend → Backend: `http://backend:8000`

## Volume Management

### Persistent Data

Data is stored in Docker volumes:

- `postgres_data`: PostgreSQL database files
- `redis_data`: Redis persistence files

### Backup Volumes

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U user interviewmaster > backup.sql

# Restore PostgreSQL
docker-compose exec -T postgres psql -U user interviewmaster < backup.sql

# Backup Redis
docker-compose exec redis redis-cli SAVE
docker cp interviewmaster-redis:/data/dump.rdb ./redis-backup.rdb
```

## Security Notes

### Development vs Production

This Docker setup is configured for **development only**:

- Default passwords are used
- Debug mode is enabled
- Hot reloading is enabled
- Volumes are mounted for code changes

### Production Checklist

For production deployment:

- [ ] Change all default passwords
- [ ] Use environment variables for secrets
- [ ] Disable debug mode
- [ ] Remove volume mounts
- [ ] Use production-optimized images
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Use secrets management (e.g., Docker Secrets)

## Support

For issues or questions:

1. Check logs: `docker-compose logs -f`
2. Check service health: `docker-compose ps`
3. Review this documentation
4. Check Docker Desktop status
5. Restart services: `docker-compose restart`

---

**Last Updated**: February 8, 2026  
**Docker Compose Version**: 3.8  
**Status**: Production-Ready for Development
