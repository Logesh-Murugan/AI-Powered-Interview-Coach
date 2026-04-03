/**
 * Premium Dashboard Page
 * Bento-style layout with high-end glassmorphism and animations
 */

import { useEffect, useState } from 'react';
import { Box, Typography, Button, Stack, Alert, Grid, useTheme, alpha } from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { ROUTES } from '../../config/app.config';
import { getInterviewSessions } from '../../services/interviewService';
import analyticsService from '../../services/analyticsService';
import { motion } from 'framer-motion';


// Icons
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimerIcon from '@mui/icons-material/Timer';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

// Premium Components
import { GlassCard, GradientButton, GradientText } from '../../components/common/PremiumComponents';

// Dashboard Sub-components
import PerformanceChart from '../../components/dashboard/PerformanceChart';
import RecentSessions from '../../components/dashboard/RecentSessions';
import QuickActions from '../../components/dashboard/QuickActions';
import StreakCard from '../../components/dashboard/StreakCard';
import { logout } from '../../store/slices/authSlice';

const MotionBox = motion.create(Box);

interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  improvementRate: number;
}

function DashboardPage() {
  const navigate = useNavigate();
  const theme = useTheme();
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

  const loadDashboardData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both sessions and analytics overview in parallel
      const [sessions, analytics] = await Promise.all([
        getInterviewSessions(),
        analyticsService.getAnalyticsOverview(forceRefresh)
      ]);
      
      const completedCount = sessions.filter(s => s.status.toLowerCase() === 'completed').length;
      
      setStats({
        totalSessions: sessions.length,
        completedSessions: Math.max(analytics.total_interviews_completed || 0, completedCount),
        averageScore: Math.round(analytics.average_score_all_time || 0),
        improvementRate: Math.round(analytics.improvement_rate || 0),
      });
      
      setRecentSessions(sessions.slice(0, 5));
    } catch (err: any) {
      console.error('Dashboard Load Error:', err);
      // Fallback if analytics fails but sessions works
      try {
          const sessions = await getInterviewSessions();
          setRecentSessions(sessions.slice(0, 5));
          const completed = sessions.filter(s => s.status.toLowerCase() === 'completed');
          setStats(prev => ({
              ...prev,
              totalSessions: sessions.length,
              completedSessions: completed.length
          }));
      } catch (innerErr) {
          setError('SYSTEM PULSE WEAK. DATA RECOVERY OFFLINE.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate(ROUTES.LOGIN);
  };

  if (loading) return <LoadingSpinner variant="fullPage" />;

  return (
    <Box sx={{ pb: 8 }}>
      {/* Premium Hero Header */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        sx={{ mb: 6, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 3 }}
      >
        <Box>
          <Typography variant="h3" sx={{ mb: 1, fontFamily: 'Orbitron', fontWeight: 900 }}>
            WELCOME, <GradientText>{user?.name?.toUpperCase()}</GradientText>
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Synchronize your background with our AI-driven practice lattice.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => loadDashboardData(true)} startIcon={<AutoAwesomeIcon />} sx={{ borderRadius: 3, fontWeight: 700 }}>
            RECALIBRATE
          </Button>
          <GradientButton onClick={() => navigate('/interviews')}>
            START SESSION
          </GradientButton>
        </Stack>
      </MotionBox>

      {/* Bento Grid Layout */}
      <Grid container spacing={4}>
        {/* Main Intelligence Sector - Performance Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <GlassCard sx={{ p: 4, height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box>
                <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 900, fontFamily: 'Orbitron' }}>PERFORMANCE PULSE</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>REAL-TIME ANALYSIS OF YOUR GROWTH VECTORS.</Typography>
              </Box>
              <Box sx={{ p: 1, px: 2, borderRadius: 2, bgcolor: alpha(stats.improvementRate >= 0 ? theme.palette.success.main : theme.palette.error.main, 0.1), border: `1px solid ${alpha(stats.improvementRate >= 0 ? theme.palette.success.main : theme.palette.error.main, 0.2)}` }}>
                <Typography variant="caption" color={stats.improvementRate >= 0 ? "success.main" : "error.main"} sx={{ fontWeight: 900 }}>
                  {stats.improvementRate >= 0 ? '+' : ''}{stats.improvementRate}% GROWTH
                </Typography>
              </Box>
            </Box>
            <Box sx={{ height: 350 }}>
              <PerformanceChart />
            </Box>
          </GlassCard>
        </Grid>

        {/* Tactical Sector - Streak Card */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={4} sx={{ height: '100%' }}>
             <StreakCard />
             <GlassCard sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)` }}>
                <Box sx={{ textAlign: 'center' }}>
                   <FlashOnIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                   <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontFamily: 'Orbitron' }}>{stats.completedSessions}</Typography>
                   <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Sessions Concluded</Typography>
                </Box>
             </GlassCard>
          </Stack>
        </Grid>

        {/* Analytics Sector - Small Cards */}
        {[
          { title: "Avg Mastery", value: `${stats.averageScore}%`, icon: <TrendingUpIcon />, color: '#6366f1' },
          { title: "Active Gaps", value: "3", icon: <TimerIcon />, color: '#ec4899' },
          { title: "Skill Tier", value: "Gold", icon: <AssessmentIcon />, color: '#f59e0b' },
          { title: "Offer Probability", value: "68%", icon: <CheckCircleIcon />, color: '#10b981' }
        ].map((item, idx) => (
          <Grid key={idx} size={{ xs: 12, sm: 6, md: 3 }}>
            <MotionBox
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <GlassCard sx={{ p: 3, textAlign: 'center', borderBottom: `4px solid ${item.color}` }}>
                <Box sx={{ color: item.color, mb: 1.5 }}>{item.icon}</Box>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5, fontFamily: 'Orbitron' }}>{item.value}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.title}</Typography>
              </GlassCard>
            </MotionBox>
          </Grid>
        ))}

        {/* Operational Sector - Quick Actions & Recent Sessions */}
        <Grid size={{ xs: 12, md: 5 }}>
          <QuickActions />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <RecentSessions sessions={recentSessions} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default DashboardPage;
