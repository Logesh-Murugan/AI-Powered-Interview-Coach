/**
 * Cache Stats Slice
 * State management for cache statistics monitoring
 * 
 * Requirements: INT-4.1
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cacheService from '../../services/cacheService';
import type { CacheStats, CacheAlert } from '../../services/cacheService';

interface CacheStatsState {
  // Current cache statistics
  stats: CacheStats | null;
  // Alert status
  alert: CacheAlert | null;
  // Loading state
  isLoading: boolean;
  // Error message
  error: string | null;
  // Last updated timestamp
  lastUpdated: string | null;
}

const initialState: CacheStatsState = {
  stats: null,
  alert: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks

/**
 * Fetch cache statistics
 */
export const fetchStats = createAsyncThunk<CacheStats>(
  'cacheStats/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      return await cacheService.getStats();
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch cache statistics');
    }
  }
);

/**
 * Check cache alert status
 */
export const fetchAlert = createAsyncThunk<CacheAlert>(
  'cacheStats/fetchAlert',
  async (_, { rejectWithValue }) => {
    try {
      return await cacheService.checkAlert();
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to check cache alert');
    }
  }
);

/**
 * Reset cache statistics
 */
export const resetStats = createAsyncThunk<void, string | undefined>(
  'cacheStats/resetStats',
  async (layer, { rejectWithValue }) => {
    try {
      await cacheService.resetStats(layer);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to reset cache statistics');
    }
  }
);

const cacheStatsSlice = createSlice({
  name: 'cacheStats',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch stats
    builder
      .addCase(fetchStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch alert
    builder
      .addCase(fetchAlert.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchAlert.fulfilled, (state, action) => {
        state.alert = action.payload;
      })
      .addCase(fetchAlert.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Reset stats
    builder
      .addCase(resetStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetStats.fulfilled, (state) => {
        state.isLoading = false;
        // Clear stats to force refresh
        state.stats = null;
        state.lastUpdated = null;
      })
      .addCase(resetStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = cacheStatsSlice.actions;
export default cacheStatsSlice.reducer;
