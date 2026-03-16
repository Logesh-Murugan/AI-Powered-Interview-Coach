/**
 * StreakPage Component
 * Detailed streak statistics and history page
 */

import { useEffect, useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  Alert,
  Chip
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { getStreakStats } from '../../services/streaksService';
import type { StreakStatsResponse } from '../../services/streaksService';
import StreakCalendar from '../../components/dashboard/StreakCalendar';

interface Milestone {
  days: number;
  title: string;
  icon: string;
  achieved: boolean;
}

function StreakPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StreakStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStreakStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading streak stats:', err);
      setError('Unable to load streak statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getMilestones = (): Milestone[] => {
    if (!stats) return [];

    const longestStreak = stats.longest_streak;

    return [
      { days: 7, title: 'Week Warrior', icon: '🔥', achieved: longestStreak >= 7 },
      { days: 30, title: 'Month Master', icon: '💪', achieved: longestStreak >= 30 },
      { days: 100, title: 'Century Champion', icon: '🏆', achieved: longestStreak >= 100 },
      { days: 365, title: 'Year Legend', icon: '👑', achieved: longestStreak >= 365 },
    ];
  };

  const getMotivationalMessage = () => {
    if (!stats) return '';

    const current = stats.current_streak;
    const longest = stats.longest_streak;

    if (current === 0) {
      return "Every expert was once a beginner. Start your streak today! 💪";
    } else if (current === longest && current >= 30) {
      return "You're at your peak! This is your longest streak ever! 🎉";
    } else if (current >= 30) {
      return "Incredible dedication! You're building an amazing habit! 🌟";
    } else if (current >= 7) {
      return "One week down! Consistency is the key to mastery! 🔑";
    } else if (current >= 3) {
      return "Great start! You're building momentum! 🚀";
    } else {
      return "Keep going! Every day counts! ⭐";
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <LoadingSpinner variant="fullPage" text="Loading streak data..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <ErrorAlert
            message={error}
            onRetry={loadStats}
            onDismiss={() => setError(null)}
          />
        </Box>
      </Container>
    );
  }

  if (!stats) {
    return null;
  }

  const milestones = getMilestones();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            component="button"
            onClick={() => navigate('/dashboard')}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            underline="hover"
            color="inherit"
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
            Dashboard
          </Link>
          <Typography color="text.primary">Streaks</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Practice Streaks
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your daily practice consistency and build lasting habits
          </Typography>
        </Box>

        {/* Motivational Message */}
        <Paper sx={{ p: 3, mb: 4, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
          <Typography variant="h6" align="center">
            {getMotivationalMessage()}
          </Typography>
        </Paper>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <LocalFireDepartmentIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                  {stats.current_streak}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Streak
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <EmojiEventsIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                  {stats.longest_streak}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Longest Streak
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                  {stats.total_practice_days}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Practice Days
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CalendarTodayIcon sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                <Typography variant="body1" component="div" sx={{ fontWeight: 'bold', mt: 2 }}>
                  {formatDate(stats.last_practice_date)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last Practice
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Streak Calendar */}
        <Box sx={{ mb: 4 }}>
          <StreakCalendar />
        </Box>

        {/* Milestones */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" component="h3" gutterBottom>
            Streak Milestones
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Achieve these milestones by maintaining your practice streak
          </Typography>

          <Grid container spacing={2}>
            {milestones.map((milestone, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card 
                  sx={{ 
                    opacity: milestone.achieved ? 1 : 0.6,
                    border: milestone.achieved ? '2px solid' : 'none',
                    borderColor: milestone.achieved ? 'success.main' : 'transparent',
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h2" component="div" sx={{ mb: 1 }}>
                      {milestone.icon}
                    </Typography>
                    <Typography variant="h6" component="div" gutterBottom>
                      {milestone.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {milestone.days} Day Streak
                    </Typography>
                    {milestone.achieved ? (
                      <Chip label="Achieved" color="success" size="small" />
                    ) : (
                      <Chip label="Locked" size="small" />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
}

export default StreakPage;
