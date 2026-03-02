/**
 * Resume Service
 * API methods for resume management
 */

import apiService from './api.service';
import { logError } from '../utils/errorMessages';

export interface Resume {
  id: number;
  user_id: number;
  filename: string;
  file_url: string;
  file_size: number | null;
  extracted_text: string | null;
  skills: {
    technical_skills?: string[];
    soft_skills?: string[];
    tools?: string[];
    languages?: string[];
  } | null;
  experience: Array<{
    job_title: string;
    company_name: string;
    start_date: string;
    end_date: string | null;
    duration_months: number;
    description: string;
  }> | null;
  education: Array<{
    degree_type: string;
    institution_name: string;
    field_of_study: string;
    graduation_year: number;
  }> | null;
  status: string;
  total_experience_months: number | null;
  seniority_level: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResumeUploadResponse {
  resume_id: number;
  filename: string;
  file_url: string;
  file_size: number;
  status: string;
  message: string;
}

export interface ResumeListResponse {
  resumes: Resume[];
  total: number;
}

export const resumeService = {
  /**
   * Upload resume file
   */
  async uploadResume(file: File): Promise<ResumeUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiService.post<ResumeUploadResponse>(
        '/resumes/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      logError(error, 'resumeService.uploadResume');
      throw error;
    }
  },

  /**
   * Get all user resumes
   */
  async getResumes(): Promise<ResumeListResponse> {
    try {
      const response = await apiService.get<ResumeListResponse>('/resumes');
      return response.data;
    } catch (error) {
      logError(error, 'resumeService.getResumes');
      throw error;
    }
  },

  /**
   * Get resume by ID
   */
  async getResumeById(id: number): Promise<Resume> {
    try {
      const response = await apiService.get<Resume>(`/resumes/${id}`);
      return response.data;
    } catch (error) {
      logError(error, 'resumeService.getResumeById');
      throw error;
    }
  },

  /**
   * Delete resume
   */
  async deleteResume(id: number): Promise<void> {
    try {
      await apiService.delete(`/resumes/${id}`);
    } catch (error) {
      logError(error, 'resumeService.deleteResume');
      throw error;
    }
  },
};

export default resumeService;
