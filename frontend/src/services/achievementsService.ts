/**
 * Achievements Service
 * API calls for achievements and gamification features
 */

import apiService from './api.service';
import { logError } from '../utils/errorMessages';

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  requirement_type: string;
  requirement_value: number;
  is_hidden: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: number;
  unlocked_at: string;
  progress: number;
  achievement: Achievement;
}

export interface AllAchievementsResponse {
  achievements: Achievement[];
  total: number;
}

export interface UserAchievementsResponse {
  achievements: UserAchievement[];
  total_unlocked: number;
  total_points: number;
  completion_percentage: number;
}

/**
 * Get all available achievements
 */
export async function getAllAchievements(): Promise<AllAchievementsResponse> {
  try {
    const response = await apiService.get('/achievements/');
    return response.data;
  } catch (error) {
    logError(error, 'achievementsService.getAllAchievements');
    throw error;
  }
}

/**
 * Get user's achievements
 */
export async function getUserAchievements(): Promise<UserAchievementsResponse> {
  try {
    const response = await apiService.get('/achievements/user');
    return response.data;
  } catch (error) {
    logError(error, 'achievementsService.getUserAchievements');
    throw error;
  }
}
