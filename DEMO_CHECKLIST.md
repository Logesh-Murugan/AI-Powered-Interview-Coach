# Demo Checklist (Local Windows)

Use this before any live walkthrough to avoid “looks complete but fails in output.”

- Prep
  - Ensure PostgreSQL service `postgresql-x64-18` is running.
  - Ensure Redis service `Redis` is running.
  - Run `.\scripts\validate_release.ps1` (or `-Full` if time permits).
- Start stack
  - `.\scripts\start_demo.ps1`
  - Backend: http://127.0.0.1:8000/health shows healthy.
  - Frontend: http://127.0.0.1:5173 loads.
- Flow 1: Auth and profile
  - Register a new user, auto-activate via existing flow, login.
  - Open Profile page, update name and target role; verify success toast.
- Flow 2: Interview core
  - Start interview (role: SWE, difficulty: Medium, 1–3 questions).
  - Answer a question; confirm submit succeeds and session completes.
  - View session summary (scores present) and session history entry.
- Flow 3: Feedback & analytics
  - Open Analytics page; totals and charts load without errors.
  - Export sessions CSV; file downloads.
- Flow 4: Resume and agents
  - Upload a sample resume (PDF or DOCX); status shows completed.
  - Trigger Resume Analysis; verify sections render.
  - Generate Study Plan; confirm plan cards render.
  - Company Coaching: create session for a company; open its detail view.
- Flow 5: Gamification
  - Achievements page loads and lists earned/available badges.
  - Streaks page shows current streak, history, and stats.
  - Leaderboard page loads weekly leaderboard without errors.
- Wrap up
  - Logout works and redirects to login.
  - Stop stack: `.\scripts\stop_demo.ps1`

If any step fails, capture the screen and the failing endpoint (from browser network tab) so we can fix it before the next demo.
