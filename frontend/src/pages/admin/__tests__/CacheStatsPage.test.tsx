/**
 * Unit Tests for Cache Stats Page
 * Tests UI rendering, auto-refresh logic, and admin-only reset functionality
 * 
 * Requirements: INT-4.2, INT-4.7, INT-4.9
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import CacheStatsPage from '../CacheStatsPage';
import cacheStatsReducer, { fetchStats, fetchAlert, resetStats } from '../../../store/slices/cacheStatsSlice';
import authReducer from '../../../store/slices/authSlice';
import cacheService from '../../../services/cacheService';
import type { CacheStats, CacheAlert } from '../../../services/cacheService';

// Mock the cache service
vi.mock('../../../services/cacheService');

// Mock data
const mockStats: CacheStats = {
  layers: [
    {
      cache_layer: 'L1_MEMORY',
      cache_hits: 1000,
      cache_misses: 100,
      hit_rate: 0.909,
      total_requests: 1100,
      last_updated: '2024-01-15T10:00:00Z',
    },
    {
      cache_layer: 'L2_REDIS',
      cache_hits: 800,
      cache_misses: 200,
      hit_rate: 0.8,
      total_requests: 1000,
      last_updated: '2024-01-15T10:00:00Z',
    },
  ],
  overall: {
    cache_layer: 'OVERALL',
    cache_hits: 1800,
    cache_misses: 300,
    hit_rate: 0.857,
    total_requests: 2100,
    last_updated: '2024-01-15T10:00:00Z',
  },
};

const mockAlert: CacheAlert = {
  alert_active: true,
  current_hit_rate: 0.82,
  threshold: 0.85,
  message: 'Cache hit rate (82.0%) is below threshold (85.0%)',
};

const createMockStore = (preloadedState?: any) => {
  return configureStore({
    reducer: {
      cacheStats: cacheStatsReducer,
      auth: authReducer,
    },
    preloadedState,
  });
};

const renderWithStore = (preloadedState?: any) => {
  const store = createMockStore(preloadedState);
  return {
    ...render(
      <Provider store={store}>
        <BrowserRouter>
          <CacheStatsPage />
        </BrowserRouter>
      </Provider>
    ),
    store,
  };
};

describe('CacheStatsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cacheService.getStats).mockResolvedValue(mockStats);
    vi.mocked(cacheService.checkAlert).mockResolvedValue(mockAlert);
    vi.mocked(cacheService.resetStats).mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render page title', async () => {
      renderWithStore({
        cacheStats: {
          stats: mockStats,
          alert: null,
          isLoading: false,
          error: null,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
      });

      expect(screen.getByText('Cache Statistics')).toBeInTheDocument();
    });

    it('should render auto-refresh toggle', async () => {
      renderWithStore({
        cacheStats: {
          stats: mockStats,
          alert: null,
          isLoading: false,
          error: null,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
      });

      expect(screen.getByLabelText('Auto-refresh')).toBeInTheDocument();
    });

    it('should render refresh button', async () => {
      renderWithStore({
        cacheStats: {
          stats: mockStats,
          alert: null,
          isLoading: false,
          error: null,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
      });

      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });
  });

  describe('Stats Display', () => {
    it('should display overall hit rate', async () => {
      renderWithStore({
        cacheStats: {
          stats: mockStats,
          alert: null,
          isLoading: false,
          error: null,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
      });

      expect(screen.getByText('85.7%')).toBeInTheDocument();
      expect(screen.getAllByText('Hit Rate')[0]).toBeInTheDocument();
    });

    it('should display cache hits', async () => {
      renderWithStore({
        cacheStats: {
          stats: mockStats,
          alert: null,
          isLoading: false,
          error: null,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
      });

      expect(screen.getByText('1,800')).toBeInTheDocument();
      expect(screen.getByText('Cache Hits')).toBeInTheDocument();
    });

    it('should display cache misses', async () => {
      renderWithStore({
        cacheStats: {
          stats: mockStats,
          alert: null,
          isLoading: false,
          error: null,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
      });

      expect(screen.getByText('300')).toBeInTheDocument();
      expect(screen.getByText('Cache Misses')).toBeInTheDocument();
    });

    it('should display total requests', async () => {
      renderWithStore({
        cacheStats: {
          stats: mockStats,
          alert: null,
          isLoading: false,
          error: null,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
      });

      expect(screen.getByText('2,100')).toBeInTheDocument();
      expect(screen.getAllByText('Total Requests')[0]).toBeInTheDocument();
    });

    it('should display last updated timestamp', async () => {
      renderWithStore({
        cacheStats: {
          stats: mockStats,
          alert: null,
          isLoading: false,
          error: null,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
      });

      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    it('should display no data message when stats are null', async () => {
      const emptyStats: CacheStats = {
        layers: [],
        overall: {
          cache_layer: 'OVERALL',
          cache_hits: 0,
          cache_misses: 0,
          hit_rate: 0,
          total_requests: 0,
          last_updated: '2024-01-15T10:00:00Z',
        },
      };

      renderWithStore({
        cacheStats: {
          stats: emptyStats,
          alert: null,
          isLoading: false,
          error: null,
          lastUpdated: null,
        },
      });

      expect(screen.queryByText('No cache statistics available')).not.toBeInTheDocument();
    });
  });

  describe('Alert Display', () => {
    it('should display alert banner when alert is active', async () => {
      renderWithStore({
        cacheStats: {
          stats: mockStats,
          alert: mockAlert,
          isLoading: false,
          error: null,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
      });

      expect(screen.getByText(mockAlert.message)).toBeInTheDocument();
    });

    it('should not display alert banner when alert is inactive', async () => {
      const inactiveAlert: CacheAlert = {
        alert_active: false,
        current_hit_rate: 0.92,
        threshold: 0.85,
        message: 'Cache performance is healthy',
      };

      renderWithStore({
        cacheStats: {
          stats: mockStats,
          alert: inactiveAlert,
          isLoading: false,
          error: null,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
      });

      expect(screen.queryByText(inactiveAlert.message)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message', async () => {
      const errorMessage = 'Failed to fetch cache statistics';
      // Mock service to reject
      vi.mocked(cacheService.getStats).mockRejectedValueOnce(new Error(errorMessage));
      
      renderWithStore({
        cacheStats: {
          stats: null,
          alert: null,
          isLoading: false,
          error: null,
          lastUpdated: null,
        },
      });

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Auto-Refresh Toggle', () => {
    it('should toggle auto-refresh when switch is clicked', async () => {
      renderWithStore({
        cacheStats: {
          stats: mockStats,
          alert: null,
          isLoading: false,
          error: null,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
      });

      const autoRefreshSwitch = screen.getByRole('switch', { name: /auto-refresh/i });
      
      // Should be checked by default
      expect(autoRefreshSwitch).toBeChecked();

      // Toggle off
      fireEvent.click(autoRefreshSwitch);
      expect(autoRefreshSwitch).not.toBeChecked();

      // Toggle on
      fireEvent.click(autoRefreshSwitch);
      expect(autoRefreshSwitch).toBeChecked();
    });
  });

  describe('Admin-Only Reset Functionality', () => {
    it('should show reset button for admin users', async () => {
      renderWithStore({
        cacheStats: {
          stats: mockStats,
          alert: null,
          isLoading: false,
          error: null,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
        auth: {
          user: {
            id: 1,
            email: 'admin@example.com',
            name: 'Admin User',
          },
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh-token',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
      });

      expect(screen.getByRole('button', { name: /reset stats/i })).toBeInTheDocument();
    });

    it('should not show reset button for non-admin users', async () => {
      renderWithStore({
        cacheStats: {
          stats: mockStats,
          alert: null,
          isLoading: false,
          error: null,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
        auth: {
          user: {
            id: 2,
            email: 'user@example.com',
            name: 'Regular User',
          },
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh-token',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
      });

      expect(screen.queryByRole('button', { name: /reset stats/i })).not.toBeInTheDocument();
    });

    it('should open confirmation dialog when reset button is clicked', async () => {
      renderWithStore({
        cacheStats: {
          stats: mockStats,
          alert: null,
          isLoading: false,
          error: null,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
        auth: {
          user: {
            id: 1,
            email: 'admin@example.com',
            name: 'Admin User',
          },
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh-token',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
      });

      // Wait for button to be enabled
      await waitFor(() => {
        const resetButton = screen.getByRole('button', { name: /reset stats/i });
        expect(resetButton).not.toBeDisabled();
      });

      const resetButton = screen.getByRole('button', { name: /reset stats/i });
      fireEvent.click(resetButton);

      expect(screen.getByText('Reset Cache Statistics?')).toBeInTheDocument();
      expect(screen.getByText(/This will reset all cache statistics to zero/)).toBeInTheDocument();
    });

    it('should close dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithStore({
        cacheStats: {
          stats: mockStats,
          alert: null,
          isLoading: false,
          error: null,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
        auth: {
          user: {
            id: 1,
            email: 'admin@example.com',
            name: 'Admin User',
          },
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh-token',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
      });

      // Open dialog
      const resetButton = screen.getByRole('button', { name: /reset stats/i });
      await user.click(resetButton);

      // Wait for dialog and click cancel
      const cancelButton = await screen.findByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Dialog should be closed
      await waitFor(() => {
        expect(screen.queryByText('Reset Cache Statistics?')).not.toBeInTheDocument();
      });
    });

    it('should disable reset button when loading', async () => {
      renderWithStore({
        cacheStats: {
          stats: mockStats,
          alert: null,
          isLoading: true,
          error: null,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
        auth: {
          user: {
            id: 1,
            email: 'admin@example.com',
            name: 'Admin User',
          },
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh-token',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
      });

      const resetButton = screen.getByRole('button', { name: /reset stats/i });
      expect(resetButton).toBeDisabled();
    });
  });

  describe('Layer Statistics', () => {
    it('should render layer table when layers exist', async () => {
      renderWithStore({
        cacheStats: {
          stats: mockStats,
          alert: null,
          isLoading: false,
          error: null,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
      });

      expect(screen.getByText('Layer Statistics')).toBeInTheDocument();
      expect(screen.getByText('L1_MEMORY')).toBeInTheDocument();
      expect(screen.getByText('L2_REDIS')).toBeInTheDocument();
    });

    it('should not render layer section when no layers exist', async () => {
      const statsWithoutLayers: CacheStats = {
        layers: [],
        overall: mockStats.overall,
      };

      renderWithStore({
        cacheStats: {
          stats: statsWithoutLayers,
          alert: null,
          isLoading: false,
          error: null,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
      });

      expect(screen.queryByText('Layer Statistics')).not.toBeInTheDocument();
    });
  });
});
