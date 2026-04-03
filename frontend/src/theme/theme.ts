/**
 * Material-UI Theme Configuration
 * High-end AI aesthetic with premium glassmorphism and specialized typography
 */

import { createTheme, alpha } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

const commonTheme: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", "system-ui", "-apple-system", sans-serif',
    h1: {
      fontFamily: '"Orbitron", "Inter", sans-serif',
      fontSize: '4.5rem',
      fontWeight: 900,
      letterSpacing: '-0.02em',
      textTransform: 'uppercase',
    },
    h2: {
      fontFamily: '"Orbitron", "Inter", sans-serif',
      fontSize: '3.5rem',
      fontWeight: 900,
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
    },
    h3: {
      fontFamily: '"Orbitron", "Inter", sans-serif',
      fontSize: '2.5rem',
      fontWeight: 900,
      letterSpacing: '0.01em',
      textTransform: 'uppercase',
    },
    h4: {
      fontFamily: '"Orbitron", "Inter", sans-serif',
      fontSize: '1.8rem',
      fontWeight: 800,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
    h5: {
      fontFamily: '"Orbitron", "Inter", sans-serif',
      fontSize: '1.4rem',
      fontWeight: 800,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
    h6: {
      fontFamily: '"Orbitron", "Inter", sans-serif',
      fontSize: '1rem',
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
    subtitle1: { fontWeight: 700, fontSize: '1.1rem' },
    subtitle2: { fontWeight: 700, fontSize: '0.9rem' },
    body1: { lineHeight: 1.7, fontSize: '1rem' },
    body2: { lineHeight: 1.6, fontSize: '0.875rem' },
    caption: { fontWeight: 700, letterSpacing: '0.05em' },
    overline: { fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase' },
    button: {
      fontFamily: '"Orbitron", sans-serif',
      textTransform: 'uppercase',
      fontWeight: 900,
      letterSpacing: '0.1em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: '8px', height: '8px' },
          '&::-webkit-scrollbar-track': { background: '#020617' },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(99, 102, 241, 0.2)',
            borderRadius: '10px',
            '&:hover': { background: 'rgba(99, 102, 241, 0.4)' },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 32px',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          backgroundImage: 'none',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 900,
          fontFamily: '"Inter", sans-serif',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 14,
            transition: 'all 0.3s ease',
            backgroundColor: 'rgba(2, 6, 23, 0.4)',
            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
            '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: '2px' },
          },
        },
      },
    },
  },
};

export const darkTheme = createTheme({
  ...commonTheme,
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5', contrastText: '#ffffff' },
    secondary: { main: '#ec4899', light: '#f472b6', dark: '#db2777', contrastText: '#ffffff' },
    success: { main: '#10b981' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    info: { main: '#3b82f6' },
    background: { default: '#020617', paper: '#0f172a' },
    text: { primary: '#f8fafc', secondary: '#94a3b8' },
    divider: 'rgba(255, 255, 255, 0.06)',
  },
});

export const lightTheme = createTheme({
  ...commonTheme,
  palette: {
    mode: 'light',
    primary: { main: '#4f46e5', light: '#6366f1', dark: '#3730a3', contrastText: '#ffffff' },
    secondary: { main: '#db2777', light: '#ec4899', dark: '#be185d', contrastText: '#ffffff' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#475569' },
    divider: 'rgba(0, 0, 0, 0.06)',
  },
});
