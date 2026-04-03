/**
 * Resume Analysis Service
 * API methods for AI-powered resume analysis
 * 
 * Requirements: INT-1.1
 */

import apiService from './api.service';
import { logError } from '../utils/errorMessages';

// Skill inventory section
export interface SkillInventory {
  technical_skills: string[];
  soft_skills: string[];
  tools: string[];
  languages: string[];
}

// Experience timeline section
export interface ExperienceTimeline {
  total_years: number;
  seniority_level: string;
  companies: string[];
  roles: string[];
  analysis?: string;
}

// Skill gaps section
export interface GapItem {
  gap: string;
  recommendations: string[];
}

export interface SkillGaps {
  target_role: string;
  required_missing: string[];
  preferred_missing: string[];
  match_percentage: number;
  priority?: string;
  recommendation?: string;
  analysis?: string;
  note?: string;
  // New standardized list format for UI
  items?: GapItem[];
}

// Learning roadmap milestone
export interface Milestone {
  milestone_number: number;
  weeks: string;
  skills_to_learn: string[];
  estimated_hours: number;
  activities: string[];
}

// Improvement roadmap section
export interface ImprovementRoadmap {
  timeline_weeks: number;
  hours_per_week?: number;
  total_hours?: number;
  milestones: Milestone[];
  success_tips: string[];
  recommendations?: string;
  note?: string;
  // New standardized sectors for UI
  short_term?: string[];
  long_term?: string[];
}

// Agent reasoning step
export interface ReasoningStep {
  step_number: number;
  tool: string;
  tool_input: Record<string, any>;
  thought: string;
  observation: string;
}

// Complete resume analysis response
export interface ResumeAnalysis {
  analysis_id: number;
  resume_id: number;
  analysis_data: {
    skill_inventory: SkillInventory;
    experience_timeline: ExperienceTimeline;
    skill_gaps: SkillGaps;
    improvement_roadmap: ImprovementRoadmap;
    analysis_summary?: string;
    fallback_used?: boolean;
  };
  agent_reasoning?: ReasoningStep[];
  execution_time_ms: number;
  status: string;
  analyzed_at: string;
  from_cache: boolean;
  cache_age_days: number;
}

// Request to analyze resume
export interface AnalyzeResumeRequest {
  target_role: string;
  force_refresh?: boolean;
}

// Analysis history response
export interface AnalysisHistoryResponse {
  analyses: ResumeAnalysis[];
  total: number;
}

export const resumeAnalysisService = {
  /**
   * Trigger resume analysis
   * POST /api/v1/resume-analysis/{resume_id}
   */
  async analyzeResume(
    resumeId: number,
    request: AnalyzeResumeRequest
  ): Promise<ResumeAnalysis> {
    try {
      const response = await apiService.post<ResumeAnalysis>(
        `/resume-analysis/${resumeId}`,
        request
      );
      return response.data;
    } catch (error) {
      logError(error, 'resumeAnalysisService.analyzeResume');
      throw error;
    }
  },

  /**
   * Get latest analysis for resume
   * GET /api/v1/resume-analysis/{resume_id}
   */
  async getAnalysis(resumeId: number): Promise<ResumeAnalysis> {
    try {
      const response = await apiService.get<ResumeAnalysis>(
        `/resume-analysis/${resumeId}`
      );
      return response.data;
    } catch (error) {
      logError(error, 'resumeAnalysisService.getAnalysis');
      throw error;
    }
  },

  /**
   * Get analysis history for resume
   * GET /api/v1/resume-analysis/{resume_id}/history
   */
  async getAnalysisHistory(
    resumeId: number,
    limit?: number
  ): Promise<AnalysisHistoryResponse> {
    try {
      const params = limit ? { limit } : {};
      const response = await apiService.get<AnalysisHistoryResponse>(
        `/resume-analysis/${resumeId}/history`,
        { params }
      );
      return response.data;
    } catch (error) {
      logError(error, 'resumeAnalysisService.getAnalysisHistory');
      throw error;
    }
  },
};

export default resumeAnalysisService;
