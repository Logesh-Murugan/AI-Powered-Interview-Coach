/**
 * Achievements Page
 * Display user achievements and progress
 */

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
} from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  getAllAchievements,
  getUserAchievements,
  type AchievementDefinition,
  type UserAchievement,
} from '../../services/achievementsService';
import FadeIn from '../../components/animations/FadeIn';

function AchievementsPage() {
  const [allAchievements, setAllAchievements] = useState<AchievementDefinition[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [totalUnlocked, setTotalUnlocked] = useState(0);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError(null);

      const [allData, userData] = await Promise.all([
        getAllAchievements(),
        getUserAchievements(),
      ]);

      setAllAchievements(allData.achievements);
      setUserAchievements(userData.achievements);
      setTotalUnlocked(userData.total_earned);
      setTotalAvailable(userData.total_available);
      setCompletionPercentage(userData.completion_percentage);
    } catch (err: any) {
      setError(err.message || 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (achievementType: string): UserAchievement | undefined => {
    return userAchievements.find(ua => ua.achievement_type === achievementType);
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'default',
      rare: 'primary',
      epic: 'secondary',
      legendary: 'warning',
    };
    return colors[rarity] || 'default';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <LoadingSpinner variant="fullPage" size="large" text="Loading achievements..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorAlert
          message={error}
          onRetry={loadAchievements}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <FadeIn>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEventsIcon fontSize="large" />
            Achievements
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your progress and unlock rewards
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary">
                  {totalUnlocked}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Achievements Unlocked
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="secondary">
                  {totalAvailable}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Available
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="success.main">
                  {completionPercentage.toFixed(0)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completion
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={completionPercentage}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {allAchievements.map((achievement) => {
            const unlocked = isUnlocked(achievement.type);

            return (
              <Grid key={achievement.type} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  sx={{
                    height: '100%',
                    opacity: unlocked ? 1 : 0.6,
                    position: 'relative',
                    overflow: 'visible',
                  }}
                >
                  {unlocked && (
                    <CheckCircleIcon
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        fontSize: 40,
                        color: 'success.main',
                        backgroundColor: 'background.paper',
                        borderRadius: '50%',
                      }}
                    />
                  )}
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          fontSize: 48,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          filter: unlocked ? 'none' : 'grayscale(100%)',
                        }}
                      >
                        {achievement.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">
                          {achievement.name}
                        </Typography>
                        <Chip
                          label={achievement.rarity}
                          size="small"
                          color={getRarityColor(achievement.rarity) as any}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {achievement.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        label={unlocked ? 'Unlocked' : 'Locked'}
                        size="small"
                        color={unlocked ? 'success' : 'default'}
                        variant={unlocked ? 'filled' : 'outlined'}
                      />
                      {unlocked && unlocked.earned_at && (
                        <Typography variant="caption" color="text.secondary">
                          {new Date(unlocked.earned_at).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </FadeIn>
    </Container>
  );
}

export default AchievementsPage;
