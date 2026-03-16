/**
 * Interview Service
 * API service for interview session operations
 */

import api from './api.service';
import { logError } from '../utils/errorMessages';

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
  answered_count?: number;
  overall_score?: number;
  overall_session_score?: number;
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
  id: number;
  session_id: number;
  overall_session_score: number;
  overall_score: number;
  avg_content_quality: number;
  avg_clarity: number;
  avg_confidence: number;
  avg_technical_accuracy: number;
  score_trend: number | null;
  previous_session_score: number | null;
  top_strengths: string[];
  top_improvements: string[];
  category_performance: Record<string, number>;
  scores: {
    content_quality: number;
    clarity: number;
    confidence: number;
    technical_accuracy: number;
  };
  performance_trend: string;
  feedback_summary: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  };
  total_questions: number;
  total_time_seconds: number;
  generated_at?: string;
  created_at?: string;
}

const normalizeSession = (session: any): InterviewSession => {
  const normalizedScore = session.overall_score ?? session.overall_session_score;

  return {
    id: session.id,
    role: session.role,
    difficulty: session.difficulty,
    status: session.status,
    question_count: session.question_count,
    categories: session.categories ?? [],
    start_time: session.start_time,
    end_time: session.end_time,
    created_at: session.created_at,
    answered_count: session.answered_count,
    overall_score: normalizedScore,
    overall_session_score: normalizedScore,
  };
};

const normalizeSummary = (summary: any): SessionSummary => {
  const overallScore = summary.overall_session_score ?? summary.overall_score ?? 0;
  const scoreTrend = summary.score_trend ?? null;

  return {
    ...summary,
    overall_session_score: overallScore,
    overall_score: overallScore,
    avg_content_quality: summary.avg_content_quality ?? summary.scores?.content_quality ?? 0,
    avg_clarity: summary.avg_clarity ?? summary.scores?.clarity ?? 0,
    avg_confidence: summary.avg_confidence ?? summary.scores?.confidence ?? 0,
    avg_technical_accuracy: summary.avg_technical_accuracy ?? summary.scores?.technical_accuracy ?? 0,
    score_trend: scoreTrend,
    previous_session_score: summary.previous_session_score ?? null,
    top_strengths: summary.top_strengths ?? summary.feedback_summary?.strengths ?? [],
    top_improvements: summary.top_improvements ?? summary.feedback_summary?.improvements ?? [],
    category_performance: summary.category_performance ?? {},
    scores: {
      content_quality: summary.avg_content_quality ?? summary.scores?.content_quality ?? 0,
      clarity: summary.avg_clarity ?? summary.scores?.clarity ?? 0,
      confidence: summary.avg_confidence ?? summary.scores?.confidence ?? 0,
      technical_accuracy: summary.avg_technical_accuracy ?? summary.scores?.technical_accuracy ?? 0,
    },
    performance_trend:
      typeof summary.performance_trend === 'string'
        ? summary.performance_trend
        : scoreTrend === null
          ? 'no_previous_session'
          : scoreTrend > 0
            ? 'improving'
            : scoreTrend < 0
              ? 'declining'
              : 'stable',
    feedback_summary: {
      strengths: summary.top_strengths ?? summary.feedback_summary?.strengths ?? [],
      improvements: summary.top_improvements ?? summary.feedback_summary?.improvements ?? [],
      suggestions: summary.feedback_summary?.suggestions ?? summary.top_improvements ?? [],
    },
    total_questions: summary.total_questions ?? 0,
    total_time_seconds: summary.total_time_seconds ?? 0,
    generated_at: summary.generated_at,
    created_at: summary.created_at,
  };
};

export const createInterviewSession = async (
  data: InterviewSessionCreate
): Promise<InterviewSessionResponse> => {
  try {
    const response = await api.post<InterviewSessionResponse>('/interviews', data);
    return response.data;
  } catch (error) {
    logError(error, 'interviewService.createInterviewSession');
    throw error;
  }
};

export const getInterviewSessions = async (): Promise<InterviewSession[]> => {
  try {
    const response = await api.get<any[]>('/interviews');
    return response.data.map(normalizeSession);
  } catch (error) {
    logError(error, 'interviewService.getInterviewSessions');
    throw error;
  }
};

export const getSessionSummary = async (sessionId: number): Promise<SessionSummary> => {
  try {
    const response = await api.get(`/interviews/${sessionId}/summary`);
    return normalizeSummary(response.data);
  } catch (error) {
    logError(error, 'interviewService.getSessionSummary');
    throw error;
  }
};

export const getQuestion = async (sessionId: number, questionNumber: number) => {
  try {
    const response = await api.get(`/interviews/${sessionId}/questions/${questionNumber}`);
    return response.data;
  } catch (error) {
    logError(error, 'interviewService.getQuestion');
    throw error;
  }
};

export const submitAnswer = async (
  sessionId: number,
  questionId: number,
  answerText: string
) => {
  try {
    const response = await api.post(
      `/interviews/${sessionId}/answers?question_id=${questionId}`,
      { answer_text: answerText }
    );
    return response.data;
  } catch (error) {
    logError(error, 'interviewService.submitAnswer');
    throw error;
  }
};

export const saveAnswerDraft = async (
  sessionId: number,
  questionId: number,
  draftText: string
) => {
  try {
    const response = await api.post(
      `/interviews/${sessionId}/drafts?question_id=${questionId}`,
      { draft_text: draftText }
    );
    return response.data;
  } catch (error) {
    logError(error, 'interviewService.saveAnswerDraft');
    throw error;
  }
};

export const getAnswerDraft = async (sessionId: number, questionId: number) => {
  try {
    const response = await api.get(`/interviews/${sessionId}/drafts/${questionId}`);
    return response.data;
  } catch (error) {
    logError(error, 'interviewService.getAnswerDraft');
    throw error;
  }
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
