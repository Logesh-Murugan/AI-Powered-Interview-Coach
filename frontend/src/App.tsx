/**
 * Main App Component
 * Root component with routing, theme, and Redux provider
 */

import { useMemo } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material';
import { store } from './store/index';
import { useAppSelector } from './store/hooks';
import { lightTheme, darkTheme } from './theme/theme';
import './App.css';

// Lazy load routes to prevent initial load issues
import { lazy, Suspense } from 'react';
const AppRoutes = lazy(() => import('./routes/AppRoutes'));
const ErrorBoundary = lazy(() => import('./components/common/ErrorBoundary'));

function LoadingFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Typography>Loading...</Typography>
    </Box>
  );
}

function AppContent() {
  const theme = useAppSelector((state) => state.ui.theme);
  const currentTheme = useMemo(
    () => (theme === 'light' ? lightTheme : darkTheme),
    [theme]
  );

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Suspense fallback={<LoadingFallback />}>
        <ErrorBoundary>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <AppRoutes />
            </Suspense>
          </BrowserRouter>
        </ErrorBoundary>
      </Suspense>
    </ThemeProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
