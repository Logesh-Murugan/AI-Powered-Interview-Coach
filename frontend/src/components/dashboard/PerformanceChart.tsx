import { useEffect, useState } from 'react';
import { Typography, Box, CircularProgress, alpha, useTheme, Stack } from '@mui/material';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import analyticsService, { type ScoreOverTime, type SessionScore } from '../../services/analyticsService';

interface ChartDataPoint {
  id: string | number;
  label: string;

  score: number;
  teamScore: number;
  fullDate: string;
  isSession: boolean;
}

function PerformanceChart() {
  const theme = useTheme();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getAnalyticsOverview();
      
      // Use recent_session_scores for the dots/line as requested (every interview marks)
      const sessionData: ChartDataPoint[] = (data.recent_session_scores || []).map((item: SessionScore) => {

        const date = new Date(item.date);
        return {
          id: item.session_id,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: Math.round(item.score),
          teamScore: Math.round(data.average_score_all_time || 70), // Compare against all-time avg or similar
          fullDate: item.date,
          isSession: true
        };
      });

      setChartData(sessionData);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          p: 2,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, mb: 1, display: 'block' }}>
            {payload[0].payload.fullDate}
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#3B82F6' }} />
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                Score: {payload[0]?.value}%
              </Typography>
            </Box>
          </Stack>
        </Box>
      );
    }
    return null;
  };

  if (loading) return (
    <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={24} />
    </Box>
  );

  if (!chartData || chartData.length === 0) return (
    <Box sx={{ height: 350, display: 'flex', flexFlow: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
      <Typography variant="caption" sx={{ fontWeight: 1000, letterSpacing: '0.2em', color: 'text.secondary' }}>
        NO PERFORMANCE VECTORS
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, fontSize: 10 }}>
        Complete interviews to see your performance progression
      </Typography>
    </Box>
  );

  return (

    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
        {/* Added Vertical and Horizontal Grid Lines as per screenshot */}
        <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.08)" vertical={true} />
        <XAxis 
          dataKey="label" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: alpha(theme.palette.text.secondary, 0.7), fontSize: 11, fontWeight: 600 }} 
          dy={15}
          minTickGap={30}
        />

        <YAxis 
          domain={[0, 100]} 
          ticks={[0, 20, 40, 60, 80, 100]}
          axisLine={false} 
          tickLine={false} 
          tickFormatter={(value) => `${value}%`}
          tick={{ fill: alpha(theme.palette.text.secondary, 0.7), fontSize: 11, fontWeight: 600 }}
        />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Curved Line with Large Blue Dots as in screenshot */}
        <Line 
          name="Interview Score"
          type="monotone" 
          dataKey="score" 
          stroke={theme.palette.text.primary} 
          strokeWidth={3} 
          dot={{ 
            fill: '#3B82F6', 
            r: 8, 
            strokeWidth: 4,
            stroke: 'rgba(59, 130, 246, 0.2)'
          }} 
          activeDot={{ r: 10, strokeWidth: 0, fill: '#60A5FA' }}

          animationDuration={1500}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default PerformanceChart;


