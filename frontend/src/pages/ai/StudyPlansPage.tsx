/**
 * Study Plans Page
 * Create and manage AI-powered study plans
 * 
 * Requirements: INT-1.8
 */

import { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  MenuItem,
  Stack,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Divider,
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

// Target roles for dropdown
const TARGET_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Scientist',
  'Machine Learning Engineer',
  'Product Manager',
  'UI/UX Designer',
  'QA Engineer',
];

function StudyPlansPage() {
  const dispatch = useAppDispatch();
  const { activePlan, isLoading, isGenerating, error } = useAppSelector(
    (state) => state.studyPlan
  );

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [hoursPerWeek, setHoursPerWeek] = useState(10);

  // Dialog state
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);

  useEffect(() => {
    // Fetch active plan on mount
    dispatch(fetchActivePlan());
  }, [dispatch]);

  const handleCreatePlan = async () => {
    if (!targetRole || durationDays < 7 || hoursPerWeek < 1) {
      return;
    }

    await dispatch(
      createStudyPlan({
        target_role: targetRole,
        duration_days: durationDays,
        available_hours_per_week: hoursPerWeek,
      })
    );

    // Reset form and hide it
    setShowCreateForm(false);
    setTargetRole('');
    setDurationDays(30);
    setHoursPerWeek(10);
  };

  const handleTaskToggle = async (day: number, taskIndex: number, completed: boolean) => {
    if (!activePlan) return;

    // Build task_updates object
    const taskKey = `day_${day}_task_${taskIndex}`;
    const taskUpdates = { [taskKey]: completed };

    await dispatch(
      updateProgress({
        planId: activePlan.id,
        request: { task_updates: taskUpdates },
      })
    );
  };

  const handleAbandonPlan = async () => {
    if (!activePlan) return;

    await dispatch(abandonPlan(activePlan.id));
    setShowAbandonDialog(false);
  };

  // Show create form if no active plan
  const shouldShowForm = showCreateForm || (!activePlan && !isLoading);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              <School sx={{ mr: 1, verticalAlign: 'middle' }} />
              Study Plans
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI-powered personalized learning roadmaps
            </Typography>
          </Box>
          {activePlan && !shouldShowForm && (
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setShowCreateForm(true)}
            >
              New Plan
            </Button>
          )}
        </Box>

        {/* Error Alert */}
        {error && (
          <ErrorAlert
            message={error}
            onRetry={() => dispatch(fetchActivePlan())}
            onDismiss={() => dispatch(clearError())}
          />
        )}

        {/* Loading State */}
        {isLoading && !activePlan && (
          <LoadingSpinner variant="fullPage" text="Loading study plan..." />
        )}

        {/* Create Plan Form */}
        {shouldShowForm && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Create Study Plan
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Generate a personalized learning roadmap based on your goals
            </Typography>

            <Stack spacing={3}>
              <TextField
                select
                label="Target Role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                fullWidth
                required
              >
                {TARGET_ROLES.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="number"
                label="Duration (days)"
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value, 10))}
                fullWidth
                required
                inputProps={{ min: 7, max: 365 }}
                helperText="Minimum 7 days, maximum 365 days"
              />

              <TextField
                type="number"
                label="Available Hours per Week"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(parseInt(e.target.value, 10))}
                fullWidth
                required
                inputProps={{ min: 1, max: 40 }}
                helperText="How many hours per week can you dedicate to learning?"
              />

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleCreatePlan}
                  disabled={isGenerating || !targetRole}
                  startIcon={isGenerating ? <LoadingSpinner size="small" /> : <Add />}
                  fullWidth
                >
                  {isGenerating ? 'Generating Plan...' : 'Generate Study Plan'}
                </Button>
                {activePlan && (
                  <Button
                    variant="outlined"
                    onClick={() => setShowCreateForm(false)}
                    fullWidth
                  >
                    Cancel
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        )}

        {/* No Active Plan Message */}
        {!activePlan && !isLoading && !shouldShowForm && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No active study plan yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create a personalized study plan to track your learning progress
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCreateForm(true)}
            >
              Create Study Plan
            </Button>
          </Paper>
        )}

        {/* Active Plan Display */}
        {activePlan && !shouldShowForm && (
          <Stack spacing={3}>
            {/* Plan Overview */}
            <Paper sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {activePlan.target_role}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={activePlan.status.toUpperCase()}
                      size="small"
                      color={activePlan.status === 'active' ? 'success' : 'default'}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Created: {format(new Date(activePlan.created_at), 'MMM dd, yyyy')}
                    </Typography>
                  </Stack>
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => setShowAbandonDialog(true)}
                  size="small"
                >
                  Abandon Plan
                </Button>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Progress Statistics */}
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.lighter', borderRadius: 1 }}>
                    <Typography variant="h4" color="primary.main">
                      {activePlan.progress_percentage}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overall Progress
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.lighter', borderRadius: 1 }}>
                    <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.5}>
                      <CheckCircle color="success" />
                      <Typography variant="h4" color="success.main">
                        {activePlan.completed_tasks}
                      </Typography>
                      <Typography variant="h6" color="text.secondary">
                        / {activePlan.total_tasks}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Tasks Completed
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                    <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.5}>
                      <TrendingUp color="info" />
                      <Typography variant="h4" color="info.main">
                        {activePlan.completed_milestones}
                      </Typography>
                      <Typography variant="h6" color="text.secondary">
                        / {activePlan.total_milestones}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Milestones Completed
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Time Estimates */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Stack direction="row" spacing={3} justifyContent="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Schedule fontSize="small" />
                    <Typography variant="body2">
                      <strong>{activePlan.duration_days}</strong> days duration
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Schedule fontSize="small" />
                    <Typography variant="body2">
                      <strong>{activePlan.available_hours_per_week}</strong> hours/week
                    </Typography>
                  </Stack>
                  {activePlan.plan_data.time_estimates && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Schedule fontSize="small" />
                      <Typography variant="body2">
                        <strong>{activePlan.plan_data.time_estimates.total_hours}</strong> total hours
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>
            </Paper>

            {/* Milestones */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Learning Milestones
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Track your progress through weekly milestones and daily tasks
              </Typography>
              <MilestoneAccordion
                milestones={activePlan.plan_data.weekly_milestones}
                dailyTasks={activePlan.plan_data.daily_tasks}
                onTaskToggle={handleTaskToggle}
                isUpdating={isLoading}
              />
            </Paper>
          </Stack>
        )}

        {/* Abandon Plan Confirmation Dialog */}
        <Dialog
          open={showAbandonDialog}
          onClose={() => setShowAbandonDialog(false)}
        >
          <DialogTitle>Abandon Study Plan?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to abandon this study plan? Your progress will be saved, but
              the plan will no longer be active. You can create a new plan at any time.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAbandonDialog(false)}>Cancel</Button>
            <Button
              onClick={handleAbandonPlan}
              color="error"
              variant="contained"
              disabled={isLoading}
            >
              {isLoading ? 'Abandoning...' : 'Abandon Plan'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}

export default StudyPlansPage;
