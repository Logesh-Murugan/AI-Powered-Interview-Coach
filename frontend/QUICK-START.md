# Frontend Quick Start Guide

## Start Development Server

```bash
cd frontend
npm run dev
```

Server will start at: **http://localhost:5173**

## Test the Application

### 1. Open Browser
Navigate to: http://localhost:5173

### 2. You'll See
- Login page (if not authenticated)
- Dashboard (if authenticated)

### 3. Test Login
Since backend isn't running yet, you'll see connection errors. That's expected!

## Start Backend (Required for Full Functionality)

```bash
# In a new terminal
cd backend

# Start Redis
.\start_redis_windows.ps1

# Start PostgreSQL
Start-Service -Name postgresql-x64-18

# Start backend
uvicorn app.main:app --reload
```

Backend will start at: **http://localhost:8000**

## Full Stack Testing

With both frontend and backend running:

1. **Register**: http://localhost:5173/register
   - Enter name, email, password
   - Click "Sign Up"

2. **Login**: http://localhost:5173/login
   - Enter email and password
   - Click "Sign In"

3. **Dashboard**: http://localhost:5173/dashboard
   - View welcome message
   - See statistics cards
   - Test quick actions

4. **Profile**: http://localhost:5173/profile
   - View user information

5. **Logout**: Click "Logout" button

## Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   ├── config/          # Configuration
│   ├── pages/           # Page components
│   ├── routes/          # Routing
│   ├── services/        # API services
│   ├── store/           # Redux store
│   ├── theme/           # MUI theme
│   └── App.tsx          # Main app
├── .env                 # Environment variables
└── package.json         # Dependencies
```

## Environment Variables

Edit `.env` file:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=InterviewMaster AI
VITE_APP_VERSION=1.0.0
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
npx kill-port 5173
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### API Connection Error
- Make sure backend is running on port 8000
- Check `.env` file has correct `VITE_API_URL`
- Verify CORS is enabled in backend

## Next Steps

1. ✅ Frontend is running
2. ✅ Start backend
3. ✅ Test full authentication flow
4. ✅ Start building features!

## Documentation

- `FRONTEND-SETUP-COMPLETE.md` - Complete setup guide
- `TASK-004-COMPLETE.md` - Task completion details
- `README.md` - Project README

## Support

If you encounter issues:
1. Check console for errors
2. Verify backend is running
3. Check network tab in browser DevTools
4. Review error messages

Happy coding! 🚀
