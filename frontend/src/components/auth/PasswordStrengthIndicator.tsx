/**
 * Password Strength Indicator Component
 * Visual indicator for password strength
 */

import { Box, LinearProgress, Typography } from '@mui/material';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: 'error' | 'warning' | 'info' | 'success';
}

function calculatePasswordStrength(password: string): StrengthResult {
  if (!password) {
    return { score: 0, label: '', color: 'error' };
  }

  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 15; // lowercase
  if (/[A-Z]/.test(password)) score += 15; // uppercase
  if (/[0-9]/.test(password)) score += 15; // numbers
  if (/[^a-zA-Z0-9]/.test(password)) score += 15; // special characters
  
  // Determine label and color
  if (score < 40) {
    return { score, label: 'Weak', color: 'error' };
  } else if (score < 60) {
    return { score, label: 'Fair', color: 'warning' };
  } else if (score < 80) {
    return { score, label: 'Good', color: 'info' };
  } else {
    return { score, label: 'Strong', color: 'success' };
  }
}

function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = calculatePasswordStrength(password);

  if (!password) {
    return null;
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <LinearProgress
          variant="determinate"
          value={strength.score}
          color={strength.color}
          sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
        />
        <Typography
          variant="caption"
          color={`${strength.color}.main`}
          sx={{ minWidth: 50, fontWeight: 600 }}
        >
          {strength.label}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Use 8+ characters with uppercase, lowercase, numbers, and symbols
      </Typography>
    </Box>
  );
}

export default PasswordStrengthIndicator;
