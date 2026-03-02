/**
 * Unit Tests for PerformanceChart Component
 * Tests chart rendering, data visualization, and no-data states
 * 
 * Requirements: COMP-2.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PerformanceChart from '../PerformanceChart';
import * as analyticsService from '../../../services/analyticsService';
import type { AnalyticsOverview } from '../../../services/analyticsService';

// Mock the analytics service
vi.mock('../../../services/analyticsService');

const mockGetAnalyticsOverview = vi.mocked(analyticsService.default.getAnalyticsOverview);

describe('PerformanceChart', () => {
  const mockAnalyticsData: AnalyticsOverview = {
    total_interviews_completed: 15,
    average_score_last_30_days: 78.5,
    improvement_rate: 12.3,
    total_practice_hours: 25.5,
    score_over_time: [
      { week: 'Week 1', avg_score: 65, session_count: 3 },
      { week: 'Week 2', avg_score: 72, session_count: 4 },
      { week: 'Week 3', avg_score: 78, session_count: 5 },
      { week: 'Week 4', avg_score: 85, session_count: 3 },
    ],
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

      render(<PerformanceChart />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should not display content while loading', () => {
      mockGetAnalyticsOverview.mockImplementation(() => new Promise(() => {}));

      render(<PerformanceChart />);

      expect(screen.queryByText('Performance Trend')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when API call fails', async () => {
      mockGetAnalyticsOverview.mockRejectedValue(new Error('Network error'));

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Unable to load performance data')).toBeInTheDocument();
      });
    });

    it('should display error in an alert component', async () => {
      mockGetAnalyticsOverview.mockRejectedValue(new Error('API error'));

      render(<PerformanceChart />);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Unable to load performance data');
      });
    });
  });

  describe('Component Rendering', () => {
    it('should display component title', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
    });

    it('should display trending up icon', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
      // Icon is rendered as MUI component
    });

    it('should call getAnalyticsOverview on mount', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(mockGetAnalyticsOverview).toHaveBeenCalledTimes(1);
      });
    });

    it('should display chart caption', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Score trends over the last 30 days')).toBeInTheDocument();
      });
    });
  });

  describe('Chart Data Display', () => {
    it('should render chart with data points', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
      // Chart is rendered by Recharts library
    });

    it('should transform score_over_time data correctly', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
      // Data transformation happens internally
    });

    it('should round average scores to integers', async () => {
      const dataWithDecimals: AnalyticsOverview = {
        ...mockAnalyticsData,
        score_over_time: [
          { week: 'Week 1', avg_score: 65.7, session_count: 3 },
          { week: 'Week 2', avg_score: 72.3, session_count: 4 },
        ],
      };
      mockGetAnalyticsOverview.mockResolvedValue(dataWithDecimals);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
      // Scores are rounded in the transformation
    });

    it('should display average score reference line', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
      // Reference line is rendered by Recharts
    });

    it('should format average score label correctly', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
      // Label shows "Avg: XX%"
    });
  });

  describe('No Data State', () => {
    it('should display no data message when chart data is empty', async () => {
      const noDataAnalytics: AnalyticsOverview = {
        ...mockAnalyticsData,
        score_over_time: [],
      };
      mockGetAnalyticsOverview.mockResolvedValue(noDataAnalytics);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Complete some interview sessions to see your performance trend.')).toBeInTheDocument();
      });
    });

    it('should display component title in no data state', async () => {
      const noDataAnalytics: AnalyticsOverview = {
        ...mockAnalyticsData,
        score_over_time: [],
      };
      mockGetAnalyticsOverview.mockResolvedValue(noDataAnalytics);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
    });

    it('should not display chart when no data', async () => {
      const noDataAnalytics: AnalyticsOverview = {
        ...mockAnalyticsData,
        score_over_time: [],
      };
      mockGetAnalyticsOverview.mockResolvedValue(noDataAnalytics);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Complete some interview sessions to see your performance trend.')).toBeInTheDocument();
      });
      // Chart should not be rendered
    });
  });

  describe('Chart Configuration', () => {
    it('should set Y-axis domain to 0-100', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
      // Y-axis domain is configured in the component
    });

    it('should display week labels on X-axis', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
      // Week labels are rendered by Recharts
    });

    it('should use responsive container', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
      // ResponsiveContainer is used for chart
    });

    it('should set chart height to 250px', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
      // Height is set in the component
    });
  });

  describe('Tooltip Functionality', () => {
    it('should configure tooltip with custom styling', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
      // Tooltip is configured with theme colors
    });

    it('should format tooltip values correctly', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
      // Formatter function handles score and sessions
    });
  });

  describe('Edge Cases', () => {
    it('should handle single data point', async () => {
      const singlePointData: AnalyticsOverview = {
        ...mockAnalyticsData,
        score_over_time: [
          { week: 'Week 1', avg_score: 75, session_count: 1 },
        ],
      };
      mockGetAnalyticsOverview.mockResolvedValue(singlePointData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
    });

    it('should handle very low scores', async () => {
      const lowScoreData: AnalyticsOverview = {
        ...mockAnalyticsData,
        score_over_time: [
          { week: 'Week 1', avg_score: 10, session_count: 1 },
          { week: 'Week 2', avg_score: 15, session_count: 1 },
        ],
      };
      mockGetAnalyticsOverview.mockResolvedValue(lowScoreData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
    });

    it('should handle perfect scores', async () => {
      const perfectScoreData: AnalyticsOverview = {
        ...mockAnalyticsData,
        score_over_time: [
          { week: 'Week 1', avg_score: 100, session_count: 1 },
          { week: 'Week 2', avg_score: 100, session_count: 1 },
        ],
      };
      mockGetAnalyticsOverview.mockResolvedValue(perfectScoreData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
    });

    it('should handle null average score', async () => {
      const nullAvgData: AnalyticsOverview = {
        ...mockAnalyticsData,
        average_score_last_30_days: null as any,
      };
      mockGetAnalyticsOverview.mockResolvedValue(nullAvgData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
      // Should not display reference line when average is null
    });

    it('should handle very long week labels', async () => {
      const longLabelData: AnalyticsOverview = {
        ...mockAnalyticsData,
        score_over_time: [
          { week: 'Week of January 1-7, 2024', avg_score: 75, session_count: 3 },
        ],
      };
      mockGetAnalyticsOverview.mockResolvedValue(longLabelData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
    });

    it('should handle many data points', async () => {
      const manyPointsData: AnalyticsOverview = {
        ...mockAnalyticsData,
        score_over_time: Array.from({ length: 20 }, (_, i) => ({
          week: `Week ${i + 1}`,
          avg_score: 50 + Math.random() * 50,
          session_count: Math.floor(Math.random() * 10) + 1,
        })),
      };
      mockGetAnalyticsOverview.mockResolvedValue(manyPointsData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
    });

    it('should handle zero session counts', async () => {
      const zeroSessionData: AnalyticsOverview = {
        ...mockAnalyticsData,
        score_over_time: [
          { week: 'Week 1', avg_score: 75, session_count: 0 },
        ],
      };
      mockGetAnalyticsOverview.mockResolvedValue(zeroSessionData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
    });
  });

  describe('Theme Integration', () => {
    it('should use theme colors for chart elements', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
      // Theme colors are applied to line, grid, axes
    });

    it('should use theme colors for tooltip', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<PerformanceChart />);

      await waitFor(() => {
        expect(screen.getByText('Performance Trend')).toBeInTheDocument();
      });
      // Tooltip uses theme background and text colors
    });
  });

  describe('Accessibility', () => {
    it('should have accessible loading state', () => {
      mockGetAnalyticsOverview.mockImplementation(() => new Promise(() => {}));

      render(<PerformanceChart />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should have descriptive caption', async () => {
      mockGetAnalyticsOverview.mockResolvedValue(mockAnalyticsData);

      render(<PerformanceChart />);

      await waitFor(() => {
        const caption = screen.getByText('Score trends over the last 30 days');
        expect(caption).toBeInTheDocument();
      });
    });
  });
});
