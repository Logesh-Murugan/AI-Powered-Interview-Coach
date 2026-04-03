/**
 * App Routes
 * Main routing configuration
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../config/app.config';
import type { RootState } from '../store/index';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import PublicRoute from '../components/auth/PublicRoute';

// Layouts
import MainLayout from '../components/layouts/MainLayout';
import AuthLayout from '../components/layouts/AuthLayout';

// Pages
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import PasswordResetPage from '../pages/auth/PasswordResetPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProfilePage from '../pages/profile/ProfilePage';
import InterviewStartPage from '../pages/interview/InterviewStartPage';
import InterviewSessionPage from '../pages/interview/InterviewSessionPage';
import InterviewSummaryPage from '../pages/interview/InterviewSummaryPage';
import AnswerEvaluationPage from '../pages/interview/AnswerEvaluationPage';
import SessionHistoryPage from '../pages/interview/SessionHistoryPage';
import ResumeInterviewPage from '../pages/interview/ResumeInterviewPage';
import ResumeListPage from '../pages/resume/ResumeListPage';
import ResumeUploadPage from '../pages/resume/ResumeUploadPage';
import ResumeDetailPage from '../pages/resume/ResumeDetailPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';
import LeaderboardPage from '../pages/leaderboard/LeaderboardPage';
import AchievementsPage from '../pages/achievements/AchievementsPage';
import StreakPage from '../pages/streaks/StreakPage';
import SettingsPage from '../pages/settings/SettingsPage';
// Lazy load AI pages to prevent cache issues
import { lazy } from 'react';
const ResumeAnalysisPage = lazy(() => import('../pages/ai/ResumeAnalysisPage'));
const StudyPlansPage = lazy(() => import('../pages/ai/StudyPlansPage'));
const CompanyCoachingPage = lazy(() => import('../pages/ai/CompanyCoachingPage'));
const CacheStatsPage = lazy(() => import('../pages/admin/CacheStatsPage'));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
import NotFoundPage from '../pages/NotFoundPage';

// Landing Page Wrapper Component
function LandingPageWrapper() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  // Removed automatic redirect to dashboard to ensure landing page is always shown first as requested
  return <LandingPage />;
}


function AppRoutes() {
  return (
    <Routes>
      {/* Landing Page - Root Route */}
      <Route path="/" element={<LandingPageWrapper />} />

      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.PASSWORD_RESET} element={<PasswordResetPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path={ROUTES.INTERVIEWS} element={<InterviewStartPage />} />
          <Route path="/interviews/:sessionId/resume" element={<ResumeInterviewPage />} />
          <Route path={ROUTES.INTERVIEW_SESSION} element={<InterviewSessionPage />} />
          <Route path="/interviews/:id/summary" element={<InterviewSummaryPage />} />
          <Route path="/interviews/:sessionId/answers/:answerId/evaluation" element={<AnswerEvaluationPage />} />
          <Route path="/interviews/history" element={<SessionHistoryPage />} />
          <Route path={ROUTES.RESUMES} element={<ResumeListPage />} />
          <Route path={ROUTES.RESUME_UPLOAD} element={<ResumeUploadPage />} />
          <Route path="/resumes/:id" element={<ResumeDetailPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/streaks" element={<StreakPage />} />
          <Route path="/ai/resume-analysis/:resumeId" element={<ResumeAnalysisPage />} />
          <Route path="/ai/study-plans" element={<StudyPlansPage />} />
          <Route path="/ai/company-coaching" element={<CompanyCoachingPage />} />
          <Route path="/admin/cache-stats" element={<CacheStatsPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        </Route>
      </Route>

      {/* Not Found */}
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
    </Routes>
  );
}

export default AppRoutes;
