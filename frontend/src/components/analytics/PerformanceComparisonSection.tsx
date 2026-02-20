import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CompareArrows,
  EmojiEvents,
  TrendingUp,
  People,
  Star,
  CheckCircle,
  BarChart,
} from '@mui/icons-material';
import { PerformanceComparison } from '../../services/analyticsService';

interface Props {
  comparison: PerformanceComparison;
}

const PerformanceComparisonSection: React.FC<Props> = ({ comparison }) => {
  const getPerformanceLevelColor = (level: string) => {
    switch (level) {
      case 'expert':
        return '#9c27b0';
      case 'advanced':
        return '#2196f3';
      case 'intermediate':
        return '#ff9800';
      case 'beginner':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const getPerformanceLevelLabel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  const getPercentileColor = (percentile: number): string => {
    if (percentile >= 90) return '#4caf50';
    if (percentile >= 75) return '#2196f3';
    if (percentile >= 50) return '#ff9800';
    if (percentile >= 25) return '#ff5722';
    return '#f44336';
  };

  return (
    <Box>
      {/* Percentile Rank Card */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 3,
          background: `linear-gradient(135deg, ${getPercentileColor(comparison.user_percentile)}15 0%, ${getPercentileColor(comparison.user_percentile)}05 100%)`,
          border: '2px solid',
          borderColor: getPercentileColor(comparison.user_percentile),
        }}
      >
        <Box textAlign="center">
          <EmojiEvents
            sx={{
              fontSize: 60,
              color: getPercentileColor(comparison.user_percentile),
              mb: 2,
            }}
          />
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            {comparison.user_percentile.toFixed(0)}th
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Percentile
          </Typography>
          <Chip
            label={getPerformanceLevelLabel(comparison.performance_level)}
            sx={{
              mt: 2,
              bgcolor: getPerformanceLevelColor(comparison.performance_level),
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1rem',
              px: 2,
              py: 3,
            }}
          />
          <Typography variant="body1" sx={{ mt: 3, fontStyle: 'italic' }}>
            {comparison.user_rank_description}
          </Typography>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Your Performance */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Star sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Your Performance
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Average Score
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {comparison.user_average_score.toFixed(1)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Difference from Cohort Average
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color={comparison.score_difference >= 0 ? 'success.main' : 'error.main'}
                  >
                    {comparison.score_difference >= 0 ? '+' : ''}
                    {comparison.score_difference.toFixed(1)}
                  </Typography>
                  <TrendingUp
                    sx={{
                      color: comparison.score_difference >= 0 ? 'success.main' : 'error.main',
                      transform: comparison.score_difference < 0 ? 'rotate(180deg)' : 'none',
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cohort Statistics */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <People sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Cohort Statistics
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                {comparison.cohort_stats.target_role}
              </Typography>

              <Box mb={2}>
                <Typography variant="caption" color="text.secondary">
                  Total Users: {comparison.cohort_stats.total_users}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Average
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {comparison.cohort_stats.cohort_average_score.toFixed(1)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Median
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {comparison.cohort_stats.cohort_median_score.toFixed(1)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Score Distribution */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <BarChart sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Score Distribution in Cohort
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {Object.entries(comparison.cohort_stats.score_distribution).map(([range, count]) => {
                const total = comparison.cohort_stats.total_users;
                const percentage = (count / total) * 100;
                
                return (
                  <Grid item xs={12} sm={6} md={2.4} key={range}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {range}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {count}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          mt: 1,
                          height: 6,
                          borderRadius: 3,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {percentage.toFixed(0)}%
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>

        {/* Top Performer Habits */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <EmojiEvents sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Top 10% Performer Habits
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Sessions per Week
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {comparison.top_performer_habits.avg_sessions_per_week.toFixed(1)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Practice Hours
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {comparison.top_performer_habits.avg_practice_hours.toFixed(1)}h
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Questions per Session
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {comparison.top_performer_habits.avg_questions_per_session.toFixed(1)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Consistency Score
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {comparison.top_performer_habits.consistency_score.toFixed(0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {comparison.top_performer_habits.most_practiced_categories.length > 0 && (
              <Box mt={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Most Practiced Categories:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {comparison.top_performer_habits.most_practiced_categories.map((cat) => (
                    <Chip
                      key={cat}
                      label={cat.replace(/_/g, ' ')}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Improvement Suggestions */}
        {comparison.improvement_suggestions.length > 0 && (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, bgcolor: 'info.light' }}>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUp sx={{ mr: 1, color: 'info.dark' }} />
                <Typography variant="h6" fontWeight="bold" color="info.dark">
                  Personalized Improvement Suggestions
                </Typography>
              </Box>

              <List>
                {comparison.improvement_suggestions.map((suggestion, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircle sx={{ color: 'info.dark' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={suggestion}
                      primaryTypographyProps={{
                        variant: 'body2',
                        color: 'info.dark',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Box mt={3} p={2} bgcolor="grey.100" borderRadius={1}>
        <Typography variant="caption" color="text.secondary">
          <strong>Privacy Note:</strong> All comparison data is completely anonymous. No individual user identities are exposed.
        </Typography>
      </Box>
    </Box>
  );
};

export default PerformanceComparisonSection;
