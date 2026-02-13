/**
 * Protected Route Component
 * Requires authentication to access with token validation and refresh
 */

import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setCredentials, clearCredentials } from '../../store/slices/authSlice';
import { ROUTES } from '../../config/app.config';
import {
  isAuthenticated,
  validateAccessToken,
  refreshAccessToken,
  isTokenExpiringSoon,
  getCurrentUser,
} from '../../utils/auth';

function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const authState = useAppSelector((state) => state.auth);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateAndRefresh = async () => {
      setIsValidating(true);

      // Check if user is authenticated
      if (!isAuthenticated()) {
        dispatch(clearCredentials());
        setIsValid(false);
        setIsValidating(false);
        return;
      }

      // Check if access token is valid
      if (validateAccessToken()) {
        // Check if token is expiring soon and refresh proactively
        const accessToken = localStorage.getItem('access_token');
        if (accessToken && isTokenExpiringSoon(accessToken)) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            const user = getCurrentUser();
            const refreshToken = localStorage.getItem('refresh_token');
            if (user && refreshToken) {
              dispatch(setCredentials({
                user,
                accessToken: newToken,
                refreshToken,
              }));
            }
          }
        }
        setIsValid(true);
        setIsValidating(false);
        return;
      }

      // Access token expired, try to refresh
      const newToken = await refreshAccessToken();
      if (newToken) {
        const user = getCurrentUser();
        const refreshToken = localStorage.getItem('refresh_token');
        if (user && refreshToken) {
          dispatch(setCredentials({
            user,
            accessToken: newToken,
            refreshToken,
          }));
          setIsValid(true);
        } else {
          dispatch(clearCredentials());
          setIsValid(false);
        }
      } else {
        dispatch(clearCredentials());
        setIsValid(false);
      }

      setIsValidating(false);
    };

    validateAndRefresh();
  }, [dispatch, location.pathname]);

  // Show loading state during validation
  if (isValidating) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isValid || !authState.isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
