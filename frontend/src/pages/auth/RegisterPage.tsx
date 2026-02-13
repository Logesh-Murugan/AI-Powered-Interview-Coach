/**
 * Register Page Component
 * User registration form with validation and password strength indicator
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
import { register as registerUser, clearError } from '../../store/slices/authSlice';
import { ROUTES } from '../../config/app.config';
import PasswordStrengthIndicator from '../../components/auth/PasswordStrengthIndicator';
import FadeIn from '../../components/animations/FadeIn';
import ScaleButton from '../../components/animations/ScaleButton';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const registerSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
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

function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  useEffect(() => {
    // Clear error when component unmounts
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await dispatch(registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      })).unwrap();
      navigate(ROUTES.DASHBOARD);
    } catch {
      // Error handled by Redux and displayed in UI
    }
  };

  return (
    <Box>
      <FadeIn delay={0.1}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Create Account
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Sign up to start your interview preparation journey
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
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Full Name"
                margin="normal"
                autoComplete="name"
                autoFocus
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />
        </FadeIn>

        <FadeIn delay={0.4}>
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
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />
        </FadeIn>

        <FadeIn delay={0.5}>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Box>
                <TextField
                  {...field}
                  fullWidth
                  label="Password"
                  type="password"
                  margin="normal"
                  autoComplete="new-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
                <PasswordStrengthIndicator password={password} />
              </Box>
            )}
          />
        </FadeIn>

        <FadeIn delay={0.6}>
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Confirm Password"
                type="password"
                margin="normal"
                autoComplete="new-password"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
              />
            )}
          />
        </FadeIn>

        <FadeIn delay={0.7}>
          <ScaleButton fullWidth>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
          </ScaleButton>
        </FadeIn>

        <FadeIn delay={0.8}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to={ROUTES.LOGIN}>
                Sign in
              </Link>
            </Typography>
          </Box>
        </FadeIn>
      </form>
    </Box>
  );
}

export default RegisterPage;
