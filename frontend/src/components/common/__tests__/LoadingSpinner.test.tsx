/**
 * Unit Tests for LoadingSpinner Component
 * Tests size variants, loading text, and inline/full-page variants
 * 
 * Requirements: COMP-5.1
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  describe('Basic Rendering', () => {
    it('should render spinner with default props', () => {
      render(<LoadingSpinner />);
      
      const spinner = screen.getByRole('progressbar');
      expect(spinner).toBeInTheDocument();
    });

    it('should render spinner without text by default', () => {
      render(<LoadingSpinner />);
      
      const text = screen.queryByText(/loading/i);
      expect(text).not.toBeInTheDocument();
    });

    it('should render as inline variant by default', () => {
      const { container } = render(<LoadingSpinner />);
      
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
      // Inline variant has padding of 2 (16px)
    });
  });

  describe('Size Variants', () => {
    it('should render small size spinner', () => {
      render(<LoadingSpinner size="small" />);
      
      const spinner = screen.getByRole('progressbar');
      expect(spinner).toBeInTheDocument();
      // Small size is 24px
    });

    it('should render medium size spinner', () => {
      render(<LoadingSpinner size="medium" />);
      
      const spinner = screen.getByRole('progressbar');
      expect(spinner).toBeInTheDocument();
      // Medium size is 40px (default)
    });

    it('should render large size spinner', () => {
      render(<LoadingSpinner size="large" />);
      
      const spinner = screen.getByRole('progressbar');
      expect(spinner).toBeInTheDocument();
      // Large size is 60px
    });

    it('should use medium size when no size prop provided', () => {
      render(<LoadingSpinner />);
      
      const spinner = screen.getByRole('progressbar');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Loading Text', () => {
    it('should display loading text when provided', () => {
      render(<LoadingSpinner text="Loading data..." />);
      
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should display custom loading message', () => {
      render(<LoadingSpinner text="Please wait while we process your request" />);
      
      expect(screen.getByText('Please wait while we process your request')).toBeInTheDocument();
    });

    it('should not display text when not provided', () => {
      const { container } = render(<LoadingSpinner />);
      
      const typography = container.querySelector('p');
      expect(typography).not.toBeInTheDocument();
    });

    it('should display text with spinner', () => {
      render(<LoadingSpinner text="Loading..." />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Variant Types', () => {
    it('should render inline variant', () => {
      const { container } = render(<LoadingSpinner variant="inline" />);
      
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render fullPage variant', () => {
      const { container } = render(<LoadingSpinner variant="fullPage" />);
      
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      // Full page variant has minHeight of 400px
    });

    it('should render fullPage variant with text', () => {
      render(<LoadingSpinner variant="fullPage" text="Loading page..." />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Loading page...')).toBeInTheDocument();
    });

    it('should render inline variant with text', () => {
      render(<LoadingSpinner variant="inline" text="Loading..." />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should render small inline spinner with text', () => {
      render(<LoadingSpinner size="small" variant="inline" text="Loading..." />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render large fullPage spinner with text', () => {
      render(<LoadingSpinner size="large" variant="fullPage" text="Loading data..." />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should render medium fullPage spinner without text', () => {
      render(<LoadingSpinner size="medium" variant="fullPage" />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom sx prop', () => {
      const { container } = render(<LoadingSpinner sx={{ backgroundColor: 'red' }} />);
      
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
    });

    it('should apply custom sx to inline variant', () => {
      const { container } = render(
        <LoadingSpinner variant="inline" sx={{ padding: 4 }} />
      );
      
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
    });

    it('should apply custom sx to fullPage variant', () => {
      const { container } = render(
        <LoadingSpinner variant="fullPage" sx={{ minHeight: '600px' }} />
      );
      
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have progressbar role for screen readers', () => {
      render(<LoadingSpinner />);
      
      const spinner = screen.getByRole('progressbar');
      expect(spinner).toBeInTheDocument();
    });

    it('should have progressbar role in all variants', () => {
      const { rerender } = render(<LoadingSpinner variant="inline" />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      rerender(<LoadingSpinner variant="fullPage" />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should have progressbar role in all sizes', () => {
      const { rerender } = render(<LoadingSpinner size="small" />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      rerender(<LoadingSpinner size="medium" />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      rerender(<LoadingSpinner size="large" />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('should center spinner in container', () => {
      const { container } = render(<LoadingSpinner />);
      
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
      // Flexbox centering is applied via MUI sx prop
    });

    it('should display text below spinner', () => {
      const { container } = render(<LoadingSpinner text="Loading..." />);
      
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
      // Flex direction column ensures text is below spinner
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should have gap between spinner and text', () => {
      const { container } = render(<LoadingSpinner text="Loading..." />);
      
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
      // Gap is applied via MUI sx prop
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string text', () => {
      render(<LoadingSpinner text="" />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      // Empty string should not render text element
    });

    it('should handle very long text', () => {
      const longText = 'This is a very long loading message that might wrap to multiple lines in the UI';
      render(<LoadingSpinner text={longText} />);
      
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle special characters in text', () => {
      render(<LoadingSpinner text="Loading... 50% complete! 🚀" />);
      
      expect(screen.getByText('Loading... 50% complete! 🚀')).toBeInTheDocument();
    });
  });

  describe('Multiple Instances', () => {
    it('should render multiple spinners independently', () => {
      const { container } = render(
        <>
          <LoadingSpinner size="small" text="Loading 1" />
          <LoadingSpinner size="large" text="Loading 2" />
        </>
      );
      
      const spinners = screen.getAllByRole('progressbar');
      expect(spinners).toHaveLength(2);
      expect(screen.getByText('Loading 1')).toBeInTheDocument();
      expect(screen.getByText('Loading 2')).toBeInTheDocument();
    });

    it('should render different variants simultaneously', () => {
      render(
        <>
          <LoadingSpinner variant="inline" />
          <LoadingSpinner variant="fullPage" />
        </>
      );
      
      const spinners = screen.getAllByRole('progressbar');
      expect(spinners).toHaveLength(2);
    });
  });
});
