/**
 * Unit Tests for Cache Stats Slice
 * Tests thunk success/failure state updates, reducer actions, and selectors
 * 
 * Requirements: INT-4.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import cacheStatsReducer, {
  fetchStats,
  fetchAlert,
  resetStats,
  clearError,
} from '../cacheStatsSlice';
import cacheService from '../../../services/cacheService';
import type { CacheStats, CacheAlert } from '../../../services/cacheService';

// Mock the service
vi.mock('../../../services/cacheService', () => ({
  default: {
    getStats: vi.fn(),
    checkAlert: vi.fn(),
    resetStats: vi.fn(),
  },
}));

// Helper to create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      cacheStats: cacheStatsReducer,
    },
  });
};

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

describe('cacheStatsSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createTestStore();
      const state = store.getState().cacheStats;

      expect(state).toEqual({
        stats: null,
        alert: null,
        isLoading: false,
        error: null,
        lastUpdated: null,
      });
    });
  });

  describe('fetchStats thunk', () => {
    it('should set isLoading to true on pending', async () => {
      const store = createTestStore();
      
      vi.mocked(cacheService.getStats).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      store.dispatch(fetchStats());

      // Wait for pending state
      await new Promise(resolve => setTimeout(resolve, 0));

      const state = store.getState().cacheStats;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update state correctly on fulfilled', async () => {
      const store = createTestStore();
      
      vi.mocked(cacheService.getStats).mockResolvedValue(mockStats);

      await store.dispatch(fetchStats());

      const state = store.getState().cacheStats;
      expect(state.isLoading).toBe(false);
      expect(state.stats).toEqual(mockStats);
      expect(state.lastUpdated).toBeTruthy();
      expect(state.error).toBe(null);
    });

    it('should set error on rejected', async () => {
      const store = createTestStore();
      const errorMessage = 'Failed to fetch cache statistics';
      
      vi.mocked(cacheService.getStats).mockRejectedValue(new Error(errorMessage));

      await store.dispatch(fetchStats());

      const state = store.getState().cacheStats;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.stats).toBe(null);
    });

    it('should update lastUpdated timestamp on successful fetch', async () => {
      const store = createTestStore();
      
      vi.mocked(cacheService.getStats).mockResolvedValue(mockStats);

      const beforeTime = new Date().toISOString();
      await store.dispatch(fetchStats());
      const afterTime = new Date().toISOString();

      const state = store.getState().cacheStats;
      expect(state.lastUpdated).toBeTruthy();
      expect(state.lastUpdated! >= beforeTime).toBe(true);
      expect(state.lastUpdated! <= afterTime).toBe(true);
    });

    it('should handle multiple consecutive fetches', async () => {
      const store = createTestStore();
      
      vi.mocked(cacheService.getStats).mockResolvedValue(mockStats);

      await store.dispatch(fetchStats());
      const firstUpdate = store.getState().cacheStats.lastUpdated;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      await store.dispatch(fetchStats());
      const secondUpdate = store.getState().cacheStats.lastUpdated;

      expect(secondUpdate).not.toBe(firstUpdate);
      expect(secondUpdate! > firstUpdate!).toBe(true);
    });
  });

  describe('fetchAlert thunk', () => {
    it('should not set isLoading for alert fetch', async () => {
      const store = createTestStore();
      
      vi.mocked(cacheService.checkAlert).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      store.dispatch(fetchAlert());

      // Wait for pending state
      await new Promise(resolve => setTimeout(resolve, 0));

      const state = store.getState().cacheStats;
      // Alert fetch should not trigger loading state
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should update alert on fulfilled', async () => {
      const store = createTestStore();
      
      vi.mocked(cacheService.checkAlert).mockResolvedValue(mockAlert);

      await store.dispatch(fetchAlert());

      const state = store.getState().cacheStats;
      expect(state.alert).toEqual(mockAlert);
      expect(state.alert?.alert_active).toBe(true);
      expect(state.alert?.current_hit_rate).toBe(0.82);
    });

    it('should handle no alert condition', async () => {
      const store = createTestStore();
      const noAlert: CacheAlert = {
        alert_active: false,
        current_hit_rate: 0.92,
        threshold: 0.85,
        message: 'Cache performance is healthy',
      };
      
      vi.mocked(cacheService.checkAlert).mockResolvedValue(noAlert);

      await store.dispatch(fetchAlert());

      const state = store.getState().cacheStats;
      expect(state.alert?.alert_active).toBe(false);
      expect(state.alert?.current_hit_rate).toBeGreaterThan(0.85);
    });

    it('should set error on rejected', async () => {
      const store = createTestStore();
      const errorMessage = 'Failed to check cache alert';
      
      vi.mocked(cacheService.checkAlert).mockRejectedValue(new Error(errorMessage));

      await store.dispatch(fetchAlert());

      const state = store.getState().cacheStats;
      expect(state.error).toBe(errorMessage);
      expect(state.alert).toBe(null);
    });
  });

  describe('resetStats thunk', () => {
    it('should set isLoading to true on pending', async () => {
      const store = createTestStore();
      
      vi.mocked(cacheService.resetStats).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      store.dispatch(resetStats());

      // Wait for pending state
      await new Promise(resolve => setTimeout(resolve, 0));

      const state = store.getState().cacheStats;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should clear stats on fulfilled', async () => {
      const store = createTestStore();
      
      // First set some stats
      vi.mocked(cacheService.getStats).mockResolvedValue(mockStats);
      await store.dispatch(fetchStats());
      
      expect(store.getState().cacheStats.stats).toEqual(mockStats);

      // Now reset
      vi.mocked(cacheService.resetStats).mockResolvedValue();
      await store.dispatch(resetStats());

      const state = store.getState().cacheStats;
      expect(state.isLoading).toBe(false);
      expect(state.stats).toBe(null);
      expect(state.lastUpdated).toBe(null);
      expect(state.error).toBe(null);
    });

    it('should handle reset with specific layer', async () => {
      const store = createTestStore();
      
      vi.mocked(cacheService.resetStats).mockResolvedValue();

      await store.dispatch(resetStats('L1_MEMORY'));

      const state = store.getState().cacheStats;
      expect(state.isLoading).toBe(false);
      expect(state.stats).toBe(null);
      expect(cacheService.resetStats).toHaveBeenCalledWith('L1_MEMORY');
    });

    it('should handle reset without layer parameter', async () => {
      const store = createTestStore();
      
      vi.mocked(cacheService.resetStats).mockResolvedValue();

      await store.dispatch(resetStats());

      const state = store.getState().cacheStats;
      expect(state.isLoading).toBe(false);
      expect(state.stats).toBe(null);
      expect(cacheService.resetStats).toHaveBeenCalledWith(undefined);
    });

    it('should set error on rejected', async () => {
      const store = createTestStore();
      const errorMessage = 'Failed to reset cache statistics';
      
      vi.mocked(cacheService.resetStats).mockRejectedValue(new Error(errorMessage));

      await store.dispatch(resetStats());

      const state = store.getState().cacheStats;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should handle 403 forbidden error (non-admin)', async () => {
      const store = createTestStore();
      const errorMessage = 'Admin access required';
      
      vi.mocked(cacheService.resetStats).mockRejectedValue(new Error(errorMessage));

      await store.dispatch(resetStats());

      const state = store.getState().cacheStats;
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('clearError reducer', () => {
    it('should clear error state', async () => {
      const store = createTestStore();
      
      // First create an error
      vi.mocked(cacheService.getStats).mockRejectedValue(new Error('Test error'));
      await store.dispatch(fetchStats());
      
      expect(store.getState().cacheStats.error).toBe('Test error');

      // Now clear it
      store.dispatch(clearError());

      const state = store.getState().cacheStats;
      expect(state.error).toBe(null);
    });

    it('should not affect other state properties', async () => {
      const store = createTestStore();
      
      // Set up some state
      vi.mocked(cacheService.getStats).mockResolvedValue(mockStats);
      await store.dispatch(fetchStats());
      
      vi.mocked(cacheService.checkAlert).mockResolvedValue(mockAlert);
      await store.dispatch(fetchAlert());

      const beforeClear = store.getState().cacheStats;

      // Create and clear error
      vi.mocked(cacheService.getStats).mockRejectedValue(new Error('Test error'));
      await store.dispatch(fetchStats());
      
      store.dispatch(clearError());

      const afterClear = store.getState().cacheStats;
      expect(afterClear.error).toBe(null);
      expect(afterClear.stats).toEqual(beforeClear.stats);
      expect(afterClear.alert).toEqual(beforeClear.alert);
    });
  });

  describe('state management', () => {
    it('should handle concurrent fetch operations', async () => {
      const store = createTestStore();
      
      vi.mocked(cacheService.getStats).mockResolvedValue(mockStats);
      vi.mocked(cacheService.checkAlert).mockResolvedValue(mockAlert);

      // Dispatch both at the same time
      await Promise.all([
        store.dispatch(fetchStats()),
        store.dispatch(fetchAlert()),
      ]);

      const state = store.getState().cacheStats;
      expect(state.stats).toEqual(mockStats);
      expect(state.alert).toEqual(mockAlert);
      expect(state.error).toBe(null);
    });

    it('should preserve stats when alert fetch fails', async () => {
      const store = createTestStore();
      
      // First fetch stats successfully
      vi.mocked(cacheService.getStats).mockResolvedValue(mockStats);
      await store.dispatch(fetchStats());

      // Then fail alert fetch
      vi.mocked(cacheService.checkAlert).mockRejectedValue(new Error('Alert error'));
      await store.dispatch(fetchAlert());

      const state = store.getState().cacheStats;
      expect(state.stats).toEqual(mockStats);
      expect(state.error).toBe('Alert error');
    });

    it('should preserve alert when stats fetch fails', async () => {
      const store = createTestStore();
      
      // First fetch alert successfully
      vi.mocked(cacheService.checkAlert).mockResolvedValue(mockAlert);
      await store.dispatch(fetchAlert());

      // Then fail stats fetch
      vi.mocked(cacheService.getStats).mockRejectedValue(new Error('Stats error'));
      await store.dispatch(fetchStats());

      const state = store.getState().cacheStats;
      expect(state.alert).toEqual(mockAlert);
      expect(state.error).toBe('Stats error');
    });

    it('should handle rapid refresh cycles', async () => {
      const store = createTestStore();
      
      vi.mocked(cacheService.getStats).mockResolvedValue(mockStats);

      // Simulate rapid refreshes (like auto-refresh every 30 seconds)
      for (let i = 0; i < 5; i++) {
        await store.dispatch(fetchStats());
      }

      const state = store.getState().cacheStats;
      expect(state.stats).toEqual(mockStats);
      expect(state.error).toBe(null);
      expect(cacheService.getStats).toHaveBeenCalledTimes(5);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const store = createTestStore();
      
      vi.mocked(cacheService.getStats).mockRejectedValue(new Error('Network Error'));

      await store.dispatch(fetchStats());

      const state = store.getState().cacheStats;
      expect(state.error).toBe('Network Error');
      expect(state.isLoading).toBe(false);
    });

    it('should handle timeout errors', async () => {
      const store = createTestStore();
      
      vi.mocked(cacheService.getStats).mockRejectedValue(
        new Error('timeout of 30000ms exceeded')
      );

      await store.dispatch(fetchStats());

      const state = store.getState().cacheStats;
      expect(state.error).toContain('timeout');
    });

    it('should handle server errors', async () => {
      const store = createTestStore();
      
      vi.mocked(cacheService.getStats).mockRejectedValue(
        new Error('Internal server error')
      );

      await store.dispatch(fetchStats());

      const state = store.getState().cacheStats;
      expect(state.error).toBe('Internal server error');
    });

    it('should handle unauthorized errors', async () => {
      const store = createTestStore();
      
      vi.mocked(cacheService.getStats).mockRejectedValue(new Error('Unauthorized'));

      await store.dispatch(fetchStats());

      const state = store.getState().cacheStats;
      expect(state.error).toBe('Unauthorized');
    });
  });
});
