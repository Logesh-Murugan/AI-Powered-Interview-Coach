/**
 * Premium Achievement Progress Widget
 * High-end AI "Reputation Metric" tracker
 */

import { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  LinearProgress,
  Stack,
  CircularProgress,
  alpha,
  useTheme,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StarsIcon from '@mui/icons-material/Stars';
import { getUserAchievements } from '../../services/achievementsService';
import type { UserAchievement } from '../../services/achievementsService';
import { GlassCard } from '../common/PremiumComponents';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

function AchievementProgress() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserAchievements();
      const recentAchievements = data.achievements
        .filter(a => a.earned_at)
        .sort((a, b) => new Date(b.earned_at!).getTime() - new Date(a.earned_at!).getTime())
        .slice(0, 3);

      setAchievements(recentAchievements);
      setCompletionPercentage(data.completion_percentage);
      setTotalPoints(data.total_earned);
    } catch (err) {
      console.error('Error:', err);
      setError('Reputation sync failure');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <GlassCard sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={30} thickness={5} />
    </GlassCard>
  );

  return (
    <GlassCard sx={{ p: 4, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
           <EmojiEventsIcon sx={{ color: 'warning.main' }} />
           <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', letterSpacing: '0.05em' }}>REPUTATION ARCHIVE</Typography>
        </Stack>
        <IconButton onClick={() => navigate('/achievements')} size="small" sx={{ bgcolor: alpha(theme.palette.background.paper, 0.3) }}>
           <ArrowForwardIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* Completion Meter */}
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: '0.1em' }}>GLOBAL COMPLETION</Typography>
          <Typography variant="h4" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', color: 'primary.main', mb: -0.5 }}>{completionPercentage.toFixed(0)}%</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={completionPercentage}
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
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
           <StarsIcon sx={{ fontSize: 14, color: 'warning.main' }} />
           <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>{totalPoints} CREDITS EARNED</Typography>
        </Stack>
      </Box>

      {/* Recent Unlocks */}
      <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: '0.1em', display: 'block', mb: 2 }}>RECENT UNLOCKS</Typography>
      
      {achievements.length > 0 ? (
        <Stack spacing={2}>
          {achievements.map((userAchievement, idx) => (
            <MotionBox
              key={userAchievement.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              sx={{
                p: 2,
                borderRadius: 4,
                bgcolor: alpha(theme.palette.background.paper, 0.3),
                border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  borderColor: alpha(theme.palette.warning.main, 0.4),
                  transform: 'scale(1.02)'
                }
              }}
            >
              <Box sx={{ fontSize: '1.8rem', opacity: 0.9 }}>🏆</Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 900, mb: 0.2 }}>{userAchievement.achievement_type.replace(/_/g, ' ').toUpperCase()}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block' }}>
                  {userAchievement.earned_at ? format(new Date(userAchievement.earned_at), 'MMM dd | HH:mm') : 'ANALYZING...'}
                </Typography>
              </Box>
            </MotionBox>
          ))}
        </Stack>
      ) : (
        <Box sx={{ py: 6, textAlign: 'center', bgcolor: alpha(theme.palette.divider, 0.03), borderRadius: 4, border: `1px dashed ${alpha(theme.palette.divider, 0.1)}` }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled' }}>NO RECENT DATA VECTORS FOUND.</Typography>
        </Box>
      )}
    </GlassCard>
  );
}

// Internal reusable helper
const format = (date: Date, pattern: string) => {
    // Simple mock for speed, we should use date-fns if available in scope
    return date.toLocaleDateString(); 
};

export default AchievementProgress;
