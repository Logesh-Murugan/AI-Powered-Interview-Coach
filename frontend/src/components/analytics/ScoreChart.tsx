import React from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { ScoreOverTime } from '../../services/analyticsService';
import { TrendingUp } from '@mui/icons-material';

interface Props {
  data: ScoreOverTime[];
}

const ScoreChart: React.FC<Props> = ({ data }) => {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Score Progression
        </Typography>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={300}
          color="text.secondary"
        >
          <Typography>No score data available yet. Complete more interviews to see your progress.</Typography>
        </Box>
      </Paper>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    week: new Date(item.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: item.avg_score,
    sessions: item.session_count,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            {payload[0].payload.week}
          </Typography>
          <Typography variant="body2" color="primary">
            Average Score: {payload[0].value.toFixed(1)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {payload[0].payload.sessions} session{payload[0].payload.sessions !== 1 ? 's' : ''}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" fontWeight="bold">
          Score Progression Over Time
        </Typography>
      </Box>

      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
              <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="week"
            stroke={theme.palette.text.secondary}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            domain={[0, 100]}
            stroke={theme.palette.text.secondary}
            style={{ fontSize: '12px' }}
            label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="score"
            fill="url(#colorScore)"
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke={theme.palette.primary.main}
            strokeWidth={3}
            dot={{ fill: theme.palette.primary.main, r: 5 }}
            activeDot={{ r: 7 }}
            name="Average Score"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <Box mt={2} display="flex" justifyContent="center">
        <Typography variant="caption" color="text.secondary">
          Weekly average scores across all completed sessions
        </Typography>
      </Box>
    </Paper>
  );
};

export default ScoreChart;
