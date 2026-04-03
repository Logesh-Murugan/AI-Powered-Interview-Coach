/**
 * Premium Login Page
 * High-end identity verification interface with secure access modules
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
  alpha,
  useTheme,
  Stack,
  CircularProgress,
} from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login, clearError } from '../../store/slices/authSlice';
import { ROUTES } from '../../config/app.config';
import { motion, AnimatePresence } from 'framer-motion';
import { GradientButton, GradientText } from '../../components/common/PremiumComponents';
import { Send, Lock } from '@mui/icons-material';

const MotionBox = motion.create(Box);

interface LoginFormData {
  email: string;
  password: string;
}

const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required('EMAIL IS REQUIRED')
    .email('INVALID EMAIL FORMAT'),
  password: yup
    .string()
    .required('PASSWORD IS REQUIRED')
    .min(8, 'MINIMUM 8 CHARACTERS'),

});

function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

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
    if (isAuthenticated) navigate(ROUTES.DASHBOARD, { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await dispatch(login(data)).unwrap();
    } catch (error) {}
  };

  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ textAlign: 'center', mb: 4 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'Orbitron', mb: 1 }}>WELCOME <GradientText>BACK</GradientText></Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
           SIGN IN TO YOUR ACCOUNT
        </Typography>
      </MotionBox>

      <AnimatePresence>
        {error && (
          <MotionBox initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} sx={{ overflow: 'hidden' }}>
            <Alert severity="error" sx={{ mb: 3, border: `1px solid ${theme.palette.error.main}66`, bgcolor: `${theme.palette.error.main}11`, fontWeight: 800 }} onClose={() => dispatch(clearError())}>
              {error.toUpperCase()}
            </Alert>
          </MotionBox>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3}>
           <Controller
             name="email"
             control={control}
             render={({ field }) => (
               <TextField
                 {...field}
                 fullWidth
                 label="EMAIL ADDRESS"
                 type="email"
                 placeholder="name@example.com"
                 error={!!errors.email}
                 helperText={errors.email?.message}
                 InputProps={{ 
                   sx: { borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.4) },
                   startAdornment: <Box sx={{ mr: 1, color: 'primary.main', opacity: 0.5 }}>@</Box>
                 }}
               />
             )}
           />

           <Controller
             name="password"
             control={control}
             render={({ field }) => (
               <TextField
                 {...field}
                 fullWidth
                 label="PASSWORD"
                 type="password"
                 placeholder="••••••••••••"
                 error={!!errors.password}
                 helperText={errors.password?.message}
                 InputProps={{ 
                   sx: { borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.4) },
                   startAdornment: <Lock sx={{ mr: 1, color: 'primary.main', opacity: 0.5, fontSize: 18 }} />
                 }}
               />
             )}
           />

           <Box sx={{ textAlign: 'right' }}>
              <Link component={RouterLink} to={ROUTES.PASSWORD_RESET} variant="caption" sx={{ textDecoration: 'none', fontWeight: 900, color: 'primary.main', '&:hover': { opacity: 0.8 } }}>
                KEY RECOVERY
              </Link>
           </Box>

           <GradientButton type="submit" fullWidth size="large" disabled={isLoading} sx={{ py: 2 }}>
              {isLoading ? <CircularProgress size={20} color="inherit" /> : 'SIGN IN'}
           </GradientButton>

           <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                DON'T HAVE AN ACCOUNT?{' '}
                <Link component={RouterLink} to={ROUTES.REGISTER} sx={{ color: 'primary.main', fontWeight: 900, textDecoration: 'none' }}>
                  CREATE ONE
                </Link>
              </Typography>
           </Box>
        </Stack>
      </form>
    </Box>
  );
}

export default LoginPage;
