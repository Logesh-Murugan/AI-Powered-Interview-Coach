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
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProfilePage from '../pages/profile/ProfilePage';
import InterviewStartPage from '../pages/interview/InterviewStartPage';
import InterviewSessionPage from '../pages/interview/InterviewSessionPage';
import InterviewSummaryPage from '../pages/interview/InterviewSummaryPage';
import AnswerEvaluationPage from '../pages/interview/AnswerEvaluationPage';
import SessionHistoryPage from '../pages/interview/SessionHistoryPage';
import ResumeListPage from '../pages/resume/ResumeListPage';
import ResumeUploadPage from '../pages/resume/ResumeUploadPage';
import ResumeDetailPage from '../pages/resume/ResumeDetailPage';
// import AnalyticsPage from '../pages/analytics/AnalyticsPage'; // Temporarily disabled
import NotFoundPage from '../pages/NotFoundPage';

// Landing Page Wrapper Component
function LandingPageWrapper() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  
  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  
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
        </Route>
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.INTERVIEWS} element={<InterviewStartPage />} />
          <Route path={ROUTES.INTERVIEW_SESSION} element={<InterviewSessionPage />} />
          <Route path="/interviews/:id/summary" element={<InterviewSummaryPage />} />
          <Route path="/interviews/:sessionId/answers/:answerId/evaluation" element={<AnswerEvaluationPage />} />
          <Route path="/interviews/history" element={<SessionHistoryPage />} />
          <Route path={ROUTES.RESUMES} element={<ResumeListPage />} />
          <Route path={ROUTES.RESUME_UPLOAD} element={<ResumeUploadPage />} />
          <Route path="/resumes/:id" element={<ResumeDetailPage />} />
          {/* Temporarily disabled - analytics component has export issue */}
          {/* <Route path="/analytics" element={<AnalyticsPage />} /> */}
        </Route>
      </Route>

      {/* Not Found */}
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
    </Routes>
  );
}

export default AppRoutes;
