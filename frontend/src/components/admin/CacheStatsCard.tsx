/**
 * Cache Stats Card Component
 * Display overall cache hit rate and summary statistics
 * 
 * Requirements: INT-4.3, INT-4.5
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { useAppSelector } from '../../store/hooks';

const CacheStatsCard: React.FC = () => {
  const { stats, alert } = useAppSelector((state) => state.cacheStats);

  if (!stats) {
    return null;
  }

  const { overall } = stats;
  const hitRate = overall.hit_rate * 100;

  // Determine color based on hit rate
  const getColor = (rate: number): string => {
    if (rate >= 90) return 'success.main';
    if (rate >= 85) return 'warning.main';
    return 'error.main';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Cache Performance
        </Typography>

        {/* Alert banner when hit rate < 85% */}
        {alert?.alert_active && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {alert.message}
          </Alert>
        )}

        {/* Overall hit rate gauge */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            my: 3,
          }}
        >
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={hitRate}
              size={120}
              thickness={4}
              sx={{ color: getColor(hitRate) }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h4" component="div" color="text.secondary">
                {hitRate.toFixed(1)}%
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Overall Hit Rate
          </Typography>
        </Box>

        {/* Summary statistics */}
        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">{overall.cache_hits.toLocaleString()}</Typography>
            <Typography variant="body2" color="text.secondary">
              Hits
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">{overall.cache_misses.toLocaleString()}</Typography>
            <Typography variant="body2" color="text.secondary">
              Misses
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">{overall.total_requests.toLocaleString()}</Typography>
            <Typography variant="body2" color="text.secondary">
              Total Requests
            </Typography>
          </Box>
        </Box>

        {/* View Details link */}
        <Box sx={{ textAlign: 'center' }}>
          <Button
            component={Link}
            to="/admin/cache-stats"
            variant="outlined"
            size="small"
          >
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CacheStatsCard;
