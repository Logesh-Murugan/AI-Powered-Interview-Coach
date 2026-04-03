/**
 * Premium Register Page
 * High-end identity initialization interface with secure onboarding modules
 */

import { useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  TextField,
  Typography,
  Link,
  Alert,
  alpha,
  useTheme,
  Stack,
  CircularProgress,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { register as registerUser, clearError, resetRegistrationSuccess } from '../../store/slices/authSlice';
import { ROUTES } from '../../config/app.config';
import PasswordStrengthIndicator from '../../components/auth/PasswordStrengthIndicator';
import { motion, AnimatePresence } from 'framer-motion';
import { GradientButton, GradientText } from '../../components/common/PremiumComponents';
import { Person, Email, Lock, Shield } from '@mui/icons-material';

const MotionBox = motion.create(Box);

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const registerSchema = yup.object().shape({
  name: yup
    .string()
    .required('FULL NAME IS REQUIRED')
    .min(2, 'MINIMUM 2 CHARACTERS'),
  email: yup
    .string()
    .required('EMAIL IS REQUIRED')
    .email('INVALID EMAIL FORMAT'),
  password: yup
    .string()
    .required('PASSWORD IS REQUIRED')
    .min(8, 'MINIMUM 8 CHARACTERS')
    .matches(/[A-Z]/, 'UPPERCASE LETTER REQUIRED')
    .matches(/[0-9]/, 'NUMBER REQUIRED'),
  confirmPassword: yup
    .string()
    .required('CONFIRM PASSWORD IS REQUIRED')
    .oneOf([yup.ref('password')], 'PASSWORDS MUST MATCH'),

});

function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { isLoading, error, isAuthenticated, registrationSuccess } = useAppSelector((state) => state.auth);

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
    if (isAuthenticated) navigate(ROUTES.DASHBOARD, { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => { 
      dispatch(clearError()); 
      dispatch(resetRegistrationSuccess());
    };
  }, [dispatch]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await dispatch(registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      })).unwrap();
    } catch (error) {}
  };

  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ textAlign: 'center', mb: 4 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'Orbitron', mb: 1 }}>CREATE <GradientText>ACCOUNT</GradientText></Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
           JOIN INTERVIEWMASTER TODAY
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

      {registrationSuccess ? (
        <MotionBox
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          sx={{ textAlign: 'center', py: 4 }}
        >
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
             <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: alpha(theme.palette.success.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield sx={{ fontSize: 40, color: 'success.main' }} />
             </Box>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>REGISTRATION SUCCESSFUL</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
             WE'VE SENT A VERIFICATION EMAIL TO YOUR ADDRESS. PLEASE VERIFY YOUR ACCOUNT TO ACCESS ALL PREMIUM FEATURES.
          </Typography>
          <GradientButton component={RouterLink} to={ROUTES.LOGIN} fullWidth size="large">
            PROCEED TO LOGIN
          </GradientButton>
        </MotionBox>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2.5}>
             <Controller
               name="name"
               control={control}
               render={({ field }) => (
                 <TextField
                   {...field}
                   fullWidth
                   label="FULL NAME"
                   error={!!errors.name}
                   helperText={errors.name?.message}
                   InputProps={{ 
                     sx: { borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.4) },
                     startAdornment: <Person sx={{ mr: 1, color: 'primary.main', opacity: 0.5, fontSize: 18 }} />
                   }}
                 />
               )}
             />

             <Controller
               name="email"
               control={control}
               render={({ field }) => (
                 <TextField
                   {...field}
                   fullWidth
                   label="EMAIL ADDRESS"
                   type="email"
                   error={!!errors.email}
                   helperText={errors.email?.message}
                   InputProps={{ 
                     sx: { borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.4) },
                     startAdornment: <Email sx={{ mr: 1, color: 'primary.main', opacity: 0.5, fontSize: 18 }} />
                   }}
                 />
               )}
             />

             <Controller
               name="password"
               control={control}
               render={({ field }) => (
                 <Box>
                   <TextField
                     {...field}
                     fullWidth
                     label="PASSWORD"
                     type="password"
                     error={!!errors.password}
                     helperText={errors.password?.message}
                     InputProps={{ 
                       sx: { borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.4) },
                       startAdornment: <Lock sx={{ mr: 1, color: 'primary.main', opacity: 0.5, fontSize: 18 }} />
                     }}
                   />
                   <Box sx={{ mt: 1 }}>
                      <PasswordStrengthIndicator password={password} />
                   </Box>
                 </Box>
               )}
             />

             <Controller
               name="confirmPassword"
               control={control}
               render={({ field }) => (
                 <TextField
                   {...field}
                   fullWidth
                   label="CONFIRM PASSWORD"
                   type="password"
                   error={!!errors.confirmPassword}
                   helperText={errors.confirmPassword?.message}
                   InputProps={{ 
                     sx: { borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.4) },
                     startAdornment: <Shield sx={{ mr: 1, color: 'primary.main', opacity: 0.5, fontSize: 18 }} />
                   }}
                 />
               )}
             />

             <GradientButton type="submit" fullWidth size="large" disabled={isLoading} sx={{ py: 2, mt: 2 }}>
                {isLoading ? <CircularProgress size={20} color="inherit" /> : 'SIGN UP'}
             </GradientButton>

             <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  ALREADY HAVE AN ACCOUNT?{' '}
                  <Link component={RouterLink} to={ROUTES.LOGIN} sx={{ color: 'primary.main', fontWeight: 900, textDecoration: 'none' }}>
                    SIGN IN
                  </Link>
                </Typography>
             </Box>
          </Stack>
        </form>
      )}
    </Box>
  );
}

export default RegisterPage;
