/**
 * Recent Sessions Component
 * Display list of recent interview sessions with resume functionality
 */

import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Box,
  Stack,
  Divider,
  Button,
  LinearProgress,
} from '@mui/material';
import { ChevronRight, EmojiEvents, PlayArrow } from '@mui/icons-material';
import { format } from 'date-fns';

interface Session {
  id: number;
  role: string;
  difficulty: string;
  status: string;
  start_time: string;
  overall_score?: number;
  question_count?: number;
  answered_count?: number;
}

interface RecentSessionsProps {
  sessions: Session[];
  loading?: boolean;
}

function RecentSessions({ sessions, loading }: RecentSessionsProps) {
  const navigate = useNavigate();

  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'default' => {
    if (status === 'completed') return 'success';
    if (status === 'in_progress') return 'warning';
    return 'default';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      in_progress: 'In Progress',
      completed: 'Completed',
      abandoned: 'Abandoned',
    };
    return labels[status] || status;
  };

  const handleResumeSession = (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to summary
    navigate(`/interviews/${sessionId}/resume`);
  };

  const handleViewSummary = (sessionId: number) => {
    navigate(`/interviews/${sessionId}/summary`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Sessions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Sessions
          </Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <EmojiEvents sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No interview sessions yet. Start your first interview!
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Sessions
        </Typography>
        <List disablePadding>
          {sessions.map((session, index) => {
            const isInProgress = session.status.toLowerCase() === 'in_progress';
            const progress = session.question_count && session.answered_count
              ? (session.answered_count / session.question_count) * 100
              : 0;

            return (
              <Box key={session.id}>
                {index > 0 && <Divider />}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={isInProgress ? undefined : () => handleViewSummary(session.id)}
                    sx={{ py: 2, cursor: isInProgress ? 'default' : 'pointer' }}
                    disabled={false}
                  >
                    <Box sx={{ width: '100%' }}>
                      {/* Primary content */}
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body1" component="div">{session.role}</Typography>
                        {session.difficulty && (
                          <Chip
                            label={session.difficulty}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                      
                      {/* Secondary content */}
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          {session.start_time && (
                            <Typography variant="caption" color="text.secondary" component="div">
                              {format(new Date(session.start_time), 'MMM dd, yyyy')}
                            </Typography>
                          )}
                          <Chip
                            label={getStatusLabel(session.status)}
                            size="small"
                            color={getStatusColor(session.status)}
                          />
                          {session.overall_score !== undefined && (
                            <Chip
                              label={`${session.overall_score.toFixed(0)}%`}
                              size="small"
                              color={getScoreColor(session.overall_score)}
                            />
                          )}
                        </Stack>
                        {isInProgress && session.question_count && session.answered_count !== undefined && (
                          <Box sx={{ width: '100%' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" component="div">
                                {session.answered_count} of {session.question_count} answered
                              </Typography>
                              <Typography variant="caption" color="text.secondary" component="div">
                                {progress.toFixed(0)}%
                              </Typography>
                            </Stack>
                            <LinearProgress variant="determinate" value={progress} />
                          </Box>
                        )}
                      </Stack>
                    </Box>
                    {isInProgress ? (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<PlayArrow />}
                        onClick={(e) => handleResumeSession(session.id, e)}
                        sx={{ ml: 1 }}
                      >
                        Continue
                      </Button>
                    ) : (
                      <ChevronRight />
                    )}
                  </ListItemButton>
                </ListItem>
              </Box>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
}

export default RecentSessions;
