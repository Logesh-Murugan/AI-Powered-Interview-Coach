import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
} from '@mui/material';
import {
  Lightbulb,
  Flag,
  TrendingUp,
} from '@mui/icons-material';
import { PracticeRecommendation } from '../../services/analyticsService';

interface Props {
  recommendations: PracticeRecommendation[];
}

const PracticeRecommendations: React.FC<Props> = ({ recommendations }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    return <Flag fontSize="small" />;
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Lightbulb sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold">
            Practice Recommendations
          </Typography>
        </Box>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={150}
          color="text.secondary"
        >
          <Typography>
            Great job! No specific recommendations at this time. Keep practicing to maintain your performance.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Lightbulb sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" fontWeight="bold">
          Personalized Practice Recommendations
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {recommendations.map((rec, index) => (
          <Grid item xs={12} md={6} key={rec.category}>
            <Card
              elevation={1}
              sx={{
                height: '100%',
                border: '2px solid',
                borderColor: `${getPriorityColor(rec.priority)}.light`,
                '&:hover': {
                  elevation: 3,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease',
                },
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
                    {rec.category.replace(/_/g, ' ')}
                  </Typography>
                  <Chip
                    icon={getPriorityIcon(rec.priority)}
                    label={rec.priority.toUpperCase()}
                    size="small"
                    color={getPriorityColor(rec.priority) as any}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {rec.suggestion}
                </Typography>

                <Box mt={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" color="text.secondary">
                      Progress to Target
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" fontWeight="bold">
                        {rec.current_score.toFixed(1)}
                      </Typography>
                      <TrendingUp fontSize="small" sx={{ color: 'success.main' }} />
                      <Typography variant="caption" fontWeight="bold" color="success.main">
                        {rec.target_score.toFixed(1)}
                      </Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(rec.current_score / rec.target_score) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: `${getPriorityColor(rec.priority)}.main`,
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={3} p={2} bgcolor="info.light" borderRadius={1}>
        <Typography variant="body2" color="info.dark">
          <strong>💡 Tip:</strong> Focus on high-priority recommendations first for maximum impact on your overall performance.
        </Typography>
      </Box>
    </Paper>
  );
};

export default PracticeRecommendations;
