import apiService from './api.service';
import { logError } from '../utils/errorMessages';

export interface ScoreOverTime {
  week: string;
  avg_score: number;
  cohort_avg_score?: number;
  session_count: number;
}

export interface SessionScore {
  session_id: number;
  date: string;
  score: number;
}



export interface CategoryPerformance {
  category: string;
  avg_score: number;
  question_count: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface PracticeRecommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
  current_score: number;
  target_score: number;
}

export interface AnalyticsOverview {
  total_interviews_completed: number;
  average_score_all_time: number | null;
  average_score_last_30_days: number | null;
  improvement_rate: number | null;
  total_practice_hours: number;
  score_over_time: ScoreOverTime[];
  recent_session_scores: SessionScore[];
  category_performance: CategoryPerformance[];

  top_5_strengths: string[];
  top_5_weaknesses: string[];
  practice_recommendations: PracticeRecommendation[];
  last_session_date: string | null;
  cache_hit: boolean;
  calculated_at: string;
}

export interface CohortStats {
  target_role: string;
  total_users: number;
  cohort_average_score: number;
  cohort_median_score: number;
  score_distribution: {
    '0-60': number;
    '60-70': number;
    '70-80': number;
    '80-90': number;
    '90-100': number;
  };
}

export interface TopPerformerHabits {
  avg_sessions_per_week: number;
  avg_practice_hours: number;
  avg_questions_per_session: number;
  most_practiced_categories: string[];
  consistency_score: number;
}

export interface PerformanceComparison {
  user_average_score: number;
  user_percentile: number;
  user_rank_description: string;
  cohort_stats: CohortStats;
  score_difference: number;
  performance_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  top_performer_habits: TopPerformerHabits;
  improvement_suggestions: string[];
  comparison_date: string;
  cache_hit: boolean;
}

class AnalyticsService {
  /**
   * Get analytics overview for current user
   */
  async getAnalyticsOverview(forceRefresh = false): Promise<AnalyticsOverview> {
    try {
      const response = await apiService.get<AnalyticsOverview>(
        `/analytics/overview${forceRefresh ? '?force_refresh=true' : ''}`
      );
      return response.data;
    } catch (error) {
      logError(error, 'analyticsService.getAnalyticsOverview');
      throw error;
    }
  }

  /**
   * Get performance comparison for current user
   */
  async getPerformanceComparison(forceRefresh = false): Promise<PerformanceComparison> {
    try {
      const response = await apiService.get<PerformanceComparison>(
        `/analytics/comparison${forceRefresh ? '?force_refresh=true' : ''}`
      );
      return response.data;
    } catch (error) {
      logError(error, 'analyticsService.getPerformanceComparison');
      throw error;
    }
  }

  /**
   * Get all interview sessions
   */
  async getInterviewSessions(): Promise<any[]> {
    try {
      const response = await apiService.get<any[]>('/interviews');
      return response.data;
    } catch (error) {
      logError(error, 'analyticsService.getInterviewSessions');
      throw error;
    }
  }

  /**
   * Get skill statistics
   */
  async getSkills(): Promise<any> {
    try {
      const response = await apiService.get<any>('/analytics/skills');
      return response.data;
    } catch (error) {
      logError(error, 'analyticsService.getSkills');
      throw error;
    }
  }
}

export default new AnalyticsService();
