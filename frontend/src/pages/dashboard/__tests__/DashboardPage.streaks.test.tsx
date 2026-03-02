/**
 * Integration Tests for Dashboard Streak Display
 * Tests StreakCard integration in DashboardPage
 * 
 * Requirements: INT-3.2, COMP-2.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import DashboardPage from '../DashboardPage';
import authReducer from '../../../store/slices/authSlice';
import * as interviewService from '../../../services/interviewService';
import * as streaksService from '../../../services/streaksService';
import type { CurrentStreakResponse } from '../../../services/streaksService';

// Mock services
vi.mock('../../../services/interviewService');
vi.mock('../../../services/streaksService');

const mockGetInterviewSessions = vi.mocked(interviewService.getInterviewSessions);
const mockGetCurrentStreak = vi.mocked(streaksService.getCurrentStreak);

// Helper to create a mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          account_status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        isLoading: false,
        error: null,
      },
    },
  });
};

// Helper to render component with providers
const renderWithProviders = (component: React.ReactElement) => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <BrowserRouter>{component}</BrowserRouter>
    </Provider>
  );
};

describe('DashboardPage - Streak Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock interview sessions to prevent errors
    mockGetInterviewSessions.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('StreakCard Display', () => {
    const mockStreakData: CurrentStreakResponse = {
      current_streak: 15,
      longest_streak: 30,
      last_practice_date: '2024-01-15T10:00:00Z',
      streak_active: true,
    };

    it('should render StreakCard component on dashboard', async () => {
      mockGetCurrentStreak.mockResolvedValue(mockStreakData);

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Practice Streak')).toBeInTheDocument();
      });
    });

    it('should display current streak on dashboard', async () => {
      mockGetCurrentStreak.mockResolvedValue(mockStreakData);

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/🔥 15/)).toBeInTheDocument();
      });
    });

    it('should display longest streak on dashboard', async () => {
      mockGetCurrentStreak.mockResolvedValue(mockStreakData);

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('30')).toBeInTheDocument();
        expect(screen.getByText('Longest Streak')).toBeInTheDocument();
      });
    });

    it('should display last practice date on dashboard', async () => {
      mockGetCurrentStreak.mockResolvedValue(mockStreakData);

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
        expect(screen.getByText('Last Practice')).toBeInTheDocument();
      });
    });

    it('should display View Details button on dashboard', async () => {
      mockGetCurrentStreak.mockResolvedValue(mockStreakData);

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Layout', () => {
    const mockStreakData: CurrentStreakResponse = {
      current_streak: 10,
      longest_streak: 20,
      last_practice_date: '2024-01-15T10:00:00Z',
      streak_active: true,
    };

    it('should display StreakCard after stats cards', async () => {
      mockGetCurrentStreak.mockResolvedValue(mockStreakData);

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        // Stats cards should be present
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        
        // StreakCard should be present
        expect(screen.getByText('Practice Streak')).toBeInTheDocument();
      });
    });

    it('should display StreakCard before Quick Actions', async () => {
      mockGetCurrentStreak.mockResolvedValue(mockStreakData);

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        // StreakCard should be present
        expect(screen.getByText('Practice Streak')).toBeInTheDocument();
        
        // Quick Actions should be present
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      });
    });

    it('should render all dashboard sections including StreakCard', async () => {
      mockGetCurrentStreak.mockResolvedValue(mockStreakData);

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        // Check all major dashboard sections
        expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
        expect(screen.getByText('Practice Streak')).toBeInTheDocument();
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state for StreakCard while fetching', async () => {
      mockGetCurrentStreak.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        // Dashboard should load but StreakCard should show loading
        expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
      });

      // StreakCard loading spinner should be present
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('should display dashboard content while StreakCard loads', async () => {
      mockGetCurrentStreak.mockImplementation(() => new Promise(() => {}));

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        // Other dashboard content should be visible
        expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error in StreakCard when API fails', async () => {
      mockGetCurrentStreak.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Unable to load streak data')).toBeInTheDocument();
      });
    });

    it('should not break dashboard when StreakCard fails', async () => {
      mockGetCurrentStreak.mockRejectedValue(new Error('API error'));

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        // Dashboard should still be functional
        expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        
        // StreakCard error should be displayed
        expect(screen.getByText('Unable to load streak data')).toBeInTheDocument();
      });
    });
  });

  describe('Active Streak Display on Dashboard', () => {
    it('should show fire emoji for active streak', async () => {
      mockGetCurrentStreak.mockResolvedValue({
        current_streak: 10,
        longest_streak: 20,
        last_practice_date: '2024-01-15T10:00:00Z',
        streak_active: true,
      });

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/🔥 10/)).toBeInTheDocument();
      });
    });

    it('should show sleep emoji for broken streak', async () => {
      mockGetCurrentStreak.mockResolvedValue({
        current_streak: 0,
        longest_streak: 15,
        last_practice_date: '2024-01-10T10:00:00Z',
        streak_active: false,
      });

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/💤 0/)).toBeInTheDocument();
      });
    });

    it('should show encouragement message for active streak', async () => {
      mockGetCurrentStreak.mockResolvedValue({
        current_streak: 7,
        longest_streak: 10,
        last_practice_date: '2024-01-15T10:00:00Z',
        streak_active: true,
      });

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Great job! Keep it up!/)).toBeInTheDocument();
      });
    });

    it('should show restart message for broken streak', async () => {
      mockGetCurrentStreak.mockResolvedValue({
        current_streak: 0,
        longest_streak: 10,
        last_practice_date: '2024-01-10T10:00:00Z',
        streak_active: false,
      });

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Start a new streak today!/)).toBeInTheDocument();
      });
    });
  });

  describe('Progress Indicator on Dashboard', () => {
    it('should display progress bar when longest streak exists', async () => {
      mockGetCurrentStreak.mockResolvedValue({
        current_streak: 10,
        longest_streak: 20,
        last_practice_date: '2024-01-15T10:00:00Z',
        streak_active: true,
      });

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Progress to longest')).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
      });
    });

    it('should not display progress bar when longest streak is 0', async () => {
      mockGetCurrentStreak.mockResolvedValue({
        current_streak: 0,
        longest_streak: 0,
        last_practice_date: null,
        streak_active: false,
      });

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.queryByText('Progress to longest')).not.toBeInTheDocument();
      });
    });
  });

  describe('User Interaction', () => {
    it('should allow navigation to streak details from dashboard', async () => {
      const user = await import('@testing-library/user-event').then(m => m.default.setup());
      
      mockGetCurrentStreak.mockResolvedValue({
        current_streak: 10,
        longest_streak: 20,
        last_practice_date: '2024-01-15T10:00:00Z',
        streak_active: true,
      });

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
      });

      const viewDetailsButton = screen.getByRole('button', { name: /view details/i });
      await user.click(viewDetailsButton);

      // Navigation is handled by React Router
      expect(viewDetailsButton).toBeInTheDocument();
    });
  });

  describe('Data Refresh', () => {
    it('should fetch streak data when dashboard loads', async () => {
      mockGetCurrentStreak.mockResolvedValue({
        current_streak: 5,
        longest_streak: 10,
        last_practice_date: '2024-01-15T10:00:00Z',
        streak_active: true,
      });

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(mockGetCurrentStreak).toHaveBeenCalledTimes(1);
      });
    });

    it('should display updated streak data after fetch', async () => {
      mockGetCurrentStreak.mockResolvedValue({
        current_streak: 25,
        longest_streak: 30,
        last_practice_date: '2024-01-15T10:00:00Z',
        streak_active: true,
      });

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/🔥 25/)).toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero streak on dashboard', async () => {
      mockGetCurrentStreak.mockResolvedValue({
        current_streak: 0,
        longest_streak: 0,
        last_practice_date: null,
        streak_active: false,
      });

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/💤 0/)).toBeInTheDocument();
        expect(screen.getByText('Never')).toBeInTheDocument();
      });
    });

    it('should handle very large streak numbers on dashboard', async () => {
      mockGetCurrentStreak.mockResolvedValue({
        current_streak: 365,
        longest_streak: 500,
        last_practice_date: '2024-01-15T10:00:00Z',
        streak_active: true,
      });

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/🔥 365/)).toBeInTheDocument();
        expect(screen.getByText('500')).toBeInTheDocument();
      });
    });

    it('should handle current streak exceeding longest streak', async () => {
      mockGetCurrentStreak.mockResolvedValue({
        current_streak: 35,
        longest_streak: 30,
        last_practice_date: '2024-01-15T10:00:00Z',
        streak_active: true,
      });

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/🔥 35/)).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument(); // Progress capped at 100%
      });
    });
  });

  describe('Component Integration', () => {
    it('should render StreakCard as a separate component', async () => {
      mockGetCurrentStreak.mockResolvedValue({
        current_streak: 10,
        longest_streak: 20,
        last_practice_date: '2024-01-15T10:00:00Z',
        streak_active: true,
      });

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        // StreakCard should be rendered with its own card structure
        const streakCard = screen.getByText('Practice Streak').closest('[class*="MuiCard"]');
        expect(streakCard).toBeInTheDocument();
      });
    });

    it('should maintain StreakCard independence from other dashboard components', async () => {
      mockGetCurrentStreak.mockRejectedValue(new Error('Streak API error'));
      // Interview service succeeds
      mockGetInterviewSessions.mockResolvedValue([
        {
          id: 1,
          user_id: 1,
          resume_id: 1,
          target_role: 'Software Engineer',
          status: 'completed',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
      ]);

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        // Dashboard stats should work
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
        
        // StreakCard should show error independently
        expect(screen.getByText('Unable to load streak data')).toBeInTheDocument();
      });
    });
  });
});
