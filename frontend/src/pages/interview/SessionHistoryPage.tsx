/**
 * Session History Page
 * Display list of all past interview sessions with filtering and sorting
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import DownloadIcon from '@mui/icons-material/Download';
import { getInterviewSessions } from '../../services/interviewService';
import api from '../../services/api.service';

interface Session {
  id: number;
  role: string;
  difficulty: string;
  status: string;
  question_count: number;
  start_time: string;
  end_time?: string;
  created_at: string;
  overall_session_score?: number;
}

function SessionHistoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filters - Initialize from URL query parameters
  const [searchRole, setSearchRole] = useState(searchParams.get('role') || '');
  const [filterDifficulty, setFilterDifficulty] = useState(searchParams.get('difficulty') || 'all');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all');
  const [filterDateRange, setFilterDateRange] = useState(searchParams.get('dateRange') || 'all');
  const [filterScoreRange, setFilterScoreRange] = useState(searchParams.get('scoreRange') || 'all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>((searchParams.get('sortBy') as 'date' | 'score') || 'date');

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sessions, searchRole, filterDifficulty, filterStatus, filterDateRange, filterScoreRange, sortBy]);

  // Update URL query parameters when filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchRole) params.role = searchRole;
    if (filterDifficulty !== 'all') params.difficulty = filterDifficulty;
    if (filterStatus !== 'all') params.status = filterStatus;
    if (filterDateRange !== 'all') params.dateRange = filterDateRange;
    if (filterScoreRange !== 'all') params.scoreRange = filterScoreRange;
    if (sortBy !== 'date') params.sortBy = sortBy;
    
    setSearchParams(params);
  }, [searchRole, filterDifficulty, filterStatus, filterDateRange, filterScoreRange, sortBy, setSearchParams]);

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

    // Filter by date range
    if (filterDateRange !== 'all') {
      const now = new Date();
      const daysAgo = filterDateRange === '7days' ? 7 : filterDateRange === '30days' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(s => new Date(s.start_time) >= cutoffDate);
    }

    // Filter by score range
    if (filterScoreRange !== 'all' && filterScoreRange !== 'no_score') {
      filtered = filtered.filter(s => {
        if (!s.overall_session_score) return false;
        
        const score = s.overall_session_score;
        switch (filterScoreRange) {
          case '0-60':
            return score < 60;
          case '60-75':
            return score >= 60 && score < 75;
          case '75-85':
            return score >= 75 && score < 85;
          case '85-100':
            return score >= 85;
          default:
            return true;
        }
      });
    } else if (filterScoreRange === 'no_score') {
      filtered = filtered.filter(s => !s.overall_session_score);
    }

    // Sort
    if (sortBy === 'date') {
      filtered.sort((a, b) => 
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );
    } else if (sortBy === 'score') {
      filtered.sort((a, b) => {
        const scoreA = a.overall_session_score || 0;
        const scoreB = b.overall_session_score || 0;
        return scoreB - scoreA;
      });
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

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setExportError(null);

      // Call export endpoint
      const response = await api.get('/export/sessions', {
        responseType: 'blob', // Important for file download
      });

      // Create blob from response
      const blob = new Blob([response.data], { type: 'text/csv' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      link.download = `interview_sessions_${date}.csv`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exporting sessions:', err);
      setExportError(err.response?.data?.detail || 'Failed to export session history');
    } finally {
      setExporting(false);
    }
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
      <LoadingSpinner variant="fullPage" text="Loading session history..." />
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Session History
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and analyze your past interview sessions
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
          onClick={handleExportCSV}
          disabled={exporting || sessions.length === 0}
        >
          {exporting ? 'Exporting...' : 'Export to CSV'}
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          message={error}
          onRetry={loadSessions}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Export Error Alert */}
      {exportError && (
        <Alert severity="error" onClose={() => setExportError(null)} sx={{ mb: 3 }}>
          {exportError}
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
              label="Date Range"
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              size="small"
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="7days">Last 7 Days</MenuItem>
              <MenuItem value="30days">Last 30 Days</MenuItem>
              <MenuItem value="90days">Last 90 Days</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              select
              label="Score Range"
              value={filterScoreRange}
              onChange={(e) => setFilterScoreRange(e.target.value)}
              size="small"
            >
              <MenuItem value="all">All Scores</MenuItem>
              <MenuItem value="85-100">85-100 (Excellent)</MenuItem>
              <MenuItem value="75-85">75-85 (Good)</MenuItem>
              <MenuItem value="60-75">60-75 (Fair)</MenuItem>
              <MenuItem value="0-60">Below 60 (Needs Work)</MenuItem>
              <MenuItem value="no_score">No Score</MenuItem>
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
              <MenuItem value="score">Score (Highest First)</MenuItem>
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
                <TableCell>Score</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ p: 0, border: 'none' }}>
                    <EmptyState
                      message="No results found"
                      icon={<SearchOffIcon sx={{ fontSize: 60 }} />}
                      action={
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setSearchRole('');
                            setFilterDifficulty('all');
                            setFilterStatus('all');
                            setFilterDateRange('all');
                            setFilterScoreRange('all');
                          }}
                        >
                          Clear Filters
                        </Button>
                      }
                    />
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
                        {session.overall_session_score !== undefined ? (
                          <Typography
                            variant="body2"
                            fontWeight="medium"
                            color={
                              session.overall_session_score >= 85
                                ? 'success.main'
                                : session.overall_session_score >= 75
                                ? 'info.main'
                                : session.overall_session_score >= 60
                                ? 'warning.main'
                                : 'error.main'
                            }
                          >
                            {session.overall_session_score.toFixed(1)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>
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
