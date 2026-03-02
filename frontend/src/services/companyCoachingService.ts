/**
 * Company Coaching Service
 * API methods for AI-powered company-specific interview coaching
 * 
 * Requirements: INT-1.3
 */

import apiService from './api.service';
import { logError } from '../utils/errorMessages';

// Company overview section
export interface CompanyOverview {
  culture: string;
  values: string[];
  interview_process: string;
}

// Predicted interview question
export interface PredictedQuestion {
  question: string;
  category: string;
  difficulty: string;
  why_asked: string;
}

// STAR method example
export interface StarExample {
  situation: string;
  task: string;
  action: string;
  result: string;
  relevant_skills: string[];
}

// Complete coaching session response
export interface CoachingSession {
  id: number;
  user_id: number;
  company_name: string;
  target_role: string;
  company_overview: CompanyOverview;
  predicted_questions: PredictedQuestion[];
  star_examples: StarExample[];
  confidence_tips: string[];
  pre_interview_checklist: string[];
  execution_time_ms: number;
  created_at: string;
}

// Request to create coaching session
export interface CreateCoachingSessionRequest {
  company_name: string;
  target_role: string;
}

export const companyCoachingService = {
  /**
   * Create a new coaching session
   * POST /api/v1/company-coaching
   */
  async createSession(
    request: CreateCoachingSessionRequest
  ): Promise<CoachingSession> {
    try {
      const response = await apiService.post<CoachingSession>(
        '/company-coaching',
        request
      );
      return response.data;
    } catch (error) {
      logError(error, 'companyCoachingService.createSession');
      throw error;
    }
  },

  /**
   * Get a specific coaching session
   * GET /api/v1/company-coaching/{session_id}
   */
  async getSession(sessionId: number): Promise<CoachingSession> {
    try {
      const response = await apiService.get<CoachingSession>(
        `/company-coaching/${sessionId}`
      );
      return response.data;
    } catch (error) {
      logError(error, 'companyCoachingService.getSession');
      throw error;
    }
  },

  /**
   * Get user's coaching sessions
   * GET /api/v1/company-coaching
   */
  async getUserSessions(limit?: number): Promise<CoachingSession[]> {
    try {
      const params = limit ? { limit } : {};
      const response = await apiService.get<CoachingSession[]>(
        '/company-coaching',
        { params }
      );
      return response.data;
    } catch (error) {
      logError(error, 'companyCoachingService.getUserSessions');
      throw error;
    }
  },

  /**
   * Get coaching sessions by company name
   * GET /api/v1/company-coaching/company/{company_name}
   */
  async getSessionsByCompany(companyName: string): Promise<CoachingSession[]> {
    try {
      const response = await apiService.get<CoachingSession[]>(
        `/company-coaching/company/${companyName}`
      );
      return response.data;
    } catch (error) {
      logError(error, 'companyCoachingService.getSessionsByCompany');
      throw error;
    }
  },
};

export default companyCoachingService;
