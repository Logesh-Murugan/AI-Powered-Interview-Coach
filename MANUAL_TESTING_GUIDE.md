# 🧪 Manual Testing Guide - InterviewMaster AI
    
## 📋 Pre-Testing Checklist

Before you start testing, ensure all services are running:

### ✅ Step 1: Check Prerequisites

```bash
# Check PostgreSQL is running
# Windows: Check Services (Win + R → services.msc)
# Look for: postgresql-x64-18

# Check Redis is running
# Windows: Check if Redis process is running in Task Manager
```

### ✅ Step 2: Verify Environment Configuration

**Backend (.env file is already configured)**:
- ✅ Database URL configured
- ✅ Redis configured
- ✅ HuggingFace API keys (3 keys)
- ✅ Email service (Gmail SMTP)
- ✅ CORS origins set

**Frontend (.env file)**:
```bash
cd Ai_powered_interview_coach/frontend
# Check if .env exists, if not create it:
echo VITE_API_URL=http://localhost:8000/api/v1 > .env
```

---

## 🚀 Step-by-Step Testing Process

### Phase 1: Start All Services (5 minutes)

#### 1.1 Start PostgreSQL
```bash
# Windows: Should already be running as a service
# Verify: Open pgAdmin or check services
```

#### 1.2 Start Redis
```bash
# Open PowerShell Terminal 1
cd Ai_powered_interview_coach
# If you have Redis installed, start it
redis-server
# Or use the Windows Redis version if available
```

#### 1.3 Start Backend
```bash
# Open PowerShell Terminal 2
cd Ai_powered_interview_coach/backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

#### 1.4 Start Frontend
```bash
# Open PowerShell Terminal 3
cd Ai_powered_interview_coach/frontend
npm run dev
```

**Expected Output**:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```


---

## 🧪 Phase 2: Test Core Features (30 minutes)

### Test 1: Health Check (1 minute)

**Backend Health**:
1. Open browser: `http://localhost:8000/health`
2. ✅ Should see: `{"status": "healthy", "database": "connected", "cache": "connected"}`

**API Documentation**:
1. Open browser: `http://localhost:8000/docs`
2. ✅ Should see: Swagger UI with all endpoints

**Frontend**:
1. Open browser: `http://localhost:5173`
2. ✅ Should see: Landing page with hero section

---

### Test 2: User Registration & Authentication (5 minutes)

#### 2.1 Register New User
1. Go to: `http://localhost:5173`
2. Click "Get Started" or "Sign Up"
3. Fill in registration form:
   - Email: `test@example.com`
   - Password: `Test123!@#`
   - Full Name: `Test User`
4. Click "Register"
5. ✅ Should redirect to dashboard
6. ✅ Should see welcome message

#### 2.2 Logout
1. Click user menu (top right)
2. Click "Logout"
3. ✅ Should redirect to login page

#### 2.3 Login
1. Enter credentials:
   - Email: `test@example.com`
   - Password: `Test123!@#`
2. Click "Login"
3. ✅ Should redirect to dashboard
4. ✅ Should see user name in header

#### 2.4 Password Reset (Optional)
1. Logout
2. Click "Forgot Password?"
3. Enter email: `test@example.com`
4. Click "Send Reset Link"
5. ✅ Check terminal for email log (if EMAIL_ENABLED=False)
6. ✅ Or check email inbox (if EMAIL_ENABLED=True)

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---

### Test 3: Dashboard & Navigation (3 minutes)


#### 3.1 Dashboard Quick Actions
1. Go to: `http://localhost:5173/dashboard`
2. ✅ Should see 7 quick action buttons:
   - Start Interview (primary, filled)
   - Upload Resume (secondary, outlined)
   - View History (primary, outlined)
   - View Resumes (info, outlined)
   - Analytics (success, outlined)
   - Leaderboard (warning, outlined)
   - Achievements (secondary, outlined)

