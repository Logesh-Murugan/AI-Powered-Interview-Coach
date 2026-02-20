import React from 'react';
import { Grid, Paper, Box, Typography, Chip } from '@mui/material';
import {
  School,
  TrendingUp,
  Timer,
  EmojiEvents,
  TrendingDown,
  TrendingFlat,
} from '@mui/icons-material';
import { AnalyticsOverview } from '../../services/analyticsService';

interface Props {
  analytics: AnalyticsOverview;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  trendValue,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case 'up':
        return <TrendingUp fontSize="small" sx={{ color: 'success.main' }} />;
      case 'down':
        return <TrendingDown fontSize="small" sx={{ color: 'error.main' }} />;
      case 'flat':
        return <TrendingFlat fontSize="small" sx={{ color: 'text.secondary' }} />;
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          elevation: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          bgcolor: color,
          opacity: 0.1,
        }}
      />
      
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          {icon}
        </Box>
        {trend && trendValue && (
          <Chip
            icon={getTrendIcon()}
            label={trendValue}
            size="small"
            sx={{
              bgcolor: trend === 'up' ? 'success.light' : trend === 'down' ? 'error.light' : 'grey.200',
              color: trend === 'up' ? 'success.dark' : trend === 'down' ? 'error.dark' : 'text.secondary',
            }}
          />
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="h4" component="div" fontWeight="bold" mb={1}>
        {value}
      </Typography>
      
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
};

const AnalyticsOverviewSection: React.FC<Props> = ({ analytics }) => {
  const getImprovementTrend = (): 'up' | 'down' | 'flat' => {
    if (!analytics.improvement_rate) return 'flat';
    if (analytics.improvement_rate > 5) return 'up';
    if (analytics.improvement_rate < -5) return 'down';
    return 'flat';
  };

  const formatScore = (score: number | null): string => {
    if (score === null) return 'N/A';
    return score.toFixed(1);
  };

  const formatHours = (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours.toFixed(1)}h`;
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Interviews"
          value={analytics.total_interviews_completed}
          subtitle="Completed sessions"
          icon={<School />}
          color="#1976d2"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Average Score"
          value={formatScore(analytics.average_score_all_time)}
          subtitle="All-time performance"
          icon={<EmojiEvents />}
          color="#f57c00"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Improvement Rate"
          value={analytics.improvement_rate ? `${analytics.improvement_rate > 0 ? '+' : ''}${analytics.improvement_rate.toFixed(1)}%` : 'N/A'}
          subtitle="First 5 vs Last 5 sessions"
          icon={<TrendingUp />}
          color="#388e3c"
          trend={getImprovementTrend()}
          trendValue={analytics.improvement_rate ? `${Math.abs(analytics.improvement_rate).toFixed(1)}%` : undefined}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Practice Time"
          value={formatHours(analytics.total_practice_hours)}
          subtitle="Total hours practiced"
          icon={<Timer />}
          color="#7b1fa2"
        />
      </Grid>

      {analytics.average_score_last_30_days !== null && (
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Last 30 Days Performance
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {formatScore(analytics.average_score_last_30_days)} average score
                </Typography>
              </Box>
              {analytics.last_session_date && (
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Last session: {new Date(analytics.last_session_date).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};

export default AnalyticsOverviewSection;
