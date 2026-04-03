/**
 * Premium Study Plans Page
 * High-end AI-powered "Neural Roadmap" learning interface
 */

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Stack,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Divider,
  alpha,
  useTheme,
  Button,
} from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import {
  School,
  Add,
  TrendingUp,
  CheckCircle,
  Delete,
  Schedule,
  AutoAwesome,
  Route,
  Timeline,
  EmojiEvents,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  createStudyPlan,
  fetchActivePlan,
  updateProgress,
  abandonPlan,
  clearError,
} from '../../store/slices/studyPlanSlice';
import MilestoneAccordion from '../../components/ai/MilestoneAccordion';
import { format } from 'date-fns';
import { GlassCard, GradientButton, GradientText } from '../../components/common/PremiumComponents';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

const TARGET_ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'DevOps Engineer', 'Data Scientist', 'Machine Learning Engineer', 'Product Manager',
  'UI/UX Designer', 'QA Engineer',
];

function StudyPlansPage() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { activePlan, isLoading, isGenerating, error } = useAppSelector((state) => state.studyPlan);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);

  useEffect(() => {
    dispatch(fetchActivePlan());
  }, [dispatch]);

  const handleCreatePlan = async () => {
    if (!targetRole || durationDays < 7 || hoursPerWeek < 1) return;
    await dispatch(createStudyPlan({ target_role: targetRole, duration_days: durationDays, available_hours_per_week: hoursPerWeek }));
    setShowCreateForm(false);
  };

  const handleTaskToggle = async (day: number, taskIndex: number, completed: boolean) => {
    if (!activePlan) return;
    const taskKey = `day_${day}_task_${taskIndex}`;
    await dispatch(updateProgress({ planId: activePlan.id, request: { task_updates: { [taskKey]: completed } } }));
  };

  const handleAbandonPlan = async () => {
    if (activePlan) await dispatch(abandonPlan(activePlan.id));
    setShowAbandonDialog(false);
  };

  const shouldShowForm = showCreateForm || (!activePlan && !isLoading);

  return (
    <Box sx={{ pb: 8 }}>
      <MotionBox initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 3 }}>
        <Box>
           <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontFamily: 'Orbitron' }}>NEURAL <GradientText>ROADMAP</GradientText></Typography>
           <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>AI-POWERED PERSONALIZED LEARNING VECTORS</Typography>
        </Box>
        {activePlan && !shouldShowForm && (
           <GradientButton startIcon={<Add />} onClick={() => setShowCreateForm(true)} size="large">INITIALIZE NEW VECTOR</GradientButton>
        )}
      </MotionBox>

      {error && <Box sx={{ mb: 4 }}><ErrorAlert message={error} onDismiss={() => dispatch(clearError())} /></Box>}

      <AnimatePresence mode="wait">
        {shouldShowForm ? (
          <MotionBox key="form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <GlassCard sx={{ p: 6, maxWidth: 800, mx: 'auto', border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}` }}>
               <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
                  <Route color="primary" />
                  <Typography variant="h5" sx={{ fontWeight: 1000, fontFamily: 'Orbitron' }}>PLAN CONFIGURATION</Typography>
               </Stack>
               
               <Grid container spacing={4}>
                  <Grid size={12}>
                     <TextField select fullWidth label="TARGET ROLE VECTOR" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} InputProps={{ sx: { borderRadius: 4, fontWeight: 700, fontFamily: 'Orbitron' } }}>
                        {TARGET_ROLES.map((r) => <MenuItem key={r} value={r}>{r.toUpperCase()}</MenuItem>)}
                     </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                     <TextField fullWidth type="number" label="DURATION (CHRONO-DAYS)" value={durationDays} onChange={(e) => setDurationDays(parseInt(e.target.value))} InputProps={{ sx: { borderRadius: 4, fontWeight: 700, fontFamily: 'Orbitron' } }} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                     <TextField fullWidth type="number" label="WEEKLY RESOURCE HOURS" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(parseInt(e.target.value))} InputProps={{ sx: { borderRadius: 4, fontWeight: 700, fontFamily: 'Orbitron' } }} />
                  </Grid>
                  <Grid size={12}>
                     <Stack direction="row" spacing={2} justifyContent="flex-end">
                        {activePlan && <GradientButton variant="outlined" onClick={() => setShowCreateForm(false)} sx={{ bgcolor: 'transparent !important', color: 'text.primary !important' }}>ABORT</GradientButton>}
                        <GradientButton size="large" onClick={handleCreatePlan} disabled={isGenerating || !targetRole} startIcon={isGenerating ? <LoadingSpinner size="small" /> : <AutoAwesome />}>
                           {isGenerating ? 'SYNTHESIZING ROADMAP...' : 'INITIALIZE NEURAL PLAN'}
                        </GradientButton>
                     </Stack>
                  </Grid>
               </Grid>
            </GlassCard>
          </MotionBox>
        ) : activePlan && (
          <MotionBox key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Stack spacing={4}>
               {/* Dashboard Cards */}
               <Grid container spacing={3}>
                  <Grid size={{ xs: 12, lg: 8 }}>
                     <GlassCard sx={{ p: 4 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
                           <Box>
                              <Typography variant="h4" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', mb: 1 }}>{activePlan.target_role.toUpperCase()}</Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                 <Chip label="ACTIVE" size="small" sx={{ fontWeight: 900, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }} />
                                 <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>INITIALIZED: {format(new Date(activePlan.created_at), 'dd MMM yyyy')}</Typography>
                              </Stack>
                           </Box>
                           <Button variant="text" color="error" startIcon={<Delete />} onClick={() => setShowAbandonDialog(true)} sx={{ fontWeight: 900 }}>ABANDON</Button>
                        </Stack>
                        
                        <Grid container spacing={3}>
                           {[
                             { label: 'VECTOR PROGRESS', val: `${activePlan.progress_percentage}%`, icon: <Timeline />, color: 'primary' },
                             { label: 'TASKS COMPLETED', val: `${activePlan.completed_tasks}/${activePlan.total_tasks}`, icon: <CheckCircle />, color: 'success' },
                             { label: 'MILESTONES', val: `${activePlan.completed_milestones}/${activePlan.total_milestones}`, icon: <EmojiEvents />, color: 'warning' },
                           ].map((stat, i) => (
                             <Grid key={i} size={4}>
                                <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha((theme.palette as any)[stat.color].main, 0.05), textAlign: 'center', border: `1px solid ${alpha((theme.palette as any)[stat.color].main, 0.1)}` }}>
                                   <Box sx={{ color: (theme.palette as any)[stat.color].main, mb: 1 }}>{stat.icon}</Box>
                                   <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>{stat.val}</Typography>
                                   <Typography variant="caption" sx={{ fontWeight: 1000, color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.1em' }}>{stat.label}</Typography>
                                </Box>
                             </Grid>
                           ))}
                        </Grid>
                     </GlassCard>
                  </Grid>
                  
                  <Grid size={{ xs: 12, lg: 4 }}>
                     <GlassCard sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron', mb: 4, textAlign: 'center' }}>RESOURCE ALLOCATION</Typography>
                        <Stack spacing={3}>
                           <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.4), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary' }}>TOTAL DURATION</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>{activePlan.duration_days} DAYS</Typography>
                           </Box>
                           <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.4), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary' }}>WEEKLY BANDWIDTH</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>{activePlan.available_hours_per_week}H</Typography>
                           </Box>
                           {activePlan.plan_data.time_estimates && (
                              <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                                 <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main' }}>ESTIMATED ENGINE HOURS</Typography>
                                 <Typography variant="body1" sx={{ fontWeight: 900, fontFamily: 'Orbitron', color: 'primary.main' }}>{activePlan.plan_data.time_estimates.total_hours}H</Typography>
                              </Box>
                           )}
                        </Stack>
                     </GlassCard>
                  </Grid>

                  <Grid size={12}>
                     <GlassCard sx={{ p: 4 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
                           <AutoAwesome color="primary" />
                           <Typography variant="h5" sx={{ fontWeight: 1000, fontFamily: 'Orbitron' }}>LEARNING MILESTONES</Typography>
                        </Stack>
                        <MilestoneAccordion 
                           milestones={activePlan.plan_data.weekly_milestones} 
                           dailyTasks={activePlan.plan_data.daily_tasks} 
                           onTaskToggle={handleTaskToggle} 
                           isUpdating={isLoading} 
                        />
                     </GlassCard>
                  </Grid>
               </Grid>
            </Stack>
          </MotionBox>
        )}
      </AnimatePresence>

      <Dialog open={showAbandonDialog} onClose={() => setShowAbandonDialog(false)} PaperProps={{ sx: { borderRadius: 5, p: 2, bgcolor: 'background.paper', backgroundImage: 'none' } }}>
        <DialogTitle sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>ABANDON VECTOR?</DialogTitle>
        <DialogContent><DialogContentText sx={{ fontWeight: 500 }}>All localized roadmap progress will be archived. You can re-initialize at any time.</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <GradientButton variant="outlined" onClick={() => setShowAbandonDialog(false)} sx={{ bgcolor: 'transparent !important', color: 'text.primary !important' }}>STAY ON TRACK</GradientButton>
          <GradientButton color="error" onClick={handleAbandonPlan} sx={{ bgcolor: `${theme.palette.error.main} !important` }}>YES, ABANDON</GradientButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default StudyPlansPage;
