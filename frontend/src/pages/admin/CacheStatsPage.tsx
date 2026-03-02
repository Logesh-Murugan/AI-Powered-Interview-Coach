/**
 * Cache Stats Page
 * Full cache monitoring dashboard with auto-refresh
 * 
 * Requirements: INT-4.2, INT-4.3, INT-4.4, INT-4.5, INT-4.6, INT-4.7, INT-4.9
 */

import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchStats, fetchAlert, resetStats, clearError } from '../../store/slices/cacheStatsSlice';
import CacheLayerTable from '../../components/admin/CacheLayerTable';

const CacheStatsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stats, alert, isLoading, error, lastUpdated } = useAppSelector(
    (state) => state.cacheStats
  );
  const { user } = useAppSelector((state) => state.auth);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Check if user is admin
  const isAdmin = user?.email?.includes('admin') ?? false;

  // Fetch stats on mount
  useEffect(() => {
    dispatch(fetchStats());
    dispatch(fetchAlert());
  }, [dispatch]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      dispatch(fetchStats());
      dispatch(fetchAlert());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [dispatch, autoRefresh]);

  const handleManualRefresh = () => {
    dispatch(fetchStats());
    dispatch(fetchAlert());
  };

  const handleResetConfirm = async () => {
    await dispatch(resetStats());
    setResetDialogOpen(false);
    // Refresh stats after reset
    dispatch(fetchStats());
    dispatch(fetchAlert());
  };

  const handleResetCancel = () => {
    setResetDialogOpen(false);
  };

  if (isLoading && !stats) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <LoadingSpinner text="Loading cache statistics..." />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4">Cache Statistics</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
              }
              label="Auto-refresh"
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleManualRefresh}
              disabled={isLoading}
            >
              Refresh
            </Button>
            {isAdmin && (
              <Button
                variant="contained"
                color="error"
                onClick={() => setResetDialogOpen(true)}
                disabled={isLoading}
              >
                Reset Stats
              </Button>
            )}
          </Box>
        </Box>

        {/* Error alert */}
        {error && (
          <ErrorAlert
            message={error}
            onRetry={handleManualRefresh}
            onDismiss={() => dispatch(clearError())}
          />
        )}

        {/* Cache alert banner */}
        {alert?.alert_active && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {alert.message}
          </Alert>
        )}

        {/* Last updated timestamp */}
        {lastUpdated && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </Typography>
        )}

        {/* Overall stats card */}
        {stats && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Overall Performance
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 3,
                p: 3,
                bgcolor: 'background.paper',
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="h4" color="primary">
                  {(stats.overall.hit_rate * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hit Rate
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="h4">
                  {stats.overall.cache_hits.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cache Hits
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="h4">
                  {stats.overall.cache_misses.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cache Misses
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="h4">
                  {stats.overall.total_requests.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Requests
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Layer statistics table */}
        {stats && stats.layers.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Layer Statistics
            </Typography>
            <CacheLayerTable layers={stats.layers} />
          </Box>
        )}

        {/* No data state */}
        {!stats && !isLoading && (
          <Alert severity="info">No cache statistics available</Alert>
        )}
      </Box>

      {/* Reset confirmation dialog */}
      <Dialog open={resetDialogOpen} onClose={handleResetCancel}>
        <DialogTitle>Reset Cache Statistics?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will reset all cache statistics to zero. This action cannot be undone.
            Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetCancel}>Cancel</Button>
          <Button onClick={handleResetConfirm} color="error" autoFocus>
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CacheStatsPage;
