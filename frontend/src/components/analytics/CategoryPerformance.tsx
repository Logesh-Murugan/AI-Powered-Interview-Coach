import React from 'react';
import {
  Paper,
  Typography,
  Box,
  LinearProgress,
  Chip,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { CategoryPerformance as CategoryPerformanceType } from '../../services/analyticsService';

interface Props {
  categories: CategoryPerformanceType[];
}

const CategoryPerformance: React.FC<Props> = ({ categories }) => {
  const theme = useTheme();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp fontSize="small" sx={{ color: 'success.main' }} />;
      case 'declining':
        return <TrendingDown fontSize="small" sx={{ color: 'error.main' }} />;
      case 'stable':
        return <TrendingFlat fontSize="small" sx={{ color: 'text.secondary' }} />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'success';
      case 'declining':
        return 'error';
      case 'stable':
        return 'default';
      default:
        return 'default';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  if (!categories || categories.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Category Performance
        </Typography>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={200}
          color="text.secondary"
        >
          <Typography>No category data available yet.</Typography>
        </Box>
      </Paper>
    );
  }

  // Sort by score descending
  const sortedCategories = [...categories].sort((a, b) => b.avg_score - a.avg_score);

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" fontWeight="bold">
          Performance by Category
        </Typography>
      </Box>

      <Box>
        {sortedCategories.map((category, index) => (
          <Box key={category.category} mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body1" fontWeight="medium">
                  {category.category.replace(/_/g, ' ')}
                </Typography>
                <Chip
                  icon={getTrendIcon(category.trend)}
                  label={category.trend}
                  size="small"
                  color={getTrendColor(category.trend) as any}
                  variant="outlined"
                />
              </Box>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ color: getScoreColor(category.avg_score) }}
              >
                {category.avg_score.toFixed(1)}
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={category.avg_score}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: getScoreColor(category.avg_score),
                  borderRadius: 4,
                },
              }}
            />

            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {category.question_count} question{category.question_count !== 1 ? 's' : ''} answered
            </Typography>
          </Box>
        ))}
      </Box>

      <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
        <Typography variant="caption" color="text.secondary">
          <strong>Trend indicators:</strong> Improving (↗), Declining (↘), Stable (→)
        </Typography>
      </Box>
    </Paper>
  );
};

export default CategoryPerformance;
