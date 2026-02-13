# Quick Start Guide 🚀

**Get Interview Master AI running in 2 minutes!**

## Option 1: Automatic Start (Recommended)

Just run this one command from the project root:

```powershell
.\START-APPLICATION.ps1
```

This will:
- ✅ Check prerequisites (PostgreSQL, Redis)
- ✅ Start backend server (port 8000)
- ✅ Start frontend server (port 5173)
- ✅ Open browser automatically

## Option 2: Manual Start

### Terminal 1 - Backend
```powershell
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend
```powershell
cd frontend
npm run dev
```

### Open Browser
Go to: `http://localhost:5173`

## First Time Use

1. **Register Account**
   - Click "Register" or "Sign Up"
   - Enter your name, email, and password
   - Click "Register"

2. **Start Interview**
   - Click "Start Interview" button
   - Enter job role (e.g., "Software Engineer")
   - Select difficulty and question count
   - Click "Start Interview"

3. **Answer Questions**
   - Read the question
   - Type your answer
   - Click "Submit Answer"
   - Repeat for all questions

4. **View Results**
   - See your performance summary
   - Check detailed scores
   - Review feedback and suggestions

## URLs

- **Application**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Troubleshooting

### Backend won't start?
- Check PostgreSQL is running (port 5432)
- Check Redis is running (port 6379)
- Check `backend/.env` file exists

### Frontend won't start?
```powershell
cd frontend
npm install
npm run dev
```

### Can't login?
- Make sure backend is running
- Register a new account first
- Check email/password spelling

## Need More Help?

See detailed guide: `HOW-TO-RUN-APPLICATION.md`

## Features Available

✅ User Authentication (Login/Register)  
✅ Interview Sessions (Create, Answer, Complete)  
✅ Performance Evaluation (AI-powered feedback)  
✅ Resume Upload & Management  
✅ Session History & Analytics  
✅ Dashboard with Stats  

Enjoy! 🎉
