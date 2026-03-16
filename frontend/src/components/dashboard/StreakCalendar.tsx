/**
 * StreakCalendar Component
 * 30-day calendar grid showing practice history
 */

import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Tooltip, CircularProgress, Alert } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { getStreakHistory } from '../../services/streaksService';
import type { StreakHistoryResponse } from '../../services/streaksService';

interface CalendarDay {
  date: string;
  practiced: boolean;
  isToday: boolean;
  dayOfMonth: number;
}

function StreakCalendar() {
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
      console.error('Error loading streak history:', err);
      setError('Unable to load streak history');
    } finally {
      setLoading(false);
    }
  };

  const prepareCalendarData = (): CalendarDay[] => {
    if (!historyData || !historyData.history) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return historyData.history.map(item => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);
      
      return {
        date: item.date,
        practiced: item.practiced,
        isToday: itemDate.getTime() === today.getTime(),
        dayOfMonth: itemDate.getDate(),
      };
    });
  };

  const formatDateForTooltip = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getMonthYearHeader = () => {
    if (!historyData || !historyData.history || historyData.history.length === 0) return '';
    
    // Get the most recent date (first in the array)
    const recentDate = new Date(historyData.history[0].date);
    return recentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Paper>
    );
  }

  const calendarDays = prepareCalendarData();

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" component="h3" gutterBottom>
          Practice Calendar
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {getMonthYearHeader()} - Last 30 Days
        </Typography>
      </Box>

      {/* Calendar Grid */}
      <Grid container spacing={1}>
        {calendarDays.map((day, index) => (
          <Grid item xs={12 / 7} key={index}>
            <Tooltip 
              title={
                <Box>
                  <Typography variant="body2">{formatDateForTooltip(day.date)}</Typography>
                  <Typography variant="caption">
                    {day.practiced ? '✅ Practiced' : '❌ Missed'}
                  </Typography>
                </Box>
              }
              arrow
            >
              <Box
                sx={{
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                  cursor: 'pointer',
                  backgroundColor: day.practiced 
                    ? 'success.light' 
                    : 'grey.200',
                  border: day.isToday ? '2px solid' : 'none',
                  borderColor: day.isToday ? 'primary.main' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: 2,
                  },
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: day.isToday ? 'bold' : 'normal',
                    color: day.practiced ? 'success.dark' : 'text.secondary',
                  }}
                >
                  {day.dayOfMonth}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
        ))}
      </Grid>

      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              width: 16, 
              height: 16, 
              borderRadius: 0.5, 
              backgroundColor: 'success.light' 
            }} 
          />
          <Typography variant="caption" color="text.secondary">
            Practiced
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              width: 16, 
              height: 16, 
              borderRadius: 0.5, 
              backgroundColor: 'grey.200' 
            }} 
          />
          <Typography variant="caption" color="text.secondary">
            Missed
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              width: 16, 
              height: 16, 
              borderRadius: 0.5, 
              border: '2px solid',
              borderColor: 'primary.main',
              backgroundColor: 'transparent'
            }} 
          />
          <Typography variant="caption" color="text.secondary">
            Today
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export default StreakCalendar;
