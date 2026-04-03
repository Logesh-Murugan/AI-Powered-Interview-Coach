import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
  Stack,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  EmojiEvents,
  TrendingDown,
} from '@mui/icons-material';
import { type CategoryPerformance } from '../../services/analyticsService';
import { GlassCard } from '../common/PremiumComponents';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

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
  const theme = useTheme();
  
  const getCategoryScore = (category: string): number | null => {
    const cat = categoryPerformance.find((c) => c.category === category);
    return cat ? cat.avg_score : null;
  };

  return (
    <GlassCard sx={{ p: 4, height: '100%' }}>
      <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', letterSpacing: '0.05em', mb: 4 }}>
        DIAGNOSTIC OVERVIEW
      </Typography>

      <Grid container spacing={3}>
        {/* Strengths Sector */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.success.main, 0.05),
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              height: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, bgcolor: 'success.main', opacity: 0.1, filter: 'blur(30px)', borderRadius: '50%' }} />
            
            <Stack direction="row" spacing={1.5} alignItems="center" mb={3}>
              <EmojiEvents sx={{ color: 'success.main' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'success.main', letterSpacing: '0.1em' }}>
                PRIMARY STRENGTHS
              </Typography>
            </Stack>

            {strengths.length > 0 ? (
              <List dense disablePadding>
                {strengths.map((str, idx) => {
                  const score = getCategoryScore(str);
                  return (
                    <MotionBox
                      key={str}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircle sx={{ color: 'success.main', fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                {str.replace(/_/g, ' ').toUpperCase()}
                              </Typography>
                              {score && (
                                <Typography variant="caption" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', color: 'success.main' }}>
                                  {Math.round(score)}%
                                </Typography>
                              )}
                            </Stack>
                          }
                        />
                      </ListItem>
                    </MotionBox>
                  );
                })}
              </List>
            ) : (
              <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary', fontWeight: 600 }}>
                AWAITING DATA SYNC...
              </Typography>
            )}
          </Box>
        </Grid>

        {/* Weaknesses Sector */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.warning.main, 0.05),
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              height: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, bgcolor: 'warning.main', opacity: 0.1, filter: 'blur(30px)', borderRadius: '50%' }} />
            
            <Stack direction="row" spacing={1.5} alignItems="center" mb={3}>
              <TrendingDown sx={{ color: 'warning.main' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'warning.main', letterSpacing: '0.1em' }}>
                CRITICAL GAPS
              </Typography>
            </Stack>

            {weaknesses.length > 0 ? (
              <List dense disablePadding>
                {weaknesses.map((wk, idx) => {
                  const score = getCategoryScore(wk);
                  return (
                    <MotionBox
                      key={wk}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Warning sx={{ color: 'warning.main', fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                {wk.replace(/_/g, ' ').toUpperCase()}
                              </Typography>
                              {score && (
                                <Typography variant="caption" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', color: 'warning.main' }}>
                                  {Math.round(score)}%
                                </Typography>
                              )}
                            </Stack>
                          }
                        />
                      </ListItem>
                    </MotionBox>
                  );
                })}
              </List>
            ) : (
              <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary', fontWeight: 600 }}>
                NO CRITICAL GAPS DETECTED.
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, p: 2, bgcolor: alpha(theme.palette.divider, 0.03), borderRadius: 3, border: `1px dashed ${alpha(theme.palette.divider, 0.1)}` }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', textAlign: 'center', letterSpacing: '0.05em' }}>
          NOTE: <span style={{ color: theme.palette.success.main }}>STRENGTHS</span> ≥ 80% • <span style={{ color: theme.palette.warning.main }}>CRITICAL GAPS</span> ≤ 60%
        </Typography>
      </Box>
    </GlassCard>
  );
};

export default StrengthsWeaknesses;
