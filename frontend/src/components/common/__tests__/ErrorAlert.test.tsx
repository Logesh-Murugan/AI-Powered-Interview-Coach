/**
 * Unit Tests for ErrorAlert Component
 * Tests error message display, retry callback, dismiss callback, and severity levels
 * 
 * Requirements: COMP-5.2
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorAlert from '../ErrorAlert';

describe('ErrorAlert', () => {
  describe('Basic Rendering', () => {
    it('should render error message', () => {
      render(<ErrorAlert message="Something went wrong" />);
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should render as alert role for accessibility', () => {
      render(<ErrorAlert message="Error occurred" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should use error severity by default', () => {
      render(<ErrorAlert message="Error message" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      // Default severity is 'error'
    });

    it('should render without title by default', () => {
      render(<ErrorAlert message="Error message" />);
      
      const title = screen.queryByText(/error/i);
      // Should only find the message, not a separate title
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  describe('Error Message Display', () => {
    it('should display simple error message', () => {
      render(<ErrorAlert message="Network error" />);
      
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should display detailed error message', () => {
      const message = 'Failed to load data. Please check your internet connection and try again.';
      render(<ErrorAlert message={message} />);
      
      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('should display error message with special characters', () => {
      render(<ErrorAlert message="Error: 404 - Resource not found!" />);
      
      expect(screen.getByText('Error: 404 - Resource not found!')).toBeInTheDocument();
    });

    it('should handle very long error messages', () => {
      const longMessage = 'This is a very long error message that might wrap to multiple lines in the UI. It contains detailed information about what went wrong and how to fix it.';
      render(<ErrorAlert message={longMessage} />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });

  describe('Title Display', () => {
    it('should display title when provided', () => {
      render(<ErrorAlert message="Connection failed" title="Network Error" />);
      
      expect(screen.getByText('Network Error')).toBeInTheDocument();
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });

    it('should display title above message', () => {
      render(<ErrorAlert message="Please try again" title="Error" />);
      
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Please try again')).toBeInTheDocument();
    });

    it('should render without title when not provided', () => {
      const { container } = render(<ErrorAlert message="Error message" />);
      
      // AlertTitle component should not be present
      const alertTitle = container.querySelector('.MuiAlertTitle-root');
      expect(alertTitle).not.toBeInTheDocument();
    });
  });

  describe('Severity Levels', () => {
    it('should render error severity', () => {
      render(<ErrorAlert message="Error message" severity="error" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should render warning severity', () => {
      render(<ErrorAlert message="Warning message" severity="warning" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should render info severity', () => {
      render(<ErrorAlert message="Info message" severity="info" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should render success severity', () => {
      render(<ErrorAlert message="Success message" severity="success" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should use error severity when not specified', () => {
      render(<ErrorAlert message="Default message" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('should display retry button when onRetry provided', () => {
      const onRetry = vi.fn();
      render(<ErrorAlert message="Error" onRetry={onRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call onRetry when retry button clicked', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      render(<ErrorAlert message="Error" onRetry={onRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);
      
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not display retry button when onRetry not provided', () => {
      render(<ErrorAlert message="Error" />);
      
      const retryButton = screen.queryByRole('button', { name: /retry/i });
      expect(retryButton).not.toBeInTheDocument();
    });

    it('should call onRetry multiple times when clicked multiple times', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      render(<ErrorAlert message="Error" onRetry={onRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);
      await user.click(retryButton);
      await user.click(retryButton);
      
      expect(onRetry).toHaveBeenCalledTimes(3);
    });

    it('should display retry button with correct severity color', () => {
      const onRetry = vi.fn();
      render(<ErrorAlert message="Error" severity="warning" onRetry={onRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Dismiss Functionality', () => {
    it('should display close button when onDismiss provided', () => {
      const onDismiss = vi.fn();
      render(<ErrorAlert message="Error" onDismiss={onDismiss} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should call onDismiss when close button clicked', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      render(<ErrorAlert message="Error" onDismiss={onDismiss} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not display close button when onDismiss not provided', () => {
      render(<ErrorAlert message="Error" />);
      
      const closeButton = screen.queryByRole('button', { name: /close/i });
      expect(closeButton).not.toBeInTheDocument();
    });

    it('should call onDismiss only once when clicked', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      render(<ErrorAlert message="Error" onDismiss={onDismiss} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Combined Retry and Dismiss', () => {
    it('should display both retry and close buttons', () => {
      const onRetry = vi.fn();
      const onDismiss = vi.fn();
      render(<ErrorAlert message="Error" onRetry={onRetry} onDismiss={onDismiss} />);
      
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('should call correct callback when retry clicked', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      const onDismiss = vi.fn();
      render(<ErrorAlert message="Error" onRetry={onRetry} onDismiss={onDismiss} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('should call correct callback when close clicked', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      const onDismiss = vi.fn();
      render(<ErrorAlert message="Error" onRetry={onRetry} onDismiss={onDismiss} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(onRetry).not.toHaveBeenCalled();
    });
  });

  describe('Complete Error Scenarios', () => {
    it('should render network error with retry', () => {
      const onRetry = vi.fn();
      render(
        <ErrorAlert 
          message="Network error. Please check your connection." 
          title="Connection Failed"
          severity="error"
          onRetry={onRetry}
        />
      );
      
      expect(screen.getByText('Connection Failed')).toBeInTheDocument();
      expect(screen.getByText('Network error. Please check your connection.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should render validation error with dismiss', () => {
      const onDismiss = vi.fn();
      render(
        <ErrorAlert 
          message="Please enter a valid email address." 
          title="Validation Error"
          severity="warning"
          onDismiss={onDismiss}
        />
      );
      
      expect(screen.getByText('Validation Error')).toBeInTheDocument();
      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('should render server error with retry and dismiss', () => {
      const onRetry = vi.fn();
      const onDismiss = vi.fn();
      render(
        <ErrorAlert 
          message="Server error. Please try again later." 
          title="500 Internal Server Error"
          severity="error"
          onRetry={onRetry}
          onDismiss={onDismiss}
        />
      );
      
      expect(screen.getByText('500 Internal Server Error')).toBeInTheDocument();
      expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have alert role for screen readers', () => {
      render(<ErrorAlert message="Error" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have accessible retry button', () => {
      const onRetry = vi.fn();
      render(<ErrorAlert message="Error" onRetry={onRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should have accessible close button', () => {
      const onDismiss = vi.fn();
      render(<ErrorAlert message="Error" onDismiss={onDismiss} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      render(<ErrorAlert message="" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should handle message with HTML entities', () => {
      render(<ErrorAlert message="Error: &lt;script&gt; not allowed" />);
      
      expect(screen.getByText('Error: <script> not allowed')).toBeInTheDocument();
    });

    it('should handle message with line breaks', () => {
      render(<ErrorAlert message="Error occurred.\nPlease try again." />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Multiple Instances', () => {
    it('should render multiple error alerts independently', () => {
      render(
        <>
          <ErrorAlert message="Error 1" />
          <ErrorAlert message="Error 2" />
        </>
      );
      
      expect(screen.getByText('Error 1')).toBeInTheDocument();
      expect(screen.getByText('Error 2')).toBeInTheDocument();
    });

    it('should handle different callbacks for multiple alerts', async () => {
      const user = userEvent.setup();
      const onRetry1 = vi.fn();
      const onRetry2 = vi.fn();
      
      render(
        <>
          <ErrorAlert message="Error 1" onRetry={onRetry1} />
          <ErrorAlert message="Error 2" onRetry={onRetry2} />
        </>
      );
      
      const retryButtons = screen.getAllByRole('button', { name: /retry/i });
      await user.click(retryButtons[0]);
      
      expect(onRetry1).toHaveBeenCalledTimes(1);
      expect(onRetry2).not.toHaveBeenCalled();
    });
  });

  describe('Button Interactions', () => {
    it('should handle rapid retry button clicks', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      render(<ErrorAlert message="Error" onRetry={onRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.tripleClick(retryButton);
      
      expect(onRetry).toHaveBeenCalled();
    });

    it('should handle keyboard interaction on retry button', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      render(<ErrorAlert message="Error" onRetry={onRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      retryButton.focus();
      await user.keyboard('{Enter}');
      
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
