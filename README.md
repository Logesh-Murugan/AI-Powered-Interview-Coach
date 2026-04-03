<p align="center">
  <img src="https://img.shields.io/badge/InterviewMaster-AI-6366f1?style=for-the-badge&labelColor=0f0f23&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2EzNWVmNSI+PHBhdGggZD0iTTEyIDJMMyA3bDkgNSA5LTVMNCA3bTkgNXY2bC05IDVMMy0xMlY3bDktNSA5IDV2Nmw5IDV6Ii8+PC9zdmc+" alt="InterviewMaster AI" />
</p>

<h1 align="center">🎯 InterviewMaster AI</h1>

<p align="center">
  <strong>AI-powered interview coaching platform with real-time feedback, adaptive study plans, and voice analysis</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 📸 Overview

InterviewMaster AI is a full-stack interview preparation platform that uses **AI agents** to deliver personalized coaching. Upload your resume, practice with adaptive mock interviews, get real-time AI feedback, and track your progress — all from a premium, modern interface.

---

## ✨ Features

### 🤖 AI-Powered Interview Engine
- **Adaptive Question Generation** — AI generates role-specific questions based on your resume, target role, and difficulty level
- **Real-Time Answer Evaluation** — Get scored on relevance, depth, clarity, and structure with actionable suggestions
- **Multi-Category Support** — Technical, behavioral, system design, and situational questions

### 📄 Resume Intelligence
- **Resume Upload & Parsing** — Supports PDF, DOCX formats with AI-powered text extraction
- **Skill Extraction** — Automatically identifies technical skills, experience level, and career trajectory
- **Resume-Based Interviews** — AI generates interview questions specifically from your resume content

### 📋 Adaptive Study Plans
- **30-Day Personalized Plans** — AI creates day-by-day study schedules based on your skill gaps
- **Gap Analysis** — Identifies weak areas and prioritizes improvement areas
- **Progress Tracking** — Track daily completion and adjust plans dynamically

### 🏢 Company-Specific Coaching
- **FAANG & Top Company Prep** — Tailored coaching for specific companies (Google, Amazon, Meta, etc.)
- **Company Culture Insights** — Learn interview patterns and expectations per company
- **Role-Specific Strategies** — Different coaching paths for SDE, PM, Data Science, and more

### 🎤 Voice & Media Recording
- **Dual-Mode Interviews** — Answer via text or record voice/video responses
- **Speech-to-Text** — Whisper-powered transcription of voice recordings
- **Voice Analysis** — Speaking pace, pause detection, filler word tracking, and confidence scoring
- **Audio/Video Playback** — Review your recordings with AI-annotated feedback

### 📊 Analytics & Progress Dashboard
- **Performance Analytics** — Track scores across sessions with interactive charts
- **Skill Heatmap** — Visual breakdown of strengths and weaknesses by category
- **Session History** — Complete history of all practice sessions with detailed reviews
- **Improvement Trends** — See how your scores evolve over time

### 🏆 Gamification System
- **Achievements & Badges** — Unlock achievements for milestones (first interview, streak goals, high scores)
- **Practice Streaks** — Daily streak tracking with streak protection
- **Leaderboard** — Compare your progress with other users
- **XP & Level System** — Earn experience points and level up

### ⚙️ Additional Features
- **JWT Authentication** — Secure login/register with access & refresh tokens
- **Email Service** — Password reset, welcome emails (SMTP/Gmail/SendGrid/SES)
- **Data Export** — Export session data and analytics as PDF reports
- **Admin Dashboard** — User management and system monitoring
- **Redis Caching** — High-performance caching for analytics and session data
- **Dark Mode UI** — Premium glassmorphism design with smooth animations

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React 18)                   │
│         TypeScript • Material-UI • Framer Motion        │
│              Vite Dev Server (port 5173)                 │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API
┌───────────────────────▼─────────────────────────────────┐
│                  Backend (FastAPI)                       │
│       SQLAlchemy • Alembic • Pydantic • Loguru          │
│            Uvicorn Server (port 8000)                    │
├─────────────┬───────────────────────┬───────────────────┤
│  AI Agents  │    Media Services     │   Auth & Core     │
│ ─────────── │ ───────────────────── │ ───────────────── │
│ Resume      │ Whisper STT           │ JWT Auth          │
│ Study Plan  │ Librosa Analysis      │ User Management   │
│ Company     │ FFmpeg Processing     │ Email Service     │
│ Coaching    │ Audio/Video Storage   │ Data Export       │
└──────┬──────┴───────────┬───────────┴────────┬──────────┘
       │                  │                    │
