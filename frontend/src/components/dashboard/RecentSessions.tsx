/**
 * Premium Recent Sessions Component
 * High-end, high-contrast "Historical Vector" list for displaying interview session history
 */

import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Stack,
  alpha,
  useTheme,
  IconButton,
  Chip,
} from '@mui/material';
import { ChevronRight, AccessTime as TimeIcon, Sensors } from '@mui/icons-material';
import { format } from 'date-fns';
import { GlassCard, GradientButton } from '../common/PremiumComponents';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

interface Session {
  id: number;
  role: string;
  difficulty: string;
  status: string;
  start_time: string;
  overall_score?: number;
}

interface RecentSessionsProps {
  sessions: Session[];
}

function RecentSessions({ sessions }: RecentSessionsProps) {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <GlassCard sx={{ p: 4, height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
           <Sensors sx={{ color: 'primary.main' }} />
           <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', letterSpacing: '0.05em' }}>HISTORICAL VECTORS</Typography>
        </Stack>
        <Typography 
          variant="caption" 
          onClick={() => navigate('/interviews/history')}
          sx={{ 
            fontWeight: 900, 
            color: 'primary.main', 
            cursor: 'pointer', 
            letterSpacing: '0.1em',
            '&:hover': { textDecoration: 'underline', color: 'secondary.main' } 
          }}
        >
          VIEW ARCHIVES
        </Typography>
      </Stack>

      <Box sx={{ position: 'absolute', top: -50, left: -50, width: 150, height: 150, bgcolor: 'primary.main', opacity: 0.05, filter: 'blur(80px)', borderRadius: '50%' }} />

      {sessions.length === 0 ? (
        <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ py: 8, opacity: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>NO TEMPORAL VECTORS RECORDED.</Typography>
        </Stack>
      ) : (
        <Stack spacing={2.5}>
          {sessions.map((session, idx) => {
            const isInProgress = session.status.toLowerCase() === 'in_progress';
            return (
              <MotionBox
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Box
                  onClick={() => !isInProgress && navigate(`/interviews/${session.id}/summary`)}
                  sx={{
                    p: 2.5,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.background.paper, 0.3),
                    border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: isInProgress ? 'default' : 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.background.paper, 0.5),
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      transform: 'translateX(8px)',
                      boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.1)}`
                    }
                  }}
                >
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Box sx={{ 
                      width: 54, 
                      height: 54, 
                      borderRadius: 3.5, 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: theme.palette.primary.main,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron' }}>{session.overall_score ? `${Math.round(session.overall_score)}` : '?'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 900, mb: 0.5, letterSpacing: '0.02em' }}>{session.role.toUpperCase()}</Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                           <TimeIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
                           <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                             {format(new Date(session.start_time), 'MMM dd | HH:mm')}
                           </Typography>
                        </Box>
                        <Chip label={session.difficulty.toUpperCase()} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}` }} />
                      </Stack>
                    </Box>
                  </Stack>

                  <Box>
                    {isInProgress ? (
                      <GradientButton size="small" onClick={() => navigate(`/interviews/${session.id}/resume`)} sx={{ height: 32, fontSize: '0.65rem' }}>
                        RESUME SESSION
                      </GradientButton>
                    ) : (
                      <IconButton size="small" sx={{ bgcolor: alpha(theme.palette.background.paper, 0.5), border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                        <ChevronRight fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </MotionBox>
            );
          })}
        </Stack>
      )}
    </GlassCard>
  );
}

export default RecentSessions;
