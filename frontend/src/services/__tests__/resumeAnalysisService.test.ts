/**
 * Unit Tests for Resume Analysis Service
 * Tests API calls, error handling, and request payload formatting
 * 
 * Requirements: INT-1.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resumeAnalysisService } from '../resumeAnalysisService';
import type { ResumeAnalysis, AnalyzeResumeRequest, AnalysisHistoryResponse } from '../resumeAnalysisService';
import apiService from '../api.service';

// Mock the apiService
vi.mock('../api.service', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('resumeAnalysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeResume', () => {
    const mockResumeId = 123;
    const mockRequest: AnalyzeResumeRequest = {
      target_role: 'Software Engineer',
      force_refresh: false,
    };

    const mockAnalysis: ResumeAnalysis = {
      analysis_id: 1,
      resume_id: mockResumeId,
      analysis_data: {
        skill_inventory: {
          technical_skills: ['JavaScript', 'TypeScript', 'React'],
          soft_skills: ['Communication', 'Leadership'],
          tools: ['Git', 'Docker'],
          languages: ['English', 'Spanish'],
        },
        experience_timeline: {
          total_years: 5,
          seniority_level: 'Mid',
          companies: ['Company A', 'Company B'],
          roles: ['Developer', 'Senior Developer'],
        },
        skill_gaps: {
          target_role: 'Software Engineer',
          required_missing: ['Kubernetes'],
          preferred_missing: ['AWS'],
          match_percentage: 85,
        },
        improvement_roadmap: {
          timeline_weeks: 12,
          milestones: [
            {
              milestone_number: 1,
              weeks: '1-4',
              skills_to_learn: ['Kubernetes basics'],
              estimated_hours: 20,
              activities: ['Complete online course'],
            },
          ],
          success_tips: ['Practice regularly'],
        },
      },
      execution_time_ms: 1500,
      status: 'completed',
      analyzed_at: '2024-01-15T10:00:00Z',
      from_cache: false,
      cache_age_days: 0,
    };

    it('should successfully call POST /resume-analysis/{resume_id} with correct payload', async () => {
      vi.mocked(apiService.post).mockResolvedValue({ data: mockAnalysis });

      const result = await resumeAnalysisService.analyzeResume(mockResumeId, mockRequest);

      expect(apiService.post).toHaveBeenCalledWith(
        `/resume-analysis/${mockResumeId}`,
        mockRequest
      );
      expect(result).toEqual(mockAnalysis);
    });

    it('should handle force_refresh parameter correctly', async () => {
      const requestWithRefresh: AnalyzeResumeRequest = {
        target_role: 'Software Engineer',
        force_refresh: true,
      };

      vi.mocked(apiService.post).mockResolvedValue({ data: mockAnalysis });

      await resumeAnalysisService.analyzeResume(mockResumeId, requestWithRefresh);

      expect(apiService.post).toHaveBeenCalledWith(
        `/resume-analysis/${mockResumeId}`,
        requestWithRefresh
      );
    });

    it('should handle 404 error when resume not found', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Resume not found' },
        },
      };

      vi.mocked(apiService.post).mockRejectedValue(error);

      await expect(
        resumeAnalysisService.analyzeResume(mockResumeId, mockRequest)
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
        resumeAnalysisService.analyzeResume(mockResumeId, mockRequest)
      ).rejects.toEqual(error);
    });

    it('should handle network error', async () => {
      const networkError = {
        message: 'Network Error',
        code: 'ECONNABORTED',
      };

      vi.mocked(apiService.post).mockRejectedValue(networkError);

      await expect(
        resumeAnalysisService.analyzeResume(mockResumeId, mockRequest)
      ).rejects.toEqual(networkError);
    });

    it('should handle timeout error', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      };

      vi.mocked(apiService.post).mockRejectedValue(timeoutError);

      await expect(
        resumeAnalysisService.analyzeResume(mockResumeId, mockRequest)
      ).rejects.toEqual(timeoutError);
    });

    it('should format request payload with only target_role when force_refresh is omitted', async () => {
      const minimalRequest: AnalyzeResumeRequest = {
        target_role: 'Data Scientist',
      };

      vi.mocked(apiService.post).mockResolvedValue({ data: mockAnalysis });

      await resumeAnalysisService.analyzeResume(mockResumeId, minimalRequest);

      expect(apiService.post).toHaveBeenCalledWith(
        `/resume-analysis/${mockResumeId}`,
        minimalRequest
      );
    });
  });

  describe('getAnalysis', () => {
    const mockResumeId = 456;
    const mockAnalysis: ResumeAnalysis = {
      analysis_id: 2,
      resume_id: mockResumeId,
      analysis_data: {
        skill_inventory: {
          technical_skills: ['Python', 'Django'],
          soft_skills: ['Problem Solving'],
          tools: ['PostgreSQL'],
          languages: ['English'],
        },
        experience_timeline: {
          total_years: 3,
          seniority_level: 'Junior',
          companies: ['Startup Inc'],
          roles: ['Backend Developer'],
        },
        skill_gaps: {
          target_role: 'Backend Engineer',
          required_missing: ['Redis'],
          preferred_missing: ['GraphQL'],
          match_percentage: 75,
        },
        improvement_roadmap: {
          timeline_weeks: 8,
          milestones: [],
          success_tips: [],
        },
      },
      execution_time_ms: 800,
      status: 'completed',
      analyzed_at: '2024-01-14T15:30:00Z',
      from_cache: true,
      cache_age_days: 2,
    };

    it('should successfully call GET /resume-analysis/{resume_id}', async () => {
      vi.mocked(apiService.get).mockResolvedValue({ data: mockAnalysis });

      const result = await resumeAnalysisService.getAnalysis(mockResumeId);

      expect(apiService.get).toHaveBeenCalledWith(`/resume-analysis/${mockResumeId}`);
      expect(result).toEqual(mockAnalysis);
    });

    it('should handle 404 error when analysis not found', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Analysis not found for this resume' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        resumeAnalysisService.getAnalysis(mockResumeId)
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
        resumeAnalysisService.getAnalysis(mockResumeId)
      ).rejects.toEqual(error);
    });

    it('should handle network error', async () => {
      const networkError = {
        message: 'Network Error',
        code: 'ERR_NETWORK',
      };

      vi.mocked(apiService.get).mockRejectedValue(networkError);

      await expect(
        resumeAnalysisService.getAnalysis(mockResumeId)
      ).rejects.toEqual(networkError);
    });

    it('should return cached analysis when from_cache is true', async () => {
      const cachedAnalysis = { ...mockAnalysis, from_cache: true, cache_age_days: 5 };
      vi.mocked(apiService.get).mockResolvedValue({ data: cachedAnalysis });

      const result = await resumeAnalysisService.getAnalysis(mockResumeId);

      expect(result.from_cache).toBe(true);
      expect(result.cache_age_days).toBe(5);
    });
  });

  describe('getAnalysisHistory', () => {
    const mockResumeId = 789;
    const mockHistory: AnalysisHistoryResponse = {
      analyses: [
        {
          analysis_id: 3,
          resume_id: mockResumeId,
          analysis_data: {
            skill_inventory: {
              technical_skills: ['Java', 'Spring'],
              soft_skills: ['Teamwork'],
              tools: ['Maven'],
              languages: ['English'],
            },
            experience_timeline: {
              total_years: 7,
              seniority_level: 'Senior',
              companies: ['Enterprise Corp'],
              roles: ['Tech Lead'],
            },
            skill_gaps: {
              target_role: 'Engineering Manager',
              required_missing: ['People Management'],
              preferred_missing: ['Agile Coaching'],
              match_percentage: 60,
            },
            improvement_roadmap: {
              timeline_weeks: 16,
              milestones: [],
              success_tips: [],
            },
          },
          execution_time_ms: 2000,
          status: 'completed',
          analyzed_at: '2024-01-10T09:00:00Z',
          from_cache: false,
          cache_age_days: 0,
        },
        {
          analysis_id: 4,
          resume_id: mockResumeId,
          analysis_data: {
            skill_inventory: {
              technical_skills: ['Java'],
              soft_skills: [],
              tools: [],
              languages: [],
            },
            experience_timeline: {
              total_years: 7,
              seniority_level: 'Senior',
              companies: [],
              roles: [],
            },
            skill_gaps: {
              target_role: 'Software Architect',
              required_missing: ['System Design'],
              preferred_missing: [],
              match_percentage: 70,
            },
            improvement_roadmap: {
              timeline_weeks: 12,
              milestones: [],
              success_tips: [],
            },
          },
          execution_time_ms: 1800,
          status: 'completed',
          analyzed_at: '2024-01-05T14:20:00Z',
          from_cache: false,
          cache_age_days: 0,
        },
      ],
      total: 2,
    };

    it('should successfully call GET /resume-analysis/{resume_id}/history without limit', async () => {
      vi.mocked(apiService.get).mockResolvedValue({ data: mockHistory });

      const result = await resumeAnalysisService.getAnalysisHistory(mockResumeId);

      expect(apiService.get).toHaveBeenCalledWith(
        `/resume-analysis/${mockResumeId}/history`,
        { params: {} }
      );
      expect(result).toEqual(mockHistory);
      expect(result.analyses).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should successfully call GET /resume-analysis/{resume_id}/history with limit parameter', async () => {
      const limit = 5;
      vi.mocked(apiService.get).mockResolvedValue({ data: mockHistory });

      const result = await resumeAnalysisService.getAnalysisHistory(mockResumeId, limit);

      expect(apiService.get).toHaveBeenCalledWith(
        `/resume-analysis/${mockResumeId}/history`,
        { params: { limit } }
      );
      expect(result).toEqual(mockHistory);
    });

    it('should handle limit parameter of 1', async () => {
      const singleHistory: AnalysisHistoryResponse = {
        analyses: [mockHistory.analyses[0]],
        total: 1,
      };

      vi.mocked(apiService.get).mockResolvedValue({ data: singleHistory });

      const result = await resumeAnalysisService.getAnalysisHistory(mockResumeId, 1);

      expect(apiService.get).toHaveBeenCalledWith(
        `/resume-analysis/${mockResumeId}/history`,
        { params: { limit: 1 } }
      );
      expect(result.analyses).toHaveLength(1);
    });

    it('should handle empty history', async () => {
      const emptyHistory: AnalysisHistoryResponse = {
        analyses: [],
        total: 0,
      };

      vi.mocked(apiService.get).mockResolvedValue({ data: emptyHistory });

      const result = await resumeAnalysisService.getAnalysisHistory(mockResumeId);

      expect(result.analyses).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle 404 error when resume not found', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Resume not found' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        resumeAnalysisService.getAnalysisHistory(mockResumeId)
      ).rejects.toEqual(error);
    });

    it('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Failed to retrieve history' },
        },
      };

      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(
        resumeAnalysisService.getAnalysisHistory(mockResumeId, 10)
      ).rejects.toEqual(error);
    });

    it('should handle network error', async () => {
      const networkError = {
        message: 'Network Error',
        code: 'ERR_NETWORK',
      };

      vi.mocked(apiService.get).mockRejectedValue(networkError);

      await expect(
        resumeAnalysisService.getAnalysisHistory(mockResumeId)
      ).rejects.toEqual(networkError);
    });
  });

  describe('Request Payload Formatting', () => {
    it('should format analyzeResume request with all fields', async () => {
      const fullRequest: AnalyzeResumeRequest = {
        target_role: 'Full Stack Developer',
        force_refresh: true,
      };

      vi.mocked(apiService.post).mockResolvedValue({ data: {} as ResumeAnalysis });

      await resumeAnalysisService.analyzeResume(1, fullRequest);

      const callArgs = vi.mocked(apiService.post).mock.calls[0];
      expect(callArgs[1]).toEqual(fullRequest);
      expect(callArgs[1]).toHaveProperty('target_role', 'Full Stack Developer');
      expect(callArgs[1]).toHaveProperty('force_refresh', true);
    });

    it('should format analyzeResume request with only required fields', async () => {
      const minimalRequest: AnalyzeResumeRequest = {
        target_role: 'DevOps Engineer',
      };

      vi.mocked(apiService.post).mockResolvedValue({ data: {} as ResumeAnalysis });

      await resumeAnalysisService.analyzeResume(1, minimalRequest);

      const callArgs = vi.mocked(apiService.post).mock.calls[0];
      expect(callArgs[1]).toEqual(minimalRequest);
      expect(callArgs[1]).toHaveProperty('target_role', 'DevOps Engineer');
      expect(callArgs[1]).not.toHaveProperty('force_refresh');
    });

    it('should correctly format URL with resume ID', async () => {
      const resumeIds = [1, 100, 9999];

      vi.mocked(apiService.post).mockResolvedValue({ data: {} as ResumeAnalysis });

      for (const id of resumeIds) {
        await resumeAnalysisService.analyzeResume(id, { target_role: 'Test' });
        expect(apiService.post).toHaveBeenCalledWith(
          `/resume-analysis/${id}`,
          expect.any(Object)
        );
      }
    });

    it('should correctly format history URL with query parameters', async () => {
      vi.mocked(apiService.get).mockResolvedValue({ 
        data: { analyses: [], total: 0 } 
      });

      // Without limit
      await resumeAnalysisService.getAnalysisHistory(123);
      expect(apiService.get).toHaveBeenCalledWith(
        '/resume-analysis/123/history',
        { params: {} }
      );

      // With limit
      await resumeAnalysisService.getAnalysisHistory(123, 10);
      expect(apiService.get).toHaveBeenCalledWith(
        '/resume-analysis/123/history',
        { params: { limit: 10 } }
      );
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
        resumeAnalysisService.getAnalysis(1)
      ).rejects.toEqual(error);
    });

    it('should handle 403 forbidden error', async () => {
      const error = {
        response: {
          status: 403,
          data: { message: 'Access denied' },
        },
      };

      vi.mocked(apiService.post).mockRejectedValue(error);

      await expect(
        resumeAnalysisService.analyzeResume(1, { target_role: 'Test' })
      ).rejects.toEqual(error);
    });

    it('should handle 422 validation error', async () => {
      const error = {
        response: {
          status: 422,
          data: { 
            message: 'Validation error',
            details: { target_role: 'Invalid role' }
          },
        },
      };

      vi.mocked(apiService.post).mockRejectedValue(error);

      await expect(
        resumeAnalysisService.analyzeResume(1, { target_role: 'InvalidRole' })
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
        resumeAnalysisService.analyzeResume(1, { target_role: 'Test' })
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
        resumeAnalysisService.getAnalysisHistory(1)
      ).rejects.toEqual(error);
    });
  });
});
