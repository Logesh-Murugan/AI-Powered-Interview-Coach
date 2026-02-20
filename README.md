# InterviewMaster AI

> An intelligent AI-powered interview preparation platform that helps candidates practice and excel in technical interviews through personalized coaching, real-time feedback, and comprehensive analytics.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🎯 Overview

InterviewMaster AI is a comprehensive full-stack application designed to revolutionize interview preparation. Using advanced AI models and intelligent algorithms, it provides candidates with realistic interview experiences, personalized feedback, and actionable insights to improve their performance.

### Key Highlights

- 🤖 **Multi-Provider AI Architecture** - Intelligent orchestration with Groq and HuggingFace models
- 📊 **Advanced Analytics** - Track performance, identify strengths/weaknesses, and measure progress
- 🎮 **Gamification** - Achievements, streaks, and leaderboards to keep users engaged
- 🎯 **Personalized Coaching** - AI agents provide company-specific and role-specific guidance
- 📈 **Study Plans** - Automated generation of personalized learning paths
- 💾 **Smart Caching** - Redis-powered caching for optimal performance
- 🔒 **Secure Authentication** - JWT-based auth with refresh tokens and password reset

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:
- Python 3.11 or higher
- Node.js 18 or higher
- PostgreSQL 15 or higher
- Redis 7 or higher
- Git

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Logesh-Murugan/AI-Powered-Interview-Coach.git
cd AI-Powered-Interview-Coach
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate

# Unix/Mac
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# Required: DATABASE_URL, REDIS_URL, SECRET_KEY, GROQ_API_KEY, HUGGINGFACE_API_KEY
```

#### 3. Database Setup

```bash
# Create database
python create_database.py

# Run migrations
alembic upgrade head

# Verify setup
python setup_database.py
```

#### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env if needed (default: http://localhost:8000)
```

#### 5. Start Services

**Terminal 1 - Redis:**
```bash
# Windows (using included Redis)
cd redis-windows
redis-server

# Unix/Mac
redis-server
```

**Terminal 2 - Backend:**
```bash
cd backend
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Unix/Mac
uvicorn app.main:app --reload
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Required API Keys

Get your free API keys from:
- **Groq**: https://console.groq.com (Primary AI provider)
- **HuggingFace**: https://huggingface.co/settings/tokens (Fallback provider)

Add to `backend/.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_token_here
```

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

The docker-compose setup includes:
- PostgreSQL 18 with health checks
- Redis 7 with persistence
- FastAPI backend with auto-reload
- React frontend with hot module replacement

## 📊 Database Schema

The application uses 14 database tables managed through Alembic migrations:

- `users` - User accounts and authentication
- `refresh_tokens` - JWT refresh token management
- `password_reset_tokens` - Password reset functionality
- `resumes` - Resume storage and metadata
- `ai_provider_usage` - AI API quota tracking
- `questions` - Interview question bank
- `interview_sessions` - Interview session data
- `session_questions` - Questions per session
- `answers` - User answer submissions
- `answer_drafts` - Draft answer storage
- `evaluations` - AI evaluation results
- `session_summaries` - Interview summaries
- `user_achievements` - Achievement tracking
- `leaderboard_entries` - Global rankings
- `cache_metadata` - Cache performance metrics
- `resume_analyses` - AI resume analysis results
- `study_plans` - Personalized learning paths
- `company_coaching_sessions` - Company-specific coaching

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html --cov-report=term

# Run specific test file
pytest tests/test_auth.py -v

# Run property-based tests
pytest tests/property/ -v
```

**Test Coverage**: 84%+ (exceeds 80% requirement)

### Frontend Tests

```bash
cd frontend

# Run tests
npm run test

# Run with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui
```

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key API Endpoints

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

#### Interview System
- `POST /api/v1/interview-sessions` - Create interview session
- `GET /api/v1/interview-sessions/{id}` - Get session details
- `GET /api/v1/interview-sessions/{id}/questions/{q_id}` - Get question
- `POST /api/v1/answers` - Submit answer
- `POST /api/v1/evaluations` - Request evaluation

#### Analytics
- `GET /api/v1/analytics/overview` - Performance overview
- `GET /api/v1/analytics/category-performance` - Category breakdown
- `GET /api/v1/analytics/strengths-weaknesses` - Identify areas

#### Gamification
- `GET /api/v1/achievements` - User achievements
- `GET /api/v1/streaks/current` - Current streak
- `GET /api/v1/leaderboard` - Global rankings

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/interviewmaster

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
SECRET_KEY=your-secret-key-min-32-characters
ENVIRONMENT=development

# AI Providers
GROQ_API_KEY=your_groq_api_key
HUGGINGFACE_API_KEY=your_huggingface_token

