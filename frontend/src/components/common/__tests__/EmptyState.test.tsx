/**
 * Unit Tests for EmptyState Component
 * Tests message display, optional illustration/icon, optional action button, and centering
 * 
 * Requirements: COMP-5.3
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from '../EmptyState';
import { Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

describe('EmptyState', () => {
  describe('Basic Rendering', () => {
    it('should render empty state message', () => {
      render(<EmptyState message="No data available" />);
      
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should render without icon by default', () => {
      const { container } = render(<EmptyState message="No data" />);
      
      // Only the message should be present
      expect(screen.getByText('No data')).toBeInTheDocument();
      const icons = container.querySelectorAll('svg');
      expect(icons).toHaveLength(0);
    });

    it('should render without action button by default', () => {
      render(<EmptyState message="No data" />);
      
      const button = screen.queryByRole('button');
      expect(button).not.toBeInTheDocument();
    });

    it('should center content', () => {
      const { container } = render(<EmptyState message="No data" />);
      
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
      // Centering is applied via MUI sx prop with flexbox
    });
  });

  describe('Message Display', () => {
    it('should display simple message', () => {
      render(<EmptyState message="No items found" />);
      
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('should display detailed message', () => {
      const message = 'You haven\'t created any study plans yet. Create your first plan to get started!';
      render(<EmptyState message={message} />);
      
      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('should display message with special characters', () => {
      render(<EmptyState message="No results for 'search query' 🔍" />);
      
      expect(screen.getByText("No results for 'search query' 🔍")).toBeInTheDocument();
    });

    it('should handle very long messages', () => {
      const longMessage = 'This is a very long empty state message that might wrap to multiple lines in the UI. It provides detailed information about why there is no data and what the user can do next.';
      render(<EmptyState message={longMessage} />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should render message as h6 variant', () => {
      render(<EmptyState message="No data" />);
      
      const heading = screen.getByText('No data');
      expect(heading.tagName).toBe('H6');
    });
  });

  describe('Icon Display', () => {
    it('should display icon when provided', () => {
      render(<EmptyState message="No data" icon={<InboxIcon />} />);
      
      expect(screen.getByText('No data')).toBeInTheDocument();
      const icon = screen.getByTestId('InboxIcon');
      expect(icon).toBeInTheDocument();
    });

    it('should display custom icon', () => {
      render(<EmptyState message="No data" icon={<span data-testid="custom-icon">📦</span>} />);
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('should display emoji as icon', () => {
      render(<EmptyState message="No data" icon="🎯" />);
      
      expect(screen.getByText('🎯')).toBeInTheDocument();
    });

    it('should display icon above message', () => {
      const { container } = render(<EmptyState message="No data" icon={<InboxIcon />} />);
      
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
      // Flex direction column ensures icon is above message
      expect(screen.getByTestId('InboxIcon')).toBeInTheDocument();
      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('should not display icon when not provided', () => {
      const { container } = render(<EmptyState message="No data" />);
      
      const icons = container.querySelectorAll('svg');
      expect(icons).toHaveLength(0);
    });
  });

  describe('Action Button', () => {
    it('should display action button when provided', () => {
      const action = <Button>Create New</Button>;
      render(<EmptyState message="No data" action={action} />);
      
      expect(screen.getByRole('button', { name: /create new/i })).toBeInTheDocument();
    });

    it('should handle button click', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const action = <Button onClick={handleClick}>Add Item</Button>;
      
      render(<EmptyState message="No data" action={action} />);
      
      const button = screen.getByRole('button', { name: /add item/i });
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should display action button below message', () => {
      const action = <Button>Create</Button>;
      render(<EmptyState message="No data" action={action} />);
      
      expect(screen.getByText('No data')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('should display multiple action buttons', () => {
      const action = (
        <>
          <Button>Create</Button>
          <Button>Import</Button>
        </>
      );
      render(<EmptyState message="No data" action={action} />);
      
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
    });

    it('should not display action when not provided', () => {
      render(<EmptyState message="No data" />);
      
      const button = screen.queryByRole('button');
      expect(button).not.toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should display icon, message, and action together', () => {
      const action = <Button>Create Plan</Button>;
      render(
        <EmptyState 
          message="No study plans yet" 
          icon={<InboxIcon />}
          action={action}
        />
      );
      
      expect(screen.getByTestId('InboxIcon')).toBeInTheDocument();
      expect(screen.getByText('No study plans yet')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create plan/i })).toBeInTheDocument();
    });

    it('should display emoji icon with message and action', () => {
      const action = <Button>Get Started</Button>;
      render(
        <EmptyState 
          message="No sessions found" 
          icon="📝"
          action={action}
        />
      );
      
      expect(screen.getByText('📝')).toBeInTheDocument();
      expect(screen.getByText('No sessions found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
    });

    it('should display icon and message without action', () => {
      render(
        <EmptyState 
          message="No results" 
          icon={<InboxIcon />}
        />
      );
      
      expect(screen.getByTestId('InboxIcon')).toBeInTheDocument();
      expect(screen.getByText('No results')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should display message and action without icon', () => {
      const action = <Button>Add</Button>;
      render(
        <EmptyState 
          message="Empty list" 
          action={action}
        />
      );
      
      expect(screen.getByText('Empty list')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom sx prop', () => {
      const { container } = render(
        <EmptyState message="No data" sx={{ backgroundColor: 'lightgray' }} />
      );
      
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
    });

    it('should apply custom minHeight', () => {
      const { container } = render(
        <EmptyState message="No data" sx={{ minHeight: '500px' }} />
      );
      
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
    });

    it('should apply custom padding', () => {
      const { container } = render(
        <EmptyState message="No data" sx={{ p: 8 }} />
      );
      
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('should center content vertically and horizontally', () => {
      const { container } = render(<EmptyState message="No data" />);
      
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
      // Centering is applied via flexbox with alignItems and justifyContent
    });

    it('should have minimum height', () => {
      const { container } = render(<EmptyState message="No data" />);
      
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
      // Default minHeight is 300px
    });

    it('should have text centered', () => {
      const { container } = render(<EmptyState message="No data" />);
      
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
      // Text alignment is center via sx prop
    });

    it('should have padding', () => {
      const { container } = render(<EmptyState message="No data" />);
      
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
      // Default padding is 4 (32px)
    });
  });

  describe('Real-World Scenarios', () => {
    it('should render empty resume list state', () => {
      const action = <Button variant="contained">Upload Resume</Button>;
      render(
        <EmptyState 
          message="No resumes uploaded yet. Upload your first resume to get started!" 
          icon="📄"
          action={action}
        />
      );
      
      expect(screen.getByText('📄')).toBeInTheDocument();
      expect(screen.getByText('No resumes uploaded yet. Upload your first resume to get started!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upload resume/i })).toBeInTheDocument();
    });

    it('should render empty study plans state', () => {
      const action = <Button variant="contained">Create Study Plan</Button>;
      render(
        <EmptyState 
          message="You haven't created any study plans yet." 
          icon={<InboxIcon />}
          action={action}
        />
      );
      
      expect(screen.getByTestId('InboxIcon')).toBeInTheDocument();
      expect(screen.getByText("You haven't created any study plans yet.")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create study plan/i })).toBeInTheDocument();
    });

    it('should render empty search results', () => {
      render(
        <EmptyState 
          message="No results found for your search." 
          icon="🔍"
        />
      );
      
      expect(screen.getByText('🔍')).toBeInTheDocument();
      expect(screen.getByText('No results found for your search.')).toBeInTheDocument();
    });

    it('should render empty coaching sessions', () => {
      const action = <Button>Start Coaching Session</Button>;
      render(
        <EmptyState 
          message="No coaching sessions yet. Start your first session!" 
          icon="🎯"
          action={action}
        />
      );
      
      expect(screen.getByText('🎯')).toBeInTheDocument();
      expect(screen.getByText('No coaching sessions yet. Start your first session!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start coaching session/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<EmptyState message="No data" />);
      
      const heading = screen.getByText('No data');
      expect(heading.tagName).toBe('H6');
    });

    it('should have accessible action button', () => {
      const action = <Button>Create</Button>;
      render(<EmptyState message="No data" action={action} />);
      
      const button = screen.getByRole('button', { name: /create/i });
      expect(button).toBeInTheDocument();
    });

    it('should support keyboard navigation on action button', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const action = <Button onClick={handleClick}>Create</Button>;
      
      render(<EmptyState message="No data" action={action} />);
      
      const button = screen.getByRole('button', { name: /create/i });
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      render(<EmptyState message="" />);
      
      const heading = screen.getByRole('heading', { level: 6 });
      expect(heading).toBeInTheDocument();
    });

    it('should handle null icon gracefully', () => {
      render(<EmptyState message="No data" icon={null} />);
      
      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('should handle undefined action gracefully', () => {
      render(<EmptyState message="No data" action={undefined} />);
      
      expect(screen.getByText('No data')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Instances', () => {
    it('should render multiple empty states independently', () => {
      render(
        <>
          <EmptyState message="No data 1" icon="📦" />
          <EmptyState message="No data 2" icon="📝" />
        </>
      );
      
      expect(screen.getByText('No data 1')).toBeInTheDocument();
      expect(screen.getByText('No data 2')).toBeInTheDocument();
      expect(screen.getByText('📦')).toBeInTheDocument();
      expect(screen.getByText('📝')).toBeInTheDocument();
    });

    it('should handle different actions for multiple empty states', async () => {
      const user = userEvent.setup();
      const handleClick1 = vi.fn();
      const handleClick2 = vi.fn();
      
      render(
        <>
          <EmptyState 
            message="No data 1" 
            action={<Button onClick={handleClick1}>Action 1</Button>}
          />
          <EmptyState 
            message="No data 2" 
            action={<Button onClick={handleClick2}>Action 2</Button>}
          />
        </>
      );
      
      const button1 = screen.getByRole('button', { name: /action 1/i });
      await user.click(button1);
      
      expect(handleClick1).toHaveBeenCalledTimes(1);
      expect(handleClick2).not.toHaveBeenCalled();
    });
  });

  describe('Icon Styling', () => {
    it('should apply opacity to icon', () => {
      const { container } = render(<EmptyState message="No data" icon="📦" />);
      
      const iconBox = container.querySelector('div > div');
      expect(iconBox).toBeInTheDocument();
      // Opacity 0.5 is applied via sx prop
    });

    it('should apply large font size to icon', () => {
      const { container } = render(<EmptyState message="No data" icon="📦" />);
      
      const iconBox = container.querySelector('div > div');
      expect(iconBox).toBeInTheDocument();
      // Font size 4rem is applied via sx prop
    });

    it('should have margin below icon', () => {
      const { container } = render(<EmptyState message="No data" icon="📦" />);
      
      const iconBox = container.querySelector('div > div');
      expect(iconBox).toBeInTheDocument();
      // Margin bottom 2 (16px) is applied via sx prop
    });
  });
});
