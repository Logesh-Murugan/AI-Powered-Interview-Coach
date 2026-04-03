import { Card, Button, styled, alpha } from '@mui/material';
import type { CardProps, ButtonProps } from '@mui/material';
import { motion } from 'framer-motion';

interface GlassCardProps extends CardProps {
  isMobile?: boolean;
}

interface GradientButtonProps extends ButtonProps {
  isMobile?: boolean;
  component?: any;
  to?: string;
}

/**
 * Filter props that shouldn't reach the DOM
 */
const filterProps = (prop: string) => !['isMobile'].includes(prop);

/**
 * Premium Glassmorphic Card with hover effects
 */
export const GlassCard = styled(Card, {
  shouldForwardProp: filterProps
})<GlassCardProps>(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? 'rgba(30, 41, 59, 0.4)' 
    : 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'}`,
  borderRadius: 24,
  overflow: 'visible',
  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 20px 40px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'}`,
    borderColor: theme.palette.primary.main,
  },
}));

/**
 * Animated Motion Card for scroll entrance
 */
export const MotionGlassCard = motion.create(GlassCard);

/**
 * Gradient Button with neon glow on hover
 */
export const GradientButton = styled(Button, {
  shouldForwardProp: filterProps
})<GradientButtonProps>(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%) !important`,
  color: '#ffffff !important',
  padding: '12px 32px',
  borderRadius: 14,
  fontWeight: 700,
  fontSize: '1rem',
  textTransform: 'none',
  letterSpacing: '0.02em',
  boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.39)}`,
  transition: 'all 0.3s ease',
  border: 'none',
  '&:hover': {
    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%) !important`,
    boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.45)}`,
    transform: 'scale(1.05)',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
  '&.Mui-disabled': {
    background: alpha(theme.palette.action.disabledBackground, 0.1),
    color: theme.palette.action.disabled,
  }
}));

/**
 * Animated Typography with Gradient Text
 */
interface GradientTextProps {
  shadow?: boolean;
}

export const GradientText = styled('span')<GradientTextProps>(({ theme, shadow }) => ({
  background: `linear-gradient(134deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.error.main} 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontWeight: 800,
  filter: shadow ? `drop-shadow(0 0 20px ${alpha(theme.palette.primary.main, 0.4)})` : 'none',
}));

