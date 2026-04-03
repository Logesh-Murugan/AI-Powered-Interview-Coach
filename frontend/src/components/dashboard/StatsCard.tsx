/**
 * Premium Stats Card Component
 * High-end telemetry module with glassmorphism and trend vectors
 */

import { Typography, Box, Stack, alpha, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { GlassCard } from '../common/PremiumComponents';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number; // percentage change
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  subtitle?: string;
}

function StatsCard({ title, value, icon, trend, color = 'primary', subtitle }: StatsCardProps) {
  const theme = useTheme();
  
  const getTrendColor = (t: number) => {
    return t >= 0 ? theme.palette.success.main : theme.palette.error.main;
  };

  return (
    <MotionBox
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <GlassCard 
        sx={{ 
          p: 3, 
          height: '100%', 
          position: 'relative', 
          overflow: 'hidden',
          borderLeft: `6px solid ${theme.palette[color].main}`
        }}
      >
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 100, height: 100, bgcolor: theme.palette[color].main, opacity: 0.1, filter: 'blur(40px)', borderRadius: '50%' }} />
        
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: '0.15em', display: 'block', mb: 1 }}>
              {title.toUpperCase()}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', color: theme.palette[color].main, mb: 1 }}>
              {value}
            </Typography>
            
            {trend !== undefined && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {trend >= 0 ? (
                  <TrendingUp fontSize="small" sx={{ color: getTrendColor(trend) }} />
                ) : (
                  <TrendingDown fontSize="small" sx={{ color: getTrendColor(trend) }} />
                )}
                <Typography variant="caption" sx={{ color: getTrendColor(trend), fontWeight: 900, fontFamily: 'Orbitron' }}>
                  {Math.abs(trend).toFixed(1)}% <span style={{ opacity: 0.7, fontWeight: 700, fontSize: '0.65rem' }}>GROWTH</span>
                </Typography>
              </Stack>
            )}
            
            {subtitle && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mt: 1, display: 'block', opacity: 0.8 }}>
                {subtitle.toUpperCase()}
              </Typography>
            )}
          </Box>
          
          <Box
            sx={{
              bgcolor: alpha(theme.palette[color].main, 0.1),
              borderRadius: 3,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.palette[color].main,
              border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`
            }}
          >
            {icon}
          </Box>
        </Stack>
      </GlassCard>
    </MotionBox>
  );
}

export default StatsCard;
