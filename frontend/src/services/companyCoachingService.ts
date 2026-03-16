/**
 * Company Coaching Service
 * API methods for AI-powered company-specific interview coaching
 * 
 * Requirements: INT-1.3
 */

import apiService from './api.service';
import { logError } from '../utils/errorMessages';

export interface CompanyOverview {
  culture: string;
  values: string[];
  interview_process: string;
}

export interface PredictedQuestion {
  question: string;
  category: string;
  difficulty: string;
  why_asked: string;
}

export interface StarExample {
  situation: string;
  task: string;
  action: string;
  result: string;
  relevant_skills: string[];
}

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

export interface CreateCoachingSessionRequest {
  company_name: string;
  target_role: string;
}

interface BackendCoachingSession {
  id: number;
  user_id: number;
  company_name: string;
  target_role: string;
  company_overview: string;  // This is a STRING from the API
  interview_process: string[];
  predicted_questions: string[];  // These are just strings, not objects
  pre_interview_checklist: string[];
  execution_time_ms: number;
  created_at: string;
}

interface BackendCoachingSessionList {
  sessions: Array<{
    id: number;
    company_name: string;
    target_role: string;
    created_at: string;
    question_count: number;
    star_example_count: number;
  }>;
  total: number;
  limit: number;
}

function normalizeSessionCollection(
  data: BackendCoachingSession[] | BackendCoachingSessionList | CoachingSession[]
): CoachingSession[] {
  if (Array.isArray(data)) {
    return data.map((session) => normalizeCoachingSession(session as BackendCoachingSession));
  }

  return Array.isArray(data.sessions) ? data.sessions.map(normalizeSummarySession) : [];
}

function normalizeCoachingSession(session: BackendCoachingSession): CoachingSession {
  return {
    id: session.id,
    user_id: session.user_id,
    company_name: session.company_name,
    target_role: session.target_role,
    company_overview: {
      culture: session.company_overview || 'No culture information available',
      values: [], // Backend doesn't provide values array in current schema
      interview_process: Array.isArray(session.interview_process) 
        ? session.interview_process.join('. ') 
        : 'No interview process information available',
    },
    predicted_questions: (session.predicted_questions || []).map((question: string) => ({
      question: question,
      category: 'General', // Default category since backend doesn't provide this
      difficulty: 'medium', // Default difficulty
      why_asked: 'This question helps assess your qualifications and fit for the role', // Default explanation
    })),
    star_examples: [], // Backend doesn't provide STAR examples in current schema
    confidence_tips: [], // Backend doesn't provide confidence tips in current schema  
    pre_interview_checklist: session.pre_interview_checklist || [],
    execution_time_ms: session.execution_time_ms,
    created_at: session.created_at,
  };
}

function normalizeSummarySession(session: BackendCoachingSessionList['sessions'][number]): CoachingSession {
  return {
    id: session.id,
    user_id: 0,
    company_name: session.company_name,
    target_role: session.target_role,
    company_overview: { culture: '', values: [], interview_process: '' },
    predicted_questions: [],
    star_examples: [],
    confidence_tips: [],
    pre_interview_checklist: [],
    execution_time_ms: 0,
    created_at: session.created_at,
  };
}

export const companyCoachingService = {
  async createSession(
    request: CreateCoachingSessionRequest
  ): Promise<CoachingSession> {
    try {
      const response = await apiService.post<BackendCoachingSession>(
        '/company-coaching',
        request
      );
      return normalizeCoachingSession(response.data);
    } catch (error) {
      logError(error, 'companyCoachingService.createSession');
      throw error;
    }
  },

  async getSession(sessionId: number): Promise<CoachingSession> {
    try {
      const response = await apiService.get<BackendCoachingSession>(
        `/company-coaching/${sessionId}`
      );
      return normalizeCoachingSession(response.data);
    } catch (error) {
      logError(error, 'companyCoachingService.getSession');
      throw error;
    }
  },

  async getUserSessions(limit?: number): Promise<CoachingSession[]> {
    try {
      const params = limit ? { limit } : {};
      const response = await apiService.get<BackendCoachingSessionList | BackendCoachingSession[]>(
        '/company-coaching',
        { params }
      );
      return normalizeSessionCollection(response.data);
    } catch (error) {
      logError(error, 'companyCoachingService.getUserSessions');
      throw error;
    }
  },

  async getSessionsByCompany(companyName: string): Promise<CoachingSession[]> {
    try {
      const response = await apiService.get<BackendCoachingSessionList | BackendCoachingSession[]>(
        `/company-coaching/company/${companyName}`
      );
      return normalizeSessionCollection(response.data);
    } catch (error) {
      logError(error, 'companyCoachingService.getSessionsByCompany');
      throw error;
    }
  },
};

export default companyCoachingService;
