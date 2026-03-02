# 🤝 Contributing to InterviewMaster AI

Thank you for considering contributing to InterviewMaster AI! We welcome contributions from developers of all skill levels.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Questions](#questions)

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/AI-Powered-Interview-Coach.git
   cd AI-Powered-Interview-Coach
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/Logesh-Murugan/AI-Powered-Interview-Coach.git
   ```
4. **Create a branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🛠️ Development Setup

See the main [README.md](README.md) for detailed setup instructions. Quick summary:

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 🎨 Code Style

### Python (Backend)

We follow **PEP 8** style guidelines with some modifications:

- **Line length**: 100 characters (not 79)
- **Imports**: Use absolute imports, group by standard library, third-party, local
- **Type hints**: Required for all function signatures
- **Docstrings**: Required for all public functions and classes

**Formatting Tools:**
```bash
# Format code with Black
black app/ tests/

# Check linting with Flake8
flake8 app/ tests/

# Type checking with mypy (optional)
mypy app/
```

**Example:**
```python
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate


def create_user(
    db: Session,
    user_data: UserCreate,
    is_active: bool = True
) -> User:
    """
    Create a new user in the database.
    
    Args:
        db: Database session
        user_data: User creation data
        is_active: Whether user is active (default: True)
        
    Returns:
        Created user object
        
    Raises:
        ValueError: If email already exists
    """
    # Implementation here
    pass
```

### TypeScript (Frontend)

We follow **Airbnb TypeScript Style Guide**:

- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Imports**: Group by external, internal, relative
- **Types**: Prefer interfaces over types for object shapes
- **Components**: Use functional components with hooks

**Formatting Tools:**
```bash
# Format code with Prettier
npm run format

# Check linting with ESLint
npm run lint

# Fix linting issues
npm run lint:fix
```

**Example:**
```typescript
import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUserProfile } from '@/store/slices/authSlice';

interface UserProfileProps {
  userId: string;
  showDetails?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  userId, 
  showDetails = true 
}) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    dispatch(fetchUserProfile(userId));
  }, [userId, dispatch]);

  return (
    <Box>
      <Typography variant="h5">{user?.name}</Typography>
      {showDetails && <Typography>{user?.email}</Typography>}
    </Box>
  );
};
```

## 📝 Commit Messages

We follow **Conventional Commits** specification:

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples
```bash
feat(auth): add password reset functionality

Implement password reset flow with email verification.
- Add password reset token generation
- Create email template for reset link
- Add reset password API endpoint

Closes #123

---

fix(interview): resolve answer submission timeout

Increase timeout for AI evaluation from 30s to 60s
to handle complex answers.

Fixes #456

---

docs(api): update authentication endpoint documentation

Add examples for refresh token usage

---

test(analytics): add tests for performance comparison

Add unit tests and property-based tests for
analytics comparison service
```

## 🔄 Pull Request Process

### Before Submitting

1. **Update your branch** with latest upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests** and ensure they pass:
   ```bash
   # Backend
   cd backend
   pytest
   
   # Frontend
   cd frontend
   npm test
   ```

3. **Check code quality**:
   ```bash
   # Backend
   black app/ tests/
   flake8 app/ tests/
   
   # Frontend
   npm run lint
   npm run format
   ```

4. **Update documentation** if needed

### Submitting PR

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** on GitHub with:
   - Clear title following commit message format
   - Detailed description of changes
   - Link to related issues
   - Screenshots (if UI changes)
   - Test results

3. **PR Template**:
   ```markdown
   ## Description
   Brief description of what this PR does
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Related Issues
   Closes #123
   
   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] Manual testing completed
   
   ## Screenshots (if applicable)
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings generated
   - [ ] Tests pass locally
   ```

### Review Process

- Maintainers will review your PR within 2-3 business days
- Address review comments by pushing new commits
- Once approved, maintainers will merge your PR
- Your contribution will be credited in release notes

## 🧪 Testing

### Backend Testing

We maintain **80%+ test coverage**. All new features must include tests.

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

# Run tests matching pattern
pytest -k "test_user" -v
```

**Test Types:**
- **Unit tests**: Test individual functions/methods
- **Integration tests**: Test API endpoints
- **Property-based tests**: Test with generated data (using Hypothesis)

**Example Test:**
```python
import pytest
from app.services.user_service import create_user
from app.schemas.user import UserCreate


def test_create_user_success(db_session):
    """Test successful user creation."""
    user_data = UserCreate(
        email="test@example.com",
        password="SecurePass123!",
        full_name="Test User"
    )
    
    user = create_user(db_session, user_data)
    
    assert user.email == "test@example.com"
    assert user.full_name == "Test User"
    assert user.hashed_password != "SecurePass123!"


def test_create_user_duplicate_email(db_session):
    """Test user creation with duplicate email fails."""
    user_data = UserCreate(
        email="test@example.com",
        password="SecurePass123!",
        full_name="Test User"
    )
    
    create_user(db_session, user_data)
    
    with pytest.raises(ValueError, match="Email already exists"):
        create_user(db_session, user_data)
```

### Frontend Testing

```bash
cd frontend

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui

# Run tests in watch mode
npm run test:watch
```

**Test Types:**
- **Component tests**: Test React components
- **Integration tests**: Test user flows
- **Property-based tests**: Test with generated data

**Example Test:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { LoginPage } from './LoginPage';
import { store } from '@/store';

describe('LoginPage', () => {
  it('renders login form', () => {
    render(
      <Provider store={store}>
        <LoginPage />
      </Provider>
    );
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    render(
      <Provider store={store}>
        <LoginPage />
      </Provider>
    );
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Assert expected behavior
  });
});
```

## 📁 Project Structure

```
InterviewMaster-AI/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── config.py            # Configuration
│   │   ├── database.py          # Database connection
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── routes/              # API endpoints
│   │   ├── services/            # Business logic
│   │   ├── tasks/               # Background tasks
│   │   └── utils/               # Utilities
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # Test suite
│   └── requirements.txt         # Dependencies
│
├── frontend/
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable components
│   │   ├── services/           # API services
│   │   ├── store/              # Redux store
│   │   ├── routes/             # Routing
│   │   └── utils/              # Utilities
│   └── package.json            # Dependencies
│
└── docker-compose.yml          # Docker setup
```

## ❓ Questions?

- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact maintainers (see README.md)

## 🙏 Thank You!

Your contributions make InterviewMaster AI better for everyone. We appreciate your time and effort!

---

**Happy Coding! 🚀**
