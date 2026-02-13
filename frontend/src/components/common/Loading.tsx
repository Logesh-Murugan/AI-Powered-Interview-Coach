/**
 * Loading Component
 * Global loading indicator with backdrop
 */

import { Backdrop, CircularProgress, Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface LoadingProps {
  open?: boolean;
  message?: string;
  fullScreen?: boolean;
  sx?: SxProps<Theme>;
}

function Loading({ 
  open = true, 
  message, 
  fullScreen = true,
  sx 
}: LoadingProps) {
  if (fullScreen) {
    return (
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          ...sx,
        }}
        open={open}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CircularProgress color="inherit" size={60} />
          {message && (
            <Typography variant="h6" component="div">
              {message}
            </Typography>
          )}
        </Box>
      </Backdrop>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 4,
        ...sx,
      }}
    >
      <CircularProgress size={40} />
      {message && (
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}

export default Loading;
