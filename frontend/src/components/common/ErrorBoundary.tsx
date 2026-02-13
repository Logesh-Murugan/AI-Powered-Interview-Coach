/**
 * Error Boundary Component
 * Catches and handles React errors gracefully
 */

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to error reporting service
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <Typography variant="h3" component="h1" gutterBottom color="error">
              Oops! Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              We're sorry for the inconvenience. Please try refreshing the page.
            </Typography>
            {import.meta.env.DEV && this.state.error && (
              <Box
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: 'error.light',
                  borderRadius: 1,
                  maxWidth: '100%',
                  overflow: 'auto',
                }}
              >
                <Typography variant="body2" component="pre" sx={{ textAlign: 'left' }}>
                  {this.state.error.toString()}
                </Typography>
              </Box>
            )}
            <Button variant="contained" size="large" onClick={this.handleReset}>
              Go to Home
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
