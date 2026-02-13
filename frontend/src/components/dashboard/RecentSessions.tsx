/**
 * Recent Sessions Component
 * Display list of recent interview sessions
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
} from '@mui/material';
import { ChevronRight, EmojiEvents } from '@mui/icons-material';
import { format } from 'date-fns';

interface Session {
  id: number;
  role: string;
  difficulty: string;
  status: string;
  start_time: string;
  overall_score?: number;
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
          {sessions.map((session, index) => (
            <Box key={session.id}>
              {index > 0 && <Divider />}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => navigate(`/interviews/${session.id}/summary`)}
                  sx={{ py: 2 }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body1">{session.role}</Typography>
                        <Chip
                          label={session.difficulty}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    }
                    secondary={
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(session.start_time), 'MMM dd, yyyy')}
                        </Typography>
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
                    }
                  />
                  <ChevronRight />
                </ListItemButton>
              </ListItem>
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export default RecentSessions;
