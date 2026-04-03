import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  alpha,
  useTheme,
  Stack,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Category as CategoryIcon,
  Psychology
} from '@mui/icons-material';
import { type CategoryPerformance as CategoryPerformanceType } from '../../services/analyticsService';
import { GlassCard } from '../common/PremiumComponents';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

interface Props {
  categories: CategoryPerformanceType[];
}

const CategoryPerformance: React.FC<Props> = ({ categories }) => {
  const theme = useTheme();

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'improving': return <TrendingUp fontSize="small" />;
      case 'declining': return <TrendingDown fontSize="small" />;
      case 'stable': return <TrendingFlat fontSize="small" />;
      default: return undefined;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'improving': return theme.palette.success.main;
      case 'declining': return theme.palette.error.main;
      case 'stable': return theme.palette.text.secondary;
      default: return theme.palette.divider;
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  if (!categories || categories.length === 0) {
    return (
      <GlassCard sx={{ p: 4, height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <CategoryIcon sx={{ fontSize: 60, color: alpha(theme.palette.divider, 0.1), mb: 2 }} />
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary' }}>NO CAPABILITY VECTORS MAPPED.</Typography>
      </GlassCard>
    );
  }

  const sortedCategories = [...categories].sort((a, b) => b.avg_score - a.avg_score);

  return (
    <GlassCard sx={{ p: 4, height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: -50, left: -50, width: 150, height: 150, bgcolor: 'secondary.main', opacity: 0.1, filter: 'blur(80px)', borderRadius: '50%' }} />

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
         <Psychology sx={{ color: 'secondary.main' }} />
         <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', letterSpacing: '0.05em' }}>CAPABILITY MATRIX</Typography>
      </Stack>

      <Stack spacing={3}>
        {sortedCategories.map((category, idx) => (
          <MotionBox 
            key={category.category}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 1000, color: 'text.primary', letterSpacing: '0.05em' }}>
                  {category.category.replace(/_/g, ' ').toUpperCase()}
                </Typography>
                <Chip
                  icon={getTrendIcon(category.trend)}
                  label={category.trend.toUpperCase()}
                  size="small"
                  sx={{
                    fontWeight: 900,
                    fontFamily: 'Orbitron',
                    fontSize: '0.6rem',
                    bgcolor: alpha(getTrendColor(category.trend), 0.1),
                    color: getTrendColor(category.trend),
                    border: `1px solid ${alpha(getTrendColor(category.trend), 0.2)}`,
                    height: 18,
                    '& .MuiChip-icon': { color: 'inherit' }
                  }}
                />
              </Stack>
              <Typography
                variant="h6"
                sx={{ fontWeight: 1000, fontFamily: 'Orbitron', color: getScoreColor(category.avg_score) }}
              >
                {Math.round(category.avg_score)}%
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={category.avg_score}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: alpha(theme.palette.divider, 0.1),
                border: '1px solid rgba(255,255,255,0.05)',
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${getScoreColor(category.avg_score)}, ${alpha(getScoreColor(category.avg_score), 0.6)})`,
                  borderRadius: 4,
                  boxShadow: `0 0 10px ${alpha(getScoreColor(category.avg_score), 0.3)}`
                },
              }}
            />

            <Typography variant="caption" sx={{ mt: 1, display: 'block', fontWeight: 800, color: 'text.secondary', opacity: 0.7 }}>
              {category.question_count} VECTORS ANALYZED
            </Typography>
          </MotionBox>
        ))}
      </Stack>

      {/* Legend Hud */}
      <Box sx={{ mt: 4, p: 2, bgcolor: alpha(theme.palette.divider, 0.03), borderRadius: 3, border: `1px dashed ${alpha(theme.palette.divider, 0.1)}` }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', textAlign: 'center' }}>
          TREND KEY: <span style={{ color: theme.palette.success.main }}>IMPROVING</span> • <span style={{ color: theme.palette.error.main }}>DECLINING</span> • <span style={{ color: theme.palette.text.secondary }}>STABLE</span>
        </Typography>
      </Box>
    </GlassCard>
  );
};

export default CategoryPerformance;
