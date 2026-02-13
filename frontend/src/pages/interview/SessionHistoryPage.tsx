/**
 * Session History Page
 * Display list of all past interview sessions with filtering and sorting
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import { getInterviewSessions } from '../../services/interviewService';

interface Session {
  id: number;
  role: string;
  difficulty: string;
  status: string;
  question_count: number;
  start_time: string;
  end_time?: string;
  created_at: string;
}

function SessionHistoryPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filters
  const [searchRole, setSearchRole] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sessions, searchRole, filterDifficulty, filterStatus, sortBy]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInterviewSessions();
      setSessions(data);
    } catch (err: any) {
      console.error('Error loading sessions:', err);
      setError('Failed to load session history');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    // Search by role
    if (searchRole) {
      filtered = filtered.filter(s => 
        s.role.toLowerCase().includes(searchRole.toLowerCase())
      );
    }

    // Filter by difficulty
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(s => s.difficulty === filterDifficulty);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }

    // Sort
    if (sortBy === 'date') {
      filtered.sort((a, b) => 
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );
    }

    setFilteredSessions(filtered);
    setPage(0); // Reset to first page when filters change
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewSummary = (sessionId: number) => {
    navigate(`/interviews/${sessionId}/summary`);
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'abandoned':
        return 'error';
      default:
        return 'default';
    }
  };

  const getDifficultyColor = (difficulty: string): 'success' | 'info' | 'warning' | 'error' => {
    switch (difficulty) {
      case 'Easy':
        return 'success';
      case 'Medium':
        return 'info';
      case 'Hard':
        return 'warning';
      case 'Expert':
        return 'error';
      default:
        return 'info';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startTime: string, endTime?: string): string => {
    if (!endTime) return 'In Progress';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Session History
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and analyze your past interview sessions
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterListIcon />
          <Typography variant="h6">Filters</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label="Search Role"
              value={searchRole}
              onChange={(e) => setSearchRole(e.target.value)}
              placeholder="e.g., Software Engineer"
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              select
              label="Difficulty"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              size="small"
            >
              <MenuItem value="all">All Difficulties</MenuItem>
              <MenuItem value="Easy">Easy</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Hard">Hard</MenuItem>
              <MenuItem value="Expert">Expert</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              select
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              size="small"
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="abandoned">Abandoned</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              select
              label="Sort By"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
              size="small"
            >
              <MenuItem value="date">Date (Newest First)</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Sessions Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Role</TableCell>
                <TableCell>Difficulty</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Questions</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No sessions found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSessions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((session) => (
                    <TableRow key={session.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {session.role}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={session.difficulty}
                          color={getDifficultyColor(session.difficulty)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={session.status.replace('_', ' ')}
                          color={getStatusColor(session.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{session.question_count}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(session.start_time)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDuration(session.start_time, session.end_time)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Summary">
                          <IconButton
                            size="small"
                            onClick={() => handleViewSummary(session.id)}
                            disabled={session.status !== 'completed'}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredSessions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Summary Stats */}
      {filteredSessions.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Total Sessions
              </Typography>
              <Typography variant="h5">{filteredSessions.length}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
              <Typography variant="h5">
                {filteredSessions.filter(s => s.status === 'completed').length}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
              <Typography variant="h5">
                {filteredSessions.filter(s => s.status === 'in_progress').length}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Total Questions
              </Typography>
              <Typography variant="h5">
                {filteredSessions.reduce((sum, s) => sum + s.question_count, 0)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Actions */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/interviews')}
        >
          Start New Session
        </Button>
      </Box>
    </Box>
  );
}

export default SessionHistoryPage;
