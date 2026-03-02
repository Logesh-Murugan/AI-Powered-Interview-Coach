/**
 * Unit Tests for Study Plan Slice
 * Tests thunk success/failure state updates, reducer actions, and selectors
 * 
 * Requirements: INT-1.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import studyPlanReducer, {
  createStudyPlan,
  fetchStudyPlan,
  fetchActivePlan,
  updateProgress,
  abandonPlan,
  clearError,
} from '../studyPlanSlice';
import studyPlanService from '../../../services/studyPlanService';
import type { StudyPlan, CreateStudyPlanRequest, UpdateProgressRequest } from '../../../services/studyPlanService';

// Mock the service
vi.mock('../../../services/studyPlanService', () => ({
  default: {
    createStudyPlan: vi.fn(),
    getStudyPlan: vi.fn(),
    getActiveStudyPlan: vi.fn(),
    updateProgress: vi.fn(),
    abandonPlan: vi.fn(),
  },
}));

// Helper to create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      studyPlan: studyPlanReducer,
    },
  });
};

// Mock data
const mockStudyPlan: StudyPlan = {
  id: 1,
  user_id: 100,
  target_role: 'Software Engineer',
  duration_days: 90,
  available_hours_per_week: 10,
  plan_data: {
    overview: 'Comprehensive study plan for Software Engineer role',
    milestones: [
      {
        week: 1,
        title: 'JavaScript Fundamentals',
        skills: ['ES6+', 'Async/Await'],
        tasks: [
          {
            id: 'task-1',
            title: 'Learn ES6 features',
            description: 'Study arrow functions, destructuring, spread operator',
            estimated_hours: 5,
            resources: ['https://example.com/es6'],
            completed: false,
          },
          {
            id: 'task-2',
            title: 'Master async programming',
            description: 'Understand promises and async/await',
            estimated_hours: 4,
            resources: ['https://example.com/async'],
            completed: false,
          },
        ],
      },
    ],
  },
  status: 'active',
  progress_percentage: 0,
  total_tasks: 2,
  completed_tasks: 0,
  total_milestones: 1,
  completed_milestones: 0,
  execution_time_ms: 2000,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

const mockStudyPlan2: StudyPlan = {
  ...mockStudyPlan,
  id: 2,
  target_role: 'Frontend Developer',
  status: 'completed',
  progress_percentage: 100,
  completed_tasks: 2,
  completed_milestones: 1,
  created_at: '2024-01-16T10:00:00Z',
  updated_at: '2024-01-20T10:00:00Z',
};

const mockCreateRequest: CreateStudyPlanRequest = {
  target_role: 'Software Engineer',
  duration_days: 90,
  available_hours_per_week: 10,
};

const mockUpdateRequest: UpdateProgressRequest = {
  task_updates: [
    { task_id: 'task-1', completed: true },
  ],
};

describe('studyPlanSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createTestStore();
      const state = store.getState().studyPlan;

      expect(state).toEqual({
        plans: {},
        activePlan: null,
        isLoading: false,
        isGenerating: false,
        error: null,
      });
    });
  });

  describe('createStudyPlan thunk', () => {
    it('should set isGenerating to true on pending', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.createStudyPlan).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      store.dispatch(createStudyPlan(mockCreateRequest));

      // Wait for pending state
      await new Promise(resolve => setTimeout(resolve, 0));

      const state = store.getState().studyPlan;
      expect(state.isGenerating).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update state correctly on fulfilled', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.createStudyPlan).mockResolvedValue(mockStudyPlan);

      await store.dispatch(createStudyPlan(mockCreateRequest));

      const state = store.getState().studyPlan;
      expect(state.isGenerating).toBe(false);
      expect(state.plans[1]).toEqual(mockStudyPlan);
      expect(state.activePlan).toEqual(mockStudyPlan);
      expect(state.error).toBe(null);
    });

    it('should handle error on rejected', async () => {
      const store = createTestStore();
      const errorMessage = 'Failed to create study plan';
      
      vi.mocked(studyPlanService.createStudyPlan).mockRejectedValue(
        new Error(errorMessage)
      );

      await store.dispatch(createStudyPlan(mockCreateRequest));

      const state = store.getState().studyPlan;
      expect(state.isGenerating).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.activePlan).toBe(null);
    });

    it('should handle non-Error rejection', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.createStudyPlan).mockRejectedValue('String error');

      await store.dispatch(createStudyPlan(mockCreateRequest));

      const state = store.getState().studyPlan;
      expect(state.isGenerating).toBe(false);
      expect(state.error).toBe('Failed to create study plan');
    });

    it('should clear previous error on new request', async () => {
      const store = createTestStore();
      
      // First request fails
      vi.mocked(studyPlanService.createStudyPlan).mockRejectedValue(
        new Error('First error')
      );
      await store.dispatch(createStudyPlan(mockCreateRequest));

      expect(store.getState().studyPlan.error).toBe('First error');

      // Second request starts
      vi.mocked(studyPlanService.createStudyPlan).mockImplementation(
        () => new Promise(() => {})
      );
      store.dispatch(createStudyPlan(mockCreateRequest));

      await new Promise(resolve => setTimeout(resolve, 0));

      const state = store.getState().studyPlan;
      expect(state.error).toBe(null);
      expect(state.isGenerating).toBe(true);
    });

    it('should set new plan as active plan', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.createStudyPlan).mockResolvedValue(mockStudyPlan);

      await store.dispatch(createStudyPlan(mockCreateRequest));

      const state = store.getState().studyPlan;
      expect(state.activePlan).toEqual(mockStudyPlan);
      expect(state.activePlan?.status).toBe('active');
    });
  });

  describe('fetchStudyPlan thunk', () => {
    it('should set isLoading to true on pending', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.getStudyPlan).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(fetchStudyPlan(1));

      await new Promise(resolve => setTimeout(resolve, 0));

      const state = store.getState().studyPlan;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update state correctly on fulfilled', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.getStudyPlan).mockResolvedValue(mockStudyPlan);

      await store.dispatch(fetchStudyPlan(1));

      const state = store.getState().studyPlan;
      expect(state.isLoading).toBe(false);
      expect(state.plans[1]).toEqual(mockStudyPlan);
      expect(state.error).toBe(null);
    });

    it('should handle error on rejected', async () => {
      const store = createTestStore();
      const errorMessage = 'Study plan not found';
      
      vi.mocked(studyPlanService.getStudyPlan).mockRejectedValue(
        new Error(errorMessage)
      );

      await store.dispatch(fetchStudyPlan(1));

      const state = store.getState().studyPlan;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should handle non-Error rejection', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.getStudyPlan).mockRejectedValue('String error');

      await store.dispatch(fetchStudyPlan(1));

      const state = store.getState().studyPlan;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to fetch study plan');
    });

    it('should update existing plan in state', async () => {
      const store = createTestStore();
      
      // First fetch
      vi.mocked(studyPlanService.getStudyPlan).mockResolvedValue(mockStudyPlan);
      await store.dispatch(fetchStudyPlan(1));

      // Second fetch with updated data
      const updatedPlan = { ...mockStudyPlan, progress_percentage: 50 };
      vi.mocked(studyPlanService.getStudyPlan).mockResolvedValue(updatedPlan);
      await store.dispatch(fetchStudyPlan(1));

      const state = store.getState().studyPlan;
      expect(state.plans[1]).toEqual(updatedPlan);
    });

    it('should handle multiple study plans', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.getStudyPlan)
        .mockResolvedValueOnce(mockStudyPlan)
        .mockResolvedValueOnce(mockStudyPlan2);

      await store.dispatch(fetchStudyPlan(1));
      await store.dispatch(fetchStudyPlan(2));

      const state = store.getState().studyPlan;
      expect(state.plans[1]).toEqual(mockStudyPlan);
      expect(state.plans[2]).toEqual(mockStudyPlan2);
    });

    it('should not change activePlan when fetching non-active plan', async () => {
      const store = createTestStore();
      
      // Set active plan
      vi.mocked(studyPlanService.createStudyPlan).mockResolvedValue(mockStudyPlan);
      await store.dispatch(createStudyPlan(mockCreateRequest));

      // Fetch different plan
      vi.mocked(studyPlanService.getStudyPlan).mockResolvedValue(mockStudyPlan2);
      await store.dispatch(fetchStudyPlan(2));

      const state = store.getState().studyPlan;
      expect(state.activePlan).toEqual(mockStudyPlan);
      expect(state.plans[2]).toEqual(mockStudyPlan2);
    });
  });

  describe('fetchActivePlan thunk', () => {
    it('should set isLoading to true on pending', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.getActiveStudyPlan).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(fetchActivePlan());

      await new Promise(resolve => setTimeout(resolve, 0));

      const state = store.getState().studyPlan;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update state correctly on fulfilled', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.getActiveStudyPlan).mockResolvedValue(mockStudyPlan);

      await store.dispatch(fetchActivePlan());

      const state = store.getState().studyPlan;
      expect(state.isLoading).toBe(false);
      expect(state.plans[1]).toEqual(mockStudyPlan);
      expect(state.activePlan).toEqual(mockStudyPlan);
      expect(state.error).toBe(null);
    });

    it('should handle error on rejected', async () => {
      const store = createTestStore();
      const errorMessage = 'No active study plan found';
      
      vi.mocked(studyPlanService.getActiveStudyPlan).mockRejectedValue(
        new Error(errorMessage)
      );

      await store.dispatch(fetchActivePlan());

      const state = store.getState().studyPlan;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should handle non-Error rejection', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.getActiveStudyPlan).mockRejectedValue('String error');

      await store.dispatch(fetchActivePlan());

      const state = store.getState().studyPlan;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to fetch active study plan');
    });

    it('should replace existing activePlan', async () => {
      const store = createTestStore();
      
      // Set first active plan
      vi.mocked(studyPlanService.getActiveStudyPlan).mockResolvedValue(mockStudyPlan);
      await store.dispatch(fetchActivePlan());

      expect(store.getState().studyPlan.activePlan?.id).toBe(1);

      // Fetch new active plan
      vi.mocked(studyPlanService.getActiveStudyPlan).mockResolvedValue(mockStudyPlan2);
      await store.dispatch(fetchActivePlan());

      const state = store.getState().studyPlan;
      expect(state.activePlan?.id).toBe(2);
      expect(state.plans[1]).toEqual(mockStudyPlan);
      expect(state.plans[2]).toEqual(mockStudyPlan2);
    });

    it('should store plan in plans dictionary', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.getActiveStudyPlan).mockResolvedValue(mockStudyPlan);

      await store.dispatch(fetchActivePlan());

      const state = store.getState().studyPlan;
      expect(state.plans[mockStudyPlan.id]).toEqual(mockStudyPlan);
    });
  });

  describe('updateProgress thunk', () => {
    it('should set isLoading to true on pending', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.updateProgress).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(updateProgress({ planId: 1, request: mockUpdateRequest }));

      await new Promise(resolve => setTimeout(resolve, 0));

      const state = store.getState().studyPlan;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update state correctly on fulfilled', async () => {
      const store = createTestStore();
      
      const updatedPlan = {
        ...mockStudyPlan,
        progress_percentage: 50,
        completed_tasks: 1,
        plan_data: {
          ...mockStudyPlan.plan_data,
          milestones: [
            {
              ...mockStudyPlan.plan_data.milestones[0],
              tasks: [
                { ...mockStudyPlan.plan_data.milestones[0].tasks[0], completed: true },
                mockStudyPlan.plan_data.milestones[0].tasks[1],
              ],
            },
          ],
        },
      };
      
      vi.mocked(studyPlanService.updateProgress).mockResolvedValue(updatedPlan);

      await store.dispatch(updateProgress({ planId: 1, request: mockUpdateRequest }));

      const state = store.getState().studyPlan;
      expect(state.isLoading).toBe(false);
      expect(state.plans[1]).toEqual(updatedPlan);
      expect(state.error).toBe(null);
    });

    it('should handle error on rejected', async () => {
      const store = createTestStore();
      const errorMessage = 'Failed to update progress';
      
      vi.mocked(studyPlanService.updateProgress).mockRejectedValue(
        new Error(errorMessage)
      );

      await store.dispatch(updateProgress({ planId: 1, request: mockUpdateRequest }));

      const state = store.getState().studyPlan;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should handle non-Error rejection', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.updateProgress).mockRejectedValue('String error');

      await store.dispatch(updateProgress({ planId: 1, request: mockUpdateRequest }));

      const state = store.getState().studyPlan;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to update progress');
    });

    it('should update activePlan if it matches the updated plan', async () => {
      const store = createTestStore();
      
      // Set active plan
      vi.mocked(studyPlanService.createStudyPlan).mockResolvedValue(mockStudyPlan);
      await store.dispatch(createStudyPlan(mockCreateRequest));

      // Update progress
      const updatedPlan = { ...mockStudyPlan, progress_percentage: 50 };
      vi.mocked(studyPlanService.updateProgress).mockResolvedValue(updatedPlan);
      await store.dispatch(updateProgress({ planId: 1, request: mockUpdateRequest }));

      const state = store.getState().studyPlan;
      expect(state.activePlan).toEqual(updatedPlan);
      expect(state.activePlan?.progress_percentage).toBe(50);
    });

    it('should not update activePlan if it does not match', async () => {
      const store = createTestStore();
      
      // Set active plan
      vi.mocked(studyPlanService.createStudyPlan).mockResolvedValue(mockStudyPlan);
      await store.dispatch(createStudyPlan(mockCreateRequest));

      // Update different plan
      const updatedPlan2 = { ...mockStudyPlan2, progress_percentage: 100 };
      vi.mocked(studyPlanService.updateProgress).mockResolvedValue(updatedPlan2);
      await store.dispatch(updateProgress({ planId: 2, request: mockUpdateRequest }));

      const state = store.getState().studyPlan;
      expect(state.activePlan).toEqual(mockStudyPlan);
      expect(state.plans[2]).toEqual(updatedPlan2);
    });

    it('should handle multiple task updates', async () => {
      const store = createTestStore();
      
      const multiTaskUpdate: UpdateProgressRequest = {
        task_updates: [
          { task_id: 'task-1', completed: true },
          { task_id: 'task-2', completed: true },
        ],
      };

      const fullyUpdatedPlan = {
        ...mockStudyPlan,
        progress_percentage: 100,
        completed_tasks: 2,
        completed_milestones: 1,
      };
      
      vi.mocked(studyPlanService.updateProgress).mockResolvedValue(fullyUpdatedPlan);

      await store.dispatch(updateProgress({ planId: 1, request: multiTaskUpdate }));

      const state = store.getState().studyPlan;
      expect(state.plans[1].completed_tasks).toBe(2);
      expect(state.plans[1].progress_percentage).toBe(100);
    });
  });

  describe('abandonPlan thunk', () => {
    it('should set isLoading to true on pending', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.abandonPlan).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(abandonPlan(1));

      await new Promise(resolve => setTimeout(resolve, 0));

      const state = store.getState().studyPlan;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update plan status to abandoned on fulfilled', async () => {
      const store = createTestStore();
      
      // First create a plan
      vi.mocked(studyPlanService.createStudyPlan).mockResolvedValue(mockStudyPlan);
      await store.dispatch(createStudyPlan(mockCreateRequest));

      // Then abandon it
      vi.mocked(studyPlanService.abandonPlan).mockResolvedValue();
      await store.dispatch(abandonPlan(1));

      const state = store.getState().studyPlan;
      expect(state.isLoading).toBe(false);
      expect(state.plans[1].status).toBe('abandoned');
      expect(state.error).toBe(null);
    });

    it('should handle error on rejected', async () => {
      const store = createTestStore();
      const errorMessage = 'Failed to abandon plan';
      
      vi.mocked(studyPlanService.abandonPlan).mockRejectedValue(
        new Error(errorMessage)
      );

      await store.dispatch(abandonPlan(1));

      const state = store.getState().studyPlan;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should handle non-Error rejection', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.abandonPlan).mockRejectedValue('String error');

      await store.dispatch(abandonPlan(1));

      const state = store.getState().studyPlan;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to abandon study plan');
    });

    it('should clear activePlan if abandoned plan is active', async () => {
      const store = createTestStore();
      
      // Create active plan
      vi.mocked(studyPlanService.createStudyPlan).mockResolvedValue(mockStudyPlan);
      await store.dispatch(createStudyPlan(mockCreateRequest));

      expect(store.getState().studyPlan.activePlan?.id).toBe(1);

      // Abandon active plan
      vi.mocked(studyPlanService.abandonPlan).mockResolvedValue();
      await store.dispatch(abandonPlan(1));

      const state = store.getState().studyPlan;
      expect(state.activePlan).toBe(null);
      expect(state.plans[1].status).toBe('abandoned');
    });

    it('should not clear activePlan if abandoned plan is not active', async () => {
      const store = createTestStore();
      
      // Create active plan
      vi.mocked(studyPlanService.createStudyPlan).mockResolvedValue(mockStudyPlan);
      await store.dispatch(createStudyPlan(mockCreateRequest));

      // Add another plan
      vi.mocked(studyPlanService.getStudyPlan).mockResolvedValue(mockStudyPlan2);
      await store.dispatch(fetchStudyPlan(2));

      // Abandon non-active plan
      vi.mocked(studyPlanService.abandonPlan).mockResolvedValue();
      await store.dispatch(abandonPlan(2));

      const state = store.getState().studyPlan;
      expect(state.activePlan).toEqual(mockStudyPlan);
      expect(state.plans[2].status).toBe('abandoned');
    });

    it('should handle abandoning non-existent plan gracefully', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.abandonPlan).mockResolvedValue();
      await store.dispatch(abandonPlan(999));

      const state = store.getState().studyPlan;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.plans[999]).toBeUndefined();
    });
  });

  describe('clearError reducer', () => {
    it('should clear error', async () => {
      const store = createTestStore();

      // Create an error
      vi.mocked(studyPlanService.getStudyPlan).mockRejectedValue(
        new Error('Test error')
      );
      await store.dispatch(fetchStudyPlan(1));

      expect(store.getState().studyPlan.error).toBe('Test error');

      // Clear error
      store.dispatch(clearError());

      const state = store.getState().studyPlan;
      expect(state.error).toBe(null);
    });

    it('should not affect other state properties', async () => {
      const store = createTestStore();

      // Set up some state
      vi.mocked(studyPlanService.createStudyPlan).mockResolvedValue(mockStudyPlan);
      await store.dispatch(createStudyPlan(mockCreateRequest));

      // Create an error
      vi.mocked(studyPlanService.getStudyPlan).mockRejectedValue(
        new Error('Test error')
      );
      await store.dispatch(fetchStudyPlan(2));

      // Clear error
      store.dispatch(clearError());

      const state = store.getState().studyPlan;
      expect(state.error).toBe(null);
      expect(state.plans[1]).toEqual(mockStudyPlan);
      expect(state.activePlan).toEqual(mockStudyPlan);
    });

    it('should work when no error exists', () => {
      const store = createTestStore();

      store.dispatch(clearError());

      const state = store.getState().studyPlan;
      expect(state.error).toBe(null);
    });
  });

  describe('state transitions', () => {
    it('should handle loading state transitions correctly', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.getStudyPlan).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockStudyPlan), 100))
      );

      // Start loading
      const promise = store.dispatch(fetchStudyPlan(1));
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(store.getState().studyPlan.isLoading).toBe(true);

      // Complete loading
      await promise;
      expect(store.getState().studyPlan.isLoading).toBe(false);
    });

    it('should handle generating state transitions correctly', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.createStudyPlan).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockStudyPlan), 100))
      );

      // Start generating
      const promise = store.dispatch(createStudyPlan(mockCreateRequest));
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(store.getState().studyPlan.isGenerating).toBe(true);

      // Complete generating
      await promise;
      expect(store.getState().studyPlan.isGenerating).toBe(false);
    });

    it('should not mix isLoading and isGenerating states', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.getStudyPlan).mockImplementation(
        () => new Promise(() => {})
      );
      vi.mocked(studyPlanService.createStudyPlan).mockImplementation(
        () => new Promise(() => {})
      );

      // Start fetch (isLoading)
      store.dispatch(fetchStudyPlan(1));
      await new Promise(resolve => setTimeout(resolve, 0));
      
      let state = store.getState().studyPlan;
      expect(state.isLoading).toBe(true);
      expect(state.isGenerating).toBe(false);

      // Start create (isGenerating)
      store.dispatch(createStudyPlan(mockCreateRequest));
      await new Promise(resolve => setTimeout(resolve, 0));

      state = store.getState().studyPlan;
      expect(state.isLoading).toBe(true);
      expect(state.isGenerating).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid successive calls', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.getStudyPlan)
        .mockResolvedValueOnce(mockStudyPlan)
        .mockResolvedValueOnce(mockStudyPlan2);

      // Dispatch multiple calls rapidly
      const promise1 = store.dispatch(fetchStudyPlan(1));
      const promise2 = store.dispatch(fetchStudyPlan(2));

      await Promise.all([promise1, promise2]);

      const state = store.getState().studyPlan;
      expect(state.plans[1]).toEqual(mockStudyPlan);
      expect(state.plans[2]).toEqual(mockStudyPlan2);
    });

    it('should handle mixed success and failure', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.getStudyPlan)
        .mockResolvedValueOnce(mockStudyPlan)
        .mockRejectedValueOnce(new Error('Failed'));

      await store.dispatch(fetchStudyPlan(1));
      await store.dispatch(fetchStudyPlan(2));

      const state = store.getState().studyPlan;
      expect(state.plans[1]).toEqual(mockStudyPlan);
      expect(state.plans[2]).toBeUndefined();
      expect(state.error).toBe('Failed');
    });

    it('should preserve plans when update fails', async () => {
      const store = createTestStore();
      
      // First, successfully create a plan
      vi.mocked(studyPlanService.createStudyPlan).mockResolvedValue(mockStudyPlan);
      await store.dispatch(createStudyPlan(mockCreateRequest));

      // Then, fail to update progress
      vi.mocked(studyPlanService.updateProgress).mockRejectedValue(
        new Error('Update failed')
      );
      await store.dispatch(updateProgress({ planId: 1, request: mockUpdateRequest }));

      const state = store.getState().studyPlan;
      expect(state.plans[1]).toEqual(mockStudyPlan);
      expect(state.error).toBe('Update failed');
    });

    it('should handle creating plan while another is active', async () => {
      const store = createTestStore();
      
      // Create first plan
      vi.mocked(studyPlanService.createStudyPlan).mockResolvedValue(mockStudyPlan);
      await store.dispatch(createStudyPlan(mockCreateRequest));

      expect(store.getState().studyPlan.activePlan?.id).toBe(1);

      // Create second plan (should replace active)
      vi.mocked(studyPlanService.createStudyPlan).mockResolvedValue(mockStudyPlan2);
      await store.dispatch(createStudyPlan(mockCreateRequest));

      const state = store.getState().studyPlan;
      expect(state.activePlan?.id).toBe(2);
      expect(state.plans[1]).toEqual(mockStudyPlan);
      expect(state.plans[2]).toEqual(mockStudyPlan2);
    });

    it('should handle fetching active plan when none exists', async () => {
      const store = createTestStore();
      
      vi.mocked(studyPlanService.getActiveStudyPlan).mockRejectedValue(
        new Error('No active plan')
      );

      await store.dispatch(fetchActivePlan());

      const state = store.getState().studyPlan;
      expect(state.activePlan).toBe(null);
      expect(state.error).toBe('No active plan');
    });

    it('should handle updating progress on completed plan', async () => {
      const store = createTestStore();
      
      // Create completed plan
      vi.mocked(studyPlanService.getStudyPlan).mockResolvedValue(mockStudyPlan2);
      await store.dispatch(fetchStudyPlan(2));

      // Try to update it
      const updatedPlan = { ...mockStudyPlan2, progress_percentage: 100 };
      vi.mocked(studyPlanService.updateProgress).mockResolvedValue(updatedPlan);
      await store.dispatch(updateProgress({ planId: 2, request: mockUpdateRequest }));

      const state = store.getState().studyPlan;
      expect(state.plans[2]).toEqual(updatedPlan);
    });

    it('should handle abandoning already abandoned plan', async () => {
      const store = createTestStore();
      
      // Create and abandon plan
      vi.mocked(studyPlanService.createStudyPlan).mockResolvedValue(mockStudyPlan);
      await store.dispatch(createStudyPlan(mockCreateRequest));

      vi.mocked(studyPlanService.abandonPlan).mockResolvedValue();
      await store.dispatch(abandonPlan(1));

      expect(store.getState().studyPlan.plans[1].status).toBe('abandoned');

      // Abandon again
      await store.dispatch(abandonPlan(1));

      const state = store.getState().studyPlan;
      expect(state.plans[1].status).toBe('abandoned');
      expect(state.error).toBe(null);
    });
  });
});
