# 🚀 START HERE - Manual Testing Guide

## 👋 Welcome to Testing!

You're about to manually test the entire InterviewMaster AI platform. This guide will help you test all 18 major features systematically.

---

## 📚 Documents Created for You

I've created 5 documents to help you:

1. **START_HERE_TESTING.md** ← You are here!
2. **MANUAL_TESTING_GUIDE.md** - Complete step-by-step testing (60+ pages)
3. **TESTING_CHECKLIST.md** - Quick checklist to track progress
4. **QUICK_TROUBLESHOOTING.md** - Fast fixes for common issues
5. **START_TESTING.ps1** - PowerShell script to start all services

---

## 🎯 Quick Start (3 Steps)

### Step 1: Start All Services (2 minutes)

**Option A: Use the script (Recommended)**
```powershell
# Open PowerShell in project root
.\START_TESTING.ps1
```

**Option B: Manual start**
```powershell
# Terminal 1 - Redis
redis-server

# Terminal 2 - Backend
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3 - Frontend
cd frontend
npm run dev
```

### Step 2: Verify Services (1 minute)

Open these URLs in your browser:
- ✅ Frontend: http://localhost:5173 (should show landing page)
- ✅ Backend: http://localhost:8000/health (should show "healthy")
- ✅ API Docs: http://localhost:8000/docs (should show Swagger UI)

### Step 3: Start Testing (1-2 hours)

Open **MANUAL_TESTING_GUIDE.md** and follow the tests in order.

---

## 📋 What You'll Test

### Phase 1: Core Features (30 minutes)
1. User registration and login
2. Dashboard navigation
3. Interview session flow (create → questions → answers → evaluation)
4. Resume upload and analysis
5. Analytics dashboard with charts
6. Achievements system
7. Streak tracking
8. Leaderboard

### Phase 2: Advanced Features (20 minutes)
9. Study plan generator (AI)
10. Company coaching (AI)
11. Session history
12. Profile management
13. Data export (CSV)
14. Cache performance

### Phase 3: Error Handling (10 minutes)
15. Form validation
16. Network errors
17. Authentication errors

### Phase 4: Responsive Design (5 minutes)
18. Mobile view testing

### Phase 5: Performance (5 minutes)
19. Load times
20. API response times

---

## ✅ Testing Checklist

Use **TESTING_CHECKLIST.md** to track your progress:

- [ ] Pre-testing setup complete
- [ ] Core features tested (8 tests)
- [ ] Advanced features tested (6 tests)
- [ ] Error handling tested (3 tests)
- [ ] Responsive design tested (1 test)
- [ ] Performance tested (2 tests)

---

## 🎯 Expected Results

### All Features Should Work 100%

Based on the project analysis:
- ✅ 84%+ test coverage
- ✅ 50+ automated tests passing
- ✅ 18 major features implemented
- ✅ 50+ API endpoints functional
- ✅ Production-ready code

### What "Working" Means

For each feature:
1. No errors in browser console (F12)
2. No errors in backend terminal
3. Expected behavior matches actual behavior
4. Data persists after page refresh
5. UI is responsive and smooth

---

## 🐛 If You Find Issues

### Document the Bug

Use this template in **TESTING_CHECKLIST.md**:

```
Bug: [Short description]
Severity: Critical / High / Medium / Low
Steps to Reproduce: [1, 2, 3...]
Expected: [What should happen]
Actual: [What actually happens]
Console Errors: [Copy from F12]
```

### Quick Fixes

Check **QUICK_TROUBLESHOOTING.md** for:
- Backend won't start → Solutions
- Frontend won't start → Solutions
- Database errors → Solutions
- Redis errors → Solutions
- White page → Solutions
- AI errors → Solutions

---

## 📊 Testing Timeline

| Phase | Duration | Tests |
|-------|----------|-------|
| Setup | 5 min | Start services |
| Core Features | 30 min | 8 tests |
| Advanced Features | 20 min | 6 tests |
| Error Handling | 10 min | 3 tests |
| Responsive Design | 5 min | 1 test |
| Performance | 5 min | 2 tests |
| **Total** | **~75 min** | **20 tests** |

---

## 🎓 Testing Tips

### Tip 1: Test in Order
Follow the guide sequentially. Some tests depend on previous ones (e.g., need to register before login).

### Tip 2: Keep Console Open
Press F12 to open browser DevTools. Watch for errors in the Console tab.

### Tip 3: Check Both Terminals
Monitor backend and frontend terminals for error messages.

### Tip 4: Hard Refresh Often
Use Ctrl+Shift+R to clear cache and reload fresh.

### Tip 5: Take Notes
Use TESTING_CHECKLIST.md to track what works and what doesn't.

---

## 🔧 Common Issues & Quick Fixes

### Issue: Services won't start
```bash
# Check prerequisites
python --version  # 3.11+
node --version    # 18+
# Check PostgreSQL and Redis are running
```

### Issue: White page
```bash
# Hard refresh
Ctrl + Shift + R
# Check backend is running
curl http://localhost:8000/health
```

### Issue: API errors
```bash
# Check .env files exist
ls backend/.env
ls frontend/.env
# Verify API keys are set
```

---

## 📞 Need Help?

| Issue | Check |
|-------|-------|
| Can't start services | QUICK_TROUBLESHOOTING.md |
| Don't know what to test | MANUAL_TESTING_GUIDE.md |
| Want quick checklist | TESTING_CHECKLIST.md |
| Found a bug | Document in TESTING_CHECKLIST.md |
| Services keep crashing | QUICK_TROUBLESHOOTING.md → Reset Everything |

---

## 🎉 Success Criteria

Testing is complete when:

- ✅ All 20 test categories pass
- ✅ No critical bugs found
- ✅ All core features working
- ✅ Analytics charts rendering
- ✅ AI features responding
- ✅ No console errors
- ✅ Data persists correctly
- ✅ Responsive on mobile
- ✅ Performance is acceptable

---

## 🚀 Ready to Start?

### Recommended Path

1. **Read this file** (5 minutes) ← You're here!
2. **Run START_TESTING.ps1** (2 minutes)
3. **Verify services** (1 minute)
4. **Open MANUAL_TESTING_GUIDE.md** (start testing)
5. **Use TESTING_CHECKLIST.md** (track progress)
6. **Refer to QUICK_TROUBLESHOOTING.md** (if issues)

### Fast Path

1. Run: `.\START_TESTING.ps1`
2. Open: `TESTING_CHECKLIST.md`
3. Test each checkbox
4. Document any issues

---

## 📝 After Testing

Once testing is complete:

1. Review TESTING_CHECKLIST.md
2. Count passed vs failed tests
3. Prioritize any bugs found
4. Document overall status
5. Decide if production-ready

---

## 💡 Pro Tips

1. **Test with real data** - Create actual interview sessions, upload real resumes
2. **Test edge cases** - Try invalid inputs, empty forms, long text
3. **Test on different browsers** - Chrome, Firefox, Edge
4. **Test mobile view** - Use F12 → Ctrl+Shift+M
5. **Test performance** - Check load times in Network tab

---

## 🎊 Let's Begin!

You're ready to test the entire platform!

**Next Step**: Run `.\START_TESTING.ps1` to start all services.

Good luck! 🚀

---

**Questions?** All answers are in the documentation files.

**Stuck?** Check QUICK_TROUBLESHOOTING.md.

**Found bugs?** Document in TESTING_CHECKLIST.md.
