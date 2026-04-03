/**
 * Premium Quick Actions Component
 * High-end interactive grid for commonly used features
 */

import { Typography, Grid, Box, alpha, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Icons
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import HistoryIcon from '@mui/icons-material/History';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';

import { GlassCard } from '../common/PremiumComponents';

const MotionBox = motion.create(Box);

function QuickActions() {
  const navigate = useNavigate();
  const theme = useTheme();

  const actions = [
    { label: 'SIMULATE', sub: 'New Interview', icon: <PlayArrowIcon />, color: '#6366f1', path: '/interviews' },
    { label: 'PARSE', sub: 'Resume Analysis', icon: <PsychologyIcon />, color: '#ec4899', path: '/resumes' },
    { label: 'STRATEGIZE', sub: 'Study Plans', icon: <SchoolIcon />, color: '#f59e0b', path: '/ai/study-plans' },
    { label: 'COACH', sub: 'Company Intel', icon: <BusinessIcon />, color: '#10b981', path: '/ai/company-coaching' },
    { label: 'ARCHIVE', sub: 'History', icon: <HistoryIcon />, color: '#0ea5e9', path: '/interviews/history' },
    { label: 'REPOSITORY', sub: 'All Resumes', icon: <UploadFileIcon />, color: '#8b5cf6', path: '/resumes' },
  ];

  return (
    <GlassCard sx={{ p: 4, height: '100%' }}>
      <Typography variant="h6" fontWeight="900" sx={{ mb: 3 }}>TACTICAL COMMAND</Typography>
      <Grid container spacing={2}>
        {actions.map((action, idx) => (
          <Grid key={idx} size={{ xs: 6, sm: 4 }}>
            <MotionBox
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(action.path)}
              sx={{ cursor: 'pointer' }}
            >
              <Box sx={{ 
                p: 2, 
                borderRadius: 4, 
                textAlign: 'center',
                bgcolor: alpha(action.color, 0.05),
                border: `1px solid ${alpha(action.color, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: alpha(action.color, 0.1),
                  borderColor: action.color,
                  boxShadow: `0 0 20px ${alpha(action.color, 0.2)}`
                }
              }}>
                <Box sx={{ color: action.color, mb: 1, display: 'flex', justifyContent: 'center' }}>
                    {action.icon}
                </Box>
                <Typography variant="caption" display="block" sx={{ fontWeight: 900, mb: 0.2, color: 'text.primary' }}>{action.label}</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}>{action.sub}</Typography>
              </Box>
            </MotionBox>
          </Grid>
        ))}
      </Grid>
    </GlassCard>
  );
}

export default QuickActions;
