# InterviewMaster AI - Backend

FastAPI backend for the InterviewMaster AI platform.

## Features

- ✅ FastAPI with async support
- ✅ Pydantic v2 for validation and settings
- ✅ Structured JSON logging with Loguru
- ✅ Request ID tracking for distributed tracing
- ✅ CORS configuration
- ✅ Health check endpoint
- ✅ Comprehensive error handling
- ✅ Test suite with pytest

## Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Run Application

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Health Check: http://localhost:8000/health
- API Docs: http://localhost:8000/docs (development only)
- ReDoc: http://localhost:8000/redoc (development only)

## Testing

### Run All Tests

```bash
pytest
```

### Run with Coverage

```bash
pytest --cov=app --cov-report=html
```

### Run Specific Test

```bash
pytest tests/test_main.py::test_health_check -v
```

## Code Quality

### Linting

```bash
flake8 app tests
```

### Formatting

```bash
black app tests
```

### Type Checking

```bash
mypy app
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration management
│   ├── logging_config.py    # Logging setup
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── routes/              # API endpoints
│   ├── services/            # Business logic
│   └── utils/               # Utility functions
├── tests/                   # Test suite
├── alembic/                 # Database migrations (Phase 1)
├── requirements.txt         # Python dependencies
├── .env.example            # Environment template
├── pytest.ini              # Pytest configuration
└── README.md               # This file
```

## API Endpoints

### Current Endpoints

- `GET /` - API information
- `GET /health` - Health check

### Coming Soon (Phase 2+)

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/users/me` - Get current user
- And more...

## Development

### Adding a New Endpoint

1. Create schema in `app/schemas/`
2. Create route in `app/routes/`
3. Create service in `app/services/`
4. Import and include router in `app/main.py`
5. Write tests in `tests/`

### Environment Variables

See `.env.example` for all available configuration options.

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000  # On Unix
netstat -ano | findstr :8000  # On Windows

# Kill the process or use a different port
uvicorn app.main:app --reload --port 8001
```

### Import Errors

Make sure you're in the virtual environment and all dependencies are installed:

```bash
source venv/bin/activate
pip install -r requirements.txt
```

## License

Proprietary - InterviewMaster AI
