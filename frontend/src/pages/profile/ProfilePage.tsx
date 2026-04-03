/**
 * Premium Profile Page
 * High-end User Dossier and identity management interface
 */

import { useState } from 'react';
import { Box, Typography, Alert, Avatar, Grid, Stack, alpha, useTheme } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateProfile, clearError } from '../../store/slices/authSlice';
import ErrorAlert from '../../components/common/ErrorAlert';
import ProfileEditForm from '../../components/profile/ProfileEditForm';
import type { UpdateProfileRequest } from '../../services/userService';
import { GlassCard, GradientButton, GradientText } from '../../components/common/PremiumComponents';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, AccountCircle, Badge, Terminal, Security } from '@mui/icons-material';

const MotionBox = motion.create(Box);

function ProfilePage() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const error = useAppSelector((state) => state.auth.error);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleEditClick = () => {
    setIsEditMode(true);
    setSuccessMessage(null);
    dispatch(clearError());
  };

  const handleCancel = () => {
    setIsEditMode(false);
    dispatch(clearError());
  };

  const handleSubmit = async (data: { name: string; target_role?: string; experience_level?: string }) => {
    try {
      await dispatch(updateProfile(data as UpdateProfileRequest)).unwrap();
      setSuccessMessage('DOSSIER SYNCHRONIZED SUCCESSFULLY');
      setIsEditMode(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Profile update failed:', err);
    }
  };

  return (
    <Box sx={{ pb: 8 }}>
      {/* Header Profile Section */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 6 }}
      >
        <Box>
           <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontFamily: 'Orbitron' }}>USER <GradientText>DOSSIER</GradientText></Typography>
           <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              CENTRAL IDENTITY AND EXPERIENCE PARAMETERS
           </Typography>
        </Box>
        <AnimatePresence>
          {!isEditMode && (
            <MotionBox initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
              <GradientButton variant="contained" onClick={handleEditClick} startIcon={<Edit />}>
                EDIT PARAMETERS
              </GradientButton>
            </MotionBox>
          )}
        </AnimatePresence>
      </MotionBox>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 4, border: `1px solid ${theme.palette.success.main}66`, bgcolor: `${theme.palette.success.main}11`, fontWeight: 800 }} onClose={() => setSuccessMessage(null)}>
          {successMessage.toUpperCase()}
        </Alert>
      )}

      {error && !isEditMode && (
        <ErrorAlert message={error} onRetry={handleEditClick} onDismiss={() => dispatch(clearError())} />
      )}

      <Grid container spacing={4}>
         {/* Identity Overview */}
         <Grid size={{ xs: 12, lg: 4 }}>
            <GlassCard sx={{ p: 4, textAlign: 'center', height: '100%', position: 'relative', overflow: 'hidden' }}>
               <Box sx={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, bgcolor: 'primary.main', opacity: 0.15, filter: 'blur(50px)', borderRadius: '50%' }} />
               <Avatar
                 sx={{ 
                   width: 120, 
                   height: 120, 
                   mx: 'auto', 
                   mb: 3, 
                   bgcolor: 'primary.main', 
                   fontSize: '3rem', 
                   fontWeight: 900,
                   fontFamily: 'Orbitron',
                   boxShadow: `0 0 30px ${alpha(theme.palette.primary.main, 0.4)}`
                 }}
               >
                  {user?.name?.[0]?.toUpperCase() || 'U'}
               </Avatar>
               <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>{user?.name?.toUpperCase()}</Typography>
               <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 900, letterSpacing: '0.2em' }}>ACTIVE OPERATIVE</Typography>
               
               <Box sx={{ mt: 6, textAlign: 'left' }}>
                  <Stack spacing={2}>
                     <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.3) }}>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 900 }}>VIRTUAL IDENTIFIER</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.email}</Typography>
                     </Box>
                  </Stack>
               </Box>
            </GlassCard>
         </Grid>

         {/* Technical Parameters */}
         <Grid size={{ xs: 12, lg: 8 }}>
            <GlassCard sx={{ p: 4, height: '100%' }}>
               <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 4 }}>
                  <Terminal color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>EXPERIENCE LATTICE</Typography>
               </Stack>
               
               {isEditMode ? (
                 <ProfileEditForm
                   initialName={user?.name || ''}
                   initialTargetRole={user?.target_role}
                   initialExperienceLevel={user?.experience_level}
                   isLoading={isLoading}
                   error={error}
                   onSubmit={handleSubmit}
                   onCancel={handleCancel}
                 />
               ) : (
                 <Grid container spacing={3}>
                    {[
                      { l: 'TARGET SECTOR', v: user?.target_role || 'ACCESS DENIED', i: <Badge /> },
                      { l: 'COMPETENCY LEVEL', v: user?.experience_level || 'INITIALIZING', i: <Security /> },
                      { l: 'STATUS', v: 'NOMINAL', i: <AccountCircle /> },
                    ].map((row, i) => (
                      <Grid key={i} size={{ xs: 12, md: 4 }}>
                         <Box sx={{ p: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.2) }}>
                            <Box sx={{ color: 'primary.main', mb: 2, opacity: 0.5 }}>{row.i}</Box>
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 900, mb: 1 }}>{row.l}</Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 900, fontFamily: 'Orbitron', fontSize: '0.9rem' }}>{row.v.toUpperCase()}</Typography>
                         </Box>
                      </Grid>
                    ))}
                 </Grid>
               )}
            </GlassCard>
         </Grid>
      </Grid>
    </Box>
  );
}

export default ProfilePage;
