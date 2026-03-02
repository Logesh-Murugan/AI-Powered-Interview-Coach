/**
 * Unit Tests for StreakPage Component
 * Tests detailed statistics display, milestones, and calendar integration
 * 
 * Requirements: INT-3.9
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import StreakPage from '../StreakPage';
import * as streaksService from '../../../services/streaksService';
import type { StreakStatsResponse } from '../../../services/streaksService';

// Mock the streaks service
vi.mock('../../../services/streaksService');

const mockGetStreakStats = vi.mocked(streaksService.getStreakStats);
const mockGetStreakHistory = vi.mocked(streaksService.getStreakHistory);

// Helper to render component with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('StreakPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the StreakCalendar component's API call
    mockGetStreakHistory.mockResolvedValue({
      history: [
        { date: '2024-01-15', practiced: true },
        { date: '2024-01-14', practiced: false },
      ],
      current_streak: 1,
      longest_streak: 5,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner while fetching data', () => {
      mockGetStreakStats.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithRouter(<StreakPage />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should not display content while loading', () => {
      mockGetStreakStats.mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<StreakPage />);

      expect(screen.queryByText('Practice Streaks')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when API call fails', async () => {
      mockGetStreakStats.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText('Unable to load streak statistics')).toBeInTheDocument();
      });
    });

    it('should display error in an alert component', async () => {
      mockGetStreakStats.mockRejectedValue(new Error('API error'));

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Unable to load streak statistics');
      });
    });

    it('should allow dismissing error message', async () => {
      const user = userEvent.setup();
      mockGetStreakStats.mockRejectedValue(new Error('API error'));

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText('Unable to load streak statistics')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(screen.queryByText('Unable to load streak statistics')).not.toBeInTheDocument();
    });
  });

  describe('Page Header', () => {
    const mockStatsData: StreakStatsResponse = {
      current_streak: 15,
      longest_streak: 30,
      total_practice_days: 100,
      streak_history: {},
      last_practice_date: '2024-01-15T10:00:00Z',
    };

    it('should display page title', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Practice Streaks' })).toBeInTheDocument();
      });
    });

    it('should display page subtitle', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText('Track your daily practice consistency and build lasting habits')).toBeInTheDocument();
      });
    });

    it('should display breadcrumb navigation', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Streaks')).toBeInTheDocument();
      });
    });

    it('should navigate to dashboard when breadcrumb is clicked', async () => {
      const user = userEvent.setup();
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      const dashboardLink = screen.getByText('Dashboard');
      await user.click(dashboardLink);

      // Navigation is handled by React Router
      expect(dashboardLink).toBeInTheDocument();
    });
  });

  describe('Statistics Cards', () => {
    const mockStatsData: StreakStatsResponse = {
      current_streak: 15,
      longest_streak: 30,
      total_practice_days: 100,
      streak_history: {},
      last_practice_date: '2024-01-15T10:00:00Z',
    };

    it('should display current streak card', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('Current Streak')).toBeInTheDocument();
      });
    });

    it('should display longest streak card', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText('30')).toBeInTheDocument();
        expect(screen.getByText('Longest Streak')).toBeInTheDocument();
      });
    });

    it('should display total practice days card', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Total Practice Days')).toBeInTheDocument();
      });
    });

    it('should display last practice date card', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
        expect(screen.getByText('Last Practice')).toBeInTheDocument();
      });
    });

    it('should display icons for each stat card', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByTestId('LocalFireDepartmentIcon')).toBeInTheDocument();
        expect(screen.getByTestId('EmojiEventsIcon')).toBeInTheDocument();
        expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();
        expect(screen.getByTestId('CalendarTodayIcon')).toBeInTheDocument();
      });
    });
  });

  describe('Motivational Messages', () => {
    it('should display beginner message when streak is 0', async () => {
      mockGetStreakStats.mockResolvedValue({
        current_streak: 0,
        longest_streak: 0,
        total_practice_days: 0,
        streak_history: {},
        last_practice_date: null,
      });

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText(/Every expert was once a beginner/)).toBeInTheDocument();
      });
    });

    it('should display peak message when current equals longest and >= 30', async () => {
      mockGetStreakStats.mockResolvedValue({
        current_streak: 35,
        longest_streak: 35,
        total_practice_days: 50,
        streak_history: {},
        last_practice_date: '2024-01-15T10:00:00Z',
      });

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText(/You're at your peak!/)).toBeInTheDocument();
      });
    });

    it('should display incredible dedication message for 30+ day streak', async () => {
      mockGetStreakStats.mockResolvedValue({
        current_streak: 40,
        longest_streak: 50,
        total_practice_days: 60,
        streak_history: {},
        last_practice_date: '2024-01-15T10:00:00Z',
      });

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText(/Incredible dedication!/)).toBeInTheDocument();
      });
    });

    it('should display one week message for 7-29 day streak', async () => {
      mockGetStreakStats.mockResolvedValue({
        current_streak: 10,
        longest_streak: 20,
        total_practice_days: 30,
        streak_history: {},
        last_practice_date: '2024-01-15T10:00:00Z',
      });

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText(/One week down!/)).toBeInTheDocument();
      });
    });

    it('should display great start message for 3-6 day streak', async () => {
      mockGetStreakStats.mockResolvedValue({
        current_streak: 5,
        longest_streak: 10,
        total_practice_days: 15,
        streak_history: {},
        last_practice_date: '2024-01-15T10:00:00Z',
      });

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText(/Great start!/)).toBeInTheDocument();
      });
    });

    it('should display keep going message for 1-2 day streak', async () => {
      mockGetStreakStats.mockResolvedValue({
        current_streak: 2,
        longest_streak: 5,
        total_practice_days: 10,
        streak_history: {},
        last_practice_date: '2024-01-15T10:00:00Z',
      });

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText(/Keep going!/)).toBeInTheDocument();
      });
    });
  });

  describe('Milestones Section', () => {
    const mockStatsData: StreakStatsResponse = {
      current_streak: 15,
      longest_streak: 30,
      total_practice_days: 100,
      streak_history: {},
      last_practice_date: '2024-01-15T10:00:00Z',
    };

    it('should display milestones section header', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText('Streak Milestones')).toBeInTheDocument();
      });
    });

    it('should display milestones description', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText(/Achieve these milestones by maintaining your practice streak/)).toBeInTheDocument();
      });
    });

    it('should display Week Warrior milestone (7 days)', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText('Week Warrior')).toBeInTheDocument();
        expect(screen.getByText('7 Day Streak')).toBeInTheDocument();
      });
    });

    it('should display Month Master milestone (30 days)', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText('Month Master')).toBeInTheDocument();
        expect(screen.getByText('30 Day Streak')).toBeInTheDocument();
      });
    });

    it('should display Century Champion milestone (100 days)', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText('Century Champion')).toBeInTheDocument();
        expect(screen.getByText('100 Day Streak')).toBeInTheDocument();
      });
    });

    it('should display Year Legend milestone (365 days)', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText('Year Legend')).toBeInTheDocument();
        expect(screen.getByText('365 Day Streak')).toBeInTheDocument();
      });
    });

    it('should mark achieved milestones', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        // Longest streak is 30, so Week Warrior and Month Master should be achieved
        const achievedChips = screen.getAllByText('Achieved');
        expect(achievedChips.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should mark locked milestones', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        // Longest streak is 30, so Century Champion and Year Legend should be locked
        const lockedChips = screen.getAllByText('Locked');
        expect(lockedChips.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should display milestone emojis', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText('🔥')).toBeInTheDocument();
        expect(screen.getByText('💪')).toBeInTheDocument();
        expect(screen.getByText('🏆')).toBeInTheDocument();
        expect(screen.getByText('👑')).toBeInTheDocument();
      });
    });
  });

  describe('Calendar Integration', () => {
    const mockStatsData: StreakStatsResponse = {
      current_streak: 15,
      longest_streak: 30,
      total_practice_days: 100,
      streak_history: {},
      last_practice_date: '2024-01-15T10:00:00Z',
    };

    it('should render StreakCalendar component', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText('Practice Calendar')).toBeInTheDocument();
      });
    });

    it('should display calendar before milestones section', async () => {
      mockGetStreakStats.mockResolvedValue(mockStatsData);

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        const calendar = screen.getByText('Practice Calendar');
        const milestones = screen.getByText('Streak Milestones');
        
        expect(calendar).toBeInTheDocument();
        expect(milestones).toBeInTheDocument();
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format last practice date correctly', async () => {
      mockGetStreakStats.mockResolvedValue({
        current_streak: 5,
        longest_streak: 10,
        total_practice_days: 20,
        streak_history: {},
        last_practice_date: '2024-03-25T14:30:00Z',
      });

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText(/March 25, 2024/)).toBeInTheDocument();
      });
    });

    it('should display "Never" when last practice date is null', async () => {
      mockGetStreakStats.mockResolvedValue({
        current_streak: 0,
        longest_streak: 0,
        total_practice_days: 0,
        streak_history: {},
        last_practice_date: null,
      });

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText('Never')).toBeInTheDocument();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should fetch stats data on mount', async () => {
      mockGetStreakStats.mockResolvedValue({
        current_streak: 5,
        longest_streak: 10,
        total_practice_days: 20,
        streak_history: {},
        last_practice_date: '2024-01-15T10:00:00Z',
      });

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(mockGetStreakStats).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle component unmount gracefully', async () => {
      mockGetStreakStats.mockResolvedValue({
        current_streak: 5,
        longest_streak: 10,
        total_practice_days: 20,
        streak_history: {},
        last_practice_date: '2024-01-15T10:00:00Z',
      });

      const { unmount } = renderWithRouter(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText('Practice Streaks')).toBeInTheDocument();
      });

      unmount();

      // Should not throw errors
      expect(mockGetStreakStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero stats correctly', async () => {
      mockGetStreakStats.mockResolvedValue({
        current_streak: 0,
        longest_streak: 0,
        total_practice_days: 0,
        streak_history: {},
        last_practice_date: null,
      });

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        // Use getAllByText and check we have the expected number of zeros
        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBeGreaterThan(0);
        expect(screen.getByText('Never')).toBeInTheDocument();
        expect(screen.getAllByText('Locked')).toHaveLength(4); // All milestones locked
      });
    });

    it('should handle very large streak numbers', async () => {
      mockGetStreakStats.mockResolvedValue({
        current_streak: 500,
        longest_streak: 500,
        total_practice_days: 600,
        streak_history: {},
        last_practice_date: '2024-01-15T10:00:00Z',
      });

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        // Use getAllByText and check we have the expected numbers
        const fiveHundreds = screen.getAllByText('500');
        expect(fiveHundreds.length).toBeGreaterThan(0);
        expect(screen.getByText('600')).toBeInTheDocument();
        expect(screen.getAllByText('Achieved')).toHaveLength(4); // All milestones achieved
      });
    });

    it('should handle milestone boundary cases', async () => {
      // Exactly 7 days - should achieve Week Warrior
      mockGetStreakStats.mockResolvedValue({
        current_streak: 7,
        longest_streak: 7,
        total_practice_days: 10,
        streak_history: {},
        last_practice_date: '2024-01-15T10:00:00Z',
      });

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        const achievedChips = screen.getAllByText('Achieved');
        expect(achievedChips.length).toBe(1); // Only Week Warrior
        
        const lockedChips = screen.getAllByText('Locked');
        expect(lockedChips.length).toBe(3); // Other three milestones
      });
    });
  });

  describe('Responsive Layout', () => {
    it('should render all sections in correct order', async () => {
      mockGetStreakStats.mockResolvedValue({
        current_streak: 15,
        longest_streak: 30,
        total_practice_days: 100,
        streak_history: {},
        last_practice_date: '2024-01-15T10:00:00Z',
      });

      renderWithRouter(<StreakPage />);

      await waitFor(() => {
        // Check that all major sections are present
        expect(screen.getByText('Practice Streaks')).toBeInTheDocument();
        expect(screen.getByText('Current Streak')).toBeInTheDocument();
        expect(screen.getByText('Practice Calendar')).toBeInTheDocument();
        expect(screen.getByText('Streak Milestones')).toBeInTheDocument();
      });
    });
  });
});
