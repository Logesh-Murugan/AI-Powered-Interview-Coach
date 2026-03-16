/**
 * Upcoming Tasks Widget
 * Displays next 3-5 upcoming tasks from active study plan
 * Requirements: COMP-2.3
 */

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Checkbox,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { studyPlanService } from '../../services/studyPlanService';
import type { DailyTask } from '../../services/studyPlanService';

interface TaskWithDay {
  task: DailyTask;
  day: number;
  date: string;
}

function UpcomingTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskWithDay[]>([]);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUpcomingTasks();
  }, []);

  const loadUpcomingTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const plan = await studyPlanService.getActiveStudyPlan();
      setHasActivePlan(true);
      
      // Get upcoming tasks (next 5 incomplete tasks)
      const upcomingTasks: TaskWithDay[] = [];
      
      if (plan?.plan_data?.daily_tasks) {
        for (const dayTasks of plan.plan_data.daily_tasks) {
          for (const task of dayTasks.tasks) {
            if (!task.completed && upcomingTasks.length < 5) {
              upcomingTasks.push({
                task,
                day: dayTasks.day,
                date: dayTasks.date,
              });
            }
          }
          if (upcomingTasks.length >= 5) break;
        }
      }
      
      setTasks(upcomingTasks);
    } catch (err: any) {
      console.error('Error loading upcoming tasks:', err);
      
      // Check if error is 404 (no active plan)
      if (err.response?.status === 404) {
        setHasActivePlan(false);
      } else {
        setError('Unable to load upcoming tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = () => {
    navigate('/ai/study-plans');
  };

  const handleViewPlan = () => {
    navigate('/ai/study-plans');
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  // No active plan state
  if (!hasActivePlan) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h2">
              Upcoming Tasks
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              You don't have an active study plan yet.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreatePlan}
            >
              Create Study Plan
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h2">
            Upcoming Tasks
          </Typography>
        </Box>

        {tasks.length > 0 ? (
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            {tasks.map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  p: 1,
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Checkbox
                  disabled
                  checked={item.task.completed}
                  sx={{ mt: -0.5 }}
                />
                <Box sx={{ flex: 1, ml: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {item.task.skill}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {item.task.activity}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip
                      label={`Day ${item.day}`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                    <Chip
                      label={`${item.task.duration_minutes} min`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  </Box>
                </Box>
              </Box>
            ))}
          </Stack>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              All tasks completed! 🎉
            </Typography>
          </Box>
        )}

        {/* View Full Plan Button */}
        <Button
          fullWidth
          variant="outlined"
          endIcon={<ArrowForwardIcon />}
          onClick={handleViewPlan}
          sx={{ mt: 2 }}
        >
          View Full Study Plan
        </Button>
      </CardContent>
    </Card>
  );
}

export default UpcomingTasks;
