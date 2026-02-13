/**
 * Stats Card Component
 * Display metric with icon and optional trend
 */

import { Card, CardContent, Typography, Box, Stack } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number; // percentage change
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  subtitle?: string;
}

function StatsCard({ title, value, icon, trend, color = 'primary', subtitle }: StatsCardProps) {
  const getTrendColor = (trend: number) => {
    return trend >= 0 ? 'success.main' : 'error.main';
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" color={`${color}.main`} sx={{ mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                {trend >= 0 ? (
                  <TrendingUp fontSize="small" sx={{ color: getTrendColor(trend) }} />
                ) : (
                  <TrendingDown fontSize="small" sx={{ color: getTrendColor(trend) }} />
                )}
                <Typography variant="caption" sx={{ color: getTrendColor(trend) }}>
                  {Math.abs(trend).toFixed(1)}% from last month
                </Typography>
              </Stack>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.lighter`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default StatsCard;
