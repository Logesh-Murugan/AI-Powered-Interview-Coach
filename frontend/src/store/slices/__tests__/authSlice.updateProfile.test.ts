/**
 * Unit Tests for Auth Slice - Update Profile Functionality
 * Tests the updateProfile thunk and state updates
 * 
 * Requirements: INT-2.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { updateProfile, clearError } from '../authSlice';
import type { UserProfile, UpdateProfileRequest } from '../../../services/userService';

// Mock the service
vi.mock('../../../services/userService', () => {
  const mockFn = vi.fn();
  return {
    default: {
      updateProfile: mockFn,
    },
    userService: {
      updateProfile: mockFn,
    },
    VALID_ROLES: [
      'Software Engineer',
      'Product Manager',
      'Data Scientist',
    ],
    VALID_EXPERIENCE_LEVELS: ['Entry', 'Mid', 'Senior', 'Staff', 'Principal'],
  };
});

// Import the mocked service to get access to the mock function
import userService from '../../../services/userService';
const mockUpdateProfile = userService.updateProfile as ReturnType<typeof vi.fn>;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Helper to create a test store
const createTestStore = (initialState?: any) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: initialState,
  });
};

// Mock data
const mockUser: UserProfile = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  target_role: 'Software Engineer',
  experience_level: 'Mid',
  account_status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

const initialAuthState = {
  user: mockUser,
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  isAuthenticated: true,
  isLoading: false,
  error: null,
};

describe('authSlice - updateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('updateProfile thunk', () => {
    it('should set isLoading to true on pending', async () => {
      const store = createTestStore({ auth: initialAuthState });

      mockUpdateProfile.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      store.dispatch(updateProfile({ name: 'New Name' }));

      // Wait for pending state
      await new Promise((resolve) => setTimeout(resolve, 0));

      const state = store.getState().auth;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update user state on fulfilled', async () => {
      const store = createTestStore({ auth: initialAuthState });

      const updateRequest: UpdateProfileRequest = {
        name: 'Updated Name',
        target_role: 'Product Manager',
        experience_level: 'Senior',
      };

      const updatedUser: UserProfile = {
        ...mockUser,
        ...updateRequest,
        updated_at: '2024-01-20T00:00:00Z',
      };

      mockUpdateProfile.mockResolvedValue(updatedUser);

      await store.dispatch(updateProfile(updateRequest));

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(updatedUser);
      expect(state.user?.name).toBe('Updated Name');
      expect(state.user?.target_role).toBe('Product Manager');
      expect(state.user?.experience_level).toBe('Senior');
      expect(state.error).toBe(null);
    });

    it('should update localStorage on fulfilled', async () => {
      const store = createTestStore({ auth: initialAuthState });

      const updatedUser: UserProfile = {
        ...mockUser,
        name: 'Updated Name',
        updated_at: '2024-01-20T00:00:00Z',
      };

      mockUpdateProfile.mockResolvedValue(updatedUser);

      await store.dispatch(updateProfile({ name: 'Updated Name' }));

      const storedUser = JSON.parse(localStorageMock.getItem('user') || '{}');
      expect(storedUser).toEqual(updatedUser);
    });

    it('should handle error on rejected', async () => {
      const store = createTestStore({ auth: initialAuthState });
      const errorMessage = 'Failed to update profile';

      mockUpdateProfile.mockRejectedValue(new Error(errorMessage));

      await store.dispatch(updateProfile({ name: 'New Name' }));

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.user).toEqual(mockUser); // User should remain unchanged
    });

    it('should handle non-Error rejection', async () => {
      const store = createTestStore({ auth: initialAuthState });

      mockUpdateProfile.mockRejectedValue('String error');

      await store.dispatch(updateProfile({ name: 'New Name' }));

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Profile update failed');
    });

    it('should clear previous error on new request', async () => {
      const store = createTestStore({
        auth: {
          ...initialAuthState,
          error: 'Previous error',
        },
      });

      mockUpdateProfile.mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(updateProfile({ name: 'New Name' }));

      await new Promise((resolve) => setTimeout(resolve, 0));

      const state = store.getState().auth;
      expect(state.error).toBe(null);
      expect(state.isLoading).toBe(true);
    });

    it('should update only name field', async () => {
      const store = createTestStore({ auth: initialAuthState });

      const updatedUser: UserProfile = {
        ...mockUser,
        name: 'Only Name Changed',
        updated_at: '2024-01-20T00:00:00Z',
      };

      mockUpdateProfile.mockResolvedValue(updatedUser);

      await store.dispatch(updateProfile({ name: 'Only Name Changed' }));

      const state = store.getState().auth;
      expect(state.user?.name).toBe('Only Name Changed');
      expect(state.user?.target_role).toBe(mockUser.target_role);
      expect(state.user?.experience_level).toBe(mockUser.experience_level);
    });

    it('should update only target_role field', async () => {
      const store = createTestStore({ auth: initialAuthState });

      const updatedUser: UserProfile = {
        ...mockUser,
        target_role: 'Data Scientist',
        updated_at: '2024-01-20T00:00:00Z',
      };

      mockUpdateProfile.mockResolvedValue(updatedUser);

      await store.dispatch(updateProfile({ target_role: 'Data Scientist' }));

      const state = store.getState().auth;
      expect(state.user?.target_role).toBe('Data Scientist');
      expect(state.user?.name).toBe(mockUser.name);
    });

    it('should update only experience_level field', async () => {
      const store = createTestStore({ auth: initialAuthState });

      const updatedUser: UserProfile = {
        ...mockUser,
        experience_level: 'Staff',
        updated_at: '2024-01-20T00:00:00Z',
      };

      mockUpdateProfile.mockResolvedValue(updatedUser);

      await store.dispatch(updateProfile({ experience_level: 'Staff' }));

      const state = store.getState().auth;
      expect(state.user?.experience_level).toBe('Staff');
      expect(state.user?.name).toBe(mockUser.name);
    });

    it('should handle validation error (422)', async () => {
      const store = createTestStore({ auth: initialAuthState });

      const validationError = new Error('Name must be at least 2 characters');
      mockUpdateProfile.mockRejectedValue(validationError);

      await store.dispatch(updateProfile({ name: 'A' }));

      const state = store.getState().auth;
      expect(state.error).toBe('Name must be at least 2 characters');
      expect(state.user).toEqual(mockUser);
    });

    it('should not update localStorage on error', async () => {
      const store = createTestStore({ auth: initialAuthState });

      // Set initial localStorage
      localStorageMock.setItem('user', JSON.stringify(mockUser));

      mockUpdateProfile.mockRejectedValue(
        new Error('Update failed')
      );

      await store.dispatch(updateProfile({ name: 'New Name' }));

      const storedUser = JSON.parse(localStorageMock.getItem('user') || '{}');
      expect(storedUser).toEqual(mockUser); // Should remain unchanged
    });

    it('should preserve authentication tokens during update', async () => {
      const store = createTestStore({ auth: initialAuthState });

      const updatedUser: UserProfile = {
        ...mockUser,
        name: 'Updated Name',
        updated_at: '2024-01-20T00:00:00Z',
      };

      mockUpdateProfile.mockResolvedValue(updatedUser);

      await store.dispatch(updateProfile({ name: 'Updated Name' }));

      const state = store.getState().auth;
      expect(state.accessToken).toBe('test-access-token');
      expect(state.refreshToken).toBe('test-refresh-token');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle rapid successive updates', async () => {
      const store = createTestStore({ auth: initialAuthState });

      const updatedUser1: UserProfile = {
        ...mockUser,
        name: 'First Update',
        updated_at: '2024-01-20T00:00:00Z',
      };

      const updatedUser2: UserProfile = {
        ...mockUser,
        name: 'Second Update',
        updated_at: '2024-01-20T00:00:01Z',
      };

      mockUpdateProfile
        .mockResolvedValueOnce(updatedUser1)
        .mockResolvedValueOnce(updatedUser2);

      await store.dispatch(updateProfile({ name: 'First Update' }));
      await store.dispatch(updateProfile({ name: 'Second Update' }));

      const state = store.getState().auth;
      expect(state.user?.name).toBe('Second Update');
    });
  });

  describe('clearError reducer', () => {
    it('should clear update profile error', async () => {
      const store = createTestStore({ auth: initialAuthState });

      // Create an error
      mockUpdateProfile.mockRejectedValue(
        new Error('Update failed')
      );
      await store.dispatch(updateProfile({ name: 'New Name' }));

      expect(store.getState().auth.error).toBe('Update failed');

      // Clear error
      store.dispatch(clearError());

      const state = store.getState().auth;
      expect(state.error).toBe(null);
    });

    it('should not affect user data when clearing error', async () => {
      const store = createTestStore({ auth: initialAuthState });

      // Create an error
      mockUpdateProfile.mockRejectedValue(
        new Error('Update failed')
      );
      await store.dispatch(updateProfile({ name: 'New Name' }));

      // Clear error
      store.dispatch(clearError());

      const state = store.getState().auth;
      expect(state.error).toBe(null);
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('state transitions', () => {
    it('should handle loading state transitions correctly', async () => {
      const store = createTestStore({ auth: initialAuthState });

      mockUpdateProfile.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ...mockUser, name: 'Updated' }), 100)
          )
      );

      // Start update
      const promise = store.dispatch(updateProfile({ name: 'Updated' }));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(store.getState().auth.isLoading).toBe(true);

      // Complete update
      await promise;
      expect(store.getState().auth.isLoading).toBe(false);
    });

    it('should maintain isAuthenticated during update', async () => {
      const store = createTestStore({ auth: initialAuthState });

      mockUpdateProfile.mockResolvedValue({
        ...mockUser,
        name: 'Updated',
      });

      await store.dispatch(updateProfile({ name: 'Updated' }));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty update request', async () => {
      const store = createTestStore({ auth: initialAuthState });

      mockUpdateProfile.mockResolvedValue(mockUser);

      await store.dispatch(updateProfile({}));

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
    });

    it('should handle update when user is null', async () => {
      const store = createTestStore({
        auth: {
          ...initialAuthState,
          user: null,
        },
      });

      const updatedUser: UserProfile = {
        ...mockUser,
        name: 'New User',
      };

      mockUpdateProfile.mockResolvedValue(updatedUser);

      await store.dispatch(updateProfile({ name: 'New User' }));

      const state = store.getState().auth;
      expect(state.user).toEqual(updatedUser);
    });

    it('should handle network timeout', async () => {
      const store = createTestStore({ auth: initialAuthState });

      mockUpdateProfile.mockRejectedValue(
        new Error('Network timeout')
      );

      await store.dispatch(updateProfile({ name: 'New Name' }));

      const state = store.getState().auth;
      expect(state.error).toBe('Network timeout');
      expect(state.isLoading).toBe(false);
    });
  });
});