┌──────▼──────┐   ┌───────▼───────┐   ┌───────▼───────┐
│  AI / LLM   │   │  PostgreSQL   │   │    Redis      │
│  Providers   │   │   Database    │   │    Cache      │
│ (Gemini API) │   │  (port 5432)  │   │  (port 6379)  │
└─────────────┘   └───────────────┘   └───────────────┘
```

### Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Material-UI (MUI), Framer Motion, Redux Toolkit, Vite |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2 |
| **Database** | PostgreSQL 16, Redis 7 |
| **AI/ML** | Google Gemini API, LangChain, Whisper (Speech-to-Text), Librosa |
| **Media** | FFmpeg, PyAV, SoundFile |
| **Auth** | JWT (Access + Refresh Tokens), Passlib/Bcrypt |
| **DevOps** | Docker, Docker Compose, GitHub Actions CI/CD |

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **PostgreSQL** 16+
- **Redis** 7+
- **FFmpeg** (for audio/video processing)

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-username/ai-powered-interview-coach.git
cd ai-powered-interview-coach

# Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Manual Setup

#### 1. Database Setup

```bash
# Create PostgreSQL database
createdb interviewmaster

# Start Redis server
redis-server
```

#### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database URL and API keys

# Run database migrations
alembic upgrade head

# Start the server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### 4. Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Documentation | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |

---

## 🔑 Environment Variables

Create a `backend/.env` file based on `backend/.env.example`:

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/interviewmaster
SECRET_KEY=your-secure-secret-key-minimum-32-characters
GEMINI_API_KEY=your-gemini-api-key

# Optional (for additional features)
REDIS_HOST=localhost
EMAIL_ENABLED=False
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

> **Note:** Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

---

## 📡 API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register a new user |
| `POST` | `/api/v1/auth/login` | Login and get tokens |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |
| `GET` | `/api/v1/users/me` | Get current user profile |

### Interview System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/interviews/` | Create new interview session |
| `GET` | `/api/v1/interviews/` | List all sessions |
| `GET` | `/api/v1/interviews/{id}` | Get session details |
| `POST` | `/api/v1/interviews/{id}/submit` | Submit answer |
| `GET` | `/api/v1/interviews/{id}/summary` | Get session summary |

### AI Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/resumes/upload` | Upload resume for analysis |
| `POST` | `/api/v1/resume-analysis/analyze` | AI resume analysis |
| `POST` | `/api/v1/study-plans/` | Generate study plan |
| `POST` | `/api/v1/company-coaching/` | Get company coaching |

### Analytics & Gamification

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/analytics/summary` | Performance analytics |
| `GET` | `/api/v1/achievements/` | User achievements |
| `GET` | `/api/v1/streaks/` | Streak data |
| `GET` | `/api/v1/leaderboard/` | Global leaderboard |

> 📖 Full interactive API documentation available at `/docs` when running the backend.

---

## 📁 Project Structure

```
Ai_powered_interview_coach/
├── backend/
│   ├── app/
│   │   ├── config.py              # Application configuration
│   │   ├── database.py            # Database connection
│   │   ├── main.py                # FastAPI app entry point
│   │   ├── models/                # SQLAlchemy models
│   │   ├── routes/                # API route handlers
│   │   ├── schemas/               # Pydantic schemas
│   │   ├── services/              # Business logic
│   │   │   ├── agents/            # AI agent system
│   │   │   │   ├── resume_agent_service.py
│   │   │   │   ├── study_plan_agent_service.py
│   │   │   │   └── company_coaching_agent_service.py
│   │   │   ├── ai/               # AI provider orchestration
│   │   │   │   ├── orchestrator.py
│   │   │   │   ├── circuit_breaker.py
│   │   │   │   └── quota_tracker.py
│   │   │   ├── analytics_service.py
│   │   │   ├── evaluation_service.py
│   │   │   └── media_service.py
│   │   ├── middleware/            # Request validation
│   │   └── utils/                 # Utilities
│   ├── alembic/                   # Database migrations
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Application pages
│   │   │   ├── LandingPage.tsx
│   │   │   ├── dashboard/
│   │   │   ├── interview/
│   │   │   ├── ai/               # Resume, Study Plans, Coaching
│   │   │   ├── analytics/
│   │   │   ├── achievements/
│   │   │   └── leaderboard/
│   │   ├── services/              # API service layer
│   │   ├── store/                 # Redux state management
│   │   └── theme/                 # MUI theme configuration
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── LICENSE
└── README.md
```

---

## 🧪 Running Tests

```bash
# Backend tests
cd backend
pytest --cov=app tests/

# Frontend tests
cd frontend
npm test
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit** your changes
   ```bash
   git commit -m "feat: add your feature description"
   ```
4. **Push** to your branch
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open** a Pull Request

### Commit Convention

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation |
| `style:` | Formatting |
| `refactor:` | Code refactoring |
| `test:` | Adding tests |
| `chore:` | Maintenance |

---

## 👨‍💻 Author

<p>
  <strong>Logesh M</strong>
  <br />
  <a href="mailto:logeshmuruganofficial@gmail.com">📧 logeshmuruganofficial@gmail.com</a>
  <br />
  <a href="https://www.linkedin.com/in/logesh01/">🔗 LinkedIn — linkedin.com/in/logesh01</a>
</p>

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with ❤️ by Logesh M</strong>
  <br />
  <sub>Empowering candidates with AI-driven coaching to land their dream jobs</sub>
</p>