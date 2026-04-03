import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Grid,
  LinearProgress,
  alpha,
  useTheme,
  Stack,
} from '@mui/material';
import {
  Lightbulb,
  Flag,
  TrendingUp,
} from '@mui/icons-material';
import { type PracticeRecommendation } from '../../services/analyticsService';
import { GlassCard } from '../common/PremiumComponents';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

interface Props {
  recommendations: PracticeRecommendation[];
}

const PracticeRecommendations: React.FC<Props> = ({ recommendations }) => {
  const theme = useTheme();

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return theme.palette.error.main;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.info.main;
      default: return theme.palette.primary.main;
    }
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <GlassCard sx={{ p: 4, height: '100%', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Lightbulb sx={{ fontSize: 60, color: alpha(theme.palette.divider, 0.1), mb: 2 }} />
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary' }}>NO TACTICAL ADVISORIES AT THIS TIME.</Typography>
      </GlassCard>
    );
  }

  return (
    <GlassCard sx={{ p: 4, height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, bgcolor: 'primary.main', opacity: 0.1, filter: 'blur(80px)', borderRadius: '50%' }} />

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
         <Lightbulb sx={{ color: 'primary.main' }} />
         <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', letterSpacing: '0.05em' }}>ADAPTIVE ADVISORIES</Typography>
      </Stack>

      <Grid container spacing={3}>
        {recommendations.map((rec, idx) => (
          <Grid size={{ xs: 12, md: 6 }} key={rec.category}>
            <MotionBox
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
              sx={{ height: '100%' }}
            >
              <Box
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.background.paper, 0.3),
                  border: `1px solid ${alpha(getPriorityColor(rec.priority), 0.2)}`,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                 <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="body1" sx={{ fontWeight: 1000, color: 'text.primary', letterSpacing: '0.05em' }}>
                      {rec.category.replace(/_/g, ' ').toUpperCase()}
                    </Typography>
                    <Chip
                      icon={<Flag sx={{ fontSize: 14 }} />}
                      label={rec.priority.toUpperCase()}
                      size="small"
                      sx={{
                        fontWeight: 900,
                        fontFamily: 'Orbitron',
                        fontSize: '0.6rem',
                        bgcolor: alpha(getPriorityColor(rec.priority), 0.1),
                        color: getPriorityColor(rec.priority),
                        border: `1px solid ${alpha(getPriorityColor(rec.priority), 0.3)}`,
                        '& .MuiChip-icon': { color: 'inherit' }
                      }}
                    />
                 </Stack>

                 <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 3, flex: 1, lineHeight: 1.6 }}>
                    {rec.suggestion.toUpperCase()}
                 </Typography>

                 <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-end" mb={1}>
                       <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.disabled', letterSpacing: '0.1em' }}>MASTERY VECTOR</Typography>
                       <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', color: 'text.secondary' }}>{Math.round(rec.current_score)}%</Typography>
                          <TrendingUp fontSize="small" sx={{ color: 'success.main', fontSize: 16 }} />
                          <Typography variant="caption" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', color: 'success.main' }}>{Math.round(rec.target_score)}%</Typography>
                       </Stack>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={(rec.current_score / rec.target_score) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.divider, 0.1),
                        border: '1px solid rgba(255,255,255,0.05)',
                        '& .MuiLinearProgress-bar': {
                          background: `linear-gradient(90deg, ${getPriorityColor(rec.priority)}, ${alpha(getPriorityColor(rec.priority), 0.6)})`,
                          borderRadius: 4,
                          boxShadow: `0 0 10px ${alpha(getPriorityColor(rec.priority), 0.3)}`
                        },
                      }}
                    />
                 </Box>
              </Box>
            </MotionBox>
          </Grid>
        ))}
      </Grid>

      {/* Advisory Tip */}
      <Box sx={{ mt: 4, p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 3, border: `1px dashed ${alpha(theme.palette.info.main, 0.2)}` }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'info.main', display: 'block', textAlign: 'center' }}>
          STRATEGIC ALERT: PRIORITIZE HIGH-VELOCITY VECTORS FOR OPTIMAL PERFORMANCE SCALING.
        </Typography>
      </Box>
    </GlassCard>
  );
};

export default PracticeRecommendations;
