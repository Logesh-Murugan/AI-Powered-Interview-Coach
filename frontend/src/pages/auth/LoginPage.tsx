/**
 * Login Page Component
 * User login form with validation
 */

import { useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login, clearError } from '../../store/slices/authSlice';
import { ROUTES } from '../../config/app.config';
import FadeIn from '../../components/animations/FadeIn';
import ScaleButton from '../../components/animations/ScaleButton';

interface LoginFormData {
  email: string;
  password: string;
}

const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    // Clear error when component unmounts
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await dispatch(login(data)).unwrap();
      navigate(ROUTES.DASHBOARD);
    } catch {
      // Error handled by Redux and displayed in UI
    }
  };

  return (
    <Box>
      <FadeIn delay={0.1}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Welcome Back
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Sign in to continue to InterviewMaster AI
        </Typography>
      </FadeIn>

      {error && (
        <FadeIn delay={0.2}>
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        </FadeIn>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <FadeIn delay={0.3}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Email"
                type="email"
                margin="normal"
                autoComplete="email"
                autoFocus
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />
        </FadeIn>

        <FadeIn delay={0.4}>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Password"
                type="password"
                margin="normal"
                autoComplete="current-password"
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            )}
          />
        </FadeIn>

        <FadeIn delay={0.5}>
          <Box sx={{ textAlign: 'right', mt: 1 }}>
            <Link
              component={RouterLink}
              to={ROUTES.PASSWORD_RESET}
              variant="body2"
              sx={{ textDecoration: 'none' }}
            >
              Forgot password?
            </Link>
          </Box>
        </FadeIn>

        <FadeIn delay={0.6}>
          <ScaleButton fullWidth>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </ScaleButton>
        </FadeIn>

        <FadeIn delay={0.7}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link component={RouterLink} to={ROUTES.REGISTER}>
                Sign up
              </Link>
            </Typography>
          </Box>
        </FadeIn>
      </form>
    </Box>
  );
}

export default LoginPage;
