/**
 * Achievement Progress Widget
 * Displays recent achievement unlocks and overall completion percentage
 * Requirements: COMP-2.2
 */

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Stack,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { getUserAchievements } from '../../services/achievementsService';
import type { UserAchievement } from '../../services/achievementsService';

function AchievementProgress() {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserAchievements();

      // Get recent achievements (last 3) — backend returns earned_at not unlocked_at
      const recentAchievements = data.achievements
        .filter(a => a.earned_at)
        .sort((a, b) => new Date(b.earned_at!).getTime() - new Date(a.earned_at!).getTime())
        .slice(0, 3);

      setAchievements(recentAchievements);
      setCompletionPercentage(data.completion_percentage);
      setTotalPoints(data.total_earned);
    } catch (err) {
      console.error('Error loading achievements:', err);
      setError('Unable to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = () => {
    navigate('/achievements');
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

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <EmojiEventsIcon sx={{ mr: 1, color: 'warning.main' }} />
          <Typography variant="h6" component="h2">
            Achievement Progress
          </Typography>
        </Box>

        {/* Overall Completion */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Overall Completion
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {completionPercentage.toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completionPercentage}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {totalPoints} points earned
          </Typography>
        </Box>

        {/* Recent Achievements */}
        {achievements.length > 0 ? (
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Recent Unlocks
            </Typography>
            {achievements.map((userAchievement) => (
              <Box
                key={userAchievement.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 1.5,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                }}
              >
                <Box
                  sx={{
                    fontSize: '2rem',
                    mr: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  🏆
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {userAchievement.achievement_type.replace(/_/g, ' ')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Earned {userAchievement.earned_at ? new Date(userAchievement.earned_at).toLocaleDateString() : ''}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No achievements unlocked yet. Keep practicing!
            </Typography>
          </Box>
        )}

        {/* View All Button */}
        <Button
          fullWidth
          variant="outlined"
          endIcon={<ArrowForwardIcon />}
          onClick={handleViewAll}
          sx={{ mt: 2 }}
        >
          View All Achievements
        </Button>
      </CardContent>
    </Card>
  );
}

export default AchievementProgress;
