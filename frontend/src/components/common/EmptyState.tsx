/**
 * EmptyState Component
 * No data illustrations with helpful messages and CTAs
 * Requirements: COMP-5.3
 */

import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material';

interface EmptyStateProps {
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
  sx?: SxProps<Theme>;
}

function EmptyState({ 
  message, 
  icon,
  action,
  sx 
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        textAlign: 'center',
        p: 4,
        ...sx,
      }}
    >
      {icon && (
        <Box sx={{ mb: 2, fontSize: '4rem', opacity: 0.5 }}>
          {icon}
        </Box>
      )}
      <Typography 
        variant="h6" 
        color="text.secondary" 
        sx={{ mb: action ? 3 : 0 }}
      >
        {message}
      </Typography>
      {action && (
        <Box>
          {action}
        </Box>
      )}
    </Box>
  );
}

export default EmptyState;
