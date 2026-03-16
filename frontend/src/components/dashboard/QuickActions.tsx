/**
 * Quick Actions Component
 * Provides quick navigation buttons for common actions
 */

import { Button, Grid, Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import HistoryIcon from '@mui/icons-material/History';
import BarChartIcon from '@mui/icons-material/BarChart';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';

function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Start Interview',
      icon: <PlayArrowIcon />,
      color: 'primary' as const,
      variant: 'contained' as const,
      onClick: () => navigate('/interviews'),
    },
    {
      label: 'Upload Resume',
      icon: <UploadFileIcon />,
      color: 'secondary' as const,
      variant: 'outlined' as const,
      onClick: () => navigate('/resumes/upload'),
    },
    {
      label: 'Study Plans',
      icon: <SchoolIcon />,
      color: 'primary' as const,
      variant: 'outlined' as const,
      onClick: () => navigate('/ai/study-plans'),
    },
    {
      label: 'Company Coaching',
      icon: <BusinessIcon />,
      color: 'info' as const,
      variant: 'outlined' as const,
      onClick: () => navigate('/ai/company-coaching'),
    },
    {
      label: 'View History',
      icon: <HistoryIcon />,
      color: 'primary' as const,
      variant: 'outlined' as const,
      onClick: () => navigate('/interviews/history'),
    },
    {
      label: 'View Resumes',
      icon: <UploadFileIcon />,
      color: 'info' as const,
      variant: 'outlined' as const,
      onClick: () => navigate('/resumes'),
    },
    {
      label: 'Analytics',
      icon: <BarChartIcon />,
      color: 'success' as const,
      variant: 'outlined' as const,
      onClick: () => navigate('/analytics'),
    },
    {
      label: 'Leaderboard',
      icon: <TrendingUpIcon />,
      color: 'warning' as const,
      variant: 'outlined' as const,
      onClick: () => navigate('/leaderboard'),
    },
    {
      label: 'Achievements',
      icon: <EmojiEventsIcon />,
      color: 'secondary' as const,
      variant: 'outlined' as const,
      onClick: () => navigate('/achievements'),
    },
  ];

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Quick Actions
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {actions.map((action) => (
          <Grid key={action.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Button
              fullWidth
              variant={action.variant}
              color={action.color}
              startIcon={action.icon}
              onClick={action.onClick}
              sx={{ py: 1.5 }}
            >
              {action.label}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

export default QuickActions;
