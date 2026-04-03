/**
 * Premium Leaderboard Page
 * High-end Competitive Lattice and global standing interface
 */

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Chip,
  Switch,
  FormControlLabel,
  Avatar,
  alpha,
  useTheme,
  Stack,
  Grid,
  CircularProgress,
} from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import {
  EmojiEvents as EmojiEventsIcon,
  Public,
  MilitaryTech,
  AutoAwesome,
} from '@mui/icons-material';
import {
  getLeaderboard,
  getLeaderboardPreference,
  updateLeaderboardPreference,
  type LeaderboardEntry,
} from '../../services/leaderboardService';
import { motion } from 'framer-motion';
import { GlassCard, GradientText } from '../../components/common/PremiumComponents';

const MotionBox = motion.create(Box);

function LeaderboardPage() {
  const theme = useTheme();
  const [period, setPeriod] = useState<'weekly' | 'all_time'>('weekly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [optedOut, setOptedOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
    loadPreference();
  }, [period]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLeaderboard(period);
      setLeaderboard(data.leaderboard);
      setCurrentUserRank(data.current_user_rank);
      setTotalParticipants(data.total_participants);
    } catch (err: any) {
      setError(err.message || 'Data retrieval failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreference = async () => {
    try {
      const data = await getLeaderboardPreference();
      setOptedOut(data.opted_out);
    } catch (err) {
      console.error('Preference retrieval failed:', err);
    }
  };

  const handlePreferenceChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newOptedOut = !event.target.checked;
    try {
      await updateLeaderboardPreference(newOptedOut);
      setOptedOut(newOptedOut);
      loadLeaderboard();
    } catch (err: any) {
      setError(err.message || 'Preference update failed.');
    }
  };

  const getRankGlow = (rank: number) => {
    if (rank === 1) return '#facc15'; // Gold
    if (rank === 2) return '#94a3b8'; // Silver
    if (rank === 3) return '#b45309'; // Bronze
    return 'transparent';
  };

  if (loading && leaderboard.length === 0) return <LoadingSpinner variant="fullPage" />;
  if (error) return <Box sx={{ p: 4 }}><ErrorAlert message={error} onRetry={loadLeaderboard} /></Box>;

  return (
    <Box sx={{ pb: 8 }}>
      {/* Header Section */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}
      >
        <Box>
           <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontFamily: 'Orbitron' }}>COMPETITIVE <GradientText>LATTICE</GradientText></Typography>
           <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              GLOBAL RANKINGS AND PERFORMANCE STANDINGS
           </Typography>
        </Box>
        <GlassCard sx={{ p: 1, px: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
           <FormControlLabel
             control={<Switch checked={!optedOut} onChange={handlePreferenceChange} color="primary" sx={{ m: 0 }} />}
             label={<Typography variant="caption" sx={{ fontWeight: 900, fontFamily: 'Orbitron', letterSpacing: '0.1em' }}>PUBLIC VISIBILITY</Typography>}
             sx={{ m: 0 }}
           />
        </GlassCard>
      </MotionBox>

      {/* Stats Summary */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
         {[
           { label: 'GLOBAL RANK', value: currentUserRank ? `#${currentUserRank}` : 'N/A', icon: <MilitaryTech />, color: theme.palette.primary.main },
           { label: 'PARTICIPANTS', value: totalParticipants, icon: <Public />, color: theme.palette.secondary.main },
           { label: 'ACTIVE CYCLE', value: period.toUpperCase().replace('_', ' '), icon: <AutoAwesome />, color: theme.palette.success.main },
         ].map((stat, i) => (
           <Grid key={i} size={{ xs: 12, md: 4 }}>
              <GlassCard sx={{ p: 3, textAlign: 'center' }}>
                 <Box sx={{ color: stat.color, mb: 1.5, opacity: 0.5 }}>{stat.icon}</Box>
                 <Typography variant="h3" sx={{ fontWeight: 900, fontFamily: 'Orbitron', color: stat.color }}>{stat.value}</Typography>
                 <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.1em' }}>{stat.label}</Typography>
              </GlassCard>
           </Grid>
         ))}
      </Grid>

      {/* Leaderboard Module */}
      <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
        <Tabs
          value={period}
          onChange={(_, v) => setPeriod(v)}
          variant="fullWidth"
          sx={{
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            '& .MuiTabs-indicator': { height: 4 },
            '& .MuiTab-root': { py: 3, fontWeight: 900, fontFamily: 'Orbitron', letterSpacing: '0.1em' }
          }}
        >
          <Tab label="WEEKLY STANDINGS" value="weekly" />
          <Tab label="ALL-TIME ARCHIVE" value="all_time" />
        </Tabs>

        {loading ? (
          <Box sx={{ p: 10, textAlign: 'center' }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: alpha(theme.palette.background.paper, 0.4) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, color: 'text.secondary', border: 'none' }}>RANK</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: 'text.secondary', border: 'none' }}>OPERATIVE</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: 'text.secondary', border: 'none' }}>SESSIONS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: 'text.secondary', border: 'none' }}>AVG RATING</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: 'text.secondary', border: 'none' }}>AGGREGATE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboard.map((entry, index) => {
                   const glowColor = getRankGlow(entry.rank);
                   return (
                     <TableRow 
                       key={index} 
                       sx={{ 
                         bgcolor: entry.is_current_user ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                         '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.8) },
                         transition: 'all 0.3s ease'
                       }}
                     >
                       <TableCell sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.03)}` }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                             <Box sx={{ width: 24, display: 'flex', justifyContent: 'center' }}>
                                {entry.rank <= 3 ? <EmojiEventsIcon sx={{ color: glowColor, filter: `drop-shadow(0 0 5px ${glowColor}66)` }} /> : null}
                             </Box>
                             <Typography variant="subtitle2" sx={{ fontWeight: 900, color: glowColor !== 'transparent' ? glowColor : 'text.primary', fontFamily: 'Orbitron' }}>#{entry.rank}</Typography>
                          </Stack>
                       </TableCell>
                       <TableCell sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.03)}` }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                             <Avatar sx={{ width: 32, height: 32, bgcolor: entry.is_current_user ? 'primary.main' : 'background.paper', border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, fontSize: '0.8rem', fontWeight: 900 }}>
                                {entry.username.charAt(0).toUpperCase()}
                             </Avatar>
                             <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{entry.username.toUpperCase()}</Typography>
                             {entry.is_current_user && <Chip label="YOU" size="small" color="primary" sx={{ fontWeight: 900, height: 18, fontSize: '0.6rem' }} />}
                          </Stack>
                       </TableCell>
                       <TableCell align="right" sx={{ fontWeight: 800, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.03)}` }}>{entry.sessions_completed}</TableCell>
                       <TableCell align="right" sx={{ fontWeight: 900, color: 'primary.main', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.03)}` }}>{entry.average_score.toFixed(1)}%</TableCell>
                       <TableCell align="right" sx={{ fontWeight: 900, fontFamily: 'Orbitron', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.03)}` }}>{(entry.average_score * entry.sessions_completed).toFixed(0)}</TableCell>
                     </TableRow>
                   );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </GlassCard>
    </Box>
  );
}

export default LeaderboardPage;
