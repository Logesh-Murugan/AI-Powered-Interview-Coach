import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  EmojiEvents,
  TrendingDown,
} from '@mui/icons-material';
import { CategoryPerformance } from '../../services/analyticsService';

interface Props {
  strengths: string[];
  weaknesses: string[];
  categoryPerformance: CategoryPerformance[];
}

const StrengthsWeaknesses: React.FC<Props> = ({
  strengths,
  weaknesses,
  categoryPerformance,
}) => {
  const getCategoryScore = (category: string): number | null => {
    const cat = categoryPerformance.find((c) => c.category === category);
    return cat ? cat.avg_score : null;
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Strengths & Areas for Improvement
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Strengths */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'success.light',
              border: '2px solid',
              borderColor: 'success.main',
            }}
          >
            <Box display="flex" alignItems="center" mb={2}>
              <EmojiEvents sx={{ color: 'success.dark', mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold" color="success.dark">
                Top Strengths
              </Typography>
            </Box>

            {strengths.length > 0 ? (
              <List dense>
                {strengths.map((strength, index) => {
                  const score = getCategoryScore(strength);
                  return (
                    <ListItem key={strength} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckCircle sx={{ color: 'success.dark' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" fontWeight="medium">
                              {strength.replace(/_/g, ' ')}
                            </Typography>
                            {score && (
                              <Chip
                                label={score.toFixed(1)}
                                size="small"
                                sx={{
                                  bgcolor: 'success.dark',
                                  color: 'white',
                                  fontWeight: 'bold',
                                }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Complete more interviews to identify your strengths
              </Typography>
            )}
          </Box>
        </Grid>

        {/* Weaknesses */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'warning.light',
              border: '2px solid',
              borderColor: 'warning.main',
            }}
          >
            <Box display="flex" alignItems="center" mb={2}>
              <TrendingDown sx={{ color: 'warning.dark', mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold" color="warning.dark">
                Areas for Improvement
              </Typography>
            </Box>

            {weaknesses.length > 0 ? (
              <List dense>
                {weaknesses.map((weakness, index) => {
                  const score = getCategoryScore(weakness);
                  return (
                    <ListItem key={weakness} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Warning sx={{ color: 'warning.dark' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" fontWeight="medium">
                              {weakness.replace(/_/g, ' ')}
                            </Typography>
                            {score && (
                              <Chip
                                label={score.toFixed(1)}
                                size="small"
                                sx={{
                                  bgcolor: 'warning.dark',
                                  color: 'white',
                                  fontWeight: 'bold',
                                }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Great job! No significant weaknesses identified yet.
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>

      <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
        <Typography variant="caption" color="text.secondary">
          <strong>Note:</strong> Strengths are categories with scores above 80. Areas for improvement are categories with scores below 60.
        </Typography>
      </Box>
    </Paper>
  );
};

export default StrengthsWeaknesses;
