import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Stack,
  alpha,
  useTheme,
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  People,
  Star,
  BarChart,
  FlashOn,
  CheckCircle,
} from '@mui/icons-material';
import { type PerformanceComparison } from '../../services/analyticsService';
import { GlassCard } from '../common/PremiumComponents';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

interface Props {
  comparison: PerformanceComparison;
}

const PerformanceComparisonSection: React.FC<Props> = ({ comparison }) => {
  const theme = useTheme();

  const getPercentileColor = (p: number): string => {
    if (p >= 90) return theme.palette.success.main;
    if (p >= 75) return theme.palette.primary.main;
    if (p >= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Box>
      {/* Premium Hero Percentile Card */}
      <MotionBox
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <GlassCard
          sx={{
            p: 6,
            mb: 4,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${alpha(getPercentileColor(comparison.user_percentile), 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
            border: `2px solid ${alpha(getPercentileColor(comparison.user_percentile), 0.3)}`,
            boxShadow: `0 0 40px ${alpha(getPercentileColor(comparison.user_percentile), 0.1)}`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, bgcolor: getPercentileColor(comparison.user_percentile), opacity: 0.1, filter: 'blur(100px)', borderRadius: '50%' }} />
          
          <EmojiEvents sx={{ fontSize: 80, color: getPercentileColor(comparison.user_percentile), mb: 3 }} />
          <Typography variant="h1" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', mb: 1 }}>{Math.round(comparison.user_percentile)}TH</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.2em', mb: 4 }}>GLOBAL PERCENTILE</Typography>
          
          <Chip
            label={comparison.performance_level.toUpperCase()}
            sx={{
              fontWeight: 1000,
              fontFamily: 'Orbitron',
              fontSize: '1.2rem',
              px: 4,
              py: 4,
              borderRadius: 3,
              bgcolor: alpha(getPercentileColor(comparison.user_percentile), 0.2),
              color: getPercentileColor(comparison.user_percentile),
              border: `1px solid ${getPercentileColor(comparison.user_percentile)}`
            }}
          />
          <Typography variant="body1" sx={{ mt: 4, fontStyle: 'italic', fontWeight: 600, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
            "{comparison.user_rank_description && comparison.user_rank_description.toUpperCase()}"
          </Typography>
        </GlassCard>
      </MotionBox>

      <Grid container spacing={4}>
        {/* Metric Sector: Personal vs Cohort */}
        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard sx={{ p: 4, height: '100%', borderLeft: `6px solid ${theme.palette.primary.main}` }}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={4}>
              <Star sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron' }}>PERSONAL RANKING</Typography>
            </Stack>

            <Box mb={4}>
              <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: '0.1em' }}>AVERAGE MASTERY</Typography>
              <Typography variant="h3" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', color: 'primary.main' }}>{comparison.user_average_score.toFixed(1)}%</Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: '0.1em' }}>COHORT VARIANCE</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h4" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', color: comparison.score_difference >= 0 ? 'success.main' : 'error.main' }}>
                  {comparison.score_difference >= 0 ? '+' : ''}{comparison.score_difference.toFixed(1)}%
                </Typography>
                <TrendingUp sx={{ color: comparison.score_difference >= 0 ? 'success.main' : 'error.main', transform: comparison.score_difference < 0 ? 'rotate(180deg)' : 'none' }} />
              </Stack>
            </Box>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard sx={{ p: 4, height: '100%', borderLeft: `6px solid ${theme.palette.secondary.main}` }}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={4}>
              <People sx={{ color: 'secondary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron' }}>COHORT STATISTICS</Typography>
            </Stack>

            <Typography variant="body2" sx={{ fontWeight: 800, mb: 1 }}>{comparison.cohort_stats.target_role.toUpperCase()}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 3 }}>SYSTEM NODES: {comparison.cohort_stats.total_users}</Typography>

            <Grid container spacing={3}>
              <Grid size={6}>
                <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary' }}>AVERAGE</Typography>
                <Typography variant="h5" sx={{ fontWeight: 1000, fontFamily: 'Orbitron' }}>{comparison.cohort_stats.cohort_average_score.toFixed(1)}%</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary' }}>MEDIAN</Typography>
                <Typography variant="h5" sx={{ fontWeight: 1000, fontFamily: 'Orbitron' }}>{comparison.cohort_stats.cohort_median_score.toFixed(1)}%</Typography>
              </Grid>
            </Grid>
          </GlassCard>
        </Grid>

        {/* Tactical Habit Matrix */}
        <Grid size={12}>
          <GlassCard sx={{ p: 4 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={4}>
               <FlashOn sx={{ color: 'warning.main' }} />
               <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron' }}>TOP 10% TACTICAL HABITS</Typography>
            </Stack>
            <Grid container spacing={3}>
              {[
                { label: 'WEEKLY CYCLES', value: comparison.top_performer_habits.avg_sessions_per_week.toFixed(1) },
                { label: 'PRACTICE FLUX', value: `${comparison.top_performer_habits.avg_practice_hours.toFixed(1)}H` },
                { label: 'VECTOR DENSITY', value: comparison.top_performer_habits.avg_questions_per_session.toFixed(1) },
                { label: 'CONSISTENCY RATIO', value: comparison.top_performer_habits.consistency_score.toFixed(0) }
              ].map((habit, idx) => (
                <Grid size={{ xs: 12, sm: 3 }} key={idx}>
                   <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.3), border: `1px solid ${alpha(theme.palette.divider, 0.05)}`, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', display: 'block', mb: 1 }}>{habit.label}</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', color: 'primary.main' }}>{habit.value}</Typography>
                   </Box>
                </Grid>
              ))}
            </Grid>
          </GlassCard>
        </Grid>

        {/* Personalized Improvement Vectors */}
        {comparison.improvement_suggestions.length > 0 && (
          <Grid size={12}>
            <GlassCard sx={{ p: 4, bgcolor: alpha(theme.palette.info.main, 0.05), border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
               <Stack direction="row" spacing={1.5} alignItems="center" mb={3}>
                  <TrendingUp sx={{ color: 'info.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', color: 'info.main' }}>ADAPTIVE VECTORS</Typography>
               </Stack>
               <Grid container spacing={2}>
                 {comparison.improvement_suggestions.map((suggestion, idx) => (
                   <Grid size={{ xs: 12, md: 6 }} key={idx}>
                      <Stack direction="row" spacing={2} alignItems="center">
                         <CheckCircle sx={{ color: 'info.main', fontSize: 18 }} />
                         <Typography variant="body2" sx={{ fontWeight: 700, opacity: 0.9 }}>{suggestion.toUpperCase()}</Typography>
                      </Stack>
                   </Grid>
                 ))}
               </Grid>
            </GlassCard>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default PerformanceComparisonSection;
