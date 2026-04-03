/**
 * Study Plan Service
 * API methods for AI-powered study plan generation
 * 
 * Requirements: INT-1.2
 */

import apiService from './api.service';
import { logError } from '../utils/errorMessages';
import { API_ENDPOINTS } from '../config/api.config';

// Daily task within a study plan
export interface DailyTask {
  skill: string;
  activity: string;
  duration_minutes: number;
  resources: string[];
  completed: boolean;
}

// Tasks for a single day
export interface DayTasks {
  day: number;
  date: string;
  tasks: DailyTask[];
}

// Weekly milestone
export interface WeeklyMilestone {
  week: number;
  milestone: string;
  skills_covered: string[];
  assessment: string;
  completed: boolean;
}

// Time estimates
export interface TimeEstimates {
  total_hours: number;
  hours_per_week: number;
  completion_date: string;
}

// Study plan data structure
export interface StudyPlanData {
  daily_tasks: DayTasks[];
  weekly_milestones: WeeklyMilestone[];
  resource_links: Record<string, string[]>;
  time_estimates: TimeEstimates;
}

// Complete study plan response
export interface StudyPlan {
  id: number;
  user_id: number;
  target_role: string;
  duration_days: number;
  available_hours_per_week: number;
  plan_data: StudyPlanData;
  execution_time_ms: number;
  status: 'active' | 'completed' | 'abandoned';
  progress_percentage: number;
  total_tasks: number;
  completed_tasks: number;
  total_milestones: number;
  completed_milestones: number;
  created_at: string;
  updated_at: string;
}

// Request to create study plan
export interface CreateStudyPlanRequest {
  target_role: string;
  duration_days: number;
  available_hours_per_week: number;
}

// Request to update progress
export interface UpdateProgressRequest {
  task_updates: Record<string, boolean>;
}

export const studyPlanService = {
  /**
   * Create a new study plan
   * POST /api/v1/study-plans
   */
  async createStudyPlan(request: CreateStudyPlanRequest): Promise<StudyPlan> {
    try {
      const response = await apiService.post<StudyPlan>(
        API_ENDPOINTS.STUDY_PLANS.CREATE,
        request
      );
      return response.data;
    } catch (error) {
      logError(error, 'studyPlanService.createStudyPlan');
      throw error;
    }
  },

  /**
   * Get a specific study plan
   * GET /api/v1/study-plans/{plan_id}
   */
  async getStudyPlan(planId: number): Promise<StudyPlan> {
    try {
      const response = await apiService.get<StudyPlan>(
        API_ENDPOINTS.STUDY_PLANS.GET(planId)
      );
      return response.data;
    } catch (error) {
      logError(error, 'studyPlanService.getStudyPlan');
      throw error;
    }
  },

  /**
   * Get the active study plan
   * GET /api/v1/study-plans/active/current
   */
  async getActiveStudyPlan(): Promise<StudyPlan | null> {
    try {
      const response = await apiService.get<StudyPlan>(
        API_ENDPOINTS.STUDY_PLANS.ACTIVE
      );
      return response.data;
    } catch (error: any) {
      // Handle 404 gracefully - no active study plan exists
      if (error?.status === 404 || error?.response?.status === 404) {
        return null;
      }
      logError(error, 'studyPlanService.getActiveStudyPlan');
      throw error;
    }
  },

  /**
   * Update study plan progress
   * PATCH /api/v1/study-plans/{plan_id}/progress
   */
  async updateProgress(
    planId: number,
    request: UpdateProgressRequest
  ): Promise<StudyPlan> {
    try {
      const response = await apiService.patch<StudyPlan>(
        API_ENDPOINTS.STUDY_PLANS.UPDATE_PROGRESS(planId),
        request
      );
      return response.data;
    } catch (error) {
      logError(error, 'studyPlanService.updateProgress');
      throw error;
    }
  },

  /**
   * Abandon a study plan
   * DELETE /api/v1/study-plans/{plan_id}
   */
  async abandonPlan(planId: number): Promise<void> {
    try {
      await apiService.delete(API_ENDPOINTS.STUDY_PLANS.ABANDON(planId));
    } catch (error) {
      logError(error, 'studyPlanService.abandonPlan');
      throw error;
    }
  },
};

export default studyPlanService;
