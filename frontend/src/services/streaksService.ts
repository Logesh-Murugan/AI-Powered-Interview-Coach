/**
 * Streaks Service
 * API calls for daily practice streaks
 */

import apiService from './api.service';
import { logError } from '../utils/errorMessages';

export interface CurrentStreakResponse {
  current_streak: number;
  longest_streak: number;
  last_practice_date: string | null;
  streak_active: boolean;
}

export interface StreakHistoryResponse {
  history: Array<{
    date: string;
    practiced: boolean;
  }>;
  current_streak: number;
  longest_streak: number;
}

export interface StreakStatsResponse {
  current_streak: number;
  longest_streak: number;
  total_practice_days: number;
  streak_history: Record<string, number>;
  last_practice_date: string | null;
}

/**
 * Get current streak information
 */
export async function getCurrentStreak(): Promise<CurrentStreakResponse> {
  try {
    const response = await apiService.get('/streaks/current');
    return response.data;
  } catch (error) {
    logError(error, 'streaksService.getCurrentStreak');
    throw error;
  }
}

/**
 * Get streak history for specified number of days
 */
export async function getStreakHistory(days: number = 30): Promise<StreakHistoryResponse> {
  try {
    const response = await apiService.get(`/streaks/history?days=${days}`);
    return response.data;
  } catch (error) {
    logError(error, 'streaksService.getStreakHistory');
    throw error;
  }
}

/**
 * Get detailed streak statistics
 */
export async function getStreakStats(): Promise<StreakStatsResponse> {
  try {
    const response = await apiService.get('/streaks/stats');
    return response.data;
  } catch (error) {
    logError(error, 'streaksService.getStreakStats');
    throw error;
  }
}
