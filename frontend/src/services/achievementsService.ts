/**
 * Achievements Service
 * API calls for achievements and gamification features
 */

import apiService from './api.service';
import { logError } from '../utils/errorMessages';

export interface AchievementDefinition {
  type: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
}

export interface UserAchievement {
  id: number;
  user_id: number;
  achievement_type: string;
  earned_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AllAchievementsResponse {
  achievements: AchievementDefinition[];
  total_count: number;
}

export interface UserAchievementsResponse {
  achievements: UserAchievement[];
  total_earned: number;
  total_available: number;
  completion_percentage: number;
}

/**
 * Get all available achievements
 */
export async function getAllAchievements(): Promise<AllAchievementsResponse> {
  try {
    const response = await apiService.get<AllAchievementsResponse>('/achievements/');
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
    const response = await apiService.get<UserAchievementsResponse>('/achievements/user');
    return response.data;
  } catch (error) {
    logError(error, 'achievementsService.getUserAchievements');
    throw error;
  }
}

