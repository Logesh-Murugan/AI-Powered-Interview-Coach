/**
 * Premium StreakCard Component
 * High-end dashboard widget with animations and glassmorphic design
 */

import { useEffect, useState } from 'react';
import { Typography, Box, LinearProgress, CircularProgress, alpha, useTheme, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { getCurrentStreak } from '../../services/streaksService';
import type { CurrentStreakResponse } from '../../services/streaksService';
import { GlassCard, GradientButton } from '../common/PremiumComponents';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

function StreakCard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [streakData, setStreakData] = useState<CurrentStreakResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      setLoading(true);
      const data = await getCurrentStreak();
      setStreakData(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Connection interrupted');
    } finally {
      setLoading(false);
    }
  };

  const getProgressValue = () => {
    if (!streakData || streakData.longest_streak === 0) return 0;
    return Math.min((streakData.current_streak / streakData.longest_streak) * 100, 100);
  };

  if (loading) return (
    <GlassCard sx={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={30} thickness={5} />
    </GlassCard>
  );

  if (error || !streakData) return (
    <GlassCard sx={{ p: 4, textAlign: 'center' }}>
      <Typography color="error" variant="body2">{error || 'Data shielded'}</Typography>
    </GlassCard>
  );

  return (
    <GlassCard sx={{ 
      p: 4, 
      position: 'relative', 
      overflow: 'hidden',
      background: streakData.streak_active 
        ? `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`
        : undefined
    }}>
      {/* Background Glow */}
      {streakData.streak_active && (
        <Box sx={{ 
          position: 'absolute', 
          top: -50, 
          right: -50, 
          width: 150, 
          height: 150, 
          borderRadius: '50%', 
          bgcolor: 'error.main', 
          filter: 'blur(100px)', 
          opacity: 0.15,
          zIndex: 0
        }} />
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ 
            p: 1, 
            borderRadius: 2, 
            bgcolor: streakData.streak_active ? 'error.main' : 'grey.800', 
            color: 'white',
            boxShadow: streakData.streak_active ? `0 0 20px ${alpha(theme.palette.error.main, 0.4)}` : 'none',
            display: 'flex'
          }}>
            <LocalFireDepartmentIcon />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', letterSpacing: '0.05em' }}>STREAK</Typography>
        </Stack>
        <Typography variant="caption" sx={{ fontWeight: 900, p: 0.5, px: 1.5, borderRadius: 10, bgcolor: streakData.streak_active ? 'success.main' : 'grey.800', color: 'white' }}>
          {streakData.streak_active ? 'ACTIVE' : 'DORMANT'}
        </Typography>
      </Stack>

      <Box sx={{ textAlign: 'center', mb: 4, position: 'relative', zIndex: 1 }}>
        <MotionBox
          animate={streakData.streak_active ? { scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          sx={{ display: 'inline-block' }}
        >
          <Typography variant="h1" sx={{ fontSize: '5rem', fontWeight: 900, mb: -1, lineHeight: 1, fontFamily: 'Orbitron', color: streakData.streak_active ? 'error.main' : 'text.primary' }}>
            {streakData.current_streak}
          </Typography>
        </MotionBox>
        <Typography variant="overline" sx={{ letterSpacing: '0.3em', fontWeight: 900, color: 'text.secondary', display: 'block', mt: 1 }}>
          DAYS RUNNING
        </Typography>
      </Box>

      <Box sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 900, opacity: 0.7, letterSpacing: '0.1em' }}>PROGRESS TO PEAK</Typography>
          <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', fontFamily: 'Orbitron' }}>{streakData.longest_streak} DAYS</Typography>
        </Stack>
        <LinearProgress 
          variant="determinate" 
          value={getProgressValue()} 
          sx={{ 
            height: 10, 
            borderRadius: 5, 
            bgcolor: alpha(theme.palette.divider, 0.1),
            border: '1px solid rgba(255,255,255,0.05)',
            '& .MuiLinearProgress-bar': { 
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.4)}`
            } 
          }} 
        />
      </Box>

      <GradientButton fullWidth onClick={() => navigate('/streaks')}>
        EXPLORE HISTORY
      </GradientButton>
    </GlassCard>
  );
}

export default StreakCard;
