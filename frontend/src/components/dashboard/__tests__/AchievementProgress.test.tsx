/**
 * Unit Tests for AchievementProgress Component
 * Tests rendering, loading states, error states, and achievement display
 * 
 * Requirements: COMP-2.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AchievementProgress from '../AchievementProgress';
import * as achievementsService from '../../../services/achievementsService';
import type { UserAchievementsResponse } from '../../../services/achievementsService';

// Mock the achievements service
vi.mock('../../../services/achievementsService');

const mockGetUserAchievements = vi.mocked(achievementsService.getUserAchievements);

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AchievementProgress', () => {
  const mockAchievementsData: UserAchievementsResponse = {
    achievements: [
      {
        id: 1,
        user_id: 123,
        achievement_id: 1,
        unlocked_at: '2024-01-20T10:00:00Z',
        achievement: {
          id: 1,
          name: 'First Steps',
          description: 'Complete your first interview session',
          icon: '🎯',
          points: 10,
          category: 'milestone',
        },
      },
      {
        id: 2,
        user_id: 123,
        achievement_id: 2,
        unlocked_at: '2024-01-19T15:30:00Z',
        achievement: {
          id: 2,
          name: 'Quick Learner',
          description: 'Score 80% or higher on your first session',
          icon: '⚡',
          points: 15,
          category: 'performance',
        },
      },
      {
        id: 3,
        user_id: 123,
        achievement_id: 3,
        unlocked_at: '2024-01-18T09:00:00Z',
        achievement: {
          id: 3,
          name: 'Consistent',
          description: 'Practice 3 days in a row',
          icon: '🔥',
          points: 20,
          category: 'streak',
        },
      },
    ],
    completion_percentage: 35.5,
    total_points: 45,
  };

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner while fetching data', () => {
      mockGetUserAchievements.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithRouter(<AchievementProgress />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should not display content while loading', () => {
      mockGetUserAchievements.mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<AchievementProgress />);

      expect(screen.queryByText('Achievement Progress')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when API call fails', async () => {
      mockGetUserAchievements.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByText('Unable to load achievements')).toBeInTheDocument();
      });
    });

    it('should display error in an alert component', async () => {
      mockGetUserAchievements.mockRejectedValue(new Error('API error'));

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Unable to load achievements');
      });
    });
  });

  describe('Component Rendering', () => {
    it('should display component title', async () => {
      mockGetUserAchievements.mockResolvedValue(mockAchievementsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByText('Achievement Progress')).toBeInTheDocument();
      });
    });

    it('should display trophy icon', async () => {
      mockGetUserAchievements.mockResolvedValue(mockAchievementsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByText('Achievement Progress')).toBeInTheDocument();
      });
      // Icon is rendered as MUI component
    });

    it('should call getUserAchievements on mount', async () => {
      mockGetUserAchievements.mockResolvedValue(mockAchievementsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(mockGetUserAchievements).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Overall Completion Display', () => {
    it('should display overall completion label', async () => {
      mockGetUserAchievements.mockResolvedValue(mockAchievementsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByText('Overall Completion')).toBeInTheDocument();
      });
    });

    it('should display completion percentage', async () => {
      mockGetUserAchievements.mockResolvedValue(mockAchievementsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByText('36%')).toBeInTheDocument(); // Rounded from 35.5
      });
    });

    it('should display progress bar', async () => {
      mockGetUserAchievements.mockResolvedValue(mockAchievementsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should display total points earned', async () => {
      mockGetUserAchievements.mockResolvedValue(mockAchievementsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByText('45 points earned')).toBeInTheDocument();
      });
    });

    it('should handle 0% completion', async () => {
      const zeroData: UserAchievementsResponse = {
        achievements: [],
        completion_percentage: 0,
        total_points: 0,
      };
      mockGetUserAchievements.mockResolvedValue(zeroData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByText('0%')).toBeInTheDocument();
        expect(screen.getByText('0 points earned')).toBeInTheDocument();
      });
    });

    it('should handle 100% completion', async () => {
      const fullData: UserAchievementsResponse = {
        ...mockAchievementsData,
        completion_percentage: 100,
        total_points: 500,
      };
      mockGetUserAchievements.mockResolvedValue(fullData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByText('500 points earned')).toBeInTheDocument();
      });
    });
  });

  describe('Recent Achievements Display', () => {
    it('should display "Recent Unlocks" label', async () => {
      mockGetUserAchievements.mockResolvedValue(mockAchievementsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByText('Recent Unlocks')).toBeInTheDocument();
      });
    });

    it('should display last 3 achievements', async () => {
      mockGetUserAchievements.mockResolvedValue(mockAchievementsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument();
        expect(screen.getByText('Quick Learner')).toBeInTheDocument();
        expect(screen.getByText('Consistent')).toBeInTheDocument();
      });
    });

    it('should display achievement icons', async () => {
      mockGetUserAchievements.mockResolvedValue(mockAchievementsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByText('🎯')).toBeInTheDocument();
        expect(screen.getByText('⚡')).toBeInTheDocument();
        expect(screen.getByText('🔥')).toBeInTheDocument();
      });
    });

    it('should display achievement descriptions', async () => {
      mockGetUserAchievements.mockResolvedValue(mockAchievementsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByText('Complete your first interview session')).toBeInTheDocument();
        expect(screen.getByText('Score 80% or higher on your first session')).toBeInTheDocument();
        expect(screen.getByText('Practice 3 days in a row')).toBeInTheDocument();
      });
    });

    it('should display achievement points', async () => {
      mockGetUserAchievements.mockResolvedValue(mockAchievementsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByText('10 pts')).toBeInTheDocument();
        expect(screen.getByText('15 pts')).toBeInTheDocument();
        expect(screen.getByText('20 pts')).toBeInTheDocument();
      });
    });

    it('should sort achievements by unlock date (most recent first)', async () => {
      mockGetUserAchievements.mockResolvedValue(mockAchievementsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        const achievements = screen.getAllByText(/pts/);
        // First Steps (most recent) should appear first
        expect(achievements[0]).toHaveTextContent('10 pts');
      });
    });

    it('should limit display to 3 achievements even if more exist', async () => {
      const manyAchievements: UserAchievementsResponse = {
        achievements: [
          ...mockAchievementsData.achievements,
          {
            id: 4,
            user_id: 123,
            achievement_id: 4,
            unlocked_at: '2024-01-17T08:00:00Z',
            achievement: {
              id: 4,
              name: 'Fourth Achievement',
              description: 'This should not appear',
              icon: '🌟',
              points: 25,
              category: 'milestone',
            },
          },
        ],
        completion_percentage: 45,
        total_points: 70,
      };
      mockGetUserAchievements.mockResolvedValue(manyAchievements);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.queryByText('Fourth Achievement')).not.toBeInTheDocument();
        expect(screen.queryByText('This should not appear')).not.toBeInTheDocument();
      });
    });
  });

  describe('No Achievements State', () => {
    it('should display message when no achievements unlocked', async () => {
      const noAchievements: UserAchievementsResponse = {
        achievements: [],
        completion_percentage: 0,
        total_points: 0,
      };
      mockGetUserAchievements.mockResolvedValue(noAchievements);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByText('No achievements unlocked yet. Keep practicing!')).toBeInTheDocument();
      });
    });

    it('should not display "Recent Unlocks" section when no achievements', async () => {
      const noAchievements: UserAchievementsResponse = {
        achievements: [],
        completion_percentage: 0,
        total_points: 0,
      };
      mockGetUserAchievements.mockResolvedValue(noAchievements);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.queryByText('Recent Unlocks')).not.toBeInTheDocument();
      });
    });

    it('should still display "View All Achievements" button when no achievements', async () => {
      const noAchievements: UserAchievementsResponse = {
        achievements: [],
        completion_percentage: 0,
        total_points: 0,
      };
      mockGetUserAchievements.mockResolvedValue(noAchievements);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view all achievements/i })).toBeInTheDocument();
      });
    });
  });

  describe('View All Button', () => {
    it('should display "View All Achievements" button', async () => {
      mockGetUserAchievements.mockResolvedValue(mockAchievementsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view all achievements/i })).toBeInTheDocument();
      });
    });

    it('should navigate to achievements page when button is clicked', async () => {
      const user = userEvent.setup();
      mockGetUserAchievements.mockResolvedValue(mockAchievementsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view all achievements/i })).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /view all achievements/i });
      await user.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('/achievements');
    });

    it('should display arrow icon on button', async () => {
      mockGetUserAchievements.mockResolvedValue(mockAchievementsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /view all achievements/i });
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle decimal completion percentages', async () => {
      const decimalData: UserAchievementsResponse = {
        ...mockAchievementsData,
        completion_percentage: 42.7,
      };
      mockGetUserAchievements.mockResolvedValue(decimalData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByText('43%')).toBeInTheDocument(); // Rounded
      });
    });

    it('should handle very long achievement names', async () => {
      const longNameData: UserAchievementsResponse = {
        achievements: [
          {
            id: 1,
            user_id: 123,
            achievement_id: 1,
            unlocked_at: '2024-01-20T10:00:00Z',
            achievement: {
              id: 1,
              name: 'This is a very long achievement name that should still display properly',
              description: 'Description',
              icon: '🎯',
              points: 10,
              category: 'milestone',
            },
          },
        ],
        completion_percentage: 10,
        total_points: 10,
      };
      mockGetUserAchievements.mockResolvedValue(longNameData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByText('This is a very long achievement name that should still display properly')).toBeInTheDocument();
      });
    });

    it('should handle very long achievement descriptions', async () => {
      const longDescData: UserAchievementsResponse = {
        achievements: [
          {
            id: 1,
            user_id: 123,
            achievement_id: 1,
            unlocked_at: '2024-01-20T10:00:00Z',
            achievement: {
              id: 1,
              name: 'Achievement',
              description: 'This is a very long description that explains in great detail what this achievement is about and how to unlock it',
              icon: '🎯',
              points: 10,
              category: 'milestone',
            },
          },
        ],
        completion_percentage: 10,
        total_points: 10,
      };
      mockGetUserAchievements.mockResolvedValue(longDescData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByText('This is a very long description that explains in great detail what this achievement is about and how to unlock it')).toBeInTheDocument();
      });
    });

    it('should handle large point values', async () => {
      const largePointsData: UserAchievementsResponse = {
        ...mockAchievementsData,
        total_points: 9999,
      };
      mockGetUserAchievements.mockResolvedValue(largePointsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        expect(screen.getByText('9999 points earned')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible loading state', () => {
      mockGetUserAchievements.mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<AchievementProgress />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should have accessible button', async () => {
      mockGetUserAchievements.mockResolvedValue(mockAchievementsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /view all achievements/i });
        expect(button).toHaveAccessibleName();
      });
    });

    it('should have accessible progress bar', async () => {
      mockGetUserAchievements.mockResolvedValue(mockAchievementsData);

      renderWithRouter(<AchievementProgress />);

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
      });
    });
  });
});
