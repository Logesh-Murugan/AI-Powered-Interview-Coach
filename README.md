# 🎯 AI-Powered Interview Coach

A comprehensive, **100% local and open-source** interview preparation platform that combines traditional text-based interviews with advanced speech-to-text capabilities and AI-powered evaluation.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![React](https://img.shields.io/badge/react-18+-blue.svg)
![Status](https://img.shields.io/badge/status-production--ready-green.svg)

## ✨ Key Features

### 🎤 **Dual-Mode Interview System** (Latest Feature)
- **Text Mode**: Traditional typing interface with auto-save
- **Speech Mode**: Voice recording with automatic transcription
- **Hybrid Mode**: Combine speech recording with text editing
- **Real-time Voice Analysis**: Speaking pace, pauses, filler words

### 🤖 **100% Local AI Processing**
- **Local Whisper Integration**: Offline speech-to-text transcription
- **Voice Analysis**: Advanced audio processing with Librosa
- **AI-Powered Evaluation**: Comprehensive answer assessment
- **Privacy First**: No external APIs, complete data privacy

### 📊 **Comprehensive Interview Management**
- **Customizable Sessions**: Role-based questions, difficulty levels
- **Progress Tracking**: Session history and analytics
- **Resume Analysis**: AI-powered skill extraction and coaching
- **Performance Analytics**: Detailed feedback and improvement suggestions

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 13+
- Redis
- FFmpeg

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/ai-powered-interview-coach.git
cd ai-powered-interview-coach
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials
alembic upgrade head
python -m uvicorn app.main:app --reload
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

4. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 🏗️ Architecture

```
Frontend (React + TypeScript)
    ↕ REST API
Backend (FastAPI + Python)
    ↕ Database
PostgreSQL + Redis
    ↕ AI Services
Local Whisper + Librosa + AI Agents
```

### Technology Stack
- **Frontend**: React 18, TypeScript, Material-UI, Vite
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Redis
- **AI**: Whisper (speech-to-text), Librosa (voice analysis)
- **Media**: FFmpeg, PyAV for audio/video processing

## 📖 Documentation

- **[Complete Project Presentation](PROJECT_PRESENTATION_COMPLETE.md)** - Comprehensive overview
- **[Quick Start Guide](QUICK_START_GUIDE.md)** - Step-by-step setup
- **[Speech System Guide](INTEGRATED_SPEECH_TEXT_WORKFLOW.md)** - Voice recording features
- **[API Documentation](http://localhost:8000/docs)** - Interactive API docs

## 🎯 Usage

### Creating an Interview Session
1. Register/Login to your account
2. Click "Start New Interview"
3. Configure session parameters:
   - **Role**: Software Engineer, Data Scientist, etc.
   - **Difficulty**: Easy, Medium, Hard, Expert
   - **Questions**: 1-20 questions
   - **Categories**: Technical, Behavioral, System Design, etc.

### Answering Questions
- **Text Mode**: Type your answers with auto-save
- **Speech Mode**: Record voice answers with automatic transcription
- **Hybrid**: Record speech and edit the transcribed text

### Getting Feedback
- Comprehensive AI evaluation with scores
- Voice analysis metrics (pace, pauses, clarity)
- Detailed improvement suggestions
- Progress tracking over time

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Database Migrations
```bash
cd backend
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

### Code Quality
```bash
# Python formatting
black backend/
flake8 backend/

# TypeScript linting
cd frontend
npm run lint
```

## 📊 Features Status

### ✅ Production Ready
- User authentication and management
- Interview session management
- Dual-mode interview system (text + speech)
- Speech-to-text processing with Whisper
- Voice analysis and evaluation
- Resume analysis and AI coaching
- Analytics and progress tracking
- Data export and reporting

### 🔄 Under Development
- Multi-language support
- Advanced AI models
- Mobile applications
- Team collaboration features

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI Whisper** for speech-to-text capabilities
- **Librosa** for audio analysis
- **FastAPI** for the excellent web framework
- **React** and **Material-UI** for the frontend

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/ai-powered-interview-coach/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/ai-powered-interview-coach/discussions)
- **Documentation**: [Project Wiki](https://github.com/your-username/ai-powered-interview-coach/wiki)

---

**Made with ❤️ for better interview preparation**

*Empowering job seekers with AI-driven interview coaching while maintaining complete privacy and local processing.*