#### 3.2 Navigation Menu
1. Check sidebar/navigation menu
2. ✅ Should see links to:
   - Dashboard
   - Interview
   - Analytics
   - Achievements
   - Leaderboard
   - Profile
   - Settings

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---

### Test 4: Interview Session Flow (10 minutes)

#### 4.1 Create Interview Session
1. Click "Start Interview" button
2. Fill in interview details:
   - Role: `Software Engineer`
   - Difficulty: `Medium`
   - Experience Level: `Mid-Level`
   - Number of Questions: `3`
3. Click "Start Interview"
4. ✅ Should redirect to interview page
5. ✅ Should see first question

#### 4.2 Answer Questions
1. Read the question
2. Type answer in text area (at least 50 words)
3. ✅ Should see character count
4. ✅ Should see timer running
5. Click "Submit Answer"
6. ✅ Should see "Answer submitted successfully"
7. ✅ Should load next question

#### 4.3 Draft Auto-Save (Optional)
1. Start typing an answer
2. Wait 3 seconds
3. ✅ Should see "Draft saved" indicator
4. Refresh page
5. ✅ Draft should be restored

#### 4.4 Complete Interview
1. Answer all 3 questions
2. After last question, click "Complete Interview"
3. ✅ Should redirect to session summary page
4. ✅ Should see:
   - Overall score
   - Performance breakdown
   - Strengths and weaknesses
   - Recommendations

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---


### Test 5: Resume Upload & Analysis (5 minutes)

#### 5.1 Upload Resume
1. Go to dashboard
2. Click "Upload Resume" button
3. Select a resume file (PDF, DOCX, or TXT)
4. Click "Upload"
5. ✅ Should see upload progress
6. ✅ Should see success message
7. ✅ Should see resume in list

#### 5.2 View Resume Analysis
1. Click "Analyze" button on uploaded resume
2. Wait for AI analysis (10-30 seconds)
3. ✅ Should see analysis results:
   - Extracted skills
   - Experience level
   - Strengths
   - Improvement suggestions
   - ATS compatibility score

#### 5.3 Delete Resume (Optional)
1. Click "Delete" button on resume
2. Confirm deletion
3. ✅ Resume should be removed from list

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---

### Test 6: Analytics Dashboard (5 minutes)

#### 6.1 View Analytics
1. Go to: `http://localhost:5173/analytics`
2. ✅ Should see:
   - Performance overview cards (total sessions, avg score, etc.)
   - Score trend chart (line chart)
   - Category performance chart (bar chart)
   - Strengths and weaknesses cards
   - Practice recommendations

#### 6.2 Check Charts
1. ✅ Line chart should show score trends over time
2. ✅ Bar chart should show category performance
3. ✅ Hover over charts to see tooltips
4. ✅ No white page or errors

#### 6.3 Performance Comparison
1. Scroll to "Performance Comparison" section
2. ✅ Should see comparison with cohort average
3. ✅ Should see percentile ranking

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---

### Test 7: Achievements System (3 minutes)

#### 7.1 View Achievements
1. Go to: `http://localhost:5173/achievements`
2. ✅ Should see:
   - Achievement statistics (unlocked count, points, completion %)
   - Progress bar
   - Achievement cards grid


#### 7.2 Check Achievement Cards
1. ✅ Locked achievements should be grayed out
2. ✅ Unlocked achievements should be colored
3. ✅ Each card should show:
   - Achievement name
   - Description
   - Points
   - Category chip
   - Lock/unlock icon

#### 7.3 Unlock Achievement
1. Complete actions to unlock achievements:
   - Complete 1 interview → "First Steps" achievement
   - Complete 3 interviews → "Getting Started" achievement
2. ✅ Achievement should unlock automatically
3. ✅ Should see confetti animation (optional)

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---

### Test 8: Streak Tracking (2 minutes)

#### 8.1 View Current Streak
1. Go to dashboard or streaks page
2. ✅ Should see current streak counter
3. ✅ Should see longest streak
4. ✅ Should see streak calendar/history

