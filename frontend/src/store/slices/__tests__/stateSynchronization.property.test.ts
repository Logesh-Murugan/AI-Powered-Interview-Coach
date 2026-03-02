/**
 * Property-Based Tests for State Synchronization After Mutation
 * **Validates: Requirements INT-2.6**
 * 
 * Tests that Redux state is correctly synchronized with backend responses
 * after mutation operations (POST, PUT, PATCH, DELETE) using fast-check.
 * 
 * Verifies that for ANY successful mutation operation:
 * 1. Redux state is updated to match the backend response
 * 2. State changes are reflected immediately after mutation
 * 3. No stale data remains in the state
 * 4. Related state fields are updated consistently
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { configureStore } from '@reduxjs/toolkit';

// Import all slices that have mutation operations
import authReducer, { updateProfile } from '../authSlice';
import studyPlanReducer, { updateProgress } from '../studyPlanSlice';
import resumeAnalysisReducer, { analyzeResume } from '../resumeAnalysisSlice';
import companyCoachingReducer, { createSession } from '../companyCoachingSlice';

// Mock all services
vi.mock('../../../services/userService', () => ({
  userService: {
    updateProfile: vi.fn(),
  },
}));

vi.mock('../../../services/studyPlanService', () => ({
  default: {
    updateProgress: vi.fn(),
  },
}));

vi.mock('../../../services/resumeAnalysisService', () => ({
  default: {
    analyzeResume: vi.fn(),
  },
}));

vi.mock('../../../services/companyCoachingService', () => ({
  default: {
    createSession: vi.fn(),
  },
}));

// Import mocked services
import { userService } from '../../../services/userService';
import studyPlanService from '../../../services/studyPlanService';
import resumeAnalysisService from '../../../services/resumeAnalysisService';
import companyCoachingService from '../../../services/companyCoachingService';

// Type definitions for mutation test configuration
interface MutationTestConfig {
  sliceName: string;
  thunkName: string;
  thunk: any;
  mockService: any;
  mockMethod: string;
  generateArgs: () => any;
  generateResponse: () => any;
  verifyStateSync: (state: any, response: any) => void;
}

// Helper to create stores
const createAuthStore = () => configureStore({
  reducer: { auth: authReducer },
  preloadedState: {
    auth: {
      isAuthenticated: true,
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Original Name',
        target_role: 'Software Engineer',
        experience_level: 'mid',
        account_status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      accessToken: 'token',
      refreshToken: 'refresh',
      isLoading: false,
      error: null,
    },
  },
});

const createStudyPlanStore = () => configureStore({ reducer: { studyPlan: studyPlanReducer } });
const createResumeAnalysisStore = () => configureStore({ reducer: { resumeAnalysis: resumeAnalysisReducer } });
const createCompanyCoachingStore = () => configureStore({ reducer: { companyCoaching: companyCoachingReducer } });

// Helper to get store for slice
const getStoreForSlice = (sliceName: string) => {
  switch (sliceName) {
    case 'auth': return createAuthStore();
    case 'studyPlan': return createStudyPlanStore();
    case 'resumeAnalysis': return createResumeAnalysisStore();
    case 'companyCoaching': return createCompanyCoachingStore();
    default: throw new Error(`Unknown slice: ${sliceName}`);
  }
};

// Mutation test configurations
const getMutationTestConfigs = (): MutationTestConfig[] => [
  // Profile Update Mutation
  {
    sliceName: 'auth',
    thunkName: 'updateProfile',
    thunk: updateProfile,
    mockService: userService,
    mockMethod: 'updateProfile',
    generateArgs: () => ({
      name: fc.sample(fc.string({ minLength: 2, maxLength: 50 }), 1)[0],
      target_role: fc.sample(fc.constantFrom('Software Engineer', 'Data Scientist', 'Product Manager'), 1)[0],
      experience_level: fc.sample(fc.constantFrom('entry', 'mid', 'senior', 'staff', 'principal'), 1)[0],
    }),
    generateResponse: () => ({
      id: 1,
      email: 'test@example.com',
      name: fc.sample(fc.string({ minLength: 2, maxLength: 50 }), 1)[0],
      target_role: fc.sample(fc.constantFrom('Software Engineer', 'Data Scientist', 'Product Manager'), 1)[0],
      experience_level: fc.sample(fc.constantFrom('entry', 'mid', 'senior', 'staff', 'principal'), 1)[0],
      account_status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    }),
    verifyStateSync: (state, response) => {
      // Verify user object is updated with response data
      expect(state.auth.user).toBeDefined();
      expect(state.auth.user.name).toBe(response.name);
      expect(state.auth.user.target_role).toBe(response.target_role);
      expect(state.auth.user.experience_level).toBe(response.experience_level);
      expect(state.auth.user.updated_at).toBe(response.updated_at);
      
      // Verify loading state is reset
      expect(state.auth.isLoading).toBe(false);
      expect(state.auth.error).toBe(null);
    },
  },
  // Study Plan Progress Update Mutation
  {
    sliceName: 'studyPlan',
    thunkName: 'updateProgress',
    thunk: updateProgress,
    mockService: studyPlanService,
    mockMethod: 'updateProgress',
    generateArgs: () => ({
      planId: fc.sample(fc.integer({ min: 1, max: 100 }), 1)[0],
      request: {
        task_updates: [
          {
            task_id: fc.sample(fc.string({ minLength: 1, maxLength: 20 }), 1)[0],
            completed: fc.sample(fc.boolean(), 1)[0],
          },
        ],
      },
    }),
    generateResponse: () => ({
      id: fc.sample(fc.integer({ min: 1, max: 100 }), 1)[0],
      user_id: 1,
      target_role: 'Software Engineer',
      duration_days: 30,
      available_hours_per_week: 10,
      plan_data: {
        overview: 'Test plan',
        milestones: [],
      },
      status: 'active' as const,
      progress_percentage: fc.sample(fc.integer({ min: 0, max: 100 }), 1)[0],
      total_tasks: fc.sample(fc.integer({ min: 1, max: 50 }), 1)[0],
      completed_tasks: fc.sample(fc.integer({ min: 0, max: 50 }), 1)[0],
      total_milestones: 5,
      completed_milestones: 2,
      execution_time_ms: 100,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    }),
    verifyStateSync: (state, response) => {
      // Verify plan is updated in the plans record
      expect(state.studyPlan.plans[response.id]).toBeDefined();
      expect(state.studyPlan.plans[response.id].progress_percentage).toBe(response.progress_percentage);
      expect(state.studyPlan.plans[response.id].completed_tasks).toBe(response.completed_tasks);
      expect(state.studyPlan.plans[response.id].updated_at).toBe(response.updated_at);
      
      // Verify loading state is reset
      expect(state.studyPlan.isLoading).toBe(false);
      expect(state.studyPlan.error).toBe(null);
    },
  },
  // Resume Analysis Creation Mutation
  {
    sliceName: 'resumeAnalysis',
    thunkName: 'analyzeResume',
    thunk: analyzeResume,
    mockService: resumeAnalysisService,
    mockMethod: 'analyzeResume',
    generateArgs: () => ({
      resumeId: fc.sample(fc.integer({ min: 1, max: 100 }), 1)[0],
      request: {
        target_role: fc.sample(fc.constantFrom('Software Engineer', 'Data Scientist', 'Product Manager'), 1)[0],
      },
    }),
    generateResponse: () => ({
      id: fc.sample(fc.integer({ min: 1, max: 1000 }), 1)[0],
      resume_id: fc.sample(fc.integer({ min: 1, max: 100 }), 1)[0],
      user_id: 1,
      target_role: fc.sample(fc.constantFrom('Software Engineer', 'Data Scientist', 'Product Manager'), 1)[0],
      skill_inventory: {
        technical_skills: ['React', 'TypeScript'],
        soft_skills: ['Communication'],
        tools: ['Git'],
        languages: ['English'],
      },
      experience_timeline: [],
      skill_gaps: [],
      improvement_roadmap: [],
      ats_compatibility_score: fc.sample(fc.integer({ min: 0, max: 100 }), 1)[0],
      execution_time_ms: 1000,
      from_cache: false,
      created_at: new Date().toISOString(),
    }),
    verifyStateSync: (state, response) => {
      // Verify analysis is stored in analyses record
      expect(state.resumeAnalysis.analyses[response.resume_id]).toBeDefined();
      expect(state.resumeAnalysis.analyses[response.resume_id].id).toBe(response.id);
      expect(state.resumeAnalysis.analyses[response.resume_id].ats_compatibility_score).toBe(response.ats_compatibility_score);
      
      // Verify current analysis is set
      expect(state.resumeAnalysis.currentAnalysis).toBeDefined();
      expect(state.resumeAnalysis.currentAnalysis.id).toBe(response.id);
      
      // Verify loading state is reset
      expect(state.resumeAnalysis.isGenerating).toBe(false);
      expect(state.resumeAnalysis.error).toBe(null);
    },
  },
  // Company Coaching Session Creation Mutation
  {
    sliceName: 'companyCoaching',
    thunkName: 'createSession',
    thunk: createSession,
    mockService: companyCoachingService,
    mockMethod: 'createSession',
    generateArgs: () => ({
      company_name: fc.sample(fc.constantFrom('Google', 'Microsoft', 'Amazon', 'Meta'), 1)[0],
      target_role: fc.sample(fc.constantFrom('Software Engineer', 'Data Scientist', 'Product Manager'), 1)[0],
    }),
    generateResponse: () => ({
      id: fc.sample(fc.integer({ min: 1, max: 1000 }), 1)[0],
      user_id: 1,
      company_name: fc.sample(fc.constantFrom('Google', 'Microsoft', 'Amazon', 'Meta'), 1)[0],
      target_role: fc.sample(fc.constantFrom('Software Engineer', 'Data Scientist', 'Product Manager'), 1)[0],
      company_overview: {
        culture: 'Test culture',
        values: ['Innovation'],
        interview_process: 'Test process',
      },
      predicted_questions: [],
      star_examples: [],
      confidence_tips: [],
      pre_interview_checklist: [],
      execution_time_ms: 1000,
      created_at: new Date().toISOString(),
    }),
    verifyStateSync: (state, response) => {
      // Verify session is stored in sessions record
      expect(state.companyCoaching.sessions[response.id]).toBeDefined();
      expect(state.companyCoaching.sessions[response.id].company_name).toBe(response.company_name);
      expect(state.companyCoaching.sessions[response.id].target_role).toBe(response.target_role);
      
      // Verify current session is set
      expect(state.companyCoaching.currentSession).toBeDefined();
      expect(state.companyCoaching.currentSession.id).toBe(response.id);
      
      // Verify loading state is reset
      expect(state.companyCoaching.isGenerating).toBe(false);
      expect(state.companyCoaching.error).toBe(null);
    },
  },
];

describe('State Synchronization Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 4: State Synchronization After Mutation', () => {
    /**
     * Universal Property: For ANY successful mutation, Redux state matches backend response
     * This is the fundamental property - state must always reflect the server's response
     */
    it('should synchronize Redux state with backend response after any mutation', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...getMutationTestConfigs()),
          async (config) => {
            // Clear mocks before each property test run
            vi.clearAllMocks();
            
            const store = getStoreForSlice(config.sliceName);
            const args = config.generateArgs();
            const response = config.generateResponse();
            
            // Setup mock to return the generated response
            vi.mocked(config.mockService[config.mockMethod]).mockResolvedValue(response);
            
            // Dispatch mutation thunk
            await store.dispatch(config.thunk(args));
            
            // Get final state
            const finalState = store.getState();
            
            // Verify state synchronization using config-specific verification
            config.verifyStateSync(finalState, response);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: State updates are atomic (all or nothing)
     * If mutation succeeds, all related state fields should be updated
     */
    it('should update all related state fields atomically after mutation', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...getMutationTestConfigs()),
          async (config) => {
            vi.clearAllMocks();
            
            const store = getStoreForSlice(config.sliceName);
            const args = config.generateArgs();
            const response = config.generateResponse();
            
            vi.mocked(config.mockService[config.mockMethod]).mockResolvedValue(response);
            
            // Get initial state
            const initialState = store.getState();
            
            // Dispatch mutation
            await store.dispatch(config.thunk(args));
            
            // Get final state
            const finalState = store.getState();
            
            // Verify state changed (mutation had effect)
            expect(finalState).not.toEqual(initialState);
            
            // Verify loading state is reset (mutation completed)
            const sliceState = (finalState as any)[config.sliceName];
            const loadingState = sliceState.isLoading !== undefined ? sliceState.isLoading : sliceState.isGenerating;
            expect(loadingState).toBe(false);
            expect(sliceState.error).toBe(null);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: No stale data remains after mutation
     * Old data should be completely replaced by new data
     */
    it('should not leave stale data after mutation', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...getMutationTestConfigs().filter(c => c.sliceName === 'auth')), // Focus on profile updates
          async (config) => {
            vi.clearAllMocks();
            
            const store = getStoreForSlice(config.sliceName);
            
            // First mutation
            const args1 = config.generateArgs();
            const response1 = config.generateResponse();
            vi.mocked(config.mockService[config.mockMethod]).mockResolvedValue(response1);
            await store.dispatch(config.thunk(args1));
            
            // Second mutation with different data
            const args2 = config.generateArgs();
            const response2 = { ...config.generateResponse(), name: 'Different Name', updated_at: new Date().toISOString() };
            vi.mocked(config.mockService[config.mockMethod]).mockResolvedValue(response2);
            await store.dispatch(config.thunk(args2));
            
            // Verify state reflects second mutation, not first
            const finalState = store.getState();
            config.verifyStateSync(finalState, response2);
            
            // Verify first mutation data is not present
            if (config.sliceName === 'auth') {
              expect((finalState as any).auth.user.name).toBe(response2.name);
              expect((finalState as any).auth.user.name).not.toBe(response1.name);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: State synchronization is consistent across multiple mutations
     * Sequential mutations should each update state correctly
     */
    it('should maintain consistent state synchronization across multiple mutations', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...getMutationTestConfigs()),
          fc.integer({ min: 2, max: 5 }), // Number of sequential mutations
          async (config, numMutations) => {
            vi.clearAllMocks();
            
            const store = getStoreForSlice(config.sliceName);
            const responses: any[] = [];
            
            // Perform multiple sequential mutations
            for (let i = 0; i < numMutations; i++) {
              const args = config.generateArgs();
              const response = config.generateResponse();
              responses.push(response);
              
              vi.mocked(config.mockService[config.mockMethod]).mockResolvedValue(response);
              await store.dispatch(config.thunk(args));
              
              // Verify state after each mutation
              const currentState = store.getState();
              config.verifyStateSync(currentState, response);
            }
            
            // Final state should reflect the last mutation
            const finalState = store.getState();
            config.verifyStateSync(finalState, responses[responses.length - 1]);
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: Error state does not corrupt data
     * If mutation fails, state should remain consistent (no partial updates)
     */
    it('should not corrupt state when mutation fails', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...getMutationTestConfigs()),
          fc.string({ minLength: 1, maxLength: 100 }), // Error message
          async (config, errorMessage) => {
            vi.clearAllMocks();
            
            const store = getStoreForSlice(config.sliceName);
            
            // Get initial state
            const initialState = store.getState();
            const initialSliceState = (initialState as any)[config.sliceName];
            
            // Setup mock to reject
            vi.mocked(config.mockService[config.mockMethod]).mockRejectedValue(
              new Error(errorMessage)
            );
            
            // Dispatch mutation (will fail)
            await store.dispatch(config.thunk(config.generateArgs()));
            
            // Get final state
            const finalState = store.getState();
            const finalSliceState = (finalState as any)[config.sliceName];
            
            // Verify error is set
            expect(finalSliceState.error).toBe(errorMessage);
            
            // Verify loading state is reset
            const loadingState = finalSliceState.isLoading !== undefined ? finalSliceState.isLoading : finalSliceState.isGenerating;
            expect(loadingState).toBe(false);
            
            // Verify data was not corrupted (for auth slice, user should remain unchanged)
            if (config.sliceName === 'auth') {
              expect(finalSliceState.user).toEqual(initialSliceState.user);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Timestamp fields are updated after mutation
     * updated_at or created_at fields should reflect mutation time
     */
    it('should update timestamp fields after mutation', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...getMutationTestConfigs()),
          async (config) => {
            vi.clearAllMocks();
            
            const store = getStoreForSlice(config.sliceName);
            const args = config.generateArgs();
            const response = config.generateResponse();
            
            // Ensure response has a timestamp
            const timestampedResponse = {
              ...response,
              updated_at: new Date().toISOString(),
            };
            
            vi.mocked(config.mockService[config.mockMethod]).mockResolvedValue(timestampedResponse);
            
            // Dispatch mutation
            await store.dispatch(config.thunk(args));
            
            // Verify timestamp is present in state
            const finalState = store.getState();
            const sliceState = (finalState as any)[config.sliceName];
            
            if (config.sliceName === 'auth') {
              expect(sliceState.user.updated_at).toBe(timestampedResponse.updated_at);
            } else if (config.sliceName === 'studyPlan' && timestampedResponse.id) {
              expect(sliceState.plans[timestampedResponse.id]?.updated_at).toBe(timestampedResponse.updated_at);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Related state fields are updated consistently
     * If one field changes, related fields should also update appropriately
     */
    it('should update related state fields consistently', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...getMutationTestConfigs().filter(c => c.sliceName === 'studyPlan')),
          async (config) => {
            vi.clearAllMocks();
            
            const store = getStoreForSlice(config.sliceName);
            const args = config.generateArgs();
            
            // Generate response with consistent progress calculation
            const totalTasks = fc.sample(fc.integer({ min: 1, max: 50 }), 1)[0];
            const completedTasks = fc.sample(fc.integer({ min: 0, max: totalTasks }), 1)[0];
            const progressPercentage = totalTasks > 0 
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0;
            
            const response = {
              ...config.generateResponse(),
              total_tasks: totalTasks,
              completed_tasks: completedTasks,
              progress_percentage: progressPercentage,
            };
            
            vi.mocked(config.mockService[config.mockMethod]).mockResolvedValue(response);
            
            // Dispatch mutation
            await store.dispatch(config.thunk(args));
            
            // Verify related fields are consistent
            const finalState = store.getState();
            const plan = (finalState as any).studyPlan.plans[response.id];
            
            if (plan) {
              // Verify the plan has the expected values
              expect(plan.total_tasks).toBe(totalTasks);
              expect(plan.completed_tasks).toBe(completedTasks);
              expect(plan.progress_percentage).toBe(progressPercentage);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
