/**
 * Quick Actions Component
 * Provides quick navigation buttons for common actions
 */

import { Button, Grid, Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import BarChartIcon from '@mui/icons-material/BarChart';
import HistoryIcon from '@mui/icons-material/History';

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
      label: 'View History',
      icon: <HistoryIcon />,
      color: 'primary' as const,
      variant: 'outlined' as const,
      onClick: () => navigate('/interviews/history'),
    },
    {
      label: 'Analytics',
      icon: <BarChartIcon />,
      color: 'primary' as const,
      variant: 'outlined' as const,
      onClick: () => navigate('/dashboard'),
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
