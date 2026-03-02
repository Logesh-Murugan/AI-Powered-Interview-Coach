/**
 * Leaderboard Service
 * API calls for leaderboard and rankings
 */

import apiService from './api.service';
import { logError } from '../utils/errorMessages';

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  score: number;
  sessions_completed: number;
  average_score: number;
  is_current_user: boolean;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  current_user_rank: number | null;
  total_participants: number;
  period: string;
}

export interface LeaderboardPreferenceResponse {
  opted_out: boolean;
}

/**
 * Get leaderboard for specified period
 */
export async function getLeaderboard(period: 'weekly' | 'all_time' = 'weekly'): Promise<LeaderboardResponse> {
  try {
    const response = await apiService.get(`/leaderboard?period=${period}`);
    return response.data;
  } catch (error) {
    logError(error, 'leaderboardService.getLeaderboard');
    throw error;
  }
}

/**
 * Get user's leaderboard preference
 */
export async function getLeaderboardPreference(): Promise<LeaderboardPreferenceResponse> {
  try {
    const response = await apiService.get('/leaderboard/preference');
    return response.data;
  } catch (error) {
    logError(error, 'leaderboardService.getLeaderboardPreference');
    throw error;
  }
}

/**
 * Update user's leaderboard preference
 */
export async function updateLeaderboardPreference(optedOut: boolean): Promise<LeaderboardPreferenceResponse> {
  try {
    const response = await apiService.put('/leaderboard/preference', {
      opted_out: optedOut,
    });
    return response.data;
  } catch (error) {
    logError(error, 'leaderboardService.updateLeaderboardPreference');
    throw error;
  }
}
