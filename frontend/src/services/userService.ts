/**
 * User Service
 * API methods for user profile management
 */

import apiService from './api.service';
import { API_ENDPOINTS } from '../config/api.config';
import { logError } from '../utils/errorMessages';

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  target_role?: string;
  experience_level?: 'Entry' | 'Mid' | 'Senior' | 'Staff' | 'Principal';
  account_status: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  name?: string;
  target_role?: string;
  experience_level?: 'Entry' | 'Mid' | 'Senior' | 'Staff' | 'Principal';
}

// Valid roles (20 predefined roles from backend)
export const VALID_ROLES = [
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
] as const;

// Valid experience levels (5 levels from backend)
export const VALID_EXPERIENCE_LEVELS = [
  'Entry',
  'Mid',
  'Senior',
  'Staff',
  'Principal',
] as const;

export const userService = {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await apiService.get<UserProfile>(API_ENDPOINTS.USERS.ME);
      return response.data;
    } catch (error) {
      logError(error, 'userService.getProfile');
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(request: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const response = await apiService.put<UserProfile>(
        API_ENDPOINTS.USERS.UPDATE_PROFILE,
        request
      );
      return response.data;
    } catch (error) {
      logError(error, 'userService.updateProfile');
      throw error;
    }
  },

  /**
   * Get user's leaderboard preference
   */
  async getLeaderboardPreference(): Promise<{ user_id: number; leaderboard_opt_out: boolean }> {
    try {
      const response = await apiService.get<{ user_id: number; leaderboard_opt_out: boolean }>(
        '/leaderboard/preference'
      );
      return response.data;
    } catch (error) {
      logError(error, 'userService.getLeaderboardPreference');
      throw error;
    }
  },

  /**
   * Update user's leaderboard preference
   */
  async updateLeaderboardPreference(optOut: boolean): Promise<{ user_id: number; leaderboard_opt_out: boolean }> {
    try {
      const response = await apiService.put<{ user_id: number; leaderboard_opt_out: boolean }>(
        '/leaderboard/preference',
        { opt_out: optOut }
      );
      return response.data;
    } catch (error) {
      logError(error, 'userService.updateLeaderboardPreference');
      throw error;
    }
  },
};

export default userService;

