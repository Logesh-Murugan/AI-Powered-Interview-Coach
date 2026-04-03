/**
 * Premium Quick Stats Component
 * High-end telemetry display for key performance indicators (KPIs)
 */

import { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Grid,
  CircularProgress,
  alpha,
  useTheme,
  Stack,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HubIcon from '@mui/icons-material/Hub';
import analyticsService from '../../services/analyticsService';
import { GlassCard } from '../common/PremiumComponents';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

interface StatItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  color: string;
}

function QuickStats() {
  const theme = useTheme();
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getAnalyticsOverview();
      
      const hours = Math.floor(data.total_practice_hours);
      const minutes = Math.round((data.total_practice_hours - hours) * 60);
      const practiceTimeStr = hours > 0 ? `${hours}H ${minutes}M` : `${minutes}M`;
      const trend = data.improvement_rate || 0;
      
      const statsData: StatItem[] = [
        { label: 'SESSIONS', value: data.total_interviews_completed.toString(), icon: <AssessmentIcon />, color: theme.palette.primary.main },
        { label: 'AVG SCORE', value: data.average_score_last_30_days !== null ? `${Math.round(data.average_score_last_30_days)}%` : 'N/A', icon: <TrendingUpIcon />, trend: trend, color: theme.palette.success.main },
        { label: 'TOTAL PRACTICE', value: practiceTimeStr, icon: <AccessTimeIcon />, color: theme.palette.info.main },
      ];
      setStats(statsData);
    } catch (err) {
      console.error('Error:', err);
      setError('Shielding active');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <GlassCard sx={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={30} thickness={5} />
    </GlassCard>
  );

  return (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid size={{ xs: 12, sm: 4 }} key={index}>
          <GlassCard sx={{ p: 4, height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, bgcolor: stat.color, opacity: 0.1, filter: 'blur(30px)', borderRadius: '50%' }} />
            
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
               <Box sx={{ color: stat.color, display: 'flex', alignItems: 'center' }}>{stat.icon}</Box>
               <Typography variant="caption" sx={{ fontWeight: 1000, color: 'text.secondary', letterSpacing: '0.15em' }}>{stat.label}</Typography>
            </Stack>

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
              <Typography variant="h3" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', color: 'text.primary' }}>
                {stat.value}
              </Typography>
              
              {stat.trend !== undefined && stat.trend !== 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: alpha(stat.trend > 0 ? theme.palette.success.main : theme.palette.error.main, 0.1),
                    color: stat.trend > 0 ? theme.palette.success.main : theme.palette.error.main,
                  }}
                >
                  {stat.trend > 0 ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />}
                  <Typography variant="caption" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>
                    {Math.abs(stat.trend).toFixed(1)}%
                  </Typography>
                </Box>
              )}
            </Box>
          </GlassCard>
        </Grid>
      ))}
    </Grid>
  );
}

export default QuickStats;
