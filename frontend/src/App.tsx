/**
 * Main App Component
 * Root component with routing, theme, and Redux provider
 */

import { useMemo } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store } from './store/index.js';
import { useAppSelector } from './store/hooks.js';
import { lightTheme, darkTheme } from './theme/theme.js';
import AppRoutes from './routes/AppRoutes.js';
import ErrorBoundary from './components/common/ErrorBoundary.js';
import './App.css';

function AppContent() {
  const theme = useAppSelector((state) => state.ui.theme);
  const currentTheme = useMemo(
    () => (theme === 'light' ? lightTheme : darkTheme),
    [theme]
  );

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <ErrorBoundary>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ErrorBoundary>
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
