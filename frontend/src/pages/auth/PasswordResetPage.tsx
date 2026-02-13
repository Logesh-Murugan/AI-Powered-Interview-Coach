/**
 * Password Reset Page Component
 * Handles both password reset request and password reset with token
 */

import { useState } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material';
import { apiService } from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api.config';
import { ROUTES } from '../../config/app.config';
import PasswordStrengthIndicator from '../../components/auth/PasswordStrengthIndicator';

interface ResetRequestFormData {
  email: string;
}

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const resetRequestSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
});

const resetPasswordSchema = yup.object().shape({
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

function PasswordResetPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form for password reset request
  const {
    control: requestControl,
    handleSubmit: handleRequestSubmit,
    formState: { errors: requestErrors },
  } = useForm<ResetRequestFormData>({
    resolver: yupResolver(resetRequestSchema),
    defaultValues: {
      email: '',
    },
  });

  // Form for password reset with token
  const {
    control: resetControl,
    handleSubmit: handleResetSubmit,
    watch,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onRequestSubmit = async (data: ResetRequestFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiService.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST, data);
      setSuccess('If the email exists, a password reset link has been sent. Please check your inbox.');
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiService.post(API_ENDPOINTS.AUTH.PASSWORD_RESET, {
        token,
        new_password: data.password,
      });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate(ROUTES.LOGIN);
      }, 2000);
    } catch {
      setError('Failed to reset password. The link may be invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show password reset form if token is present
  if (token) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Reset Password
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Enter your new password below
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleResetSubmit(onResetSubmit)}>
          <Controller
            name="password"
            control={resetControl}
            render={({ field }) => (
              <Box>
                <TextField
                  {...field}
                  fullWidth
                  label="New Password"
                  type="password"
                  margin="normal"
                  autoComplete="new-password"
                  autoFocus
                  error={!!resetErrors.password}
                  helperText={resetErrors.password?.message}
                />
                <PasswordStrengthIndicator password={password} />
              </Box>
            )}
          />

          <Controller
            name="confirmPassword"
            control={resetControl}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Confirm New Password"
                type="password"
                margin="normal"
                autoComplete="new-password"
                error={!!resetErrors.confirmPassword}
                helperText={resetErrors.confirmPassword?.message}
              />
            )}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading || !!success}
            sx={{ mt: 3, mb: 2 }}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Reset Password'}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Remember your password?{' '}
              <Link component={RouterLink} to={ROUTES.LOGIN}>
                Sign in
              </Link>
            </Typography>
          </Box>
        </form>
      </Box>
    );
  }

  // Show password reset request form
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Reset Password
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Enter your email address and we'll send you a link to reset your password
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleRequestSubmit(onRequestSubmit)}>
        <Controller
          name="email"
          control={requestControl}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              autoComplete="email"
              autoFocus
              error={!!requestErrors.email}
              helperText={requestErrors.email?.message}
            />
          )}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isLoading || !!success}
          sx={{ mt: 3, mb: 2 }}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Send Reset Link'}
        </Button>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2">
            Remember your password?{' '}
            <Link component={RouterLink} to={ROUTES.LOGIN}>
              Sign in
            </Link>
          </Typography>
        </Box>
      </form>
    </Box>
  );
}

export default PasswordResetPage;
