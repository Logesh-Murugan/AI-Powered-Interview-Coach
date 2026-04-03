/**
 * Premium Password Reset Page
 * High-end identity recovery interface with secure key regeneration modules
 */

import { useState } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
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
import { apiService } from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api.config';
import { ROUTES } from '../../config/app.config';
import PasswordStrengthIndicator from '../../components/auth/PasswordStrengthIndicator';
import { motion, AnimatePresence } from 'framer-motion';
import { GradientButton, GradientText } from '../../components/common/PremiumComponents';
import { Email, Lock, Shield, Autorenew } from '@mui/icons-material';

const MotionBox = motion.create(Box);

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
    .required('VIRTUAL IDENTIFIER REQUIRED')
    .email('INVALID IDENTIFIER FORMAT'),
});

const resetPasswordSchema = yup.object().shape({
  password: yup
    .string()
    .required('ACCESS KEY REQUIRED')
    .min(8, 'MINIMUM 8 CHARACTER COMPLIANCE')
    .matches(/[A-Z]/, 'UPPERCASE PROTOCOL REQUIRED')
    .matches(/[0-9]/, 'NUMERIC VECTOR REQUIRED'),
  confirmPassword: yup
    .string()
    .required('CONFIRMATION KEY REQUIRED')
    .oneOf([yup.ref('password')], 'KEYS MUST SYNCHRONIZE'),
});

function PasswordResetPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    control: requestControl,
    handleSubmit: handleRequestSubmit,
    formState: { errors: requestErrors },
  } = useForm<ResetRequestFormData>({
    resolver: yupResolver(resetRequestSchema),
    defaultValues: { email: '' },
  });

  const {
    control: resetControl,
    handleSubmit: handleResetSubmit,
    watch,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = watch('password');

  const onRequestSubmit = async (data: ResetRequestFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiService.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST, data);
      setSuccess('RECOVERY SIGNAL TRANSMITTED. CHECK YOUR INBOX.');
    } catch {
      setError('TRANSMISSION FAILED. VERIFY IDENTIFIER.');
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetPasswordFormData) => {
    if (!token) { setError('INVALID RECOVERY TOKEN'); return; }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiService.post(API_ENDPOINTS.AUTH.PASSWORD_RESET, {
        token,
        new_password: data.password,
      });
      setSuccess('ACCESS KEY SYNCHRONIZED. REDIRECTING...');
      setTimeout(() => navigate(ROUTES.LOGIN), 2000);
    } catch {
      setError('SYNCHRONIZATION FAILED. TOKEN EXPIRED.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ textAlign: 'center', mb: 4 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'Orbitron', mb: 1 }}>KEY <GradientText>RECOVERY</GradientText></Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
           {token ? 'ESTABLISHING NEW ACCESS PROTOCOLS' : 'INITIATING IDENTITY RECOVERY'}
        </Typography>
      </MotionBox>

      <AnimatePresence>
        {(error || success) && (
          <MotionBox initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} sx={{ overflow: 'hidden' }}>
            <Alert severity={error ? "error" : "success"} sx={{ mb: 3, border: `1px solid ${error ? theme.palette.error.main : theme.palette.success.main}66`, bgcolor: `${error ? theme.palette.error.main : theme.palette.success.main}11`, fontWeight: 800 }} onClose={() => { setError(null); setSuccess(null); }}>
              {(error || success || "").toUpperCase()}
            </Alert>
          </MotionBox>
        )}
      </AnimatePresence>

      {token ? (
        <form onSubmit={handleResetSubmit(onResetSubmit)}>
          <Stack spacing={2.5}>
            <Controller
              name="password"
              control={resetControl}
              render={({ field }) => (
                <Box>
                  <TextField
                    {...field}
                    fullWidth
                    label="NEW ACCESS KEY"
                    type="password"
                    error={!!resetErrors.password}
                    helperText={resetErrors.password?.message}
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
              control={resetControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="CONFIRMATION KEY"
                  type="password"
                  error={!!resetErrors.confirmPassword}
                  helperText={resetErrors.confirmPassword?.message}
                  InputProps={{ 
                    sx: { borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.4) },
                    startAdornment: <Shield sx={{ mr: 1, color: 'primary.main', opacity: 0.5, fontSize: 18 }} />
                  }}
                />
              )}
            />

            <GradientButton type="submit" fullWidth size="large" disabled={isLoading || !!success} sx={{ py: 2, mt: 2 }}>
               {isLoading ? <CircularProgress size={20} color="inherit" /> : 'SYNCHRONIZE KEY'}
            </GradientButton>
          </Stack>
        </form>
      ) : (
        <form onSubmit={handleRequestSubmit(onRequestSubmit)}>
          <Stack spacing={3}>
            <Controller
              name="email"
              control={requestControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="VIRTUAL IDENTIFIER"
                  type="email"
                  placeholder="NAME@DOMAIN.COM"
                  error={!!requestErrors.email}
                  helperText={requestErrors.email?.message}
                  InputProps={{ 
                    sx: { borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.4) },
                    startAdornment: <Email sx={{ mr: 1, color: 'primary.main', opacity: 0.5, fontSize: 18 }} />
                  }}
                />
              )}
            />

            <GradientButton type="submit" fullWidth size="large" disabled={isLoading || !!success} sx={{ py: 2, mt: 1 }} startIcon={<Autorenew />}>
               {isLoading ? <CircularProgress size={20} color="inherit" /> : 'TRANSMIT RECOVERY SIGNAL'}
            </GradientButton>
          </Stack>
        </form>
      )}

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          REMEMBER YOUR ACCESS KEY?{' '}
          <Link component={RouterLink} to={ROUTES.LOGIN} sx={{ color: 'primary.main', fontWeight: 900, textDecoration: 'none' }}>
            AUTHORIZE ACCESS
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}

export default PasswordResetPage;
