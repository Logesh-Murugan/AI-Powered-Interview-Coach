/**
 * Interview Service
 * API service for interview session operations
 */

import api from './api.service';

export interface InterviewSession {
  id: number;
  role: string;
  difficulty: string;
  status: string;
  question_count: number;
  categories?: string[];
  start_time: string;
  end_time?: string;
  created_at: string;
}

export interface InterviewSessionCreate {
  role: string;
  difficulty: string;
  question_count: number;
  categories?: string[];
}

export interface InterviewSessionResponse {
  session_id: number;
  role: string;
  difficulty: string;
  status: string;
  question_count: number;
  categories?: string[];
  start_time: string;
  first_question: {
    id: number;
    question_text: string;
    category: string;
    difficulty: string;
    time_limit_seconds: number;
    question_number: number;
  };
}

export interface SessionSummary {
  session_id: number;
  role: string;
  difficulty: string;
  status: string;
  start_time: string;
  end_time?: string;
  overall_score: number;
  scores: {
    content_quality: number;
    clarity: number;
    confidence: number;
    technical_accuracy: number;
  };
  performance_trend: string;
  category_performance: Array<{
    category: string;
    average_score: number;
    question_count: number;
  }>;
  feedback_summary: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  };
}

/**
 * Create a new interview session
 */
export const createInterviewSession = async (
  data: InterviewSessionCreate
): Promise<InterviewSessionResponse> => {
  const response = await api.post<InterviewSessionResponse>('/interviews', data);
  return response.data;
};

/**
 * Get all interview sessions for the current user
 */
export const getInterviewSessions = async (): Promise<InterviewSession[]> => {
  // Note: This endpoint doesn't exist yet in backend, but we'll use it
  // For now, return empty array
  try {
    const response = await api.get<InterviewSession[]>('/interviews');
    return response.data;
  } catch (error) {
    console.warn('Interview sessions endpoint not available yet');
    return [];
  }
};

/**
 * Get session summary
 */
export const getSessionSummary = async (sessionId: number): Promise<SessionSummary> => {
  const response = await api.get<SessionSummary>(`/interviews/${sessionId}/summary`);
  return response.data;
};

/**
 * Get question for session
 */
export const getQuestion = async (sessionId: number, questionNumber: number) => {
  const response = await api.get(`/interviews/${sessionId}/questions/${questionNumber}`);
  return response.data;
};

/**
 * Submit answer
 */
export const submitAnswer = async (
  sessionId: number,
  questionId: number,
  answerText: string
) => {
  const response = await api.post(
    `/interviews/${sessionId}/answers?question_id=${questionId}`,
    { answer_text: answerText }
  );
  return response.data;
};

/**
 * Save answer draft
 */
export const saveAnswerDraft = async (
  sessionId: number,
  questionId: number,
  draftText: string
) => {
  const response = await api.post(
    `/interviews/${sessionId}/drafts?question_id=${questionId}`,
    { draft_text: draftText }
  );
  return response.data;
};

/**
 * Get answer draft
 */
export const getAnswerDraft = async (sessionId: number, questionId: number) => {
  const response = await api.get(`/interviews/${sessionId}/drafts/${questionId}`);
  return response.data;
};

export default {
  createInterviewSession,
  getInterviewSessions,
  getSessionSummary,
  getQuestion,
  submitAnswer,
  saveAnswerDraft,
  getAnswerDraft,
};
