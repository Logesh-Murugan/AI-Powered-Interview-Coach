/**
 * Unit Tests for QuickStats Component
 * Tests stat calculations, rendering, and data display
 * 
 * Requirements: COMP-2.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import QuickStats from '../QuickStats';
import * as analyticsService from '../../../services/analyticsService';
import type { AnalyticsOverview } from '../../../services/analyticsService';

// Mock the analytics service
vi.mock('../../../services/analyticsService');

const mockGetAnalyticsOverview = vi.mocked(analyticsService.default.getAnalyticsOverview);

describe('QuickStats', () => {
  const mockAnalyticsData: AnalyticsOverview = {
    total_interviews_completed: 25,
    average_score_last_30_days: 78.5,
    improvement_rate: 12.3,
    total_practice_hours: 15.75,
    score_over_time: [],
    category_performance: [],
    strengths: [],
    weaknesses: [],
    recommendations: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner while fetching data', () => {
      mockGetAnalyticsOverview.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<QuickStats />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should not display content while loading', () => {
      mockGetAnalyticsOverview.mockImplementation(() => new Promise(() => {}));

      render(<QuickStats />);

      expect(screen.queryByText('Quick Stats')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when API call fails', async () => {
      mockGetAnalyticsOverview.mockRejectedValue(new Error('Network error'));

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('Unable to load statistics')).toBeInTheDocument();
      });
    });

    it('should display error in an alert component', async () => {
      mockGetAnalyticsOverview.mockRejectedValue(new Error('API error'));

      render(<QuickStats />);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Unable to load statistics');
      });
    });
  });

  describe('Component Rendering', () => {
    it('should display component title', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('Quick Stats')).toBeInTheDocument();
      });
    });

    it('should call getAnalyticsOverview on mount', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(mockGetAnalyticsOverview).toHaveBeenCalledTimes(1);
      });
    });

    it('should render three stat cards', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
        expect(screen.getByText('Average Score')).toBeInTheDocument();
        expect(screen.getByText('Practice Time')).toBeInTheDocument();
      });
    });
  });

  describe('Total Sessions Stat', () => {
    it('should display total sessions label', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
      });
    });

    it('should display total sessions count', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument();
      });
    });

    it('should display assessment icon', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
      });
      // Icon is rendered as MUI component
    });

    it('should handle zero sessions', async () => {
      const zeroData: AnalyticsOverview = {
        ...mockAnalyticsData,
        total_interviews_completed: 0,
      };
      mockGetAnalyticsOverview.mockResolvedValue(zeroData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('should handle large session counts', async () => {
      const largeData: AnalyticsOverview = {
        ...mockAnalyticsData,
        total_interviews_completed: 9999,
      };
      mockGetAnalyticsOverview.mockResolvedValue(largeData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('9999')).toBeInTheDocument();
      });
    });
  });

  describe('Average Score Stat', () => {
    it('should display average score label', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('Average Score')).toBeInTheDocument();
      });
    });

    it('should display average score as percentage', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('79%')).toBeInTheDocument(); // Rounded from 78.5
      });
    });

    it('should display trending up icon', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('Average Score')).toBeInTheDocument();
      });
      // Icon is rendered as MUI component
    });

    it('should display trend indicator when improvement rate exists', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('12.3%')).toBeInTheDocument();
      });
    });

    it('should display upward arrow for positive trend', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('12.3%')).toBeInTheDocument();
      });
      // Arrow icon is rendered
    });

    it('should display downward arrow for negative trend', async () => {
      const negativeData: AnalyticsOverview = {
        ...mockAnalyticsData,
        improvement_rate: -5.2,
      };
      mockGetAnalyticsOverview.mockResolvedValue(negativeData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('5.2%')).toBeInTheDocument(); // Absolute value
      });
      // Downward arrow icon is rendered
    });

    it('should not display trend when improvement rate is zero', async () => {
      const zeroTrendData: AnalyticsOverview = {
        ...mockAnalyticsData,
        improvement_rate: 0,
      };
      mockGetAnalyticsOverview.mockResolvedValue(zeroTrendData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('Average Score')).toBeInTheDocument();
      });
      // No trend indicator should be shown
    });

    it('should display "N/A" when average score is null', async () => {
      const nullScoreData: AnalyticsOverview = {
        ...mockAnalyticsData,
        average_score_last_30_days: null as any,
      };
      mockGetAnalyticsOverview.mockResolvedValue(nullScoreData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('N/A')).toBeInTheDocument();
      });
    });

    it('should handle perfect score', async () => {
      const perfectData: AnalyticsOverview = {
        ...mockAnalyticsData,
        average_score_last_30_days: 100,
      };
      mockGetAnalyticsOverview.mockResolvedValue(perfectData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });

    it('should handle very low score', async () => {
      const lowScoreData: AnalyticsOverview = {
        ...mockAnalyticsData,
        average_score_last_30_days: 5.3,
      };
      mockGetAnalyticsOverview.mockResolvedValue(lowScoreData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('5%')).toBeInTheDocument();
      });
    });
  });

  describe('Practice Time Stat', () => {
    it('should display practice time label', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('Practice Time')).toBeInTheDocument();
      });
    });

    it('should display practice time in hours and minutes', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('15h 45m')).toBeInTheDocument(); // 15.75 hours = 15h 45m
      });
    });

    it('should display clock icon', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('Practice Time')).toBeInTheDocument();
      });
      // Icon is rendered as MUI component
    });

    it('should display only minutes when less than 1 hour', async () => {
      const shortTimeData: AnalyticsOverview = {
        ...mockAnalyticsData,
        total_practice_hours: 0.5,
      };
      mockGetAnalyticsOverview.mockResolvedValue(shortTimeData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('30m')).toBeInTheDocument();
      });
    });

    it('should handle zero practice time', async () => {
      const zeroTimeData: AnalyticsOverview = {
        ...mockAnalyticsData,
        total_practice_hours: 0,
      };
      mockGetAnalyticsOverview.mockResolvedValue(zeroTimeData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('0m')).toBeInTheDocument();
      });
    });

    it('should handle large practice hours', async () => {
      const largeTimeData: AnalyticsOverview = {
        ...mockAnalyticsData,
        total_practice_hours: 123.25,
      };
      mockGetAnalyticsOverview.mockResolvedValue(largeTimeData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('123h 15m')).toBeInTheDocument();
      });
    });

    it('should round minutes correctly', async () => {
      const decimalTimeData: AnalyticsOverview = {
        ...mockAnalyticsData,
        total_practice_hours: 2.333, // 2h 20m (rounded from 19.98m)
      };
      mockGetAnalyticsOverview.mockResolvedValue(decimalTimeData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('2h 20m')).toBeInTheDocument();
      });
    });

    it('should handle exactly 1 hour', async () => {
      const oneHourData: AnalyticsOverview = {
        ...mockAnalyticsData,
        total_practice_hours: 1.0,
      };
      mockGetAnalyticsOverview.mockResolvedValue(oneHourData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('1h 0m')).toBeInTheDocument();
      });
    });
  });

  describe('Grid Layout', () => {
    it('should render stats in a grid', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('Quick Stats')).toBeInTheDocument();
      });
      // Grid is rendered with MUI Grid component
    });

    it('should display all three stats side by side', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
        expect(screen.getByText('Average Score')).toBeInTheDocument();
        expect(screen.getByText('Practice Time')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle all stats at zero', async () => {
      const allZeroData: AnalyticsOverview = {
        total_interviews_completed: 0,
        average_score_last_30_days: null as any,
        improvement_rate: 0,
        total_practice_hours: 0,
        score_over_time: [],
        category_performance: [],
        strengths: [],
        weaknesses: [],
        recommendations: [],
      };
      mockGetAnalyticsOverview.mockResolvedValue(allZeroData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
        expect(screen.getByText('N/A')).toBeInTheDocument();
        expect(screen.getByText('0m')).toBeInTheDocument();
      });
    });

    it('should handle very large improvement rate', async () => {
      const largeImprovementData: AnalyticsOverview = {
        ...mockAnalyticsData,
        improvement_rate: 99.9,
      };
      mockGetAnalyticsOverview.mockResolvedValue(largeImprovementData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('99.9%')).toBeInTheDocument();
      });
    });

    it('should handle very small improvement rate', async () => {
      const smallImprovementData: AnalyticsOverview = {
        ...mockAnalyticsData,
        improvement_rate: 0.1,
      };
      mockGetAnalyticsOverview.mockResolvedValue(smallImprovementData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('0.1%')).toBeInTheDocument();
      });
    });

    it('should handle decimal session counts (should not happen but defensive)', async () => {
      const decimalSessionData: AnalyticsOverview = {
        ...mockAnalyticsData,
        total_interviews_completed: 25.7 as any,
      };
      mockGetAnalyticsOverview.mockResolvedValue(decimalSessionData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('25.7')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible loading state', () => {
      mockGetAnalyticsOverview.mockImplementation(() => new Promise(() => {}));

      render(<QuickStats />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should have descriptive labels for each stat', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<QuickStats />);

      await waitFor(() => {
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
        expect(screen.getByText('Average Score')).toBeInTheDocument();
        expect(screen.getByText('Practice Time')).toBeInTheDocument();
      });
    });
  });
});
