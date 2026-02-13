/**
 * App Routes
 * Main routing configuration
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../config/app.config';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import PublicRoute from '../components/auth/PublicRoute';

// Layouts
import MainLayout from '../components/layouts/MainLayout';
import AuthLayout from '../components/layouts/AuthLayout';

// Pages
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
import NotFoundPage from '../pages/NotFoundPage';

function AppRoutes() {
  return (
    <Routes>
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
        </Route>
      </Route>

      {/* Redirects */}
      <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
    </Routes>
  );
}

export default AppRoutes;
