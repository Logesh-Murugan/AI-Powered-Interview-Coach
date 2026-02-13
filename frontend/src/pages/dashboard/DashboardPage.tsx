/**
 * Dashboard Page Component
 * Main dashboard for authenticated users with real-time stats
 */

import { useEffect, useState } from 'react';
import { Box, Typography, Button, Stack, Grid, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { ROUTES } from '../../config/app.config';
import StatsCard from '../../components/dashboard/StatsCard';
import RecentSessions from '../../components/dashboard/RecentSessions';
import QuickActions from '../../components/dashboard/QuickActions';
import { getInterviewSessions } from '../../services/interviewService';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimerIcon from '@mui/icons-material/Timer';
import FadeIn from '../../components/animations/FadeIn';
import ScaleButton from '../../components/animations/ScaleButton';

interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  improvementRate: number;
}

function DashboardPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    completedSessions: 0,
    averageScore: 0,
    improvementRate: 0,
  });
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch interview sessions
      const sessions = await getInterviewSessions();
      
      // Calculate stats
      const completed = sessions.filter(s => s.status === 'completed');
      const totalSessions = sessions.length;
      const completedSessions = completed.length;
      
      // Calculate average score (placeholder - will be real once we have evaluations)
      const averageScore = completedSessions > 0 ? 75 : 0;
      
      // Calculate improvement rate (placeholder)
      const improvementRate = completedSessions > 1 ? 12 : 0;
      
      setStats({
        totalSessions,
        completedSessions,
        averageScore,
        improvementRate,
      });
      
      // Get recent sessions (last 5)
      setRecentSessions(sessions.slice(0, 5));
      
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Unable to load dashboard data. Using default values.');
      // Set default values on error
      setStats({
        totalSessions: 0,
        completedSessions: 0,
        averageScore: 0,
        improvementRate: 0,
      });
      setRecentSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate(ROUTES.LOGIN);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <FadeIn delay={0.1}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Welcome back, {user?.name}!
          </Typography>
          <ScaleButton>
            <Button variant="outlined" onClick={handleLogout}>
              Logout
            </Button>
          </ScaleButton>
        </Box>
      </FadeIn>

      {/* Error Alert */}
      {error && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Stats Cards */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FadeIn delay={0.2}>
              <StatsCard
                title="Total Sessions"
                value={stats.totalSessions}
                icon={<AssessmentIcon />}
                color="primary"
              />
            </FadeIn>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FadeIn delay={0.3}>
              <StatsCard
                title="Completed"
                value={stats.completedSessions}
                icon={<CheckCircleIcon />}
                color="success"
              />
            </FadeIn>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FadeIn delay={0.4}>
              <StatsCard
                title="Average Score"
                value={`${stats.averageScore}%`}
                icon={<TrendingUpIcon />}
                color="info"
                trend={stats.improvementRate}
              />
            </FadeIn>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FadeIn delay={0.5}>
              <StatsCard
                title="Improvement"
                value={`+${stats.improvementRate}%`}
                icon={<TimerIcon />}
                color="warning"
                trend={stats.improvementRate}
              />
            </FadeIn>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <FadeIn delay={0.6}>
          <QuickActions />
        </FadeIn>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <FadeIn delay={0.7}>
            <RecentSessions sessions={recentSessions} />
          </FadeIn>
        )}
      </Stack>
    </Box>
  );
}

export default DashboardPage;