# CORS
ALLOWED_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api/v1
```

## 🎯 Development Workflow

### Adding New Features

1. Plan feature requirements and design
2. Create database migration if needed
3. Implement backend service and routes
4. Write comprehensive tests
5. Implement frontend components
6. Update documentation

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] Update `SECRET_KEY` with strong random value
- [ ] Configure production database with SSL
- [ ] Set up Redis with persistence and backups
- [ ] Add rate limiting for API endpoints
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Review and update security headers
- [ ] Set up CI/CD pipeline (optional)

### Recommended Hosting

- **Backend**: Render, Railway, or AWS EC2
- **Frontend**: Vercel, Netlify, or Cloudflare Pages
- **Database**: AWS RDS, DigitalOcean, or Supabase
- **Redis**: Redis Cloud, AWS ElastiCache, or Upstash

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow PEP 8 for Python code
- Use TypeScript for all frontend code
- Write tests for new features
- Maintain 80%+ test coverage
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Logesh Murugan**
- GitHub: [@Logesh-Murugan](https://github.com/Logesh-Murugan)
- Project: [AI-Powered-Interview-Coach](https://github.com/Logesh-Murugan/AI-Powered-Interview-Coach)

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- React and Material-UI for frontend components
- Groq and HuggingFace for AI model access
- LangChain for agent framework
- The open-source community

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review API documentation at `/docs`

---

**Built with ❤️ using FastAPI, React, and AI**

*Last Updated: February 2026*

## 🏗️ Architecture

### Technology Stack

#### Backend
- **Framework**: FastAPI 0.109.0 - High-performance async API framework
- **Database**: PostgreSQL 15+ - Robust relational database with 14 migration files
- **Cache**: Redis 7+ - In-memory data store for high-speed caching
- **ORM**: SQLAlchemy 2.0.25 - Python SQL toolkit and ORM
- **Task Queue**: Celery 5.3.6 - Distributed task queue for background jobs
- **Authentication**: JWT with bcrypt - Secure token-based authentication
- **Validation**: Pydantic 2.5.3 - Data validation using Python type annotations
- **Logging**: Loguru - Structured JSON logging for better observability
- **Testing**: Pytest with 84%+ coverage - Comprehensive test suite

#### AI Stack
- **Primary Provider**: Groq (llama-3.3-70b-versatile) - Fast inference with high quality
- **Fallback Provider**: HuggingFace (Mistral-7B-Instruct-v0.2) - Reliable backup
- **Agent Framework**: LangChain - Building AI agents with tools
- **NLP**: spaCy 3.7+ - Advanced natural language processing
- **Pattern**: Circuit Breaker - Automatic failover and recovery

#### Frontend
- **Framework**: React 18.2+ with Vite 5+ - Modern, fast development experience
- **Language**: TypeScript 5.9+ - Type-safe JavaScript
- **State Management**: Redux Toolkit - Predictable state container
- **UI Library**: Material-UI v5 - Comprehensive React component library
- **Styling**: Emotion + Tailwind CSS - Flexible styling solutions
- **Animations**: Framer Motion - Production-ready motion library
- **Charts**: Recharts - Composable charting library
- **Forms**: React Hook Form + Yup - Performant form validation

### Project Structure

```
InterviewMaster-AI/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── main.py            # Application entry point
│   │   ├── config.py          # Configuration management
│   │   ├── database.py        # Database connection
│   │   ├── models/            # SQLAlchemy models (14 models)
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── routes/            # API endpoints (15 route files)
│   │   ├── services/          # Business logic
│   │   │   ├── ai/           # AI provider orchestration
│   │   │   └── agents/       # LangChain AI agents
│   │   ├── tasks/            # Celery background tasks
│   │   ├── middleware/       # Custom middleware
│   │   └── utils/            # Utility functions
│   ├── alembic/              # Database migrations (14 files)
│   ├── tests/                # Test suite (50+ test files)
│   └── requirements.txt      # Python dependencies
│
├── frontend/                  # React Frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   │   ├── auth/        # Authentication pages
│   │   │   ├── dashboard/   # Dashboard
│   │   │   ├── interview/   # Interview flow
│   │   │   ├── resume/      # Resume management
│   │   │   └── analytics/   # Analytics dashboard
│   │   ├── components/       # Reusable components
│   │   │   ├── landing/     # Landing page sections
│   │   │   ├── analytics/   # Analytics components
│   │   │   └── animations/  # Animation components
│   │   ├── services/         # API service layer
│   │   ├── store/           # Redux store
│   │   ├── routes/          # Route configuration
│   │   └── utils/           # Utility functions
│   └── package.json         # Node dependencies
│
├── .github/                  # GitHub configuration
├── docker-compose.yml        # Docker orchestration
└── README.md                # This file
```

## ✨ Features

### Core Interview System
- **Dynamic Question Generation** - AI-generated questions tailored to role, difficulty, and experience level
- **Real-time Interview Sessions** - Interactive interview experience with timer and draft saving
- **AI-Powered Evaluation** - Comprehensive answer analysis with detailed feedback and scoring
- **Session History** - Track all past interviews with complete transcripts and evaluations

### Advanced Features
- **Resume Analysis** - AI-powered resume parsing and skill extraction using NLP
- **Analytics Dashboard** - Visualize performance trends, category strengths, and improvement areas
- **Achievement System** - Unlock badges and milestones as you progress
- **Streak Tracking** - Maintain daily practice streaks for consistent improvement
- **Global Leaderboard** - Compete with other users and track rankings
- **Study Plan Generator** - AI creates personalized learning paths based on your performance
- **Company Coaching** - Get company-specific interview preparation and insights
- **Performance Comparison** - Compare your performance against benchmarks

### Technical Features
- **Multi-Provider AI** - Intelligent failover between Groq and HuggingFace models
- **Circuit Breaker Pattern** - Automatic recovery from AI provider failures
- **Quota Management** - Smart tracking and rotation of API keys
- **Redis Caching** - High-performance caching for questions and sessions
- **Cache Monitoring** - Real-time cache hit rates and performance metrics
- **Property-Based Testing** - Comprehensive test coverage with hypothesis testing
- **Modern UI/UX** - Responsive design with animations and smooth transitions
- **Landing Page** - Professional marketing page with features showcase


