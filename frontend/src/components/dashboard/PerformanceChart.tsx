/**
 * Performance Chart Widget
 * Displays line chart showing score trends over last 30 days
 * Requirements: COMP-2.4
 */

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import analyticsService, { type ScoreOverTime } from '../../services/analyticsService';

interface ChartDataPoint {
  week: string;
  score: number;
  sessions: number;
}

function PerformanceChart() {
  const theme = useTheme();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await analyticsService.getAnalyticsOverview();
      
      // Transform score_over_time data for chart
      const transformedData = data.score_over_time.map((item: ScoreOverTime) => ({
        week: item.week,
        score: Math.round(item.avg_score),
        sessions: item.session_count,
      }));
      
      setChartData(transformedData);
      setAverageScore(data.average_score_last_30_days);
    } catch (err) {
      console.error('Error loading performance data:', err);
      setError('Unable to load performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TrendingUpIcon sx={{ mr: 1, color: 'info.main' }} />
            <Typography variant="h6" component="h2">
              Performance Trend
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Complete some interview sessions to see your performance trend.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrendingUpIcon sx={{ mr: 1, color: 'info.main' }} />
          <Typography variant="h6" component="h2">
            Performance Trend
          </Typography>
        </Box>

        <Box sx={{ width: '100%', height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                stroke={theme.palette.divider}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                stroke={theme.palette.divider}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 4,
                }}
                labelStyle={{ color: theme.palette.text.primary }}
                formatter={(value: number | undefined, name: string) => {
                  if (value === undefined) return ['N/A', name];
                  if (name === 'score') return [`${value}%`, 'Score'];
                  if (name === 'sessions') return [value, 'Sessions'];
                  return [value, name];
                }}
              />
              {averageScore !== null && (
                <ReferenceLine
                  y={averageScore}
                  stroke={theme.palette.warning.main}
                  strokeDasharray="5 5"
                  label={{
                    value: `Avg: ${Math.round(averageScore)}%`,
                    position: 'right',
                    fill: theme.palette.text.secondary,
                    fontSize: 12,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="score"
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                dot={{ fill: theme.palette.primary.main, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Score trends over the last 30 days
        </Typography>
      </CardContent>
    </Card>
  );
}

export default PerformanceChart;