#### 8.2 Maintain Streak
1. Complete an interview today
2. ✅ Streak should increment by 1
3. Come back tomorrow and complete another
4. ✅ Streak should continue

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---

### Test 9: Leaderboard (3 minutes)

#### 9.1 View Leaderboard
1. Go to: `http://localhost:5173/leaderboard`
2. ✅ Should see:
   - Weekly/All-time tabs
   - Opt-in/opt-out toggle
   - Leaderboard table

#### 9.2 Opt-In to Leaderboard
1. Toggle "Participate in Leaderboard" to ON
2. ✅ Should see your rank in the table
3. ✅ Should see trophy icons for top 3

#### 9.3 Switch Tabs
1. Click "Weekly" tab
2. ✅ Should show weekly rankings
3. Click "All-time" tab
4. ✅ Should show all-time rankings

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---


## 🎓 Phase 3: Test Advanced Features (20 minutes)

### Test 10: Study Plan Generator (5 minutes)

#### 10.1 Generate Study Plan
1. Go to dashboard or AI features section
2. Click "Generate Study Plan"
3. Wait for AI generation (10-30 seconds)
4. ✅ Should see personalized study plan:
   - Weekly structure
   - Topic recommendations
   - Resource suggestions
   - Based on your performance

#### 10.2 View Study Plan Details
1. ✅ Should see breakdown by week
2. ✅ Should see specific topics to study
3. ✅ Should see time estimates
4. ✅ Should see progress tracking

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---

### Test 11: Company Coaching (5 minutes)

#### 11.1 Start Coaching Session
1. Go to AI features or company coaching page
2. Enter company name: `Google` or `Microsoft`
3. Enter role: `Software Engineer`
4. Click "Get Coaching"
5. Wait for AI response (10-30 seconds)

#### 11.2 View Coaching Results
1. ✅ Should see:
   - Company culture insights
   - Interview process overview
   - Common interview questions
   - Role-specific guidance
   - Preparation tips

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---

### Test 12: Session History (3 minutes)

#### 12.1 View History
1. Go to dashboard
2. Click "View History" button
3. ✅ Should see list of all completed interviews
4. ✅ Each entry should show:
   - Date and time
   - Role
   - Score
   - Number of questions

#### 12.2 View Session Details
1. Click on a session from history
2. ✅ Should see full session details:
   - All questions asked
   - Your answers
   - Evaluations
   - Scores
   - Feedback

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---


### Test 13: Profile Management (3 minutes)

#### 13.1 View Profile
1. Go to: `http://localhost:5173/profile`
2. ✅ Should see current profile information:
   - Full name
   - Email
   - Join date
   - Statistics

#### 13.2 Update Profile
1. Click "Edit Profile"
2. Change full name to: `Test User Updated`
3. Click "Save"
4. ✅ Should see success message
5. ✅ Name should update in header

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---

### Test 14: Data Export (2 minutes)

#### 14.1 Export Session Data
1. Go to analytics or settings page
2. Click "Export Data" or "Download CSV"
3. ✅ Should download CSV file
4. Open CSV file
5. ✅ Should contain session data with columns:
   - Session ID
   - Date
   - Role
   - Score
   - Questions
   - Answers

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---

### Test 15: Cache Performance (2 minutes)

#### 15.1 Check Cache Metrics
1. Go to: `http://localhost:8000/cache/metrics`
2. ✅ Should see JSON response with:
   - Total requests
   - Cache hits
   - Cache misses
   - Hit rate percentage

#### 15.2 Test Caching
1. Create an interview session
2. Get first question (should cache)
3. Refresh page
4. Get same question again (should hit cache)
5. ✅ Response should be faster second time

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---

## 🔍 Phase 4: Error Handling & Edge Cases (10 minutes)

### Test 16: Form Validation

