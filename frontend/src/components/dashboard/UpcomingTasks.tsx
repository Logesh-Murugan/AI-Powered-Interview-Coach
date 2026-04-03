/**
 * Premium Upcoming Tasks Widget
 * High-end AI-powered learning task tracker
 */

import { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Checkbox,
  Stack,
  CircularProgress,
  Chip,
  alpha,
  useTheme,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { studyPlanService } from '../../services/studyPlanService';
import type { DailyTask } from '../../services/studyPlanService';
import { GlassCard, GradientButton } from '../common/PremiumComponents';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

interface TaskWithDay {
  task: DailyTask;
  day: number;
  date: string;
}

function UpcomingTasks() {
  const navigate = useNavigate();
  const theme = useTheme();
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
      
      const upcomingTasks: TaskWithDay[] = [];
      if (plan?.plan_data?.daily_tasks) {
        for (const dayTasks of plan.plan_data.daily_tasks) {
          for (const task of dayTasks.tasks) {
            if (!task.completed && upcomingTasks.length < 5) {
              upcomingTasks.push({ task, day: dayTasks.day, date: dayTasks.date });
            }
          }
          if (upcomingTasks.length >= 5) break;
        }
      }
      setTasks(upcomingTasks);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setHasActivePlan(false);
      } else {
        setError('Connection shielding active');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <GlassCard sx={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={30} thickness={5} />
    </GlassCard>
  );

  if (!hasActivePlan) return (
    <GlassCard sx={{ p: 4, height: '100%', border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}` }}>
      <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ height: '100%', py: 4 }}>
        <Box sx={{ p: 2, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
           <AssignmentIcon sx={{ fontSize: 40 }} />
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>NO ACTIVE ROADMAP</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>INITIALIZE YOUR AI STUDY PLAN TO TRACK VECTORS.</Typography>
        </Box>
        <GradientButton startIcon={<AddIcon />} onClick={() => navigate('/ai/study-plans')}>
          INITIALIZE PLAN
        </GradientButton>
      </Stack>
    </GlassCard>
  );

  return (
    <GlassCard sx={{ p: 4, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
           <AssignmentIcon color="primary" />
           <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', letterSpacing: '0.05em' }}>UPCOMING VECTORS</Typography>
        </Stack>
        <IconButton onClick={() => navigate('/ai/study-plans')} size="small" sx={{ bgcolor: alpha(theme.palette.background.paper, 0.3) }}>
           <ArrowForwardIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Stack spacing={2}>
        {tasks.map((item, idx) => (
          <MotionBox
            key={idx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.background.paper, 0.3),
              border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.background.paper, 0.5),
                borderColor: alpha(theme.palette.primary.main, 0.2)
              }
            }}
          >
            <Checkbox 
              checked={item.task.completed} 
              sx={{ 
                color: alpha(theme.palette.text.primary, 0.2),
                '&.Mui-checked': { color: theme.palette.success.main }
              }} 
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 900, mb: 0.5 }}>{item.task.skill.toUpperCase()}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600, mb: 1, lineHeight: 1.4 }}>
                {item.task.activity}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip label={`CHRONO-DAY ${item.day}`} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }} />
                <Chip label={`${item.task.duration_minutes} MIN`} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main' }} />
              </Stack>
            </Box>
          </MotionBox>
        ))}
        {tasks.length === 0 && (
          <Box sx={{ py: 6, textAlign: 'center', opacity: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>SYNCHRONIZATION COMPLETE. NO PENDING VECTORS.</Typography>
          </Box>
        )}
      </Stack>
    </GlassCard>
  );
}

export default UpcomingTasks;
