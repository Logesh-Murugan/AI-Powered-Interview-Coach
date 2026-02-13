# Docker Compose - Quick Start (5 Minutes)

## 🚀 Super Fast Setup

### 1️⃣ Stop Local Services
```powershell
# Stop PostgreSQL
Stop-Service -Name postgresql-x64-18

# Stop Redis
cd backend
.\stop_redis_windows.ps1
```

### 2️⃣ Build Images (First Time Only - 5-10 min)
```powershell
cd D:\Ai_powered_interview_coach
docker-compose build
```

### 3️⃣ Start Everything
```powershell
docker-compose up -d
```

### 4️⃣ Wait for Services (30-60 seconds)
```powershell
docker-compose ps
```

Wait until all show **"Up (healthy)"**

### 5️⃣ Run Database Migrations
```powershell
docker-compose exec backend alembic upgrade head
```

### 6️⃣ Test It Works
```powershell
# Test backend
curl http://localhost:8000/health

# Open frontend in browser
start http://localhost:5173
```

## ✅ Done! You're Ready to Code!

---

## 📋 Daily Commands

```powershell
# Start work
docker-compose up -d

# Stop work
docker-compose down

# View logs
docker-compose logs -f

# Restart service
docker-compose restart backend
```

---

## 🔧 Troubleshooting

### Services not starting?
```powershell
docker-compose logs backend
docker-compose restart
```

### Port conflict?
```powershell
netstat -ano | findstr :8000
# Kill the process or change port
```

### Need fresh start?
```powershell
docker-compose down -v
docker-compose up -d
```

---

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 📊 Check Status

```powershell
# All services
docker-compose ps

# Resource usage
docker stats

# Logs
docker-compose logs -f backend
```

---

**That's it! Simple and fast! 🎉**

For detailed guide, see: `DOCKER-COMPOSE-STEP-BY-STEP.md`
