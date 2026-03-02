/**
 * LoadingSpinner Component
 * Consistent loading indicator with size variants and optional text
 * Requirements: COMP-5.1
 */

import { Box, CircularProgress, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

type SpinnerSize = 'small' | 'medium' | 'large';
type SpinnerVariant = 'inline' | 'fullPage';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  text?: string;
  variant?: SpinnerVariant;
  sx?: SxProps<Theme>;
}

const sizeMap: Record<SpinnerSize, number> = {
  small: 24,
  medium: 40,
  large: 60,
};

function LoadingSpinner({ 
  size = 'medium', 
  text,
  variant = 'inline',
  sx 
}: LoadingSpinnerProps) {
  const spinnerSize = sizeMap[size];

  if (variant === 'fullPage') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: 2,
          ...sx,
        }}
      >
        <CircularProgress size={spinnerSize} />
        {text && (
          <Typography variant="body1" color="text.secondary">
            {text}
          </Typography>
        )}
      </Box>
    );
  }

  // Inline variant
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        p: 2,
        ...sx,
      }}
    >
      <CircularProgress size={spinnerSize} />
      {text && (
        <Typography variant="body2" color="text.secondary">
          {text}
        </Typography>
      )}
    </Box>
  );
}

export default LoadingSpinner;
