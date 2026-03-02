/**
 * Unit Tests for Study Plan Service
 * Tests API calls, error handling, and request payload formatting
 * 
 * Requirements: INT-1.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { studyPlanService } from '../studyPlanService';
import type { StudyPlan, CreateStudyPlanRequest, UpdateProgressRequest } from '../studyPlanService';
import apiService from '../api.service';

// Mock the apiService
vi.mock('../api.service', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('studyPlanService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockStudyPlan: StudyPlan = {
    id: 1,
    user_id: 123,
    target_role: 'Software Engineer',
    duration_days: 90,
    available_hours_per_week: 10,
    plan_data: {
      daily_tasks: [
        {
          day: 1,
          date: '2024-01-15',
          tasks: [
            {
              skill: 'JavaScript',
              activity: 'Complete ES6 tutorial',
              duration_minutes: 60,
              resources: ['https://example.com/es6'],
              completed: false,
            },
          ],
        },
      ],
      weekly_milestones: [
        {
          week: 1,
          milestone: 'Master JavaScript fundamentals',
          skills_covered: ['JavaScript', 'ES6'],
          assessment: 'Build a small project',
          completed: false,
        },
      ],
      resource_links: {
        JavaScript: ['https://example.com/js'],
      },
      time_estimates: {
        total_hours: 120,
        hours_per_week: 10,
        completion_date: '2024-04-15',
      },
    },
    execution_time_ms: 2500,
    status: 'active',
    progress_percentage: 0,
    total_tasks: 90,
    completed_tasks: 0,
    total_milestones: 12,
    completed_milestones: 0,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  };

  describe('createStudyPlan', () => {
    const mockRequest: CreateStudyPlanRequest = {
      target_role: 'Software Engineer',
      duration_days: 90,
      available_hours_per_week: 10,
    };

    it('should successfully call POST /study-plans with correct payload', async () => {
      vi.mocked(apiService.post).mockResolvedValue({ data: mockStudyPlan });

      const result = await studyPlanService.createStudyPlan(mockRequest);

      expect(apiService.post).toHaveBeenCalledWith('/study-plans', mockRequest);
      expect(result).toEqual(mockStudyPlan);
    });

    it('should handle different duration_days values', async () => {
      const requestWith30Days: CreateStudyPlanRequest = {
        target_role: 'Data Scientist',
        duration_days: 30,
        available_hours_per_week: 15,
      };

      vi.mocked(apiService.post).mockResolvedValue({ data: mockStudyPlan });

      await studyPlanService.createStudyPlan(requestWith30Days);

      expect(apiService.post).toHaveBeenCalledWith('/study-plans', requestWith30Days);
    });

    it('should handle different available_hours_per_week values', async () => {
      const requestWith5Hours: CreateStudyPlanRequest = {
        target_role: 'DevOps Engineer',
        duration_days: 60,
        available_hours_per_week: 5,
      };

      vi.mocked(apiService.post).mockResolvedValue({ data: mockStudyPlan });

      await studyPlanService.createStudyPlan(requestWith5Hours);

      expect(apiService.post).toHaveBeenCalledWith('/study-plans', requestWith5Hours);
    });

    it('should handle 404 error when user not found', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'User not found' },
        },
      };

      vi.mocked(apiService.post).mockRejectedValue(error);

      await expect(
        studyPlanService.createStudyPlan(mockRequest)
      ).rejects.toEqual(error);
    });

    it('should handle 422 validation error', async () => {
      const error = {
        response: {
          status: 422,
          data: { 
            message: 'Validation error',
            details: { duration_days: 'Must be between 7 and 365' }
          },
        },
      };

      vi.mocked(apiService.post).mockRejectedValue(error);

      await expect(
        studyPlanService.createStudyPlan(mockRequest)
      ).rejects.toEqual(error);
    });

    it('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      vi.mocked(apiService.post).mockRejectedValue(error);

      await expect(
        studyPlanService.createStudyPlan(mockRequest)
      ).rejects.toEqual(error);
    });

    it('should handle network error', async () => {
      const networkError = {
        message: 'Network Error',
        code: 'ECONNABORTED',
      };

      vi.mocked(apiService.post).mockRejectedValue(networkError);

      await expect(
        studyPlanService.createStudyPlan(mockRequest)
      ).rejects.toEqual(networkError);
    });

    it('should handle timeout error', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      };

      vi.mocked(apiService.post).mockRejectedValue(timeoutError);

      await expect(
        studyPlanService.createStudyPlan(mockRequest)
      ).rejects.toEqual(timeoutError);
    });
  });

  describe('getStudyPlan', () => {
    const mockPlanId = 456;

    it('should successfully call GET /study-plans/{plan_id}', async () => {
      vi.mocked(apiService.get).mockResolvedValue({ data: mockStudyPlan });

      const result = await studyPlanService.getStudyPlan(mockPlanId);

      expect(apiService.get).toHaveBeenCalledWith(`/study-plans/${mockPlanId}`);
      expect(result).toEqual(mockStudyPlan);
    });

    it('should handle different plan IDs', async () => {
      const planIds = [1, 100, 9999];

      vi.mocked(apiService.get).mockResolvedValue({ data: mockStudyPlan });

      for (const id of planIds) {
        await studyPlanService.getStudyPlan(id);
        expect(apiService.get).toHaveBeenCalledWith(`/study-plans/${id}`);
      }
    });

    it('should handle 404 error when plan not found', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Study plan not found' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        studyPlanService.getStudyPlan(mockPlanId)
      ).rejects.toEqual(error);
    });

    it('should handle 403 forbidden error', async () => {
      const error = {
        response: {
          status: 403,
          data: { message: 'Access denied to this study plan' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        studyPlanService.getStudyPlan(mockPlanId)
      ).rejects.toEqual(error);
    });

    it('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Database connection failed' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        studyPlanService.getStudyPlan(mockPlanId)
      ).rejects.toEqual(error);
    });

    it('should handle network error', async () => {
      const networkError = {
        message: 'Network Error',
        code: 'ERR_NETWORK',
      };

      vi.mocked(apiService.get).mockRejectedValue(networkError);

      await expect(
        studyPlanService.getStudyPlan(mockPlanId)
      ).rejects.toEqual(networkError);
    });
  });

  describe('getActiveStudyPlan', () => {
    it('should successfully call GET /study-plans/active/current', async () => {
      vi.mocked(apiService.get).mockResolvedValue({ data: mockStudyPlan });

      const result = await studyPlanService.getActiveStudyPlan();

      expect(apiService.get).toHaveBeenCalledWith('/study-plans/active/current');
      expect(result).toEqual(mockStudyPlan);
    });

    it('should return active plan with status active', async () => {
      const activePlan = { ...mockStudyPlan, status: 'active' as const };
      vi.mocked(apiService.get).mockResolvedValue({ data: activePlan });

      const result = await studyPlanService.getActiveStudyPlan();

      expect(result.status).toBe('active');
    });

    it('should handle 404 error when no active plan exists', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'No active study plan found' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        studyPlanService.getActiveStudyPlan()
      ).rejects.toEqual(error);
    });

    it('should handle 401 unauthorized error', async () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        studyPlanService.getActiveStudyPlan()
      ).rejects.toEqual(error);
    });

    it('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Failed to retrieve active plan' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        studyPlanService.getActiveStudyPlan()
      ).rejects.toEqual(error);
    });

    it('should handle network error', async () => {
      const networkError = {
        message: 'Network Error',
        code: 'ERR_NETWORK',
      };

      vi.mocked(apiService.get).mockRejectedValue(networkError);

      await expect(
        studyPlanService.getActiveStudyPlan()
      ).rejects.toEqual(networkError);
    });
  });

  describe('updateProgress', () => {
    const mockPlanId = 789;
    const mockUpdateRequest: UpdateProgressRequest = {
      task_updates: {
        'day-1-task-1': true,
        'day-1-task-2': false,
      },
    };

    const mockUpdatedPlan: StudyPlan = {
      ...mockStudyPlan,
      progress_percentage: 15,
      completed_tasks: 5,
    };

    it('should successfully call PATCH /study-plans/{plan_id}/progress with correct payload', async () => {
      vi.mocked(apiService.patch).mockResolvedValue({ data: mockUpdatedPlan });

      const result = await studyPlanService.updateProgress(mockPlanId, mockUpdateRequest);

      expect(apiService.patch).toHaveBeenCalledWith(
        `/study-plans/${mockPlanId}/progress`,
        mockUpdateRequest
      );
      expect(result).toEqual(mockUpdatedPlan);
    });

    it('should handle marking multiple tasks as completed', async () => {
      const multipleTasksUpdate: UpdateProgressRequest = {
        task_updates: {
          'day-1-task-1': true,
          'day-1-task-2': true,
          'day-2-task-1': true,
        },
      };

      vi.mocked(apiService.patch).mockResolvedValue({ data: mockUpdatedPlan });

      await studyPlanService.updateProgress(mockPlanId, multipleTasksUpdate);

      expect(apiService.patch).toHaveBeenCalledWith(
        `/study-plans/${mockPlanId}/progress`,
        multipleTasksUpdate
      );
    });

    it('should handle marking tasks as incomplete', async () => {
      const incompleteUpdate: UpdateProgressRequest = {
        task_updates: {
          'day-1-task-1': false,
        },
      };

      vi.mocked(apiService.patch).mockResolvedValue({ data: mockUpdatedPlan });

      await studyPlanService.updateProgress(mockPlanId, incompleteUpdate);

      expect(apiService.patch).toHaveBeenCalledWith(
        `/study-plans/${mockPlanId}/progress`,
        incompleteUpdate
      );
    });

    it('should return updated progress percentage', async () => {
      const planWith50Percent = { ...mockStudyPlan, progress_percentage: 50, completed_tasks: 45 };
      vi.mocked(apiService.patch).mockResolvedValue({ data: planWith50Percent });

      const result = await studyPlanService.updateProgress(mockPlanId, mockUpdateRequest);

      expect(result.progress_percentage).toBe(50);
      expect(result.completed_tasks).toBe(45);
    });

    it('should handle 404 error when plan not found', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Study plan not found' },
        },
      };

      vi.mocked(apiService.patch).mockRejectedValue(error);

      await expect(
        studyPlanService.updateProgress(mockPlanId, mockUpdateRequest)
      ).rejects.toEqual(error);
    });

    it('should handle 422 validation error for invalid task IDs', async () => {
      const error = {
        response: {
          status: 422,
          data: { 
            message: 'Validation error',
            details: { task_updates: 'Invalid task ID' }
          },
        },
      };

      vi.mocked(apiService.patch).mockRejectedValue(error);

      await expect(
        studyPlanService.updateProgress(mockPlanId, mockUpdateRequest)
      ).rejects.toEqual(error);
    });

    it('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Failed to update progress' },
        },
      };

      vi.mocked(apiService.patch).mockRejectedValue(error);

      await expect(
        studyPlanService.updateProgress(mockPlanId, mockUpdateRequest)
      ).rejects.toEqual(error);
    });

    it('should handle network error', async () => {
      const networkError = {
        message: 'Network Error',
        code: 'ERR_NETWORK',
      };

      vi.mocked(apiService.patch).mockRejectedValue(networkError);

      await expect(
        studyPlanService.updateProgress(mockPlanId, mockUpdateRequest)
      ).rejects.toEqual(networkError);
    });
  });

  describe('abandonPlan', () => {
    const mockPlanId = 999;

    it('should successfully call DELETE /study-plans/{plan_id}', async () => {
      vi.mocked(apiService.delete).mockResolvedValue({ data: undefined });

      await studyPlanService.abandonPlan(mockPlanId);

      expect(apiService.delete).toHaveBeenCalledWith(`/study-plans/${mockPlanId}`);
    });

    it('should handle different plan IDs', async () => {
      const planIds = [1, 50, 1000];

      vi.mocked(apiService.delete).mockResolvedValue({ data: undefined });

      for (const id of planIds) {
        await studyPlanService.abandonPlan(id);
        expect(apiService.delete).toHaveBeenCalledWith(`/study-plans/${id}`);
      }
    });

    it('should return void on success', async () => {
      vi.mocked(apiService.delete).mockResolvedValue({ data: undefined });

      const result = await studyPlanService.abandonPlan(mockPlanId);

      expect(result).toBeUndefined();
    });

    it('should handle 404 error when plan not found', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Study plan not found' },
        },
      };

      vi.mocked(apiService.delete).mockRejectedValue(error);

      await expect(
        studyPlanService.abandonPlan(mockPlanId)
      ).rejects.toEqual(error);
    });

    it('should handle 403 forbidden error', async () => {
      const error = {
        response: {
          status: 403,
          data: { message: 'Cannot abandon another user\'s plan' },
        },
      };

      vi.mocked(apiService.delete).mockRejectedValue(error);

      await expect(
        studyPlanService.abandonPlan(mockPlanId)
      ).rejects.toEqual(error);
    });

    it('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Failed to abandon plan' },
        },
      };

      vi.mocked(apiService.delete).mockRejectedValue(error);

      await expect(
        studyPlanService.abandonPlan(mockPlanId)
      ).rejects.toEqual(error);
    });

    it('should handle network error', async () => {
      const networkError = {
        message: 'Network Error',
        code: 'ERR_NETWORK',
      };

      vi.mocked(apiService.delete).mockRejectedValue(networkError);

      await expect(
        studyPlanService.abandonPlan(mockPlanId)
      ).rejects.toEqual(networkError);
    });
  });

  describe('Request Payload Formatting', () => {
    it('should format createStudyPlan request with all required fields', async () => {
      const fullRequest: CreateStudyPlanRequest = {
        target_role: 'Full Stack Developer',
        duration_days: 120,
        available_hours_per_week: 20,
      };

      vi.mocked(apiService.post).mockResolvedValue({ data: mockStudyPlan });

      await studyPlanService.createStudyPlan(fullRequest);

      const callArgs = vi.mocked(apiService.post).mock.calls[0];
      expect(callArgs[1]).toEqual(fullRequest);
      expect(callArgs[1]).toHaveProperty('target_role', 'Full Stack Developer');
      expect(callArgs[1]).toHaveProperty('duration_days', 120);
      expect(callArgs[1]).toHaveProperty('available_hours_per_week', 20);
    });

    it('should format updateProgress request with task_updates object', async () => {
      const updateRequest: UpdateProgressRequest = {
        task_updates: {
          'task-1': true,
          'task-2': false,
          'task-3': true,
        },
      };

      vi.mocked(apiService.patch).mockResolvedValue({ data: mockStudyPlan });

      await studyPlanService.updateProgress(1, updateRequest);

      const callArgs = vi.mocked(apiService.patch).mock.calls[0];
      expect(callArgs[1]).toEqual(updateRequest);
      expect(callArgs[1]).toHaveProperty('task_updates');
      expect(Object.keys(callArgs[1].task_updates)).toHaveLength(3);
    });

    it('should correctly format URL with plan ID for all operations', async () => {
      const planId = 123;

      vi.mocked(apiService.get).mockResolvedValue({ data: mockStudyPlan });
      vi.mocked(apiService.patch).mockResolvedValue({ data: mockStudyPlan });
      vi.mocked(apiService.delete).mockResolvedValue({ data: undefined });

      // Test getStudyPlan
      await studyPlanService.getStudyPlan(planId);
      expect(apiService.get).toHaveBeenCalledWith(`/study-plans/${planId}`);

      // Test updateProgress
      await studyPlanService.updateProgress(planId, { task_updates: {} });
      expect(apiService.patch).toHaveBeenCalledWith(
        `/study-plans/${planId}/progress`,
        expect.any(Object)
      );

      // Test abandonPlan
      await studyPlanService.abandonPlan(planId);
      expect(apiService.delete).toHaveBeenCalledWith(`/study-plans/${planId}`);
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

      await expect(
        studyPlanService.getStudyPlan(1)
      ).rejects.toEqual(error);
    });

    it('should handle 429 rate limit error', async () => {
      const error = {
        response: {
          status: 429,
          data: { message: 'Too many requests' },
        },
      };

      vi.mocked(apiService.post).mockRejectedValue(error);

      await expect(
        studyPlanService.createStudyPlan({
          target_role: 'Test',
          duration_days: 30,
          available_hours_per_week: 10,
        })
      ).rejects.toEqual(error);
    });

    it('should handle 503 service unavailable error', async () => {
      const error = {
        response: {
          status: 503,
          data: { message: 'Service temporarily unavailable' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        studyPlanService.getActiveStudyPlan()
      ).rejects.toEqual(error);
    });

    it('should handle timeout during plan generation', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      };

      vi.mocked(apiService.post).mockRejectedValue(timeoutError);

      await expect(
        studyPlanService.createStudyPlan({
          target_role: 'Test',
          duration_days: 30,
          available_hours_per_week: 10,
        })
      ).rejects.toEqual(timeoutError);
    });
  });

  describe('Progress Update Logic', () => {
    it('should handle empty task_updates object', async () => {
      const emptyUpdate: UpdateProgressRequest = {
        task_updates: {},
      };

      vi.mocked(apiService.patch).mockResolvedValue({ data: mockStudyPlan });

      await studyPlanService.updateProgress(1, emptyUpdate);

      expect(apiService.patch).toHaveBeenCalledWith(
        '/study-plans/1/progress',
        emptyUpdate
      );
    });

    it('should handle single task update', async () => {
      const singleUpdate: UpdateProgressRequest = {
        task_updates: {
          'task-1': true,
        },
      };

      vi.mocked(apiService.patch).mockResolvedValue({ data: mockStudyPlan });

      await studyPlanService.updateProgress(1, singleUpdate);

      const callArgs = vi.mocked(apiService.patch).mock.calls[0];
      expect(Object.keys(callArgs[1].task_updates)).toHaveLength(1);
    });

    it('should handle large batch of task updates', async () => {
      const taskUpdates: Record<string, boolean> = {};
      for (let i = 1; i <= 50; i++) {
        taskUpdates[`task-${i}`] = i % 2 === 0;
      }

      const batchUpdate: UpdateProgressRequest = {
        task_updates: taskUpdates,
      };

      vi.mocked(apiService.patch).mockResolvedValue({ data: mockStudyPlan });

      await studyPlanService.updateProgress(1, batchUpdate);

      const callArgs = vi.mocked(apiService.patch).mock.calls[0];
      expect(Object.keys(callArgs[1].task_updates)).toHaveLength(50);
    });
  });
});
