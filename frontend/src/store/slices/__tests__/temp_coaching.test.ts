/**
 * Unit Tests for Resume Analysis Slice
 * Tests thunk success/failure state updates, reducer actions, and selectors
 * 
 * Requirements: INT-1.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import resumeAnalysisReducer, {
  analyzeResume,
  fetchAnalysis,
  fetchHistory,
  setCurrentAnalysis,
  clearError,
} from '../resumeAnalysisSlice';
import resumeAnalysisService from '../../../services/resumeAnalysisService';
import type { ResumeAnalysis, AnalysisHistoryResponse } from '../../../services/resumeAnalysisService';

// Mock the service
vi.mock('../../../services/resumeAnalysisService', () => ({
  default: {
    analyzeResume: vi.fn(),
    getAnalysis: vi.fn(),
    getAnalysisHistory: vi.fn(),
  },
}));

// Helper to create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      resumeAnalysis: resumeAnalysisReducer,
    },
  });
};

// Mock data
const mockAnalysis: ResumeAnalysis = {
  analysis_id: 1,
  resume_id: 123,
  analysis_data: {
    skill_inventory: {
      technical_skills: ['JavaScript', 'TypeScript', 'React'],
      soft_skills: ['Communication', 'Leadership'],
      tools: ['Git', 'Docker'],
      languages: ['English', 'Spanish'],
    },
    experience_timeline: {
      total_years: 5,
      seniority_level: 'Mid',
      companies: ['Company A', 'Company B'],
      roles: ['Developer', 'Senior Developer'],
    },
    skill_gaps: {
      target_role: 'Software Engineer',
      required_missing: ['Kubernetes'],
      preferred_missing: ['AWS'],
      match_percentage: 85,
    },
    improvement_roadmap: {
      timeline_weeks: 12,
      milestones: [
        {
          milestone_number: 1,
          weeks: '1-4',
          skills_to_learn: ['Kubernetes basics'],
          estimated_hours: 20,
          activities: ['Complete online course'],
        },
      ],
      success_tips: ['Practice regularly'],
    },
  },
  execution_time_ms: 1500,
  status: 'completed',
  analyzed_at: '2024-01-15T10:00:00Z',
  from_cache: false,
  cache_age_days: 0,
};

const mockAnalysis2: ResumeAnalysis = {
  ...mockAnalysis,
  analysis_id: 2,
  resume_id: 456,
  analyzed_at: '2024-01-16T10:00:00Z',
};

describe('resumeAnalysisSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createTestStore();
      const state = store.getState().resumeAnalysis;

      expect(state).toEqual({
        analyses: {},
        currentAnalysis: null,
        history: {},
        isLoading: false,
        isGenerating: false,
        error: null,
      });
    });
  });

  describe('analyzeResume thunk', () => {
    it('should set isGenerating to true on pending', async () => {
      const store = createTestStore();
      
      vi.mocked(resumeAnalysisService.analyzeResume).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      store.dispatch(
        analyzeResume({
          resumeId: 123,
          request: { target_role: 'Software Engineer' },
        })
      );

      // Wait for pending state
      await new Promise(resolve => setTimeout(resolve, 0));

      const state = store.getState().resumeAnalysis;
      expect(state.isGenerating).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update state correctly on fulfilled', async () => {
      const store = createTestStore();
      
      vi.mocked(resumeAnalysisService.analyzeResume).mockResolvedValue(mockAnalysis);

      await store.dispatch(
        analyzeResume({
          resumeId: 123,
          request: { target_role: 'Software Engineer' },
        })
      );

      const state = store.getState().resumeAnalysis;
      expect(state.isGenerating).toBe(false);
      expect(state.analyses[123]).toEqual(mockAnalysis);
      expect(state.currentAnalysis).toEqual(mockAnalysis);
      expect(state.error).toBe(null);
    });

    it('should handle error on rejected', async () => {
      const store = createTestStore();
      const errorMessage = 'Failed to analyze resume';
      
      vi.mocked(resumeAnalysisService.analyzeResume).mockRejectedValue(
        new Error(errorMessage)
      );

      await store.dispatch(
        analyzeResume({
          resumeId: 123,
          request: { target_role: 'Software Engineer' },
        })
      );

      const state = store.getState().resumeAnalysis;
      expect(state.isGenerating).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.currentAnalysis).toBe(null);
    });

    it('should handle non-Error rejection', async () => {
      const store = createTestStore();
      
      vi.mocked(resumeAnalysisService.analyzeResume).mockRejectedValue('String error');

      await store.dispatch(
        analyzeResume({
          resumeId: 123,
          request: { target_role: 'Software Engineer' },
        })
      );

      const state = store.getState().resumeAnalysis;
      expect(state.isGenerating).toBe(false);
      expect(state.error).toBe('Failed to analyze resume');
    });

    it('should clear previous error on new request', async () => {
      const store = createTestStore();
      
      // First request fails
      vi.mocked(resumeAnalysisService.analyzeResume).mockRejectedValue(
        new Error('First error')
      );
      await store.dispatch(
        analyzeResume({
          resumeId: 123,
          request: { target_role: 'Software Engineer' },
        })
      );

      expect(store.getState().resumeAnalysis.error).toBe('First error');

      // Second request starts
      vi.mocked(resumeAnalysisService.analyzeResume).mockImplementation(
        () => new Promise(() => {})
      );
      store.dispatch(
        analyzeResume({
          resumeId: 123,
          request: { target_role: 'Software Engineer' },
        })
      );

      await new Promise(resolve => setTimeout(resolve, 0));

      const state = store.getState().resumeAnalysis;
      expect(state.error).toBe(null);
      expect(state.isGenerating).toBe(true);
    });

    it('should handle force_refresh parameter', async () => {
      const store = createTestStore();
      
      vi.mocked(resumeAnalysisService.analyzeResume).mockResolvedValue(mockAnalysis);

      await store.dispatch(
        analyzeResume({
          resumeId: 123,
          request: { target_role: 'Software Engineer', force_refresh: true },
        })
      );

      expect(resumeAnalysisService.analyzeResume).toHaveBeenCalledWith(
        123,
        { target_role: 'Software Engineer', force_refresh: true }
      );
    });
  });

  describe('fetchAnalysis thunk', () => {
    it('should set isLoading to true on pending', async () => {
      const store = createTestStore();
      
      vi.mocked(resumeAnalysisService.getAnalysis).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(fetchAnalysis(123));

      await new Promise(resolve => setTimeout(resolve, 0));

      const state = store.getState().resumeAnalysis;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update state correctly on fulfilled', async () => {
      const store = createTestStore();
      
      vi.mocked(resumeAnalysisService.getAnalysis).mockResolvedValue(mockAnalysis);

      await store.dispatch(fetchAnalysis(123));

      const state = store.getState().resumeAnalysis;
      expect(state.isLoading).toBe(false);
      expect(state.analyses[123]).toEqual(mockAnalysis);
      expect(state.currentAnalysis).toEqual(mockAnalysis);
      expect(state.error).toBe(null);
    });

    it('should handle error on rejected', async () => {
      const store = createTestStore();
      const errorMessage = 'Analysis not found';
      
      vi.mocked(resumeAnalysisService.getAnalysis).mockRejectedValue(
        new Error(errorMessage)
      );

      await store.dispatch(fetchAnalysis(123));

      const state = store.getState().resumeAnalysis;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should handle non-Error rejection', async () => {
      const store = createTestStore();
      
      vi.mocked(resumeAnalysisService.getAnalysis).mockRejectedValue('String error');

      await store.dispatch(fetchAnalysis(123));

      const state = store.getState().resumeAnalysis;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to fetch analysis');
    });

    it('should update existing analysis in state', async () => {
      const store = createTestStore();
      
      // First fetch
      vi.mocked(resumeAnalysisService.getAnalysis).mockResolvedValue(mockAnalysis);
      await store.dispatch(fetchAnalysis(123));

      // Second fetch with updated data
      const updatedAnalysis = { ...mockAnalysis, cache_age_days: 5 };
      vi.mocked(resumeAnalysisService.getAnalysis).mockResolvedValue(updatedAnalysis);
      await store.dispatch(fetchAnalysis(123));

      const state = store.getState().resumeAnalysis;
      expect(state.analyses[123]).toEqual(updatedAnalysis);
      expect(state.currentAnalysis).toEqual(updatedAnalysis);
    });

    it('should handle multiple resume analyses', async () => {
      const store = createTestStore();
      
      vi.mocked(resumeAnalysisService.getAnalysis)
        .mockResolvedValueOnce(mockAnalysis)
        .mockResolvedValueOnce(mockAnalysis2);

      await store.dispatch(fetchAnalysis(123));
      await store.dispatch(fetchAnalysis(456));

      const state = store.getState().resumeAnalysis;
      expect(state.analyses[123]).toEqual(mockAnalysis);
      expect(state.analyses[456]).toEqual(mockAnalysis2);
      expect(state.currentAnalysis).toEqual(mockAnalysis2); // Last fetched
    });
  });

  describe('fetchHistory thunk', () => {
    const mockHistoryResponse: AnalysisHistoryResponse = {
      analyses: [mockAnalysis, mockAnalysis2],
      total: 2,
    };

    it('should set isLoading to true on pending', async () => {
      const store = createTestStore();
      
      vi.mocked(resumeAnalysisService.getAnalysisHistory).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(fetchHistory({ resumeId: 123 }));

      await new Promise(resolve => setTimeout(resolve, 0));

      const state = store.getState().resumeAnalysis;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update state correctly on fulfilled', async () => {
      const store = createTestStore();
      
      vi.mocked(resumeAnalysisService.getAnalysisHistory).mockResolvedValue(
        mockHistoryResponse
      );

      await store.dispatch(fetchHistory({ resumeId: 123 }));

      const state = store.getState().resumeAnalysis;
      expect(state.isLoading).toBe(false);
      expect(state.history[123]).toEqual(mockHistoryResponse.analyses);
      expect(state.error).toBe(null);
    });

    it('should handle error on rejected', async () => {
      const store = createTestStore();
      const errorMessage = 'Failed to fetch history';
      
      vi.mocked(resumeAnalysisService.getAnalysisHistory).mockRejectedValue(
        new Error(errorMessage)
      );

      await store.dispatch(fetchHistory({ resumeId: 123 }));

      const state = store.getState().resumeAnalysis;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should handle non-Error rejection', async () => {
      const store = createTestStore();
      
      vi.mocked(resumeAnalysisService.getAnalysisHistory).mockRejectedValue(
        'String error'
      );

      await store.dispatch(fetchHistory({ resumeId: 123 }));

      const state = store.getState().resumeAnalysis;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to fetch analysis history');
    });

    it('should handle limit parameter', async () => {
      const store = createTestStore();
      
      vi.mocked(resumeAnalysisService.getAnalysisHistory).mockResolvedValue(
        mockHistoryResponse
      );

      await store.dispatch(fetchHistory({ resumeId: 123, limit: 5 }));

      expect(resumeAnalysisService.getAnalysisHistory).toHaveBeenCalledWith(123, 5);
    });

    it('should handle empty history', async () => {
      const store = createTestStore();
      const emptyHistory: AnalysisHistoryResponse = {
        analyses: [],
        total: 0,
      };
      
      vi.mocked(resumeAnalysisService.getAnalysisHistory).mockResolvedValue(
        emptyHistory
      );

      await store.dispatch(fetchHistory({ resumeId: 123 }));

      const state = store.getState().resumeAnalysis;
      expect(state.history[123]).toEqual([]);
    });

    it('should handle history for multiple resumes', async () => {
      const store = createTestStore();
      const history1: AnalysisHistoryResponse = {
        analyses: [mockAnalysis],
        total: 1,
      };
      const history2: AnalysisHistoryResponse = {
        analyses: [mockAnalysis2],
        total: 1,
      };
      
      vi.mocked(resumeAnalysisService.getAnalysisHistory)
        .mockResolvedValueOnce(history1)
        .mockResolvedValueOnce(history2);

      await store.dispatch(fetchHistory({ resumeId: 123 }));
      await store.dispatch(fetchHistory({ resumeId: 456 }));

      const state = store.getState().resumeAnalysis;
      expect(state.history[123]).toEqual(history1.analyses);
      expect(state.history[456]).toEqual(history2.analyses);
    });
  });

  describe('setCurrentAnalysis reducer', () => {
    it('should set current analysis', () => {
      const store = createTestStore();

      store.dispatch(setCurrentAnalysis(mockAnalysis));

      const state = store.getState().resumeAnalysis;
      expect(state.currentAnalysis).toEqual(mockAnalysis);
    });

    it('should update current analysis', () => {
      const store = createTestStore();

      store.dispatch(setCurrentAnalysis(mockAnalysis));
      store.dispatch(setCurrentAnalysis(mockAnalysis2));

      const state = store.getState().resumeAnalysis;
      expect(state.currentAnalysis).toEqual(mockAnalysis2);
    });

    it('should set current analysis to null', () => {
      const store = createTestStore();

      store.dispatch(setCurrentAnalysis(mockAnalysis));
      store.dispatch(setCurrentAnalysis(null));

      const state = store.getState().resumeAnalysis;
      expect(state.currentAnalysis).toBe(null);
    });

    it('should not affect other state properties', () => {
      const store = createTestStore();

      // Set up some state
      vi.mocked(resumeAnalysisService.analyzeResume).mockRejectedValue(
        new Error('Test error')
      );
      store.dispatch(
        analyzeResume({
          resumeId: 123,
          request: { target_role: 'Software Engineer' },
        })
      );

      // Wait for error state
      setTimeout(() => {
        store.dispatch(setCurrentAnalysis(mockAnalysis));

        const state = store.getState().resumeAnalysis;
        expect(state.currentAnalysis).toEqual(mockAnalysis);
        expect(state.error).toBe('Test error'); // Error should remain
      }, 100);
    });
  });

  describe('clearError reducer', () => {
    it('should clear error', async () => {
      const store = createTestStore();

      // Create an error
      vi.mocked(resumeAnalysisService.getAnalysis).mockRejectedValue(
        new Error('Test error')
      );
      await store.dispatch(fetchAnalysis(123));

      expect(store.getState().resumeAnalysis.error).toBe('Test error');

      // Clear error
      store.dispatch(clearError());

      const state = store.getState().resumeAnalysis;
      expect(state.error).toBe(null);
    });

    it('should not affect other state properties', async () => {
      const store = createTestStore();

      // Set up some state
      vi.mocked(resumeAnalysisService.getAnalysis).mockResolvedValue(mockAnalysis);
      await store.dispatch(fetchAnalysis(123));

      // Create an error
      vi.mocked(resumeAnalysisService.getAnalysis).mockRejectedValue(
        new Error('Test error')
      );
      await store.dispatch(fetchAnalysis(456));

      // Clear error
      store.dispatch(clearError());

      const state = store.getState().resumeAnalysis;
      expect(state.error).toBe(null);
      expect(state.analyses[123]).toEqual(mockAnalysis);
      expect(state.currentAnalysis).toBeDefined();
    });

    it('should work when no error exists', () => {
      const store = createTestStore();

      store.dispatch(clearError());

      const state = store.getState().resumeAnalysis;
      expect(state.error).toBe(null);
    });
  });

  describe('state transitions', () => {
    it('should handle loading state transitions correctly', async () => {
      const store = createTestStore();
      
      vi.mocked(resumeAnalysisService.getAnalysis).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockAnalysis), 100))
      );

      // Start loading
      const promise = store.dispatch(fetchAnalysis(123));
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(store.getState().resumeAnalysis.isLoading).toBe(true);

      // Complete loading
      await promise;
      expect(store.getState().resumeAnalysis.isLoading).toBe(false);
    });

    it('should handle generating state transitions correctly', async () => {
      const store = createTestStore();
      
      vi.mocked(resumeAnalysisService.analyzeResume).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockAnalysis), 100))
      );

      // Start generating
      const promise = store.dispatch(
        analyzeResume({
          resumeId: 123,
          request: { target_role: 'Software Engineer' },
        })
      );
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(store.getState().resumeAnalysis.isGenerating).toBe(true);

      // Complete generating
      await promise;
      expect(store.getState().resumeAnalysis.isGenerating).toBe(false);
    });

    it('should not mix isLoading and isGenerating states', async () => {
      const store = createTestStore();
      
      vi.mocked(resumeAnalysisService.getAnalysis).mockImplementation(
        () => new Promise(() => {})
      );
      vi.mocked(resumeAnalysisService.analyzeResume).mockImplementation(
        () => new Promise(() => {})
      );

      // Start fetch (isLoading)
      store.dispatch(fetchAnalysis(123));
      await new Promise(resolve => setTimeout(resolve, 0));
      
      let state = store.getState().resumeAnalysis;
      expect(state.isLoading).toBe(true);
      expect(state.isGenerating).toBe(false);

      // Start analyze (isGenerating)
      store.dispatch(
        analyzeResume({
          resumeId: 456,
          request: { target_role: 'Software Engineer' },
        })
      );
      await new Promise(resolve => setTimeout(resolve, 0));

      state = store.getState().resumeAnalysis;
      expect(state.isLoading).toBe(true);
      expect(state.isGenerating).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid successive calls', async () => {
      const store = createTestStore();
      
      vi.mocked(resumeAnalysisService.getAnalysis)
        .mockResolvedValueOnce(mockAnalysis)
        .mockResolvedValueOnce(mockAnalysis2);

      // Dispatch multiple calls rapidly
      const promise1 = store.dispatch(fetchAnalysis(123));
      const promise2 = store.dispatch(fetchAnalysis(456));

      await Promise.all([promise1, promise2]);

      const state = store.getState().resumeAnalysis;
      expect(state.analyses[123]).toEqual(mockAnalysis);
      expect(state.analyses[456]).toEqual(mockAnalysis2);
    });

    it('should handle mixed success and failure', async () => {
      const store = createTestStore();
      
      vi.mocked(resumeAnalysisService.getAnalysis)
        .mockResolvedValueOnce(mockAnalysis)
        .mockRejectedValueOnce(new Error('Failed'));

      await store.dispatch(fetchAnalysis(123));
      await store.dispatch(fetchAnalysis(456));

      const state = store.getState().resumeAnalysis;
      expect(state.analyses[123]).toEqual(mockAnalysis);
      expect(state.analyses[456]).toBeUndefined();
      expect(state.error).toBe('Failed');
    });

    it('should preserve analyses when fetching history fails', async () => {
      const store = createTestStore();
      
      // First, successfully fetch an analysis
      vi.mocked(resumeAnalysisService.getAnalysis).mockResolvedValue(mockAnalysis);
      await store.dispatch(fetchAnalysis(123));

      // Then, fail to fetch history
      vi.mocked(resumeAnalysisService.getAnalysisHistory).mockRejectedValue(
        new Error('History failed')
      );
      await store.dispatch(fetchHistory({ resumeId: 123 }));

      const state = store.getState().resumeAnalysis;
      expect(state.analyses[123]).toEqual(mockAnalysis);
      expect(state.error).toBe('History failed');
    });
  });
});
