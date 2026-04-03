/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '/api/v1',
  TIMEOUT: 120000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    LOGOUT_ALL: '/auth/logout-all',
    REFRESH: '/auth/refresh',
    PASSWORD_RESET_REQUEST: '/auth/password-reset-request',
    PASSWORD_RESET: '/auth/password-reset',
  },

  // Users
  USERS: {
    ME: '/users/me',
    UPDATE_PROFILE: '/users/me',
  },

  // Interviews
  INTERVIEWS: {
    LIST: '/interviews',
    CREATE: '/interviews',
    GET: (id: string) => `/interviews/${id}`,
    UPDATE: (id: string) => `/interviews/${id}`,
    DELETE: (id: string) => `/interviews/${id}`,
    START: (id: string) => `/interviews/${id}/start`,
    SUBMIT_ANSWER: (id: string) => `/interviews/${id}/answer`,
    COMPLETE: (id: string) => `/interviews/${id}/complete`,
  },

  // Resumes
  RESUMES: {
    LIST: '/resumes',
    UPLOAD: '/resumes/upload',
    GET: (id: string) => `/resumes/${id}`,
    DELETE: (id: string) => `/resumes/${id}`,
    PARSE: (id: string) => `/resumes/${id}/parse`,
  },

  // Analytics
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    PERFORMANCE: '/analytics/performance',
    PROGRESS: '/analytics/progress',
  },

  // Study Plans
  STUDY_PLANS: {
    LIST: '/study-plans',
    CREATE: '/study-plans',
    GET: (id: number) => `/study-plans/${id}`,
    ACTIVE: '/study-plans/active/current',
    UPDATE_PROGRESS: (id: number) => `/study-plans/${id}/progress`,
    ABANDON: (id: number) => `/study-plans/${id}`,
  },

  // Resume Analysis
  RESUME_ANALYSIS: {
    LIST: '/resume-analysis',
    CREATE: '/resume-analysis',
    GET: (id: number) => `/resume-analysis/${id}`,
    LATEST: '/resume-analysis/latest',
  },

  // Company Coaching
  COMPANY_COACHING: {
    LIST: '/company-coaching',
    CREATE: '/company-coaching',
    GET: (id: number) => `/company-coaching/${id}`,
    BY_COMPANY: (company: string) => `/company-coaching/company/${company}`,
  },

  // Health
  HEALTH: '/health',
} as const;
