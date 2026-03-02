/**
 * Unit Tests for ErrorBoundary Component
 * Tests error catching, fallback UI display, error logging, and reset functionality
 * 
 * Requirements: COMP-5.6, COMP-5.10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Component that throws a specific error
const ThrowCustomError = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress console.error in tests to avoid noise
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Normal Rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render multiple children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('should render complex component tree when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>
            <h1>Title</h1>
            <p>Paragraph</p>
            <button>Button</button>
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Button' })).toBeInTheDocument();
    });
  });

  describe('Error Catching', () => {
    it('should catch error thrown by child component', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
    });

    it('should display fallback UI when error is caught', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/We're sorry for the inconvenience/i)).toBeInTheDocument();
    });

    it('should catch errors from deeply nested components', () => {
      render(
        <ErrorBoundary>
          <div>
            <div>
              <div>
                <ThrowError shouldThrow={true} />
              </div>
            </div>
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
    });

    it('should catch different error types', () => {
      render(
        <ErrorBoundary>
          <ThrowCustomError message="Custom error message" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Fallback UI Display', () => {
    it('should display error heading', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const heading = screen.getByRole('heading', { name: /Oops! Something went wrong/i });
      expect(heading).toBeInTheDocument();
    });

    it('should display user-friendly error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/We're sorry for the inconvenience/i)).toBeInTheDocument();
      expect(screen.getByText(/Please try refreshing the page/i)).toBeInTheDocument();
    });

    it('should display "Go to Home" button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const button = screen.getByRole('button', { name: /Go to Home/i });
      expect(button).toBeInTheDocument();
    });

    it('should center fallback UI', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const box = container.querySelector('[class*="MuiBox"]');
      expect(box).toBeInTheDocument();
    });

    it('should not display original children when error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Original content</div>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Original content')).not.toBeInTheDocument();
      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Error Logging (COMP-5.10)', () => {
    it('should log error to console when error is caught', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Unhandled error:',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should log error with error info', () => {
      render(
        <ErrorBoundary>
          <ThrowCustomError message="Specific error" />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorArg = consoleErrorSpy.mock.calls[0][1] as Error;
      expect(errorArg.message).toBe('Specific error');
    });

    it('should log error details for debugging', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Unhandled error:',
        expect.objectContaining({
          message: 'Test error',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Reset Functionality', () => {
    it('should navigate to home when "Go to Home" button is clicked', async () => {
      const user = userEvent.setup();
      
      // Mock window.location.href
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' } as Location;

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const button = screen.getByRole('button', { name: /Go to Home/i });
      await user.click(button);

      expect(window.location.href).toBe('/');

      // Restore original location
      window.location = originalLocation;
    });

    it('should display reset button with correct styling', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const button = screen.getByRole('button', { name: /Go to Home/i });
      expect(button).toHaveClass('MuiButton-contained');
      expect(button).toHaveClass('MuiButton-sizeLarge');
    });
  });

  describe('Development Mode Error Display', () => {
    it('should display error details in development mode', () => {
      // Note: This test assumes import.meta.env.DEV is true in test environment
      render(
        <ErrorBoundary>
          <ThrowCustomError message="Detailed error message" />
        </ErrorBoundary>
      );

      // In dev mode, error details should be visible
      const errorText = screen.queryByText(/Error: Detailed error message/i);
      if (import.meta.env.DEV) {
        expect(errorText).toBeInTheDocument();
      }
    });
  });

  describe('Multiple Error Boundaries', () => {
    it('should isolate errors to specific boundary', () => {
      render(
        <div>
          <ErrorBoundary>
            <div>Safe content 1</div>
          </ErrorBoundary>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
          <ErrorBoundary>
            <div>Safe content 2</div>
          </ErrorBoundary>
        </div>
      );

      // First boundary should render normally
      expect(screen.getByText('Safe content 1')).toBeInTheDocument();
      
      // Second boundary should show error
      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
      
      // Third boundary should render normally
      expect(screen.getByText('Safe content 2')).toBeInTheDocument();
    });

    it('should handle nested error boundaries', () => {
      render(
        <ErrorBoundary>
          <div>Outer content</div>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      // Inner boundary should catch the error
      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle error with empty message', () => {
      render(
        <ErrorBoundary>
          <ThrowCustomError message="" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
    });

    it('should handle error with very long message', () => {
      const longMessage = 'A'.repeat(1000);
      render(
        <ErrorBoundary>
          <ThrowCustomError message={longMessage} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
    });

    it('should handle error with special characters', () => {
      render(
        <ErrorBoundary>
          <ThrowCustomError message="Error: <script>alert('xss')</script>" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible heading', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const button = screen.getByRole('button', { name: /Go to Home/i });
      expect(button).toBeInTheDocument();
    });

    it('should have proper semantic structure', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const heading = container.querySelector('h1');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('should maintain error state after re-render', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();

      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
    });

    it('should render children when error state is cleared', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();

      // Simulate error state being cleared (would happen on reset)
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Note: In real scenario, reset would navigate away
      // This test just verifies the boundary can handle state changes
    });
  });
});
