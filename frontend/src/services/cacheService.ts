/**
 * Cache Service
 * API methods for cache statistics monitoring
 * 
 * Requirements: INT-4.1
 */

import apiService from './api.service';
import { logError } from '../utils/errorMessages';

// Cache layer statistics
export interface CacheLayerStats {
  cache_layer: string;
  cache_hits: number;
  cache_misses: number;
  hit_rate: number;
  total_requests: number;
  last_updated: string | null;
}

// Overall cache statistics
export interface CacheStats {
  layers: CacheLayerStats[];
  overall: CacheLayerStats;
}

// Cache alert information
export interface CacheAlert {
  alert_active: boolean;
  current_hit_rate: number;
  threshold: number;
  message: string;
}

// Reset stats request
export interface ResetStatsRequest {
  layer?: string;
}

export const cacheService = {
  /**
   * Get all cache statistics
   * GET /api/v1/cache-stats/stats
   */
  async getStats(): Promise<CacheStats> {
    try {
      const response = await apiService.get<CacheStats>('/cache-stats/stats');
      return response.data;
    } catch (error) {
      logError(error, 'cacheService.getStats');
      throw error;
    }
  },

  /**
   * Get statistics for specific cache layer
   * GET /api/v1/cache-stats/stats/{layer}
   */
  async getLayerStats(layer: string): Promise<CacheLayerStats> {
    try {
      const response = await apiService.get<CacheLayerStats>(
        `/cache-stats/stats/${layer}`
      );
      return response.data;
    } catch (error) {
      logError(error, 'cacheService.getLayerStats');
      throw error;
    }
  },

  /**
   * Check cache alert status
   * GET /api/v1/cache-stats/alert
   */
  async checkAlert(): Promise<CacheAlert> {
    try {
      const response = await apiService.get<CacheAlert>('/cache-stats/alert');
      return response.data;
    } catch (error) {
      logError(error, 'cacheService.checkAlert');
      throw error;
    }
  },

  /**
   * Reset cache statistics
   * POST /api/v1/cache-stats/reset
   */
  async resetStats(layer?: string): Promise<void> {
    try {
      const data: ResetStatsRequest = layer ? { layer } : {};
      await apiService.post('/cache-stats/reset', data);
    } catch (error) {
      logError(error, 'cacheService.resetStats');
      throw error;
    }
  },
};

export default cacheService;
