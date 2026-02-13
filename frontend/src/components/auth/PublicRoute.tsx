/**
 * Public Route Component
 * Redirects to dashboard if already authenticated
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { ROUTES } from '../../config/app.config';

function PublicRoute() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}

export default PublicRoute;
