# How to Run Interview Master AI 🚀

**Complete Guide to Start and Use the Application**

## Prerequisites Check

Before starting, make sure you have:
- ✅ PostgreSQL installed and running
- ✅ Redis installed and running (for Windows: use `redis-windows` folder)
- ✅ Python 3.9+ installed
- ✅ Node.js 18+ installed
- ✅ Backend `.env` file configured with API keys

## Quick Start (3 Steps)

### Step 1: Start Backend Server

Open a terminal in the project root and run:

```powershell
# Navigate to backend
cd backend

# Activate virtual environment (if you have one)
# .\venv\Scripts\activate

# Start the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Backend is now running at:** `http://localhost:8000`

**API Documentation:** `http://localhost:8000/docs`

### Step 2: Start Frontend Development Server

Open a NEW terminal (keep backend running) and run:

```powershell
# Navigate to frontend
cd frontend

# Start the Vite development server
npm run dev
```

**Expected Output:**
```
  VITE v7.3.1  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Frontend is now running at:** `http://localhost:5173`

### Step 3: Open in Browser

Open your web browser and go to:

```
http://localhost:5173
```

You should see the Login page!

## First Time Setup

### Create Your First Account

1. Click "Register" or "Sign Up"
2. Fill in the registration form:
   - Name: Your Name
   - Email: your.email@example.com
   - Password: (at least 8 characters)
3. Click "Register"
4. You'll be redirected to the dashboard

### Login

If you already have an account:
1. Enter your email and password
2. Click "Login"
3. You'll be redirected to the dashboard

## Using the Application

### 1. Dashboard (Home Page)

After login, you'll see:
- **Stats Cards**: Total Sessions, Completed, Average Score, Improvement
- **Quick Actions**: Buttons to start interview, upload resume, view history
- **Recent Sessions**: Your last 5 interview sessions (if any)

### 2. Start an Interview

**Option A: From Dashboard**
- Click "Start Interview" button in Quick Actions

**Option B: From Navigation**
- Click "Interviews" in the sidebar/menu

**Steps:**
1. Enter the job role (e.g., "Software Engineer")
2. Select difficulty (Easy, Medium, Hard, Expert)
3. Choose number of questions (1-20)
4. Optionally select categories
5. Click "Start Interview"

### 3. During the Interview

You'll see:
- **Question Display**: Current question with category and difficulty
- **Timer**: Countdown timer for the question
- **Answer Input**: Text area to type your answer
- **Auto-Save**: Your answer is automatically saved as you type
- **Navigation**: "Submit Answer" button to move to next question

**Tips:**
- Answer is auto-saved every few seconds
- Timer shows remaining time
- You can take as long as you need (timer is informational)
- Click "Submit Answer" when ready

### 4. View Summary

After completing all questions:
- You'll automatically see the Performance Summary
- Shows:
  - Overall score
  - Score breakdown (Content Quality, Clarity, Confidence, Technical Accuracy)
  - Category performance
  - Top strengths
  - Areas to improve
  - Score trend (compared to previous sessions)

### 5. View Detailed Evaluation

From the summary page:
- Click "View Detailed Feedback" on any question
- See:
  - Detailed scores for all criteria
  - Strengths list
  - Areas for improvement
  - Suggestions
  - Example answer

### 6. Upload Resume

**Option A: From Dashboard**
- Click "Upload Resume" in Quick Actions

**Option B: From Navigation**
- Click "Resumes" → "Upload Resume"

**Steps:**
1. Drag & drop a PDF or DOCX file (or click to browse)
2. File must be under 10MB
3. Wait for upload to complete
4. View extracted information (skills, experience, education)

### 7. View Resume List

- Click "Resumes" in navigation
- See all your uploaded resumes
- Click on a resume to view details
- Delete resumes you no longer need

### 8. View Session History

**Option A: From Dashboard**
- Click "View History" in Quick Actions

**Option B: From Navigation**
- Click "Interviews" → "History"

**Features:**
- See all past interview sessions
- Filter by difficulty, status
- Search by role
- Sort by date
- Click eye icon to view summary

