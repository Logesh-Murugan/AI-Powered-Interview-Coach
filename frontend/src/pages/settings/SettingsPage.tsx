/**
 * Premium Settings Page
 * High-end User Preferences and Account Control interface
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  Stack,
  alpha,
  useTheme,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleTheme } from '../../store/slices/uiSlice';
import { userService } from '../../services/userService';
import { GlassCard, GradientButton, GradientText } from '../../components/common/PremiumComponents';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Palette, 
  Language, 
  Notifications, 
  Security, 
  DeleteForever,
  Contrast
} from '@mui/icons-material';

const MotionBox = motion.create(Box);

interface UserPreferences {
  leaderboardOptOut: boolean;
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export default function SettingsPage() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector((state) => state.ui.theme);
  const user = useAppSelector((state) => state.auth.user);

  const [preferences, setPreferences] = useState<UserPreferences>({
    leaderboardOptOut: false,
    language: 'en',
    emailNotifications: true,
    pushNotifications: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (e) {
        console.error('Preference parsing error', e);
      }
    }
    if (user) loadLeaderboardPreference();
  }, [user]);

  const loadLeaderboardPreference = async () => {
    try {
      const response = await userService.getLeaderboardPreference();
      setPreferences((prev) => ({
        ...prev,
        leaderboardOptOut: response.leaderboard_opt_out,
      }));
    } catch (err) {}
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
    showSuccess('VISUAL THEME RECALIBRATED');
  };

  const handleLanguageChange = (language: string) => {
    const newPrefs = { ...preferences, language };
    setPreferences(newPrefs);
    localStorage.setItem('userPreferences', JSON.stringify(newPrefs));
    showSuccess('LINGUISTIC PARAMETERS UPDATED');
  };

  const handleLeaderboardToggle = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const newOptOut = !preferences.leaderboardOptOut;
      await userService.updateLeaderboardPreference(newOptOut);
      const newPrefs = { ...preferences, leaderboardOptOut: newOptOut };
      setPreferences(newPrefs);
      localStorage.setItem('userPreferences', JSON.stringify(newPrefs));
      showSuccess(newOptOut ? 'GLOBAL VISIBILITY DEACTIVATED' : 'GLOBAL VISIBILITY ACTIVATED');
    } catch (err: any) {
      setError(err.message || 'Calibration failure');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = (type: 'email' | 'push') => {
    const key = type === 'email' ? 'emailNotifications' : 'pushNotifications';
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    localStorage.setItem('userPreferences', JSON.stringify(newPrefs));
    showSuccess('SIGNAL PROTOCOLS UPDATED');
  };

  return (
    <Box sx={{ pb: 8 }}>
      <MotionBox initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} sx={{ mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontFamily: 'Orbitron' }}>SYSTEM <GradientText>CONTROL</GradientText></Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
           IDENTITY PREFERENCES AND ACCOUNT PARAMETERS
        </Typography>
      </MotionBox>

      {success && <Alert severity="success" sx={{ mb: 4, bgcolor: `${theme.palette.success.main}11`, border: `1px solid ${theme.palette.success.main}66`, fontWeight: 800 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 4, bgcolor: `${theme.palette.error.main}11`, border: `1px solid ${theme.palette.error.main}66`, fontWeight: 800 }}>{error}</Alert>}

      <Grid container spacing={4}>
        {/* Appearance & Interface */}
        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard sx={{ p: 4, height: '100%' }}>
            <Stack spacing={4}>
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                   <Palette color="primary" />
                   <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron', fontSize: '1rem' }}>INTERFACE CALIBRATION</Typography>
                </Stack>
                <FormControlLabel
                  control={<Switch checked={currentTheme === 'dark'} onChange={handleThemeToggle} color="primary" />}
                  label={<Typography variant="body2" sx={{ fontWeight: 700 }}>HIGH-CONTRAST NEON (DARK MODE)</Typography>}
                />
              </Box>

              <Divider sx={{ opacity: 0.1 }} />

              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                   <Language color="primary" />
                   <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron', fontSize: '1rem' }}>LINGUISTIC MODULE</Typography>
                </Stack>
                <FormControl fullWidth variant="outlined">
                   <InputLabel sx={{ fontWeight: 700 }}>SELECT DIALECT</InputLabel>
                   <Select
                     value={preferences.language}
                     label="SELECT DIALECT"
                     onChange={(e) => handleLanguageChange(e.target.value)}
                     sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.4) }}
                   >
                     <MenuItem value="en">ENGLISH (US)</MenuItem>
                     <MenuItem value="es">ESPAÑOL</MenuItem>
                     <MenuItem value="fr">FRANÇAIS</MenuItem>
                     <MenuItem value="de">DEUTSCH</MenuItem>
                   </Select>
                </FormControl>
              </Box>
            </Stack>
          </GlassCard>
        </Grid>

        {/* Security & Notifications */}
        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard sx={{ p: 4, height: '100%' }}>
            <Stack spacing={4}>
               <Box>
                 <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                    <Notifications color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron', fontSize: '1rem' }}>SIGNAL PROTOCOLS</Typography>
                 </Stack>
                 <Stack spacing={1}>
                    <FormControlLabel control={<Switch checked={preferences.emailNotifications} onChange={() => handleNotificationToggle('email')} color="primary" />} label={<Typography variant="body2" sx={{ fontWeight: 700 }}>EXTERNAL COMMS (EMAIL)</Typography>} />
                    <FormControlLabel control={<Switch checked={preferences.pushNotifications} onChange={() => handleNotificationToggle('push')} color="primary" />} label={<Typography variant="body2" sx={{ fontWeight: 700 }}>SYSTEM OVERLAY (PUSH)</Typography>} />
                 </Stack>
               </Box>

               <Divider sx={{ opacity: 0.1 }} />

               <Box>
                 <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                    <Security color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron', fontSize: '1rem' }}>IDENTITY PRIVACY</Typography>
                 </Stack>
                 <FormControlLabel control={<Switch checked={!preferences.leaderboardOptOut} onChange={handleLeaderboardToggle} color="primary" />} label={<Typography variant="body2" sx={{ fontWeight: 700 }}>LATTICE VISIBILITY (LEADERBOARD)</Typography>} />
               </Box>
            </Stack>
          </GlassCard>
        </Grid>

        {/* Critical Actions */}
        <Grid size={{ xs: 12 }}>
           <GlassCard sx={{ p: 4, border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`, background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)} 0%, transparent 100%)` }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                 <DeleteForever color="error" />
                 <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron', color: 'error.main' }}>CRITICAL TERMINATION</Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, maxWidth: 600, fontWeight: 500 }}>
                 DANGER: Permanent identity deletion. This will wipe all session history, resume vectors, and achievement telemetry. This action is irreversible.
              </Typography>
              <GradientButton 
                 variant="contained" 
                 onClick={() => setDeleteDialogOpen(true)} 
                 sx={{ bgcolor: `${theme.palette.error.main} !important`, boxShadow: `0 4px 14px ${alpha(theme.palette.error.main, 0.4)}` }}
              >
                 TERMINATE ACCOUNT
              </GradientButton>
           </GlassCard>
        </Grid>
      </Grid>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 5, p: 2, bgcolor: 'background.paper', backgroundImage: 'none' } }}>
        <DialogTitle sx={{ fontFamily: 'Orbitron', fontWeight: 900 }}>CONFIRM TERMINATION</DialogTitle>
        <DialogContent><DialogContentText sx={{ fontWeight: 500 }}>All user data will be purged from the lattice. Proceed with caution.</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <GradientButton onClick={() => setDeleteDialogOpen(false)} sx={{ bgcolor: `${theme.palette.grey[700]} !important` }}>ABORT</GradientButton>
          <GradientButton onClick={() => setDeleteDialogOpen(false)} sx={{ bgcolor: `${theme.palette.error.main} !important` }}>PURGE IDENTITY</GradientButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
