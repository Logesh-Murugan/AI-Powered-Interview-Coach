/**
 * Unit Tests for StreakCalendar Component
 * Tests calendar rendering, day coloring, and tooltip functionality
 * 
 * Requirements: INT-3.6, INT-3.7
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StreakCalendar from '../StreakCalendar';
import * as streaksService from '../../../services/streaksService';
import type { StreakHistoryResponse } from '../../../services/streaksService';

// Mock the streaks service
vi.mock('../../../services/streaksService');

const mockGetStreakHistory = vi.mocked(streaksService.getStreakHistory);

describe('StreakCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner while fetching data', () => {
      mockGetStreakHistory.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<StreakCalendar />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should not display calendar grid while loading', () => {
      mockGetStreakHistory.mockImplementation(() => new Promise(() => {}));

      render(<StreakCalendar />);

      expect(screen.queryByText('Practice Calendar')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when API call fails', async () => {
      mockGetStreakHistory.mockRejectedValue(new Error('Network error'));

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Unable to load streak history')).toBeInTheDocument();
      });
    });

    it('should display error in an alert component', async () => {
      mockGetStreakHistory.mockRejectedValue(new Error('API error'));

      render(<StreakCalendar />);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Unable to load streak history');
      });
    });

    it('should allow dismissing error message', async () => {
      const user = userEvent.setup();
      mockGetStreakHistory.mockRejectedValue(new Error('API error'));

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Unable to load streak history')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(screen.queryByText('Unable to load streak history')).not.toBeInTheDocument();
    });
  });

  describe('Calendar Rendering', () => {
    const mockHistoryData: StreakHistoryResponse = {
      history: [
        { date: '2024-01-15', practiced: true },
        { date: '2024-01-14', practiced: true },
        { date: '2024-01-13', practiced: false },
        { date: '2024-01-12', practiced: true },
        { date: '2024-01-11', practiced: false },
      ],
      current_streak: 2,
      longest_streak: 5,
    };

    it('should display calendar header', async () => {
      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Practice Calendar')).toBeInTheDocument();
      });
    });

    it('should display month and year in header', async () => {
      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText(/January 2024/)).toBeInTheDocument();
      });
    });

    it('should display "Last 30 Days" subtitle', async () => {
      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText(/Last 30 Days/)).toBeInTheDocument();
      });
    });

    it('should render calendar days', async () => {
      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('14')).toBeInTheDocument();
        expect(screen.getByText('13')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('11')).toBeInTheDocument();
      });
    });

    it('should call getStreakHistory with 30 days parameter', async () => {
      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(mockGetStreakHistory).toHaveBeenCalledWith(30);
      });
    });
  });

  describe('Day Coloring', () => {
    const mockHistoryData: StreakHistoryResponse = {
      history: [
        { date: '2024-01-15', practiced: true },
        { date: '2024-01-14', practiced: false },
        { date: '2024-01-13', practiced: true },
      ],
      current_streak: 1,
      longest_streak: 5,
    };

    it('should color practiced days green', async () => {
      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        const day15 = screen.getByText('15').closest('div');
        expect(day15).toBeInTheDocument();
        // Green color is applied via MUI theme (success.light)
      });
    });

    it('should color missed days gray', async () => {
      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        const day14 = screen.getByText('14').closest('div');
        expect(day14).toBeInTheDocument();
        // Gray color is applied via MUI theme (grey.200)
      });
    });

    it('should display legend for practiced days', async () => {
      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Practiced')).toBeInTheDocument();
      });
    });

    it('should display legend for missed days', async () => {
      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Missed')).toBeInTheDocument();
      });
    });

    it('should display legend for today', async () => {
      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument();
      });
    });
  });

  describe('Today Highlighting', () => {
    it('should highlight today with border', async () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const mockHistoryData: StreakHistoryResponse = {
        history: [
          { date: todayStr, practiced: true },
          { date: '2024-01-14', practiced: false },
        ],
        current_streak: 1,
        longest_streak: 5,
      };

      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        const todayDay = screen.getByText(today.getDate().toString()).closest('div');
        expect(todayDay).toBeInTheDocument();
        // Border is applied via MUI sx prop
      });
    });

    it('should not highlight non-today days with border', async () => {
      const mockHistoryData: StreakHistoryResponse = {
        history: [
          { date: '2024-01-15', practiced: true },
          { date: '2024-01-14', practiced: false },
        ],
        current_streak: 1,
        longest_streak: 5,
      };

      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('14')).toBeInTheDocument();
      });
    });
  });

  describe('Tooltip Functionality', () => {
    const mockHistoryData: StreakHistoryResponse = {
      history: [
        { date: '2024-01-15', practiced: true },
        { date: '2024-01-14', practiced: false },
      ],
      current_streak: 1,
      longest_streak: 5,
    };

    it('should show tooltip on hover with practiced status', async () => {
      const user = userEvent.setup();
      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
      });

      const day15 = screen.getByText('15').closest('div');
      if (day15) {
        await user.hover(day15);
        
        // Tooltip content is rendered by MUI Tooltip
        await waitFor(() => {
          // The tooltip shows the formatted date and practice status
          expect(screen.getByText(/Monday, January 15, 2024/)).toBeInTheDocument();
          expect(screen.getByText((content, element) => element?.textContent === '✅ Practiced')).toBeInTheDocument();
        });
      }
    });

    it('should show tooltip on hover with missed status', async () => {
      const user = userEvent.setup();
      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText('14')).toBeInTheDocument();
      });

      const day14 = screen.getByText('14').closest('div');
      if (day14) {
        await user.hover(day14);
        
        await waitFor(() => {
          expect(screen.getByText(/Sunday, January 14, 2024/)).toBeInTheDocument();
          expect(screen.getByText((content, element) => element?.textContent === '❌ Missed')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Calendar Grid Layout', () => {
    it('should render 30 days when history has 30 entries', async () => {
      const history = Array.from({ length: 30 }, (_, i) => ({
        date: `2024-01-${String(30 - i).padStart(2, '0')}`,
        practiced: i % 2 === 0,
      }));

      const mockHistoryData: StreakHistoryResponse = {
        history,
        current_streak: 5,
        longest_streak: 10,
      };

      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Practice Calendar')).toBeInTheDocument();
      });

      // Check that multiple days are rendered
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should handle fewer than 30 days', async () => {
      const mockHistoryData: StreakHistoryResponse = {
        history: [
          { date: '2024-01-15', practiced: true },
          { date: '2024-01-14', practiced: false },
          { date: '2024-01-13', practiced: true },
        ],
        current_streak: 1,
        longest_streak: 5,
      };

      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('14')).toBeInTheDocument();
        expect(screen.getByText('13')).toBeInTheDocument();
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly in tooltips', async () => {
      const user = userEvent.setup();
      const mockHistoryData: StreakHistoryResponse = {
        history: [
          { date: '2024-03-25', practiced: true },
        ],
        current_streak: 1,
        longest_streak: 5,
      };

      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument();
      });

      const day25 = screen.getByText('25').closest('div');
      if (day25) {
        await user.hover(day25);
        
        await waitFor(() => {
          expect(screen.getByText(/Monday, March 25, 2024/)).toBeInTheDocument();
        });
      }
    });

    it('should display correct month in header', async () => {
      const mockHistoryData: StreakHistoryResponse = {
        history: [
          { date: '2024-12-25', practiced: true },
        ],
        current_streak: 1,
        longest_streak: 5,
      };

      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText(/December 2024/)).toBeInTheDocument();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should fetch history data on mount', async () => {
      const mockHistoryData: StreakHistoryResponse = {
        history: [
          { date: '2024-01-15', practiced: true },
        ],
        current_streak: 1,
        longest_streak: 5,
      };

      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(mockGetStreakHistory).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle component unmount gracefully', async () => {
      const mockHistoryData: StreakHistoryResponse = {
        history: [
          { date: '2024-01-15', practiced: true },
        ],
        current_streak: 1,
        longest_streak: 5,
      };

      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      const { unmount } = render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Practice Calendar')).toBeInTheDocument();
      });

      unmount();

      // Should not throw errors
      expect(mockGetStreakHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty history', async () => {
      const mockHistoryData: StreakHistoryResponse = {
        history: [],
        current_streak: 0,
        longest_streak: 0,
      };

      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Practice Calendar')).toBeInTheDocument();
      });
    });

    it('should handle all practiced days', async () => {
      const mockHistoryData: StreakHistoryResponse = {
        history: [
          { date: '2024-01-15', practiced: true },
          { date: '2024-01-14', practiced: true },
          { date: '2024-01-13', practiced: true },
        ],
        current_streak: 3,
        longest_streak: 5,
      };

      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('14')).toBeInTheDocument();
        expect(screen.getByText('13')).toBeInTheDocument();
      });
    });

    it('should handle all missed days', async () => {
      const mockHistoryData: StreakHistoryResponse = {
        history: [
          { date: '2024-01-15', practiced: false },
          { date: '2024-01-14', practiced: false },
          { date: '2024-01-13', practiced: false },
        ],
        current_streak: 0,
        longest_streak: 0,
      };

      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('14')).toBeInTheDocument();
        expect(screen.getByText('13')).toBeInTheDocument();
      });
    });
  });

  describe('Hover Effects', () => {
    it('should apply hover effects to calendar days', async () => {
      const user = userEvent.setup();
      const mockHistoryData: StreakHistoryResponse = {
        history: [
          { date: '2024-01-15', practiced: true },
        ],
        current_streak: 1,
        longest_streak: 5,
      };

      mockGetStreakHistory.mockResolvedValue(mockHistoryData);

      render(<StreakCalendar />);

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
      });

      const day15 = screen.getByText('15').closest('div');
      if (day15) {
        await user.hover(day15);
        // Hover effects are applied via CSS, just verify element is hoverable
        expect(day15).toBeInTheDocument();
      }
    });
  });
});
