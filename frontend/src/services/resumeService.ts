/**
 * Resume Service
 * API methods for resume management
 */

import apiService from './api.service';

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
  },

  /**
   * Get all user resumes
   */
  async getResumes(): Promise<ResumeListResponse> {
    const response = await apiService.get<ResumeListResponse>('/resumes');
    return response.data;
  },

  /**
   * Get resume by ID
   */
  async getResumeById(id: number): Promise<Resume> {
    const response = await apiService.get<Resume>(`/resumes/${id}`);
    return response.data;
  },

  /**
   * Delete resume
   */
  async deleteResume(id: number): Promise<void> {
    await apiService.delete(`/resumes/${id}`);
  },
};

export default resumeService;
