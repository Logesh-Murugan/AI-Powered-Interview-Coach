/**
 * Unit Tests for Company Coaching Service
 * Tests API calls, error handling, and request payload formatting
 * 
 * Requirements: INT-1.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { companyCoachingService } from '../companyCoachingService';
import type { CoachingSession, CreateCoachingSessionRequest } from '../companyCoachingService';
import apiService from '../api.service';

// Mock the apiService
vi.mock('../api.service', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('companyCoachingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockCoachingSession: CoachingSession = {
    id: 1,
    user_id: 123,
    company_name: 'TechCorp',
    target_role: 'Senior Software Engineer',
    company_overview: {
      culture: 'Fast-paced, innovative, collaborative',
      values: ['Innovation', 'Teamwork', 'Excellence'],
      interview_process: '3 rounds: technical screen, system design, behavioral',
    },
    predicted_questions: [
      {
        question: 'Describe a time you optimized system performance',
        category: 'Technical',
        difficulty: 'Hard',
        why_asked: 'Tests problem-solving and technical depth',
      },
    ],
    star_examples: [
      {
        situation: 'System was experiencing high latency',
        task: 'Reduce response time by 50%',
        action: 'Implemented caching and database indexing',
        result: 'Reduced latency from 2s to 500ms',
        relevant_skills: ['Performance Optimization', 'Caching'],
      },
    ],
    confidence_tips: [
      'Research the company culture thoroughly',
      'Prepare specific examples from your experience',
    ],
    pre_interview_checklist: [
      'Review company products',
      'Prepare questions for interviewer',
    ],
    execution_time_ms: 3500,
    created_at: '2024-01-15T10:00:00Z',
  };

  describe('createSession', () => {
    const mockRequest: CreateCoachingSessionRequest = {
      company_name: 'TechCorp',
      target_role: 'Senior Software Engineer',
    };

    it('should successfully call POST /company-coaching with correct payload', async () => {
      vi.mocked(apiService.post).mockResolvedValue({ data: mockCoachingSession });

      const result = await companyCoachingService.createSession(mockRequest);

      expect(apiService.post).toHaveBeenCalledWith('/company-coaching', mockRequest);
      expect(result).toEqual(mockCoachingSession);
    });

    it('should handle different company names', async () => {
      const requestWithDifferentCompany: CreateCoachingSessionRequest = {
        company_name: 'Google',
        target_role: 'Software Engineer',
      };

      vi.mocked(apiService.post).mockResolvedValue({ data: mockCoachingSession });

      await companyCoachingService.createSession(requestWithDifferentCompany);

      expect(apiService.post).toHaveBeenCalledWith(
        '/company-coaching',
        requestWithDifferentCompany
      );
    });

    it('should handle different target roles', async () => {
      const requestWithDifferentRole: CreateCoachingSessionRequest = {
        company_name: 'TechCorp',
        target_role: 'Engineering Manager',
      };

      vi.mocked(apiService.post).mockResolvedValue({ data: mockCoachingSession });

      await companyCoachingService.createSession(requestWithDifferentRole);

      expect(apiService.post).toHaveBeenCalledWith(
        '/company-coaching',
        requestWithDifferentRole
      );
    });

    it('should handle 404 error when user not found', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'User not found' },
        },
      };

      vi.mocked(apiService.post).mockRejectedValue(error);

      await expect(
        companyCoachingService.createSession(mockRequest)
      ).rejects.toEqual(error);
    });

    it('should handle 422 validation error', async () => {
      const error = {
        response: {
          status: 422,
          data: { 
            message: 'Validation error',
            details: { company_name: 'Company name is required' }
          },
        },
      };

      vi.mocked(apiService.post).mockRejectedValue(error);

      await expect(
        companyCoachingService.createSession(mockRequest)
      ).rejects.toEqual(error);
    });

    it('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      vi.mocked(apiService.post).mockRejectedValue(error);

      await expect(
        companyCoachingService.createSession(mockRequest)
      ).rejects.toEqual(error);
    });

    it('should handle network error', async () => {
      const networkError = {
        message: 'Network Error',
        code: 'ECONNABORTED',
      };

      vi.mocked(apiService.post).mockRejectedValue(networkError);

      await expect(
        companyCoachingService.createSession(mockRequest)
      ).rejects.toEqual(networkError);
    });

    it('should handle timeout error', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      };

      vi.mocked(apiService.post).mockRejectedValue(timeoutError);

      await expect(
        companyCoachingService.createSession(mockRequest)
      ).rejects.toEqual(timeoutError);
    });
  });

  describe('getSession', () => {
    const mockSessionId = 456;

    it('should successfully call GET /company-coaching/{session_id}', async () => {
      vi.mocked(apiService.get).mockResolvedValue({ data: mockCoachingSession });

      const result = await companyCoachingService.getSession(mockSessionId);

      expect(apiService.get).toHaveBeenCalledWith(`/company-coaching/${mockSessionId}`);
      expect(result).toEqual(mockCoachingSession);
    });

    it('should handle different session IDs', async () => {
      const sessionIds = [1, 100, 9999];

      vi.mocked(apiService.get).mockResolvedValue({ data: mockCoachingSession });

      for (const id of sessionIds) {
        await companyCoachingService.getSession(id);
        expect(apiService.get).toHaveBeenCalledWith(`/company-coaching/${id}`);
      }
    });

    it('should handle 404 error when session not found', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Coaching session not found' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        companyCoachingService.getSession(mockSessionId)
      ).rejects.toEqual(error);
    });

    it('should handle 403 forbidden error', async () => {
      const error = {
        response: {
          status: 403,
          data: { message: 'Access denied to this coaching session' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        companyCoachingService.getSession(mockSessionId)
      ).rejects.toEqual(error);
    });

    it('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Database connection failed' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        companyCoachingService.getSession(mockSessionId)
      ).rejects.toEqual(error);
    });

    it('should handle network error', async () => {
      const networkError = {
        message: 'Network Error',
        code: 'ERR_NETWORK',
      };

      vi.mocked(apiService.get).mockRejectedValue(networkError);

      await expect(
        companyCoachingService.getSession(mockSessionId)
      ).rejects.toEqual(networkError);
    });
  });

  describe('getUserSessions', () => {
    const mockSessions: CoachingSession[] = [
      mockCoachingSession,
      {
        ...mockCoachingSession,
        id: 2,
        company_name: 'StartupXYZ',
        target_role: 'Full Stack Developer',
      },
    ];

    it('should successfully call GET /company-coaching without limit', async () => {
      vi.mocked(apiService.get).mockResolvedValue({ data: mockSessions });

      const result = await companyCoachingService.getUserSessions();

      expect(apiService.get).toHaveBeenCalledWith('/company-coaching', { params: {} });
      expect(result).toEqual(mockSessions);
      expect(result).toHaveLength(2);
    });

    it('should successfully call GET /company-coaching with limit parameter', async () => {
      const limit = 5;
      vi.mocked(apiService.get).mockResolvedValue({ data: mockSessions });

      const result = await companyCoachingService.getUserSessions(limit);

      expect(apiService.get).toHaveBeenCalledWith('/company-coaching', { params: { limit } });
      expect(result).toEqual(mockSessions);
    });

    it('should handle limit parameter of 1', async () => {
      const singleSession = [mockCoachingSession];

      vi.mocked(apiService.get).mockResolvedValue({ data: singleSession });

      const result = await companyCoachingService.getUserSessions(1);

      expect(apiService.get).toHaveBeenCalledWith('/company-coaching', { params: { limit: 1 } });
      expect(result).toHaveLength(1);
    });

    it('should handle empty sessions list', async () => {
      const emptySessions: CoachingSession[] = [];

      vi.mocked(apiService.get).mockResolvedValue({ data: emptySessions });

      const result = await companyCoachingService.getUserSessions();

      expect(result).toHaveLength(0);
    });

    it('should handle 404 error when user not found', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'User not found' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        companyCoachingService.getUserSessions()
      ).rejects.toEqual(error);
    });

    it('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Failed to retrieve sessions' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        companyCoachingService.getUserSessions(10)
      ).rejects.toEqual(error);
    });

    it('should handle network error', async () => {
      const networkError = {
        message: 'Network Error',
        code: 'ERR_NETWORK',
      };

      vi.mocked(apiService.get).mockRejectedValue(networkError);

      await expect(
        companyCoachingService.getUserSessions()
      ).rejects.toEqual(networkError);
    });
  });

  describe('getSessionsByCompany', () => {
    const mockCompanyName = 'TechCorp';
    const mockCompanySessions: CoachingSession[] = [
      mockCoachingSession,
      {
        ...mockCoachingSession,
        id: 3,
        target_role: 'Staff Engineer',
      },
    ];

    it('should successfully call GET /company-coaching/company/{company_name}', async () => {
      vi.mocked(apiService.get).mockResolvedValue({ data: mockCompanySessions });

      const result = await companyCoachingService.getSessionsByCompany(mockCompanyName);

      expect(apiService.get).toHaveBeenCalledWith(`/company-coaching/company/${mockCompanyName}`);
      expect(result).toEqual(mockCompanySessions);
      expect(result).toHaveLength(2);
    });

    it('should handle different company names', async () => {
      const companyNames = ['Google', 'Microsoft', 'Amazon'];

      vi.mocked(apiService.get).mockResolvedValue({ data: mockCompanySessions });

      for (const company of companyNames) {
        await companyCoachingService.getSessionsByCompany(company);
        expect(apiService.get).toHaveBeenCalledWith(`/company-coaching/company/${company}`);
      }
    });

    it('should handle company names with spaces', async () => {
      const companyWithSpaces = 'Tech Corp Inc';
      vi.mocked(apiService.get).mockResolvedValue({ data: mockCompanySessions });

      await companyCoachingService.getSessionsByCompany(companyWithSpaces);

      expect(apiService.get).toHaveBeenCalledWith(`/company-coaching/company/${companyWithSpaces}`);
    });

    it('should handle empty sessions list for company', async () => {
      const emptySessions: CoachingSession[] = [];

      vi.mocked(apiService.get).mockResolvedValue({ data: emptySessions });

      const result = await companyCoachingService.getSessionsByCompany(mockCompanyName);

      expect(result).toHaveLength(0);
    });

    it('should handle 404 error when company not found', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'No sessions found for this company' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        companyCoachingService.getSessionsByCompany(mockCompanyName)
      ).rejects.toEqual(error);
    });

    it('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Failed to retrieve company sessions' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        companyCoachingService.getSessionsByCompany(mockCompanyName)
      ).rejects.toEqual(error);
    });

    it('should handle network error', async () => {
      const networkError = {
        message: 'Network Error',
        code: 'ERR_NETWORK',
      };

      vi.mocked(apiService.get).mockRejectedValue(networkError);

      await expect(
        companyCoachingService.getSessionsByCompany(mockCompanyName)
      ).rejects.toEqual(networkError);
    });
  });

  describe('Request Payload Formatting', () => {
    it('should format createSession request with all required fields', async () => {
      const fullRequest: CreateCoachingSessionRequest = {
        company_name: 'Meta',
        target_role: 'Product Engineer',
      };

      vi.mocked(apiService.post).mockResolvedValue({ data: mockCoachingSession });

      await companyCoachingService.createSession(fullRequest);

      const callArgs = vi.mocked(apiService.post).mock.calls[0];
      expect(callArgs[1]).toEqual(fullRequest);
      expect(callArgs[1]).toHaveProperty('company_name', 'Meta');
      expect(callArgs[1]).toHaveProperty('target_role', 'Product Engineer');
    });

    it('should correctly format URL with session ID', async () => {
      const sessionIds = [1, 100, 9999];

      vi.mocked(apiService.get).mockResolvedValue({ data: mockCoachingSession });

      for (const id of sessionIds) {
        await companyCoachingService.getSession(id);
        expect(apiService.get).toHaveBeenCalledWith(`/company-coaching/${id}`);
      }
    });

    it('should correctly format URL with company name', async () => {
      vi.mocked(apiService.get).mockResolvedValue({ data: [] });

      await companyCoachingService.getSessionsByCompany('TechCorp');
      expect(apiService.get).toHaveBeenCalledWith('/company-coaching/company/TechCorp');
    });

    it('should correctly format getUserSessions URL with query parameters', async () => {
      vi.mocked(apiService.get).mockResolvedValue({ data: [] });

      // Without limit
      await companyCoachingService.getUserSessions();
      expect(apiService.get).toHaveBeenCalledWith('/company-coaching', { params: {} });

      // With limit
      await companyCoachingService.getUserSessions(10);
      expect(apiService.get).toHaveBeenCalledWith('/company-coaching', { params: { limit: 10 } });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle 401 unauthorized error', async () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        companyCoachingService.getSession(1)
      ).rejects.toEqual(error);
    });

    it('should handle 429 rate limit error', async () => {
      const error = {
        response: {
          status: 429,
          data: { message: 'Too many requests' },
        },
      };

      vi.mocked(apiService.post).mockRejectedValue(error);

      await expect(
        companyCoachingService.createSession({
          company_name: 'Test',
          target_role: 'Engineer',
        })
      ).rejects.toEqual(error);
    });

    it('should handle 503 service unavailable error', async () => {
      const error = {
        response: {
          status: 503,
          data: { message: 'Service temporarily unavailable' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        companyCoachingService.getUserSessions()
      ).rejects.toEqual(error);
    });

    it('should handle timeout during session creation', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      };

      vi.mocked(apiService.post).mockRejectedValue(timeoutError);

      await expect(
        companyCoachingService.createSession({
          company_name: 'Test',
          target_role: 'Engineer',
        })
      ).rejects.toEqual(timeoutError);
    });
  });

  describe('Response Data Validation', () => {
    it('should return complete coaching session with all fields', async () => {
      vi.mocked(apiService.post).mockResolvedValue({ data: mockCoachingSession });

      const result = await companyCoachingService.createSession({
        company_name: 'TechCorp',
        target_role: 'Senior Software Engineer',
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('user_id');
      expect(result).toHaveProperty('company_name');
      expect(result).toHaveProperty('target_role');
      expect(result).toHaveProperty('company_overview');
      expect(result).toHaveProperty('predicted_questions');
      expect(result).toHaveProperty('star_examples');
      expect(result).toHaveProperty('confidence_tips');
      expect(result).toHaveProperty('pre_interview_checklist');
      expect(result).toHaveProperty('execution_time_ms');
      expect(result).toHaveProperty('created_at');
    });

    it('should return coaching session with company overview structure', async () => {
      vi.mocked(apiService.get).mockResolvedValue({ data: mockCoachingSession });

      const result = await companyCoachingService.getSession(1);

      expect(result.company_overview).toHaveProperty('culture');
      expect(result.company_overview).toHaveProperty('values');
      expect(result.company_overview).toHaveProperty('interview_process');
      expect(Array.isArray(result.company_overview.values)).toBe(true);
    });

    it('should return coaching session with predicted questions array', async () => {
      vi.mocked(apiService.get).mockResolvedValue({ data: mockCoachingSession });

      const result = await companyCoachingService.getSession(1);

      expect(Array.isArray(result.predicted_questions)).toBe(true);
      if (result.predicted_questions.length > 0) {
        expect(result.predicted_questions[0]).toHaveProperty('question');
        expect(result.predicted_questions[0]).toHaveProperty('category');
        expect(result.predicted_questions[0]).toHaveProperty('difficulty');
        expect(result.predicted_questions[0]).toHaveProperty('why_asked');
      }
    });

    it('should return coaching session with STAR examples array', async () => {
      vi.mocked(apiService.get).mockResolvedValue({ data: mockCoachingSession });

      const result = await companyCoachingService.getSession(1);

      expect(Array.isArray(result.star_examples)).toBe(true);
      if (result.star_examples.length > 0) {
        expect(result.star_examples[0]).toHaveProperty('situation');
        expect(result.star_examples[0]).toHaveProperty('task');
        expect(result.star_examples[0]).toHaveProperty('action');
        expect(result.star_examples[0]).toHaveProperty('result');
        expect(result.star_examples[0]).toHaveProperty('relevant_skills');
        expect(Array.isArray(result.star_examples[0].relevant_skills)).toBe(true);
      }
    });

    it('should return coaching session with tips and checklist arrays', async () => {
      vi.mocked(apiService.get).mockResolvedValue({ data: mockCoachingSession });

      const result = await companyCoachingService.getSession(1);

      expect(Array.isArray(result.confidence_tips)).toBe(true);
      expect(Array.isArray(result.pre_interview_checklist)).toBe(true);
    });
  });
});