#### 16.1 Registration Validation
1. Try to register with:
   - Invalid email: `notanemail`
   - ✅ Should show error: "Invalid email format"
   - Short password: `123`
   - ✅ Should show error: "Password too short"
   - Empty fields
   - ✅ Should show error: "Required field"


#### 16.2 Interview Form Validation
1. Try to create interview with:
   - Empty role field
   - ✅ Should show error
   - Invalid number of questions (0 or 100)
   - ✅ Should show error or limit

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---

### Test 17: Network Error Handling

#### 17.1 Backend Down
1. Stop backend server (Ctrl+C in backend terminal)
2. Try to login or create interview
3. ✅ Should show error message: "Unable to connect to server"
4. ✅ Should not crash the app
5. Restart backend
6. ✅ App should recover automatically

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---

### Test 18: Authentication Errors

#### 18.1 Invalid Login
1. Try to login with wrong password
2. ✅ Should show error: "Invalid credentials"

#### 18.2 Duplicate Registration
1. Try to register with existing email
2. ✅ Should show error: "Email already registered"

#### 18.3 Token Expiration
1. Login and wait 15+ minutes (or modify token expiry)
2. Try to make an API call
3. ✅ Should auto-refresh token or redirect to login

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---

## 📱 Phase 5: Responsive Design (5 minutes)

### Test 19: Mobile View

#### 19.1 Resize Browser
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device (iPhone, Android)
4. ✅ Navigation should collapse to hamburger menu
5. ✅ Cards should stack vertically
6. ✅ Charts should be responsive
7. ✅ Forms should be usable

#### 19.2 Test Key Pages on Mobile
1. Dashboard: ✅ PASS / ❌ FAIL
2. Interview: ✅ PASS / ❌ FAIL
3. Analytics: ✅ PASS / ❌ FAIL
4. Achievements: ✅ PASS / ❌ FAIL

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---


## 🎯 Phase 6: Performance Testing (5 minutes)

### Test 20: Load Time

#### 20.1 Page Load Times
1. Open browser DevTools → Network tab
2. Hard refresh (Ctrl+Shift+R)
3. Check load times:
   - Landing page: ✅ < 2 seconds
   - Dashboard: ✅ < 3 seconds
   - Analytics: ✅ < 3 seconds

#### 20.2 API Response Times
1. Check Network tab for API calls
2. ✅ Most endpoints should respond < 500ms
3. ✅ AI endpoints (evaluation, analysis) may take 5-30 seconds

**Test Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________

---

## 📊 Testing Summary Checklist

### Core Features (Must Pass)
- [ ] User Registration & Login
- [ ] Interview Session Creation
- [ ] Question Display
- [ ] Answer Submission
- [ ] AI Evaluation
- [ ] Session Summary
- [ ] Dashboard Navigation

### Analytics & Gamification (Must Pass)
- [ ] Analytics Dashboard
- [ ] Charts Rendering
- [ ] Achievements Display
- [ ] Streak Tracking
- [ ] Leaderboard

### Advanced Features (Should Pass)
- [ ] Resume Upload
- [ ] Resume Analysis
- [ ] Study Plan Generation
- [ ] Company Coaching
- [ ] Session History
- [ ] Profile Management
- [ ] Data Export

### Technical (Should Pass)
- [ ] Form Validation
- [ ] Error Handling
- [ ] Responsive Design
- [ ] Performance
- [ ] Cache Functionality

---

## 🐛 Bug Reporting Template

If you find any issues, document them using this template:

```
**Bug Title**: [Short description]

**Severity**: Critical / High / Medium / Low

**Steps to Reproduce**:
1. Go to...
2. Click on...
3. Enter...
4. See error

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Screenshots**:
[Attach if applicable]

**Browser Console Errors**:
[Copy any errors from F12 console]

**Environment**:
- Browser: Chrome/Firefox/Edge
- OS: Windows 11
- Backend: Running/Not Running
- Frontend: Running/Not Running
```

---


## 🔧 Troubleshooting Common Issues

