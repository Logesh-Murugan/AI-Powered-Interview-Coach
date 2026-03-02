/**
 * StreakCard Component
 * Dashboard widget displaying current streak information
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, LinearProgress, Button, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { getCurrentStreak } from '../../services/streaksService';
import type { CurrentStreakResponse } from '../../services/streaksService';

function StreakCard() {
  const navigate = useNavigate();
  const [streakData, setStreakData] = useState<CurrentStreakResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCurrentStreak();
      setStreakData(data);
    } catch (err) {
      console.error('Error loading streak data:', err);
      setError('Unable to load streak data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getProgressValue = () => {
    if (!streakData) return 0;
    // Progress based on current streak relative to longest streak
    if (streakData.longest_streak === 0) return 0;
    return Math.min((streakData.current_streak / streakData.longest_streak) * 100, 100);
  };

  const getEncouragementMessage = () => {
    if (!streakData) return '';
    
    if (streakData.streak_active) {
      if (streakData.current_streak >= 30) {
        return "Amazing! You're on fire! 🔥";
      } else if (streakData.current_streak >= 7) {
        return "Great job! Keep it up! 💪";
      } else if (streakData.current_streak >= 3) {
        return "You're building momentum! 🚀";
      } else {
        return "Good start! Keep going! ⭐";
      }
    } else {
      return "Start a new streak today! 💪";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!streakData) {
    return null;
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LocalFireDepartmentIcon sx={{ fontSize: 32, color: streakData.streak_active ? 'error.main' : 'grey.400', mr: 1 }} />
          <Typography variant="h6" component="h2">
            Practice Streak
          </Typography>
        </Box>

        {/* Current Streak Display */}
        <Box sx={{ textAlign: 'center', my: 3 }}>
          <Typography variant="h2" component="div" sx={{ fontWeight: 'bold', color: streakData.streak_active ? 'error.main' : 'text.secondary' }}>
            {streakData.streak_active ? '🔥' : '💤'} {streakData.current_streak}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {streakData.current_streak === 1 ? 'Day Streak' : 'Day Streak'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {getEncouragementMessage()}
          </Typography>
        </Box>

        {/* Progress Bar */}
        {streakData.longest_streak > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progress to longest
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(getProgressValue())}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={getProgressValue()} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: streakData.streak_active ? 'error.main' : 'grey.400',
                }
              }} 
            />
          </Box>
        )}

        {/* Stats Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2, mt: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
              <EmojiEventsIcon sx={{ fontSize: 20, color: 'warning.main', mr: 0.5 }} />
              <Typography variant="h6" component="div">
                {streakData.longest_streak}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Longest Streak
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
              <CalendarTodayIcon sx={{ fontSize: 20, color: 'info.main', mr: 0.5 }} />
              <Typography variant="body2" component="div">
                {formatDate(streakData.last_practice_date)}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Last Practice
            </Typography>
          </Box>
        </Box>

        {/* View Details Button */}
        <Button 
          variant="outlined" 
          fullWidth 
          onClick={() => navigate('/streaks')}
          sx={{ mt: 2 }}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}

export default StreakCard;
