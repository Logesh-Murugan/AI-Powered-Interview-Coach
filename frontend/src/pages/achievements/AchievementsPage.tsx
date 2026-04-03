/**
 * Premium Achievements Page
 * High-end Milestone Matrix and gamified career evolution interface
 */

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  Stack,
  alpha,
  useTheme,
  LinearProgress,
} from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import {
  EmojiEvents as EmojiEventsIcon,
  MilitaryTech,
  AutoAwesome,
} from '@mui/icons-material';
import {
  getAllAchievements,
  getUserAchievements,
  type AchievementDefinition,
  type UserAchievement,
} from '../../services/achievementsService';
import { motion } from 'framer-motion';
import { GlassCard, GradientText } from '../../components/common/PremiumComponents';

const MotionBox = motion.create(Box);

function AchievementsPage() {
  const theme = useTheme();
  const [allAchievements, setAllAchievements] = useState<AchievementDefinition[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [totalUnlocked, setTotalUnlocked] = useState(0);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allData, userData] = await Promise.all([
        getAllAchievements(),
        getUserAchievements(),
      ]);
      setAllAchievements(allData.achievements);
      setUserAchievements(userData.achievements);
      setTotalUnlocked(userData.total_earned);
      setTotalAvailable(userData.total_available);
      setCompletionPercentage(userData.completion_percentage);
    } catch (err: any) {
      setError(err.message || 'Data retrieval failed.');
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (achievementType: string): UserAchievement | undefined => {
    return userAchievements.find(ua => ua.achievement_type === achievementType);
  };

  const getRarityGlow = (rarity: string) => {
    const colors: Record<string, string> = {
      common: theme.palette.primary.main,
      rare: theme.palette.secondary.main,
      epic: theme.palette.warning.main,
      legendary: '#f43f5e',
    };
    return colors[rarity] || theme.palette.primary.main;
  };

  if (loading) return <LoadingSpinner variant="fullPage" />;
  if (error) return <Box sx={{ p: 4 }}><ErrorAlert message={error} onRetry={loadAchievements} /></Box>;

  return (
    <Box sx={{ pb: 8 }}>
      {/* Header Section */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ mb: 6 }}
      >
        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontFamily: 'Orbitron' }}>MILESTONE <GradientText>MATRIX</GradientText></Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
           CAREER EVOLUTION TELEMETRY AND ACHIEVEMENTS
        </Typography>
      </MotionBox>

      {/* Stats Overview */}
      <GlassCard sx={{ p: 4, mb: 6 }}>
        <Grid container spacing={4}>
           {[
             { label: 'UNLOCKED', value: totalUnlocked, color: 'primary.main', icon: <EmojiEventsIcon /> },
             { label: 'POTENTIAL', value: totalAvailable, color: 'secondary.main', icon: <MilitaryTech /> },
             { label: 'COMPLETION', value: `${completionPercentage.toFixed(1)}%`, color: 'success.main', icon: <AutoAwesome /> },
           ].map((stat, i) => (
             <Grid key={i} size={{ xs: 12, md: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                   <Box sx={{ color: stat.color, mb: 1.5, opacity: 0.5 }}>{stat.icon}</Box>
                   <Typography variant="h3" sx={{ fontWeight: 900, fontFamily: 'Orbitron', color: stat.color }}>{stat.value}</Typography>
                   <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.1em' }}>{stat.label}</Typography>
                </Box>
             </Grid>
           ))}
        </Grid>
        <Box sx={{ mt: 4 }}>
           <LinearProgress variant="determinate" value={completionPercentage} sx={{ height: 6, borderRadius: 3 }} />
        </Box>
      </GlassCard>

      {/* Achievements Grid */}
      <Grid container spacing={3}>
         {allAchievements.map((achievement, i) => {
           const unlocked = isUnlocked(achievement.type);
           const glowColor = getRarityGlow(achievement.rarity);
           
           return (
             <Grid key={achievement.type} size={{ xs: 12, sm: 6, md: 4 }}>
                <MotionBox
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  sx={{ height: '100%' }}
                >
                   <GlassCard 
                     sx={{ 
                       p: 4, 
                       height: '100%', 
                       opacity: unlocked ? 1 : 0.4, 
                       transition: 'all 0.4s ease',
                       border: unlocked ? `1px solid ${alpha(glowColor, 0.3)}` : undefined,
                       boxShadow: unlocked ? `0 0 20px ${alpha(glowColor, 0.1)}` : undefined,
                       '&:hover': unlocked ? { borderColor: glowColor, boxShadow: `0 0 30px ${alpha(glowColor, 0.2)}` } : {}
                     }}
                   >
                      <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
                         <Box sx={{ fontSize: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: unlocked ? 'none' : 'grayscale(100%)' }}>
                            <Typography variant="h1" sx={{ m: 0, p: 0 }}>{achievement.icon}</Typography>
                         </Box>
                         <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron', fontSize: '1rem' }}>{achievement.name.toUpperCase()}</Typography>
                            <Chip 
                              label={achievement.rarity.toUpperCase()} 
                              size="small" 
                              sx={{ 
                                mt: 1, 
                                fontWeight: 900, 
                                bgcolor: alpha(glowColor, 0.1), 
                                color: glowColor, 
                                border: `1px solid ${alpha(glowColor, 0.2)}` 
                              }} 
                            />
                         </Box>
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500, lineHeight: 1.6 }}>{achievement.description}</Typography>
                      
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                         <Typography variant="caption" sx={{ fontWeight: 900, color: unlocked ? 'success.main' : 'text.disabled' }}>
                            {unlocked ? 'STATUS: ACTIVE' : 'STATUS: ARCHIVED'}
                         </Typography>
                         {unlocked && unlocked.earned_at && (
                           <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                              {new Date(unlocked.earned_at).toLocaleDateString()}
                           </Typography>
                         )}
                      </Stack>
                   </GlassCard>
                </MotionBox>
             </Grid>
           );
         })}
      </Grid>
    </Box>
  );
}

export default AchievementsPage;
