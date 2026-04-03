import React from 'react';
import { Box, Typography, alpha, useTheme, Stack } from '@mui/material';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line
} from 'recharts';
import { type AnalyticsOverview } from '../../services/analyticsService';
import { Assessment, Timeline } from '@mui/icons-material';
import { GlassCard } from '../common/PremiumComponents';

interface Props {
  analytics: AnalyticsOverview;
}

const ScoreChart: React.FC<Props> = ({ analytics }) => {
  const theme = useTheme();

  const data = analytics.recent_session_scores;

  if (!data || data.length === 0) {
    return (
      <GlassCard sx={{ p: 4, height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Timeline sx={{ fontSize: 60, color: alpha(theme.palette.divider, 0.1), mb: 2 }} />
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary' }}>NO TEMPORAL SCORE DATA UNLOCKED.</Typography>
      </GlassCard>
    );
  }

  const chartData = data.map((item) => {
    const date = new Date(item.date);
    return {
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase(),
      score: Math.round(item.score),
      fullDate: item.date,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <GlassCard sx={{ p: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`, minWidth: 150, bgcolor: 'rgba(15, 23, 42, 0.95)' }}>
          <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', display: 'block', mb: 1 }}>{payload[0].payload.fullDate}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#3B82F6' }}>SCORE:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 1000, color: '#3B82F6', fontFamily: 'Orbitron' }}>{payload[0]?.value}%</Typography>
          </Box>
        </GlassCard>
      );
    }
    return null;
  };

  return (
    <GlassCard sx={{ p: 4, height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, bgcolor: 'primary.main', opacity: 0.1, filter: 'blur(80px)', borderRadius: '50%' }} />
      
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
         <Assessment sx={{ color: 'primary.main' }} />
         <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', letterSpacing: '0.05em' }}>PERFORMANCE PULSE</Typography>
      </Stack>

      <Box sx={{ width: '100%', height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="0" vertical={true} stroke="rgba(255,255,255,0.08)" />
            <XAxis
              dataKey="label"
              stroke={alpha(theme.palette.text.secondary, 0.5)}
              axisLine={false}
              tickLine={false}
              style={{ fontSize: '10px', fontWeight: 900, fontFamily: 'Orbitron' }}
              dy={10}
              minTickGap={20}
            />

            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              stroke={alpha(theme.palette.text.secondary, 0.5)}
              axisLine={false}
              tickLine={false}
              style={{ fontSize: '10px', fontWeight: 900, fontFamily: 'Orbitron' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Line
              name="Interview Score"
              type="monotone"
              dataKey="score"
              stroke={theme.palette.text.primary}
              strokeWidth={4}
              dot={{ fill: '#3B82F6', strokeWidth: 4, r: 8, stroke: 'rgba(59, 130, 246, 0.2)' }}
              activeDot={{ r: 10, strokeWidth: 0, fill: '#60A5FA' }}
              animationDuration={2000}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: '0.1em', fontFamily: 'Orbitron' }}>
          INDIVIDUAL PERFORMANCE VECTORS — REAL-TIME ANALYSIS
        </Typography>
      </Box>
    </GlassCard>
  );
};

export default ScoreChart;