### Issue 1: Backend Won't Start

**Symptoms**: Error when running `uvicorn app.main:app --reload`

**Solutions**:
```bash
# Check if virtual environment is activated
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt

# Check database connection
# Verify PostgreSQL is running
# Check DATABASE_URL in .env

# Check Redis connection
# Verify Redis is running
```

---

### Issue 2: Frontend Won't Start

**Symptoms**: Error when running `npm run dev`

**Solutions**:
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Clear cache
npm cache clean --force

# Check Node version
node --version  # Should be 18+
```

---

### Issue 3: Database Connection Error

**Symptoms**: "Database health check failed"

**Solutions**:
1. Check PostgreSQL service is running
2. Verify DATABASE_URL in .env
3. Check password encoding (@ symbol should be %40)
4. Run: `python create_database.py`
5. Run: `alembic upgrade head`

---

### Issue 4: Redis Connection Error

**Symptoms**: "Cache unavailable"

**Solutions**:
1. Start Redis server: `redis-server`
2. Check REDIS_HOST and REDIS_PORT in .env
3. Test connection: `redis-cli ping` (should return PONG)

---

### Issue 5: AI API Errors

**Symptoms**: "AI provider error" or evaluation fails

**Solutions**:
1. Check HuggingFace API keys in .env
2. Verify keys are valid (not expired)
3. Check API quota/rate limits
4. Circuit breaker will auto-retry with backup keys

---

### Issue 6: White Page / Blank Screen

**Symptoms**: Page loads but shows nothing

**Solutions**:
1. Hard refresh: `Ctrl + Shift + R`
2. Clear browser cache
3. Check browser console (F12) for errors
4. Check if backend is running
5. Verify VITE_API_URL in frontend/.env

---

### Issue 7: Charts Not Rendering

**Symptoms**: Analytics page shows no charts

**Solutions**:
1. Complete at least 1 interview session (need data)
2. Hard refresh page
3. Check browser console for errors
4. Verify Recharts is installed: `npm list recharts`

---


## 📝 Quick Start Commands Reference

### Start Everything (3 Terminals)

**Terminal 1 - Redis**:
```bash
redis-server
```

**Terminal 2 - Backend**:
```bash
cd Ai_powered_interview_coach/backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 3 - Frontend**:
```bash
cd Ai_powered_interview_coach/frontend
npm run dev
```

### Access URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Cache Metrics**: http://localhost:8000/cache/metrics

### Stop Everything

1. Press `Ctrl + C` in each terminal
2. Or close terminal windows

---

## ✅ Final Testing Checklist

Before marking testing complete, ensure:

### Functionality
- [ ] All 20 tests passed
- [ ] No critical bugs found
- [ ] All core features working
- [ ] AI features responding correctly
- [ ] Data persists after refresh

### Performance
- [ ] Pages load quickly (< 3 seconds)
- [ ] No memory leaks
- [ ] Smooth animations
- [ ] Charts render properly

### User Experience
- [ ] Navigation is intuitive
- [ ] Forms are easy to use
- [ ] Error messages are clear
- [ ] Success feedback is visible
- [ ] Responsive on mobile

### Technical
- [ ] No console errors
- [ ] API calls succeed
- [ ] Database queries work
- [ ] Cache is functioning
- [ ] Email service works (if enabled)

---

## 🎉 Testing Complete!

Once all tests pass, you have verified:

✅ **18 major features** are working correctly
✅ **50+ API endpoints** are functional
✅ **20 database models** are properly configured
✅ **Frontend and backend** are communicating
✅ **AI integration** is working with failover
✅ **Caching system** is operational
✅ **Authentication** is secure
✅ **Analytics** are calculating correctly
✅ **Gamification** features are engaging

**Your InterviewMaster AI platform is production-ready!** 🚀

---

**Testing Duration**: ~1-2 hours for complete manual testing
**Last Updated**: March 12, 2026
**Version**: 1.0