/**
 * Leaderboard Service
 * API calls for leaderboard and rankings
 */

import apiService from './api.service';
import { logError } from '../utils/errorMessages';

export interface LeaderboardEntry {
  rank: number;
  username: string;
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

interface BackendLeaderboardEntry {
  rank: number;
  anonymous_username: string;
  average_score: number;
  total_interviews: number;
}

interface BackendLeaderboardResponse {
  period: string;
  entries: BackendLeaderboardEntry[];
  total_entries: number;
}

interface BackendLeaderboardPreferenceResponse {
  leaderboard_opt_out: boolean;
}

/**
 * Get leaderboard for specified period
 */
export async function getLeaderboard(period: 'weekly' | 'all_time' = 'weekly'): Promise<LeaderboardResponse> {
  try {
    const response = await apiService.get<BackendLeaderboardResponse>(`/leaderboard?period=${period}`);
    const data = response.data;
    return {
      period: data.period,
      leaderboard: data.entries.map((entry) => ({
        rank: entry.rank,
        username: entry.anonymous_username,
        sessions_completed: entry.total_interviews,
        average_score: entry.average_score,
        is_current_user: false,
      })),
      current_user_rank: null,
      total_participants: data.total_entries,
    };
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
    const response = await apiService.get<BackendLeaderboardPreferenceResponse>('/leaderboard/preference');
    return { opted_out: response.data.leaderboard_opt_out };
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
    const response = await apiService.put<BackendLeaderboardPreferenceResponse>('/leaderboard/preference', {
      opt_out: optedOut,
    });
    return { opted_out: response.data.leaderboard_opt_out };
  } catch (error) {
    logError(error, 'leaderboardService.updateLeaderboardPreference');
    throw error;
  }
}
