/**
 * Quick Stats Widget
 * Displays total sessions, average score, and total practice time
 * Requirements: COMP-2.5
 */

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import analyticsService from '../../services/analyticsService';

interface StatItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  color: string;
}

function QuickStats() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await analyticsService.getAnalyticsOverview();
      
      // Format practice hours
      const hours = Math.floor(data.total_practice_hours);
      const minutes = Math.round((data.total_practice_hours - hours) * 60);
      const practiceTimeStr = hours > 0 
        ? `${hours}h ${minutes}m` 
        : `${minutes}m`;
      
      // Calculate trend (improvement rate)
      const trend = data.improvement_rate || 0;
      
      const statsData: StatItem[] = [
        {
          label: 'Total Sessions',
          value: data.total_interviews_completed.toString(),
          icon: <AssessmentIcon />,
          color: 'primary.main',
        },
        {
          label: 'Average Score',
          value: data.average_score_last_30_days !== null 
            ? `${Math.round(data.average_score_last_30_days)}%` 
            : 'N/A',
          icon: <TrendingUpIcon />,
          trend: trend,
          color: 'success.main',
        },
        {
          label: 'Practice Time',
          value: practiceTimeStr,
          icon: <AccessTimeIcon />,
          color: 'info.main',
        },
      ];
      
      setStats(statsData);
    } catch (err) {
      console.error('Error loading quick stats:', err);
      setError('Unable to load statistics');
    } finally {
      setLoading(false);
    }
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
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          Quick Stats
        </Typography>

        <Grid container spacing={2}>
          {stats.map((stat, index) => (
            <Grid size={{ xs: 12, sm: 4 }} key={index}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  height: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      color: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      mr: 1,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <Typography variant="h5" fontWeight="bold">
                    {stat.value}
                  </Typography>
                  
                  {stat.trend !== undefined && stat.trend !== 0 && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: stat.trend > 0 ? 'success.main' : 'error.main',
                      }}
                    >
                      {stat.trend > 0 ? (
                        <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                      ) : (
                        <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                      )}
                      <Typography variant="caption" fontWeight="medium">
                        {Math.abs(stat.trend).toFixed(1)}%
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default QuickStats;
