# CI/CD Pipeline Documentation

## Overview

This repository uses GitHub Actions for continuous integration and deployment. The pipeline automatically runs tests, linting, and type checking on every push and pull request.

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` branch

**Jobs:**

#### Backend Tests
- Runs on Ubuntu with PostgreSQL 15 and Redis 7 services
- Python 3.11
- Steps:
  1. Checkout code
  2. Cache Python dependencies
  3. Install dependencies
  4. Run flake8 linting
  5. Run pytest with coverage
  6. Check coverage threshold (80%)
  7. Upload coverage to Codecov

#### Frontend Tests
- Runs on Ubuntu
- Node.js 18
- Steps:
  1. Checkout code
  2. Cache Node modules
  3. Install dependencies
  4. Run ESLint
  5. Run TypeScript type checking
  6. Run Vitest tests with coverage
  7. Upload coverage to Codecov

#### Docker Build
- Runs after backend and frontend tests pass
- Steps:
  1. Build backend Docker image
  2. Build frontend Docker image
  3. Validate docker-compose configuration

### 2. Deploy to Staging (`.github/workflows/deploy-staging.yml`)

**Triggers:**
- Push to `develop` branch
- Manual workflow dispatch

**Environment:** staging

**Steps:**
1. Checkout code
2. Install backend and frontend dependencies
3. Build frontend with staging API URL
4. Run database migrations
5. Deploy backend to Render
6. Deploy frontend to Render
7. Run health check
8. Send deployment notification

## Required Secrets

Configure these secrets in GitHub repository settings:

### Staging Environment
- `STAGING_API_URL`: Staging API base URL
- `STAGING_DATABASE_URL`: PostgreSQL connection string
- `RENDER_API_KEY`: Render.com API key
- `RENDER_BACKEND_SERVICE_ID`: Render backend service ID
- `RENDER_FRONTEND_SERVICE_ID`: Render frontend service ID

### Codecov (Optional)
- `CODECOV_TOKEN`: Token for uploading coverage reports

## Local Testing

Before pushing code, run these commands locally:

### Backend
```bash
cd backend

# Linting
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics

# Tests
pytest --cov=app --cov-report=term -v

# Coverage check
coverage report --fail-under=80
```

### Frontend
```bash
cd frontend

# Linting
npm run lint

# Type checking
npm run type-check

# Tests
npm run test -- --run

# Coverage
npm run test:coverage
```

### Docker
```bash
# Validate docker-compose
docker-compose config

# Build images
docker build -t interviewmaster-backend:test ./backend
docker build -t interviewmaster-frontend:test ./frontend
```

## Coverage Requirements

- Backend: Minimum 80% code coverage
- Frontend: No minimum enforced (recommended 70%+)

## Troubleshooting

### Backend Tests Failing
- Ensure PostgreSQL and Redis services are running
- Check database connection string
- Verify all dependencies are installed

### Frontend Tests Failing
- Clear node_modules and reinstall: `npm ci`
- Check for TypeScript errors: `npm run type-check`
- Verify all peer dependencies are installed

### Docker Build Failing
- Check Dockerfile syntax
- Ensure all required files are present
- Verify .dockerignore is not excluding necessary files

### Deployment Failing
- Verify all secrets are configured
- Check Render service IDs are correct
- Ensure database migrations are compatible
- Review Render deployment logs

## Best Practices

1. **Always run tests locally** before pushing
2. **Keep coverage above 80%** for backend
3. **Fix linting errors** before committing
4. **Write tests for new features** before implementation
5. **Update documentation** when changing workflows
6. **Use feature branches** and create pull requests
7. **Review CI logs** when builds fail

## Monitoring

- **GitHub Actions**: View workflow runs in the Actions tab
- **Codecov**: View coverage reports at codecov.io
- **Render**: Monitor deployments in Render dashboard

## Support

For issues with CI/CD:
1. Check GitHub Actions logs
2. Review this documentation
3. Contact DevOps team
4. Create an issue in the repository
