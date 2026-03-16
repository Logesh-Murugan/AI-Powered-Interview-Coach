/**
 * Leaderboard Page
 * Display rankings and competitive standings
 */

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Alert,
  Chip,
  Switch,
  FormControlLabel,
  Avatar,
} from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  getLeaderboard,
  getLeaderboardPreference,
  updateLeaderboardPreference,
  type LeaderboardEntry,
} from '../../services/leaderboardService';
import FadeIn from '../../components/animations/FadeIn';

function LeaderboardPage() {
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
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const loadPreference = async () => {
    try {
      const data = await getLeaderboardPreference();
      setOptedOut(data.opted_out);
    } catch (err) {
      console.error('Failed to load preference:', err);
    }
  };

  const handlePreferenceChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newOptedOut = !event.target.checked;
    try {
      await updateLeaderboardPreference(newOptedOut);
      setOptedOut(newOptedOut);
      loadLeaderboard(); // Reload to reflect changes
    } catch (err: any) {
      setError(err.message || 'Failed to update preference');
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return '#CD7F32'; // bronze
    return 'inherit';
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <EmojiEventsIcon sx={{ color: getRankColor(rank) }} />;
    }
    return null;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <FadeIn>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon fontSize="large" />
            Leaderboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            See how you rank against other users
          </Typography>
        </Box>

        <Paper sx={{ mb: 3, p: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={!optedOut}
                onChange={handlePreferenceChange}
                color="primary"
              />
            }
            label="Participate in leaderboard"
          />
          <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4 }}>
            {optedOut
              ? 'You are currently opted out of the leaderboard'
              : 'Your scores will be visible on the leaderboard'}
          </Typography>
        </Paper>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={period}
            onChange={(_, newValue) => setPeriod(newValue)}
            centered
          >
            <Tab label="Weekly" value="weekly" />
            <Tab label="All Time" value="all_time" />
          </Tabs>
        </Paper>

        {currentUserRank && !optedOut && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Your current rank: #{currentUserRank} out of {totalParticipants} participants
          </Alert>
        )}

        {loading ? (
          <LoadingSpinner variant="fullPage" text="Loading leaderboard..." />
        ) : error ? (
          <ErrorAlert
            message={error}
            onRetry={loadLeaderboard}
          />
        ) : leaderboard.length === 0 ? (
          <Alert severity="info">
            No leaderboard data available yet. Complete some interview sessions to appear on the leaderboard!
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell align="right">Sessions</TableCell>
                  <TableCell align="right">Avg Score</TableCell>
                  <TableCell align="right">Total Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboard.map((entry) => (
                  <TableRow
                    key={`${entry.rank}-${entry.username}`}
                    sx={{
                      backgroundColor: entry.is_current_user ? 'action.selected' : 'inherit',
                      fontWeight: entry.is_current_user ? 'bold' : 'normal',
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getRankIcon(entry.rank)}
                        <Typography
                          sx={{
                            color: getRankColor(entry.rank),
                            fontWeight: entry.rank <= 3 ? 'bold' : 'normal',
                          }}
                        >
                          #{entry.rank}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {entry.username.charAt(0).toUpperCase()}
                        </Avatar>
                        {entry.username}
                        {entry.is_current_user && (
                          <Chip label="You" size="small" color="primary" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{entry.sessions_completed}</TableCell>
                    <TableCell align="right">{entry.average_score.toFixed(1)}%</TableCell>
                    <TableCell align="right">{(entry.average_score * entry.sessions_completed).toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </FadeIn>
    </Container>
  );
}

export default LeaderboardPage;