## Troubleshooting

### Backend Not Starting

**Problem:** Port 8000 already in use
```powershell
# Find and kill the process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Or use a different port
uvicorn app.main:app --reload --port 8001
```

**Problem:** Database connection error
```powershell
# Check if PostgreSQL is running
# Check backend/.env file has correct DATABASE_URL
```

**Problem:** Redis connection error
```powershell
# Start Redis (Windows)
cd redis-windows
.\start_redis.bat

# Or start Redis service
```

### Frontend Not Starting

**Problem:** Port 5173 already in use
```powershell
# Kill the process
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F

# Or Vite will automatically use next available port
```

**Problem:** Dependencies not installed
```powershell
cd frontend
npm install
```

### Cannot Login

**Problem:** User not found
- Make sure you registered first
- Check email spelling

**Problem:** Wrong password
- Use the password you set during registration
- Password is case-sensitive

**Problem:** Backend not responding
- Check backend terminal for errors
- Make sure backend is running on port 8000
- Check `http://localhost:8000/docs` is accessible

### API Errors

**Problem:** 401 Unauthorized
- Your session expired, login again
- Token might be invalid

**Problem:** 500 Internal Server Error
- Check backend terminal for error logs
- Database might not be running
- Check backend/.env configuration

## Useful URLs

### Development
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc

### API Endpoints
- **Login**: POST http://localhost:8000/api/v1/auth/login
- **Register**: POST http://localhost:8000/api/v1/auth/register
- **Create Interview**: POST http://localhost:8000/api/v1/interviews
- **Upload Resume**: POST http://localhost:8000/api/v1/resumes/upload

## Keyboard Shortcuts

### Frontend Development
- `Ctrl + C` - Stop the dev server
- `Ctrl + R` - Reload page
- `F12` - Open browser DevTools

### During Interview
- `Tab` - Navigate between fields
- `Enter` - Submit form (when focused on button)

## Tips for Best Experience

### Performance
1. Use Chrome or Edge for best performance
2. Close unnecessary browser tabs
3. Keep backend and frontend terminals open

### Development
1. Backend auto-reloads on code changes
2. Frontend hot-reloads on code changes
3. Check browser console (F12) for errors
4. Check terminal output for server errors

### Testing
1. Create a test account first
2. Try a short interview (1-2 questions) first
3. Upload a sample resume to test features
4. Check all pages work correctly

## Common Workflows

### Complete Interview Flow
1. Login → Dashboard
2. Click "Start Interview"
3. Fill in interview details
4. Answer questions one by one
5. View summary after completion
6. Click "View Detailed Feedback" for any question
7. Return to dashboard

### Resume Management Flow
1. Login → Dashboard
2. Click "Upload Resume"
3. Drag & drop your resume file
4. Wait for processing
5. View extracted information
6. Go to "Resumes" to see all resumes
7. Click on a resume to view full details

### Review Past Sessions
1. Login → Dashboard
2. Click "View History"
3. Filter/search for specific sessions
4. Click eye icon to view summary
5. Review performance and feedback

## Production Deployment

### Build Frontend for Production
```powershell
cd frontend
npm run build
```

This creates a `dist/` folder with optimized files.

### Serve Production Build
```powershell
# Preview production build locally
npm run preview

# Or deploy dist/ folder to your web server
```

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/interview_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key
GROQ_API_KEY=your-groq-key
HUGGINGFACE_API_KEY=your-huggingface-key
```

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Getting Help

### Check Logs
- **Backend**: Check terminal where uvicorn is running
- **Frontend**: Check browser console (F12)
- **Database**: Check PostgreSQL logs

### Common Issues
- Port conflicts → Change port or kill process
- Database errors → Check PostgreSQL is running
- API errors → Check backend logs
- UI errors → Check browser console

## Next Steps

Once everything is running:
1. ✅ Create your account
2. ✅ Complete your first interview
3. ✅ Upload your resume
4. ✅ Review your performance
5. ✅ Track your progress over time

Enjoy using Interview Master AI! 🎉
