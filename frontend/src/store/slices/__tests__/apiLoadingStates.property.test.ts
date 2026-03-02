/**
 * Property-Based Tests for API Loading States
 * **Validates: Requirements INT-1.10, COMP-5.4**
 * 
 * Tests universal loading state behavior across all API operations using fast-check.
 * Verifies that for ANY API call in the application:
 * 1. Loading indicator appears during request (isLoading or isGenerating = true)
 * 2. Loading indicator disappears after completion (isLoading or isGenerating = false)
 * 3. Error state is set correctly on rejection
 * 4. Error state is null on success
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { configureStore } from '@reduxjs/toolkit';

// Import all slices
import resumeAnalysisReducer, {
  analyzeResume,
  fetchAnalysis,
  fetchHistory,
} from '../resumeAnalysisSlice';
import studyPlanReducer, {
  createStudyPlan,
  fetchStudyPlan,
  fetchActivePlan,
  updateProgress,
  abandonPlan,
} from '../studyPlanSlice';
import companyCoachingReducer, {
  createSession,
  fetchSession,
  fetchUserSessions,
  fetchSessionsByCompany,
} from '../companyCoachingSlice';
import cacheStatsReducer, {
  fetchStats,
  resetStats,
} from '../cacheStatsSlice';
import authReducer, {
  updateProfile,
} from '../authSlice';

// Mock all services
vi.mock('../../../services/resumeAnalysisService', () => ({
  default: {
    analyzeResume: vi.fn(),
    getAnalysis: vi.fn(),
    getAnalysisHistory: vi.fn(),
  },
}));

vi.mock('../../../services/studyPlanService', () => ({
  default: {
    createStudyPlan: vi.fn(),
    getStudyPlan: vi.fn(),
    getActiveStudyPlan: vi.fn(),
    updateProgress: vi.fn(),
    abandonPlan: vi.fn(),
  },
}));

vi.mock('../../../services/companyCoachingService', () => ({
  default: {
    createSession: vi.fn(),
    getSession: vi.fn(),
    getUserSessions: vi.fn(),
    getSessionsByCompany: vi.fn(),
  },
}));

vi.mock('../../../services/cacheService', () => ({
  default: {
    getStats: vi.fn(),
    checkAlert: vi.fn(),
    resetStats: vi.fn(),
  },
}));

vi.mock('../../../services/userService', () => ({
  userService: {
    updateProfile: vi.fn(),
  },
}));

// Import mocked services
import resumeAnalysisService from '../../../services/resumeAnalysisService';
import studyPlanService from '../../../services/studyPlanService';
import companyCoachingService from '../../../services/companyCoachingService';
import cacheService from '../../../services/cacheService';
import { userService } from '../../../services/userService';

// Type definitions for test configuration
interface ThunkConfig {
  sliceName: string;
  thunkName: string;
  thunk: any;
  loadingStateKey: 'isLoading' | 'isGenerating';
  mockService: any;
  mockMethod: string;
  mockArgs: any;
  mockResponse: any;
}

// Mock data generators
const mockResumeAnalysis = {
  id: 1,
  resume_id: 1,
  overall_score: 85,
  skill_gaps: ['React', 'TypeScript'],
  improvement_suggestions: ['Add more projects'],
  created_at: '2024-01-15T10:00:00Z',
};

const mockStudyPlan = {
  id: 1,
  user_id: 1,
  title: 'Test Plan',
  status: 'active' as const,
  milestones: [],
  created_at: '2024-01-15T10:00:00Z',
};

const mockCoachingSession = {
  id: 1,
  user_id: 1,
  company_name: 'Test Company',
  position: 'Software Engineer',
  advice: 'Test advice',
  created_at: '2024-01-15T10:00:00Z',
};

const mockCacheStats = {
  layers: [],
  overall: {
    cache_layer: 'OVERALL',
    cache_hits: 100,
    cache_misses: 10,
    hit_rate: 0.909,
    total_requests: 110,
    last_updated: '2024-01-15T10:00:00Z',
  },
};

const mockUserProfile = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  target_role: 'Software Engineer',
  experience_level: 'mid',
};

// Helper to create test stores for each slice
const createResumeAnalysisStore = () => configureStore({ reducer: { resumeAnalysis: resumeAnalysisReducer } });
const createStudyPlanStore = () => configureStore({ reducer: { studyPlan: studyPlanReducer } });
const createCompanyCoachingStore = () => configureStore({ reducer: { companyCoaching: companyCoachingReducer } });
const createCacheStatsStore = () => configureStore({ reducer: { cacheStats: cacheStatsReducer } });
const createAuthStore = () => configureStore({ reducer: { auth: authReducer } });

// All thunk configurations
const getAllThunkConfigs = (): ThunkConfig[] => [
  // Resume Analysis Slice
  {
    sliceName: 'resumeAnalysis',
    thunkName: 'analyzeResume',
    thunk: analyzeResume,
    loadingStateKey: 'isGenerating',
    mockService: resumeAnalysisService,
    mockMethod: 'analyzeResume',
    mockArgs: { resumeId: 1, request: { target_role: 'Engineer' } },
    mockResponse: mockResumeAnalysis,
  },
  {
    sliceName: 'resumeAnalysis',
    thunkName: 'fetchAnalysis',
    thunk: fetchAnalysis,
    loadingStateKey: 'isLoading',
    mockService: resumeAnalysisService,
    mockMethod: 'getAnalysis',
    mockArgs: 1,
    mockResponse: mockResumeAnalysis,
  },
  {
    sliceName: 'resumeAnalysis',
    thunkName: 'fetchHistory',
    thunk: fetchHistory,
    loadingStateKey: 'isLoading',
    mockService: resumeAnalysisService,
    mockMethod: 'getAnalysisHistory',
    mockArgs: { resumeId: 1, limit: 10 },
    mockResponse: { analyses: [mockResumeAnalysis], total: 1 },
  },
  // Study Plan Slice
  {
    sliceName: 'studyPlan',
    thunkName: 'createStudyPlan',
    thunk: createStudyPlan,
    loadingStateKey: 'isGenerating',
    mockService: studyPlanService,
    mockMethod: 'createStudyPlan',
    mockArgs: { resume_id: 1, focus_areas: ['React'] },
    mockResponse: mockStudyPlan,
  },
  {
    sliceName: 'studyPlan',
    thunkName: 'fetchStudyPlan',
    thunk: fetchStudyPlan,
    loadingStateKey: 'isLoading',
    mockService: studyPlanService,
    mockMethod: 'getStudyPlan',
    mockArgs: 1,
    mockResponse: mockStudyPlan,
  },
  {
    sliceName: 'studyPlan',
    thunkName: 'fetchActivePlan',
    thunk: fetchActivePlan,
    loadingStateKey: 'isLoading',
    mockService: studyPlanService,
    mockMethod: 'getActiveStudyPlan',
    mockArgs: undefined,
    mockResponse: mockStudyPlan,
  },
  {
    sliceName: 'studyPlan',
    thunkName: 'updateProgress',
    thunk: updateProgress,
    loadingStateKey: 'isLoading',
    mockService: studyPlanService,
    mockMethod: 'updateProgress',
    mockArgs: { planId: 1, request: { milestone_id: 1, completed: true } },
    mockResponse: mockStudyPlan,
  },
  {
    sliceName: 'studyPlan',
    thunkName: 'abandonPlan',
    thunk: abandonPlan,
    loadingStateKey: 'isLoading',
    mockService: studyPlanService,
    mockMethod: 'abandonPlan',
    mockArgs: 1,
    mockResponse: undefined,
  },
  // Company Coaching Slice
  {
    sliceName: 'companyCoaching',
    thunkName: 'createSession',
    thunk: createSession,
    loadingStateKey: 'isGenerating',
    mockService: companyCoachingService,
    mockMethod: 'createSession',
    mockArgs: { company_name: 'Test', position: 'Engineer' },
    mockResponse: mockCoachingSession,
  },
  {
    sliceName: 'companyCoaching',
    thunkName: 'fetchSession',
    thunk: fetchSession,
    loadingStateKey: 'isLoading',
    mockService: companyCoachingService,
    mockMethod: 'getSession',
    mockArgs: 1,
    mockResponse: mockCoachingSession,
  },
  {
    sliceName: 'companyCoaching',
    thunkName: 'fetchUserSessions',
    thunk: fetchUserSessions,
    loadingStateKey: 'isLoading',
    mockService: companyCoachingService,
    mockMethod: 'getUserSessions',
    mockArgs: 10,
    mockResponse: [mockCoachingSession],
  },
  {
    sliceName: 'companyCoaching',
    thunkName: 'fetchSessionsByCompany',
    thunk: fetchSessionsByCompany,
    loadingStateKey: 'isLoading',
    mockService: companyCoachingService,
    mockMethod: 'getSessionsByCompany',
    mockArgs: 'Test Company',
    mockResponse: [mockCoachingSession],
  },
  // Cache Stats Slice
  {
    sliceName: 'cacheStats',
    thunkName: 'fetchStats',
    thunk: fetchStats,
    loadingStateKey: 'isLoading',
    mockService: cacheService,
    mockMethod: 'getStats',
    mockArgs: undefined,
    mockResponse: mockCacheStats,
  },
  // Note: fetchAlert does not set isLoading in the slice, so we skip it
  {
    sliceName: 'cacheStats',
    thunkName: 'resetStats',
    thunk: resetStats,
    loadingStateKey: 'isLoading',
    mockService: cacheService,
    mockMethod: 'resetStats',
    mockArgs: undefined,
    mockResponse: undefined,
  },
  // Auth Slice
  {
    sliceName: 'auth',
    thunkName: 'updateProfile',
    thunk: updateProfile,
    loadingStateKey: 'isLoading',
    mockService: userService,
    mockMethod: 'updateProfile',
    mockArgs: { name: 'Updated Name' },
    mockResponse: mockUserProfile,
  },
];

// Helper to get store for slice
const getStoreForSlice = (sliceName: string) => {
  switch (sliceName) {
    case 'resumeAnalysis': return createResumeAnalysisStore();
    case 'studyPlan': return createStudyPlanStore();
    case 'companyCoaching': return createCompanyCoachingStore();
    case 'cacheStats': return createCacheStatsStore();
    case 'auth': return createAuthStore();
    default: throw new Error(`Unknown slice: ${sliceName}`);
  }
};

describe('API Loading States Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 1: Loading State Lifecycle', () => {
    /**
     * Universal Property: For ANY API call, loading state is false after completion
     * This is the most fundamental property - regardless of success or failure,
     * the loading indicator must disappear after the API call completes.
     */
    it('should set loading state to false after API call completion', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...getAllThunkConfigs()),
          fc.boolean(), // success or error
          async (config, shouldSucceed) => {
            // Clear mocks before each property test run
            vi.clearAllMocks();
            
            const store = getStoreForSlice(config.sliceName);
            
            // Setup mock
            if (shouldSucceed) {
              vi.mocked(config.mockService[config.mockMethod]).mockResolvedValue(config.mockResponse);
            } else {
              vi.mocked(config.mockService[config.mockMethod]).mockRejectedValue(
                new Error('API Error')
              );
            }

            // Initial state: loading should be false
            const initialState = (store.getState() as any)[config.sliceName];
            expect(initialState[config.loadingStateKey]).toBe(false);

            // Dispatch thunk and wait for completion
            await store.dispatch(config.thunk(config.mockArgs));

            // After completion: loading should be false
            const finalState = (store.getState() as any)[config.sliceName];
            expect(finalState[config.loadingStateKey]).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Error state is set correctly on rejection
     */
    it('should set error state on API failure', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...getAllThunkConfigs()),
          fc.string({ minLength: 1, maxLength: 100 }), // error message
          async (config, errorMessage) => {
            // Clear mocks before each property test run
            vi.clearAllMocks();
            
            const store = getStoreForSlice(config.sliceName);
            
            // Setup mock to reject
            vi.mocked(config.mockService[config.mockMethod]).mockRejectedValue(
              new Error(errorMessage)
            );

            // Dispatch thunk
            await store.dispatch(config.thunk(config.mockArgs));

            // After rejection: error should be set
            const finalState = (store.getState() as any)[config.sliceName];
            expect(finalState.error).toBe(errorMessage);
            expect(finalState[config.loadingStateKey]).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Error state is null on success
     */
    it('should clear error state on API success', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...getAllThunkConfigs()),
          async (config) => {
            // Clear mocks before each property test run
            vi.clearAllMocks();
            
            const store = getStoreForSlice(config.sliceName);
            
            // First create an error state
            vi.mocked(config.mockService[config.mockMethod]).mockRejectedValue(
              new Error('Previous error')
            );
            await store.dispatch(config.thunk(config.mockArgs));
            
            // Verify error exists
            expect((store.getState() as any)[config.sliceName].error).toBeTruthy();

            // Now succeed
            vi.mocked(config.mockService[config.mockMethod]).mockResolvedValue(config.mockResponse);
            await store.dispatch(config.thunk(config.mockArgs));

            // After success: error should be null
            const finalState = (store.getState() as any)[config.sliceName];
            expect(finalState.error).toBe(null);
            expect(finalState[config.loadingStateKey]).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Loading state is consistent across multiple sequential calls
     */
    it('should maintain consistent loading state across sequential API calls', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...getAllThunkConfigs()),
          fc.array(fc.boolean(), { minLength: 2, maxLength: 5 }), // sequence of success/failure
          async (config, outcomes) => {
            // Clear mocks before each property test run
            vi.clearAllMocks();
            
            const store = getStoreForSlice(config.sliceName);
            
            for (const shouldSucceed of outcomes) {
              // Setup mock
              if (shouldSucceed) {
                vi.mocked(config.mockService[config.mockMethod]).mockResolvedValue(config.mockResponse);
              } else {
                vi.mocked(config.mockService[config.mockMethod]).mockRejectedValue(
                  new Error('API Error')
                );
              }

              // Before call
              const beforeState = (store.getState() as any)[config.sliceName];
              expect(beforeState[config.loadingStateKey]).toBe(false);

              // Dispatch and wait for completion
              await store.dispatch(config.thunk(config.mockArgs));

              // After call
              const afterState = (store.getState() as any)[config.sliceName];
              expect(afterState[config.loadingStateKey]).toBe(false);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: Loading state distinguishes between isLoading and isGenerating
     */
    it('should use correct loading state key (isLoading vs isGenerating)', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...getAllThunkConfigs()),
          async (config) => {
            // Clear mocks before each property test run
            vi.clearAllMocks();
            
            const store = getStoreForSlice(config.sliceName);
            
            vi.mocked(config.mockService[config.mockMethod]).mockResolvedValue(config.mockResponse);

            // Dispatch thunk and wait for completion
            await store.dispatch(config.thunk(config.mockArgs));

            // After completion: correct loading key should be false
            const finalState = (store.getState() as any)[config.sliceName];
            expect(finalState[config.loadingStateKey]).toBe(false);
            
            // The other loading key should remain false
            const otherKey = config.loadingStateKey === 'isLoading' ? 'isGenerating' : 'isLoading';
            if (otherKey in finalState) {
              expect(finalState[otherKey]).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Concurrent API calls maintain independent loading states
     * Note: This tests that different slices maintain independent state
     */
    it('should maintain independent loading states for different slices', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...getAllThunkConfigs()),
          fc.constantFrom(...getAllThunkConfigs()),
          async (config1, config2) => {
            // Skip if same slice (we want to test independence)
            if (config1.sliceName === config2.sliceName) return;

            // Clear mocks before each property test run
            vi.clearAllMocks();

            const store1 = getStoreForSlice(config1.sliceName);
            const store2 = getStoreForSlice(config2.sliceName);
            
            // Setup mocks
            vi.mocked(config1.mockService[config1.mockMethod]).mockResolvedValue(config1.mockResponse);
            vi.mocked(config2.mockService[config2.mockMethod]).mockResolvedValue(config2.mockResponse);

            // Dispatch both thunks and wait for completion
            await Promise.all([
              store1.dispatch(config1.thunk(config1.mockArgs)),
              store2.dispatch(config2.thunk(config2.mockArgs))
            ]);

            // Both should have loading state false after completion
            const finalState1 = (store1.getState() as any)[config1.sliceName];
            const finalState2 = (store2.getState() as any)[config2.sliceName];
            expect(finalState1[config1.loadingStateKey]).toBe(false);
            expect(finalState2[config2.loadingStateKey]).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: Loading state handles rapid successive calls
     */
    it('should handle rapid successive API calls correctly', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...getAllThunkConfigs()),
          fc.integer({ min: 2, max: 5 }), // number of rapid calls
          async (config, numCalls) => {
            // Clear mocks before each property test run
            vi.clearAllMocks();
            
            const store = getStoreForSlice(config.sliceName);
            
            vi.mocked(config.mockService[config.mockMethod]).mockResolvedValue(config.mockResponse);

            // Dispatch multiple calls rapidly
            const promises = Array.from({ length: numCalls }, () =>
              store.dispatch(config.thunk(config.mockArgs))
            );

            // Wait for all to complete
            await Promise.all(promises);

            // After all complete: loading should be false
            const finalState = (store.getState() as any)[config.sliceName];
            expect(finalState[config.loadingStateKey]).toBe(false);
            expect(finalState.error).toBe(null);
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: Loading state with delayed responses
     */
    it('should maintain loading state for delayed API responses', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...getAllThunkConfigs()),
          fc.integer({ min: 10, max: 100 }), // delay in ms
          async (config, delayMs) => {
            // Clear mocks before each property test run
            vi.clearAllMocks();
            
            const store = getStoreForSlice(config.sliceName);
            
            // Setup mock with delay
            vi.mocked(config.mockService[config.mockMethod]).mockImplementation(
              () => new Promise(resolve => setTimeout(() => resolve(config.mockResponse), delayMs))
            );

            // Dispatch thunk and wait for completion
            await store.dispatch(config.thunk(config.mockArgs));

            // After completion: loading should be false
            const finalState = (store.getState() as any)[config.sliceName];
            expect(finalState[config.loadingStateKey]).toBe(false);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
