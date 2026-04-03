import React from 'react';
import { Box, Typography, Chip, Grid, alpha, useTheme, Stack } from '@mui/material';
import {
  School,
  TrendingUp,
  Timer,
  EmojiEvents,
  TrendingDown,
  TrendingFlat,
  Hub
} from '@mui/icons-material';
import { type AnalyticsOverview } from '../../services/analyticsService';
import { GlassCard } from '../common/PremiumComponents';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

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
  const theme = useTheme();
  
  const getTrendIcon = () => {
    if (!trend) return undefined;
    switch (trend) {
      case 'up': return <TrendingUp fontSize="small" />;
      case 'down': return <TrendingDown fontSize="small" />;
      case 'flat': return <TrendingFlat fontSize="small" />;
    }
  };

  const getTrendColor = () => {
     if (trend === 'up') return theme.palette.success.main;
     if (trend === 'down') return theme.palette.error.main;
     return theme.palette.text.secondary;
  };

  return (
    <MotionBox whileHover={{ y: -5, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
      <GlassCard
        sx={{
          p: 3,
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          borderLeft: `6px solid ${color}`
        }}
      >
        <Box sx={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, bgcolor: color, opacity: 0.1, filter: 'blur(30px)', borderRadius: '50%' }} />
        
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, border: `1px solid ${alpha(color, 0.2)}` }}>
            {icon}
          </Box>
          {trend && trendValue && (
            <Chip
              icon={getTrendIcon()}
              label={trendValue}
              size="small"
              sx={{
                fontWeight: 900,
                fontFamily: 'Orbitron',
                fontSize: '0.65rem',
                bgcolor: alpha(getTrendColor(), 0.1),
                color: getTrendColor(),
                border: `1px solid ${alpha(getTrendColor(), 0.2)}`,
                '& .MuiChip-icon': { color: 'inherit' }
              }}
            />
          )}
        </Stack>

        <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: '0.1em', display: 'block', mb: 1 }}>
          {title.toUpperCase()}
        </Typography>
        
        <Typography variant="h3" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', color: color, mb: 1 }}>
          {value}
        </Typography>
        
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', opacity: 0.8 }}>
            {subtitle.toUpperCase()}
          </Typography>
        )}
      </GlassCard>
    </MotionBox>
  );
};

const AnalyticsOverviewSection: React.FC<Props> = ({ analytics }) => {
  const theme = useTheme();
  const getImprovementTrend = (): 'up' | 'down' | 'flat' => {
    if (!analytics.improvement_rate) return 'flat';
    if (analytics.improvement_rate > 5) return 'up';
    if (analytics.improvement_rate < -5) return 'down';
    return 'flat';
  };

  const formatScore = (score: number | null): string => {
    if (score === null) return 'N/A';
    return `${Math.round(score)}%`;
  };

  const formatHours = (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)}M`;
    return `${hours.toFixed(1)}H`;
  };

  return (
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Sessions Base"
          value={analytics.total_interviews_completed}
          subtitle="ARCHIVE TOTAL"
          icon={<School />}
          color={theme.palette.primary.main}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Mastery Vector"
          value={formatScore(analytics.average_score_all_time)}
          subtitle="GLOBAL AVERAGE"
          icon={<EmojiEvents />}
          color={theme.palette.warning.main}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Growth Velocity"
          value={analytics.improvement_rate ? `${analytics.improvement_rate > 0 ? '+' : ''}${analytics.improvement_rate.toFixed(1)}%` : 'N/A'}
          subtitle="IMPROVEMENT DELTA"
          icon={<TrendingUp />}
          color={theme.palette.success.main}
          trend={getImprovementTrend()}
          trendValue={analytics.improvement_rate ? `${Math.abs(analytics.improvement_rate).toFixed(1)}%` : undefined}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Practice Flux"
          value={formatHours(analytics.total_practice_hours)}
          subtitle="TOTAL TIME SYNCED"
          icon={<Timer />}
          color={theme.palette.info.main}
        />
      </Grid>

      {analytics.average_score_last_30_days !== null && (
        <Grid size={12}>
          <GlassCard sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), borderLeft: `6px solid ${theme.palette.primary.main}` }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={3} alignItems="center">
                 <Box sx={{ width: 50, height: 50, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                    <Hub />
                 </Box>
                 <Box>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: '0.2em' }}>LAST 30 DAYS PERFORMANCE</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 1000, fontFamily: 'Orbitron' }}>{formatScore(analytics.average_score_last_30_days)} AVERAGE SCORE</Typography>
                 </Box>
              </Stack>
              {analytics.last_session_date && (
                <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', fontFamily: 'Orbitron', bgcolor: alpha(theme.palette.divider, 0.05), p: 1, px: 2, borderRadius: 2 }}>
                  LAST SYNC: {new Date(analytics.last_session_date).toLocaleDateString().toUpperCase()}
                </Typography>
              )}
            </Stack>
          </GlassCard>
        </Grid>
      )}
    </Grid>
  );
};

export default AnalyticsOverviewSection;
