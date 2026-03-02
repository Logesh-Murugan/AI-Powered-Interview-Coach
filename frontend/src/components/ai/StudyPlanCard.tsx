/**
 * Study Plan Card Component
 * Dashboard widget showing active study plan progress
 * 
 * Requirements: INT-1.8
 */

import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Stack,
  LinearProgress,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  School,
  TrendingUp,
  CheckCircle,
  Add,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { StudyPlan } from '../../services/studyPlanService';

interface StudyPlanCardProps {
  activePlan: StudyPlan | null;
  isLoading: boolean;
  error: string | null;
}

function StudyPlanCard({ activePlan, isLoading, error }: StudyPlanCardProps) {
  const navigate = useNavigate();

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading study plan...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <School sx={{ mr: 1, verticalAlign: 'middle' }} />
            Study Plan
          </Typography>
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/ai/study-plans')}
            fullWidth
          >
            Go to Study Plans
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No active plan state
  if (!activePlan) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2} alignItems="center" sx={{ py: 3 }}>
            <School sx={{ fontSize: 60, color: 'primary.main' }} />
            <Typography variant="h6" align="center">
              No Active Study Plan
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Create a personalized learning roadmap to achieve your career goals
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/ai/study-plans')}
              size="large"
            >
              Create Study Plan
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Active plan exists - show progress
  const { target_role, progress_percentage, completed_tasks, total_tasks, plan_data } = activePlan;
  
  // Get next milestone
  const nextMilestone = plan_data.weekly_milestones?.find(m => !m.completed);

  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              <School sx={{ mr: 1, verticalAlign: 'middle' }} />
              Study Plan
            </Typography>
            <Chip
              label={target_role}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
          <Chip
            label={activePlan.status.toUpperCase()}
            size="small"
            color={activePlan.status === 'active' ? 'success' : 'default'}
          />
        </Stack>

        {/* Progress Section */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Overall Progress
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {progress_percentage}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress_percentage}
            sx={{ height: 8, borderRadius: 1 }}
          />
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <CheckCircle fontSize="small" color="success" />
            <Typography variant="caption" color="text.secondary">
              {completed_tasks} of {total_tasks} tasks completed
            </Typography>
          </Stack>
        </Box>

        {/* Next Milestone Preview */}
        {nextMilestone && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.lighter', borderRadius: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <TrendingUp fontSize="small" color="primary" />
              <Typography variant="subtitle2" color="primary.main">
                Next Milestone: Week {nextMilestone.week}
              </Typography>
            </Stack>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              {nextMilestone.milestone}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {nextMilestone.skills_covered.slice(0, 3).map((skill, idx) => (
                <Chip key={idx} label={skill} size="small" />
              ))}
              {nextMilestone.skills_covered.length > 3 && (
                <Chip label={`+${nextMilestone.skills_covered.length - 3} more`} size="small" />
              )}
            </Box>
          </Box>
        )}

        {/* View Full Plan Button */}
        <Button
          variant="contained"
          fullWidth
          onClick={() => navigate('/ai/study-plans')}
        >
          View Full Plan
        </Button>
      </CardContent>
    </Card>
  );
}

export default StudyPlanCard;
