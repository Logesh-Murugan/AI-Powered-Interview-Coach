/**
 * Unit Tests for Cache Service
 * Tests API calls, error handling, and request payload formatting
 * 
 * Requirements: INT-4.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cacheService } from '../cacheService';
import type { CacheStats, CacheLayerStats, CacheAlert } from '../cacheService';
import apiService from '../api.service';

// Mock the apiService
vi.mock('../api.service', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('cacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStats', () => {
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

    it('should successfully call GET /cache-stats/stats', async () => {
      vi.mocked(apiService.get).mockResolvedValue({ data: mockStats });

      const result = await cacheService.getStats();

      expect(apiService.get).toHaveBeenCalledWith('/cache-stats/stats');
      expect(result).toEqual(mockStats);
      expect(result.layers).toHaveLength(2);
      expect(result.overall.hit_rate).toBe(0.857);
    });

    it('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(cacheService.getStats()).rejects.toEqual(error);
    });

    it('should handle network error', async () => {
      const networkError = {
        message: 'Network Error',
        code: 'ECONNABORTED',
      };

      vi.mocked(apiService.get).mockRejectedValue(networkError);

      await expect(cacheService.getStats()).rejects.toEqual(networkError);
    });
  });

  describe('getLayerStats', () => {
    const mockLayerStats: CacheLayerStats = {
      cache_layer: 'L1_MEMORY',
      cache_hits: 1500,
      cache_misses: 150,
      hit_rate: 0.909,
      total_requests: 1650,
      last_updated: '2024-01-15T10:30:00Z',
    };

    it('should successfully call GET /cache-stats/stats/{layer}', async () => {
      vi.mocked(apiService.get).mockResolvedValue({ data: mockLayerStats });

      const result = await cacheService.getLayerStats('L1_MEMORY');

      expect(apiService.get).toHaveBeenCalledWith('/cache-stats/stats/L1_MEMORY');
      expect(result).toEqual(mockLayerStats);
      expect(result.cache_layer).toBe('L1_MEMORY');
    });

    it('should handle different layer names', async () => {
      const layers = ['L1_MEMORY', 'L2_REDIS', 'L3_DATABASE', 'L4_AGENT'];

      for (const layer of layers) {
        const layerStats = { ...mockLayerStats, cache_layer: layer };
        vi.mocked(apiService.get).mockResolvedValue({ data: layerStats });

        const result = await cacheService.getLayerStats(layer);

        expect(apiService.get).toHaveBeenCalledWith(`/cache-stats/stats/${layer}`);
        expect(result.cache_layer).toBe(layer);
      }
    });

    it('should handle 404 error when layer not found', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Cache layer not found' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(cacheService.getLayerStats('INVALID_LAYER')).rejects.toEqual(error);
    });

    it('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Database connection failed' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(cacheService.getLayerStats('L1_MEMORY')).rejects.toEqual(error);
    });
  });

  describe('checkAlert', () => {
    const mockAlert: CacheAlert = {
      alert_active: true,
      current_hit_rate: 0.82,
      threshold: 0.85,
      message: 'Cache hit rate (82.0%) is below threshold (85.0%)',
    };

    it('should successfully call GET /cache-stats/alert', async () => {
      vi.mocked(apiService.get).mockResolvedValue({ data: mockAlert });

      const result = await cacheService.checkAlert();

      expect(apiService.get).toHaveBeenCalledWith('/cache-stats/alert');
      expect(result).toEqual(mockAlert);
      expect(result.alert_active).toBe(true);
      expect(result.current_hit_rate).toBe(0.82);
    });

    it('should handle no alert condition', async () => {
      const noAlert: CacheAlert = {
        alert_active: false,
        current_hit_rate: 0.92,
        threshold: 0.85,
        message: 'Cache performance is healthy',
      };

      vi.mocked(apiService.get).mockResolvedValue({ data: noAlert });

      const result = await cacheService.checkAlert();

      expect(result.alert_active).toBe(false);
      expect(result.current_hit_rate).toBeGreaterThan(result.threshold);
    });

    it('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Failed to check alert' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(cacheService.checkAlert()).rejects.toEqual(error);
    });

    it('should handle network error', async () => {
      const networkError = {
        message: 'Network Error',
        code: 'ERR_NETWORK',
      };

      vi.mocked(apiService.get).mockRejectedValue(networkError);

      await expect(cacheService.checkAlert()).rejects.toEqual(networkError);
    });
  });

  describe('resetStats', () => {
    it('should successfully call POST /cache-stats/reset without layer', async () => {
      vi.mocked(apiService.post).mockResolvedValue({ data: undefined });

      await cacheService.resetStats();

      expect(apiService.post).toHaveBeenCalledWith('/cache-stats/reset', {});
    });

    it('should successfully call POST /cache-stats/reset with specific layer', async () => {
      vi.mocked(apiService.post).mockResolvedValue({ data: undefined });

      await cacheService.resetStats('L1_MEMORY');

      expect(apiService.post).toHaveBeenCalledWith('/cache-stats/reset', {
        layer: 'L1_MEMORY',
      });
    });

    it('should handle different layer names for reset', async () => {
      const layers = ['L1_MEMORY', 'L2_REDIS', 'L3_DATABASE', 'L4_AGENT'];

      for (const layer of layers) {
        vi.mocked(apiService.post).mockResolvedValue({ data: undefined });

        await cacheService.resetStats(layer);

        expect(apiService.post).toHaveBeenCalledWith('/cache-stats/reset', { layer });
      }
    });

    it('should handle 403 forbidden error (non-admin user)', async () => {
      const error = {
        response: {
          status: 403,
          data: { message: 'Admin access required' },
        },
      };

      vi.mocked(apiService.post).mockRejectedValue(error);

      await expect(cacheService.resetStats()).rejects.toEqual(error);
    });

    it('should handle 404 error when layer not found', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Cache layer not found' },
        },
      };

      vi.mocked(apiService.post).mockRejectedValue(error);

      await expect(cacheService.resetStats('INVALID_LAYER')).rejects.toEqual(error);
    });

    it('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Failed to reset statistics' },
        },
      };

      vi.mocked(apiService.post).mockRejectedValue(error);

      await expect(cacheService.resetStats()).rejects.toEqual(error);
    });

    it('should handle network error', async () => {
      const networkError = {
        message: 'Network Error',
        code: 'ECONNABORTED',
      };

      vi.mocked(apiService.post).mockRejectedValue(networkError);

      await expect(cacheService.resetStats('L1_MEMORY')).rejects.toEqual(networkError);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle 401 unauthorized error', async () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(cacheService.getStats()).rejects.toEqual(error);
    });

    it('should handle 429 rate limit error', async () => {
      const error = {
        response: {
          status: 429,
          data: { message: 'Too many requests' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(cacheService.checkAlert()).rejects.toEqual(error);
    });

    it('should handle 503 service unavailable error', async () => {
      const error = {
        response: {
          status: 503,
          data: { message: 'Service temporarily unavailable' },
        },
      };

      vi.mocked(apiService.post).mockRejectedValue(error);

      await expect(cacheService.resetStats()).rejects.toEqual(error);
    });
  });
});
