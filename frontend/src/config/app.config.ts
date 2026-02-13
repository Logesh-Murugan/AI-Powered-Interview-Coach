/**
 * Application Configuration
 * Global app settings and constants
 */

export const APP_CONFIG = {
  NAME: 'InterviewMaster AI',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI-Powered Interview Preparation Platform',
  
  // Feature flags
  FEATURES: {
    ANALYTICS: true,
    GAMIFICATION: true,
    AI_FEEDBACK: true,
    RESUME_PARSING: true,
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  },
  
  // Storage keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER: 'user',
    THEME: 'theme',
    LANGUAGE: 'language',
  },
  
  // Timeouts
  TIMEOUTS: {
    TOAST: 5000,
    DEBOUNCE: 300,
    THROTTLE: 1000,
  },
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PASSWORD_RESET: '/password-reset',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  
  // Profile
  PROFILE: '/profile',
  SETTINGS: '/settings',
  
  // Interviews
  INTERVIEWS: '/interviews',
  INTERVIEW_DETAIL: '/interviews/:id',
  INTERVIEW_SESSION: '/interviews/:id/session',
  INTERVIEW_RESULTS: '/interviews/:id/results',
  
  // Resumes
  RESUMES: '/resumes',
  RESUME_UPLOAD: '/resumes/upload',
  
  // Analytics
  ANALYTICS: '/analytics',
  PERFORMANCE: '/analytics/performance',
  PROGRESS: '/analytics/progress',
  
  // Not Found
  NOT_FOUND: '/404',
} as const;
