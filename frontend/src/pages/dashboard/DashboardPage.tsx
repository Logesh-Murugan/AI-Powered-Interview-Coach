/**
 * Dashboard Page Component
 * Main dashboard for authenticated users with real-time stats
 * Requirements: COMP-2.1, COMP-2.2, COMP-2.3, COMP-2.4, COMP-2.5, COMP-2.6, COMP-2.7, COMP-2.8
 */

import { useEffect, useState } from 'react';
import { Box, Typography, Button, Stack, Grid, Alert } from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { ROUTES } from '../../config/app.config';
import StatsCard from '../../components/dashboard/StatsCard';
import RecentSessions from '../../components/dashboard/RecentSessions';
import QuickActions from '../../components/dashboard/QuickActions';
import StreakCard from '../../components/dashboard/StreakCard';
import AchievementProgress from '../../components/dashboard/AchievementProgress';
import UpcomingTasks from '../../components/dashboard/UpcomingTasks';
import PerformanceChart from '../../components/dashboard/PerformanceChart';
import QuickStats from '../../components/dashboard/QuickStats';
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
  const [hasData, setHasData] = useState(false);

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
      
      // Check if user has any data
      setHasData(totalSessions > 0);
      
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
      setHasData(false);
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
      <LoadingSpinner variant="fullPage" text="Loading dashboard..." />
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
        <ErrorAlert
          message={error}
          severity="warning"
          onRetry={loadDashboardData}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Onboarding prompt for new users */}
      {!hasData && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Welcome! Start your interview preparation journey by taking your first practice session.
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Stats Cards - Top Row */}
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

        {/* Main Dashboard Widgets - Responsive Grid Layout */}
        <Grid container spacing={3}>
          {/* Left Column - Streak and Quick Stats */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              <FadeIn delay={0.6}>
                <StreakCard />
              </FadeIn>
              <FadeIn delay={0.7}>
                <QuickStats />
              </FadeIn>
            </Stack>
          </Grid>

          {/* Middle Column - Performance Chart and Quick Actions */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              <FadeIn delay={0.8}>
                <PerformanceChart />
              </FadeIn>
              <FadeIn delay={0.9}>
                <QuickActions />
              </FadeIn>
            </Stack>
          </Grid>

          {/* Right Column - Achievements and Upcoming Tasks */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              <FadeIn delay={1.0}>
                <AchievementProgress />
              </FadeIn>
              <FadeIn delay={1.1}>
                <UpcomingTasks />
              </FadeIn>
            </Stack>
          </Grid>
        </Grid>

        {/* Recent Sessions - Full Width */}
        {recentSessions.length > 0 && (
          <FadeIn delay={1.2}>
            <RecentSessions sessions={recentSessions} />
          </FadeIn>
        )}
      </Stack>
    </Box>
  );
}

export default DashboardPage;
