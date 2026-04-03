/**
 * Premium Streak Calendar Widget
 * High-end AI "Chrono-Temporal Matrix" for visualizing practice history
 */

import { useEffect, useState } from 'react';
import { Box, Typography, Tooltip, CircularProgress, alpha, useTheme, Grid, Stack } from '@mui/material';
import { getStreakHistory } from '../../services/streaksService';
import type { StreakHistoryResponse } from '../../services/streaksService';
import { GlassCard } from '../common/PremiumComponents';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

interface CalendarDay {
  date: string;
  practiced: boolean;
  isToday: boolean;
  dayOfMonth: number;
}

function StreakCalendar() {
  const theme = useTheme();
  const [historyData, setHistoryData] = useState<StreakHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStreakHistory(30);
      setHistoryData(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Signal synchronization offline');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <GlassCard sx={{ minHeight: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={30} thickness={5} />
    </GlassCard>
  );

  const calendarDays = (historyData?.history || []).map(item => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const itemDate = new Date(item.date);
    itemDate.setHours(0,0,0,0);
    return {
      date: item.date,
      practiced: item.practiced,
      isToday: itemDate.getTime() === today.getTime(),
      dayOfMonth: itemDate.getDate(),
    };
  });

  return (
    <GlassCard sx={{ p: 4, height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', bottom: -50, right: -50, width: 120, height: 120, bgcolor: 'primary.main', opacity: 0.1, filter: 'blur(80px)', borderRadius: '50%' }} />

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
         <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', letterSpacing: '0.05em' }}>TEMPORAL MATRIX</Typography>
         <Chip label="LAST 30 DAYS" size="small" sx={{ fontWeight: 900, bgcolor: alpha(theme.palette.divider, 0.1), color: 'text.secondary', fontSize: '0.65rem' }} />
      </Stack>

      <Grid container spacing={1}>
        {calendarDays.map((day, index) => (
          <Grid size={12/7 as any} key={index}>
            <Tooltip 
              title={
                <Box sx={{ p: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{new Date(day.date).toLocaleDateString()}</Typography>
                  <Typography variant="caption" sx={{ color: day.practiced ? 'success.main' : 'error.main', fontWeight: 900 }}>
                    {day.practiced ? 'VECTOR ACTIVE' : 'MISSING SIGNAL'}
                  </Typography>
                </Box>
              }
              arrow
            >
              <Box
                sx={{
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  backgroundColor: day.practiced 
                    ? alpha(theme.palette.success.main, 0.2) 
                    : alpha(theme.palette.divider, 0.05),
                  border: `1px solid ${day.isToday ? theme.palette.primary.main : 'rgba(255,255,255,0.05)'}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: day.practiced && day.isToday ? `0 0 15px ${alpha(theme.palette.success.main, 0.3)}` : 'none',
                  '&:hover': {
                    transform: 'scale(1.15) rotate(5deg)',
                    bgcolor: day.practiced ? alpha(theme.palette.success.main, 0.4) : alpha(theme.palette.divider, 0.1),
                    zIndex: 10
                  },
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 900,
                    fontFamily: 'Orbitron',
                    fontSize: '0.65rem',
                    color: day.practiced ? 'success.main' : 'text.disabled',
                  }}
                >
                  {day.dayOfMonth}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" spacing={3} justifyContent="center" sx={{ mt: 4 }}>
        <Stack direction="row" spacing={1} alignItems="center">
           <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: alpha(theme.palette.success.main, 0.4) }} />
           <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>ACTIVE</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
           <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: alpha(theme.palette.divider, 0.1) }} />
           <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>INERT</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
           <Box sx={{ width: 8, height: 8, borderRadius: 0.5, border: `1px solid ${theme.palette.primary.main}` }} />
           <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>MARKER</Typography>
        </Stack>
      </Stack>
    </GlassCard>
  );
}

// Internal reusable Chip if needed (since it's small)
function Chip({ label, size, sx }: any) {
  return <Box sx={{ px: 1, py: 0.5, borderRadius: 10, ...sx }}>{label}</Box>;
}

export default StreakCalendar;
