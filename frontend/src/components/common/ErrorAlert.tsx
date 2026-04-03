/**
 * ErrorAlert Component
 * User-friendly error messages with retry and dismiss functionality
 * Requirements: COMP-5.2
 */

import { Alert, AlertTitle, Button, Box } from '@mui/material';
import type { AlertColor, SxProps, Theme } from '@mui/material';

interface ErrorAlertProps {
  message: string;
  title?: string;
  severity?: AlertColor;
  onRetry?: () => void;
  onDismiss?: () => void;
  sx?: SxProps<Theme>;
}

function ErrorAlert({ 
  message, 
  title,
  severity = 'error',
  onRetry,
  onDismiss,
  sx
}: ErrorAlertProps) {
  return (
    <Alert 
      severity={severity}
      onClose={onDismiss}
      sx={{ mb: 2, ...sx }}
    >
      {title && <AlertTitle>{title}</AlertTitle>}
      {message}
      {onRetry && (
        <Box sx={{ mt: 2 }}>
          <Button 
            size="small" 
            variant="outlined" 
            color={severity}
            onClick={onRetry}
          >
            Retry
          </Button>
        </Box>
      )}
    </Alert>
  );
}

export default ErrorAlert;
