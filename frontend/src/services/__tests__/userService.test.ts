/**
 * Unit Tests for User Service
 * Tests API calls for user profile management
 * 
 * Requirements: INT-2.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userService, { UserProfile, UpdateProfileRequest, VALID_ROLES, VALID_EXPERIENCE_LEVELS } from '../userService';
import apiService from '../api.service';

// Mock the apiService
vi.mock('../api.service', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const mockUserProfile: UserProfile = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  target_role: 'Software Engineer',
  experience_level: 'Mid',
  account_status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getProfile', () => {
    it('should fetch user profile successfully', async () => {
      vi.mocked(apiService.get).mockResolvedValue({ data: mockUserProfile });

      const result = await userService.getProfile();

      expect(apiService.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockUserProfile);
    });

    it('should handle 401 unauthorized error', async () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(userService.getProfile()).rejects.toEqual(error);
    });

    it('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Server error' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(userService.getProfile()).rejects.toEqual(error);
    });

    it('should handle network error', async () => {
      const networkError = {
        message: 'Network Error',
        code: 'ERR_NETWORK',
      };

      vi.mocked(apiService.get).mockRejectedValue(networkError);

      await expect(userService.getProfile()).rejects.toEqual(networkError);
    });
  });

  describe('updateProfile', () => {
    it('should update profile with all fields', async () => {
      const updateRequest: UpdateProfileRequest = {
        name: 'Updated Name',
        target_role: 'Senior Software Engineer',
        experience_level: 'Senior',
      };

      const updatedProfile: UserProfile = {
        ...mockUserProfile,
        ...updateRequest,
        updated_at: '2024-01-20T00:00:00Z',
      };

      vi.mocked(apiService.put).mockResolvedValue({ data: updatedProfile });

      const result = await userService.updateProfile(updateRequest);

      expect(apiService.put).toHaveBeenCalledWith('/users/me', updateRequest);
      expect(result).toEqual(updatedProfile);
      expect(result.name).toBe('Updated Name');
      expect(result.target_role).toBe('Senior Software Engineer');
      expect(result.experience_level).toBe('Senior');
    });

    it('should update profile with only name', async () => {
      const updateRequest: UpdateProfileRequest = {
        name: 'New Name',
      };

      const updatedProfile: UserProfile = {
        ...mockUserProfile,
        name: 'New Name',
        updated_at: '2024-01-20T00:00:00Z',
      };

      vi.mocked(apiService.put).mockResolvedValue({ data: updatedProfile });

      const result = await userService.updateProfile(updateRequest);

      expect(apiService.put).toHaveBeenCalledWith('/users/me', updateRequest);
      expect(result.name).toBe('New Name');
    });

    it('should update profile with only target_role', async () => {
      const updateRequest: UpdateProfileRequest = {
        target_role: 'Product Manager',
      };

      const updatedProfile: UserProfile = {
        ...mockUserProfile,
        target_role: 'Product Manager',
        updated_at: '2024-01-20T00:00:00Z',
      };

      vi.mocked(apiService.put).mockResolvedValue({ data: updatedProfile });

      const result = await userService.updateProfile(updateRequest);

      expect(apiService.put).toHaveBeenCalledWith('/users/me', updateRequest);
      expect(result.target_role).toBe('Product Manager');
    });

    it('should update profile with only experience_level', async () => {
      const updateRequest: UpdateProfileRequest = {
        experience_level: 'Staff',
      };

      const updatedProfile: UserProfile = {
        ...mockUserProfile,
        experience_level: 'Staff',
        updated_at: '2024-01-20T00:00:00Z',
      };

      vi.mocked(apiService.put).mockResolvedValue({ data: updatedProfile });

      const result = await userService.updateProfile(updateRequest);

      expect(apiService.put).toHaveBeenCalledWith('/users/me', updateRequest);
      expect(result.experience_level).toBe('Staff');
    });

    it('should handle 422 validation error', async () => {
      const updateRequest: UpdateProfileRequest = {
        name: 'A', // Too short
      };

      const error = {
        response: {
          status: 422,
          data: {
            detail: [
              {
                loc: ['body', 'name'],
                msg: 'Name must be at least 2 characters',
                type: 'value_error',
              },
            ],
          },
        },
      };

      vi.mocked(apiService.put).mockRejectedValue(error);

      await expect(userService.updateProfile(updateRequest)).rejects.toEqual(error);
    });

    it('should handle 401 unauthorized error', async () => {
      const updateRequest: UpdateProfileRequest = {
        name: 'New Name',
      };

      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      vi.mocked(apiService.put).mockRejectedValue(error);

      await expect(userService.updateProfile(updateRequest)).rejects.toEqual(error);
    });

    it('should handle 500 server error', async () => {
      const updateRequest: UpdateProfileRequest = {
        name: 'New Name',
      };

      const error = {
        response: {
          status: 500,
          data: { message: 'Server error' },
        },
      };

      vi.mocked(apiService.put).mockRejectedValue(error);

      await expect(userService.updateProfile(updateRequest)).rejects.toEqual(error);
    });

    it('should handle network error', async () => {
      const updateRequest: UpdateProfileRequest = {
        name: 'New Name',
      };

      const networkError = {
        message: 'Network Error',
        code: 'ERR_NETWORK',
      };

      vi.mocked(apiService.put).mockRejectedValue(networkError);

      await expect(userService.updateProfile(updateRequest)).rejects.toEqual(networkError);
    });
  });

  describe('constants', () => {
    it('should have 20 valid roles', () => {
      expect(VALID_ROLES).toHaveLength(20);
    });

    it('should have 5 valid experience levels', () => {
      expect(VALID_EXPERIENCE_LEVELS).toHaveLength(5);
      expect(VALID_EXPERIENCE_LEVELS).toEqual(['Entry', 'Mid', 'Senior', 'Staff', 'Principal']);
    });

    it('should include all expected roles', () => {
      const expectedRoles = [
        'Software Engineer',
        'Product Manager',
        'Data Scientist',
        'Marketing Manager',
        'Finance Analyst',
        'Business Analyst',
        'UX Designer',
        'DevOps Engineer',
        'Data Engineer',
        'Machine Learning Engineer',
        'Frontend Developer',
        'Backend Developer',
        'Full Stack Developer',
        'Mobile Developer',
        'QA Engineer',
        'Security Engineer',
        'Cloud Architect',
        'Technical Writer',
        'Sales Engineer',
        'Customer Success Manager',
      ];

      expectedRoles.forEach((role) => {
        expect(VALID_ROLES).toContain(role);
      });
    });
  });
});
