/**
 * Unit Tests for Company Coaching Slice
 * Tests thunk success/failure state updates, reducer actions, and selectors
 * 
 * Requirements: INT-1.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import companyCoachingReducer, {
  createSession,
  fetchSession,
  fetchUserSessions,
  fetchSessionsByCompany,
  setCurrentSession,
  clearError,
} from '../companyCoachingSlice';
import companyCoachingService from '../../../services/companyCoachingService';
import type { CoachingSession, CreateCoachingSessionRequest } from '../../../services/companyCoachingService';

// Mock the service
vi.mock('../../../services/companyCoachingService', () => ({
  default: {
    createSession: vi.fn(),
    getSession: vi.fn(),
    getUserSessions: vi.fn(),
    getSessionsByCompany: vi.fn(),
  },
}));

// Helper to create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      companyCoaching: companyCoachingReducer,
    },
  });
};

// Mock data
const mockSession: CoachingSession = {
  id: 1,
  user_id: 100,
  company_name: 'TechCorp',
  target_role: 'Software Engineer',
  company_overview: {
    culture: 'Fast-paced startup environment',
    values: ['Innovation', 'Collaboration', 'Excellence'],
    interview_process: 'Phone screen, technical interview, behavioral interview, final round',
  },
  predicted_questions: [
    {
      question: 'Tell me about a time you solved a complex technical problem',
      category: 'Technical',
      difficulty: 'Hard',
      why_asked: 'To assess problem-solving skills',
    },
  ],
  star_examples: [
    {
      situation: 'System performance degradation',
      task: 'Identify and fix bottleneck',
      action: 'Profiled code and optimized database queries',
      result: '50% performance improvement',
      relevant_skills: ['Performance optimization', 'Database tuning'],
    },
  ],
  confidence_tips: ['Research the company', 'Practice STAR method'],
  pre_interview_checklist: ['Review resume', 'Prepare questions'],
  execution_time_ms: 3000,
  created_at: '2024-01-15T10:00:00Z',
};

const mockSession2: CoachingSession = {
  ...mockSession,
  id: 2,
  company_name: 'DataCo',
  target_role: 'Data Engineer',
  created_at: '2024-01-16T10:00:00Z',
};

const mockCreateRequest: CreateCoachingSessionRequest = {
  company_name: 'TechCorp',
  target_role: 'Software Engineer',
};

describe('companyCoachingSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createTestStore();
      const state = store.getState().companyCoaching;

      expect(state).toEqual({
        sessions: {},
        userSessions: [],
        currentSession: null,
        isLoading: false,
        isGenerating: false,
        error: null,
      });
    });
  });

  describe('createSession thunk', () => {
    it('should set isGenerating to true on pending', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.createSession).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      store.dispatch(createSession(mockCreateRequest));

      // Wait for pending state
      await new Promise(resolve => setTimeout(resolve, 0));

      const state = store.getState().companyCoaching;
      expect(state.isGenerating).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update state correctly on fulfilled', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.createSession).mockResolvedValue(mockSession);

      await store.dispatch(createSession(mockCreateRequest));

      const state = store.getState().companyCoaching;
      expect(state.isGenerating).toBe(false);
      expect(state.sessions[1]).toEqual(mockSession);
      expect(state.currentSession).toEqual(mockSession);
      expect(state.userSessions).toContainEqual(mockSession);
      expect(state.error).toBe(null);
    });

    it('should handle error on rejected', async () => {
      const store = createTestStore();
      const errorMessage = 'Failed to create coaching session';
      
      vi.mocked(companyCoachingService.createSession).mockRejectedValue(
        new Error(errorMessage)
      );

      await store.dispatch(createSession(mockCreateRequest));

      const state = store.getState().companyCoaching;
      expect(state.isGenerating).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.currentSession).toBe(null);
    });

    it('should handle non-Error rejection', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.createSession).mockRejectedValue('String error');

      await store.dispatch(createSession(mockCreateRequest));

      const state = store.getState().companyCoaching;
      expect(state.isGenerating).toBe(false);
      expect(state.error).toBe('Failed to create coaching session');
    });

    it('should clear previous error on new request', async () => {
      const store = createTestStore();
      
      // First request fails
      vi.mocked(companyCoachingService.createSession).mockRejectedValue(
        new Error('First error')
      );
      await store.dispatch(createSession(mockCreateRequest));

      expect(store.getState().companyCoaching.error).toBe('First error');

      // Second request starts
      vi.mocked(companyCoachingService.createSession).mockImplementation(
        () => new Promise(() => {})
      );
      store.dispatch(createSession(mockCreateRequest));

      await new Promise(resolve => setTimeout(resolve, 0));

      const state = store.getState().companyCoaching;
      expect(state.error).toBe(null);
      expect(state.isGenerating).toBe(true);
    });

    it('should add session to userSessions array', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.createSession).mockResolvedValue(mockSession);

      await store.dispatch(createSession(mockCreateRequest));

      const state = store.getState().companyCoaching;
      expect(state.userSessions).toHaveLength(1);
      expect(state.userSessions[0]).toEqual(mockSession);
    });

    it('should not duplicate session in userSessions', async () => {
      const store = createTestStore();
      
      // Create session twice
      vi.mocked(companyCoachingService.createSession).mockResolvedValue(mockSession);
      await store.dispatch(createSession(mockCreateRequest));
      await store.dispatch(createSession(mockCreateRequest));

      const state = store.getState().companyCoaching;
      expect(state.userSessions).toHaveLength(1);
    });
  });

  describe('fetchSession thunk', () => {
    it('should set isLoading to true on pending', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.getSession).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(fetchSession(1));

      await new Promise(resolve => setTimeout(resolve, 0));

      const state = store.getState().companyCoaching;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update state correctly on fulfilled', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.getSession).mockResolvedValue(mockSession);

      await store.dispatch(fetchSession(1));

      const state = store.getState().companyCoaching;
      expect(state.isLoading).toBe(false);
      expect(state.sessions[1]).toEqual(mockSession);
      expect(state.currentSession).toEqual(mockSession);
      expect(state.error).toBe(null);
    });

    it('should handle error on rejected', async () => {
      const store = createTestStore();
      const errorMessage = 'Session not found';
      
      vi.mocked(companyCoachingService.getSession).mockRejectedValue(
        new Error(errorMessage)
      );

      await store.dispatch(fetchSession(1));

      const state = store.getState().companyCoaching;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should handle non-Error rejection', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.getSession).mockRejectedValue('String error');

      await store.dispatch(fetchSession(1));

      const state = store.getState().companyCoaching;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to fetch coaching session');
    });

    it('should update existing session in state', async () => {
      const store = createTestStore();
      
      // First fetch
      vi.mocked(companyCoachingService.getSession).mockResolvedValue(mockSession);
      await store.dispatch(fetchSession(1));

      // Second fetch with updated data
      const updatedSession = { ...mockSession, company_name: 'Updated Corp' };
      vi.mocked(companyCoachingService.getSession).mockResolvedValue(updatedSession);
      await store.dispatch(fetchSession(1));

      const state = store.getState().companyCoaching;
      expect(state.sessions[1]).toEqual(updatedSession);
      expect(state.currentSession).toEqual(updatedSession);
    });

    it('should handle multiple sessions', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.getSession)
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce(mockSession2);

      await store.dispatch(fetchSession(1));
      await store.dispatch(fetchSession(2));

      const state = store.getState().companyCoaching;
      expect(state.sessions[1]).toEqual(mockSession);
      expect(state.sessions[2]).toEqual(mockSession2);
      expect(state.currentSession).toEqual(mockSession2);
    });
  });

  describe('fetchUserSessions thunk', () => {
    it('should set isLoading to true on pending', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.getUserSessions).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(fetchUserSessions());

      await new Promise(resolve => setTimeout(resolve, 0));

      const state = store.getState().companyCoaching;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update state correctly on fulfilled', async () => {
      const store = createTestStore();
      const sessions = [mockSession, mockSession2];
      
      vi.mocked(companyCoachingService.getUserSessions).mockResolvedValue(sessions);

      await store.dispatch(fetchUserSessions());

      const state = store.getState().companyCoaching;
      expect(state.isLoading).toBe(false);
      expect(state.userSessions).toEqual(sessions);
      expect(state.sessions[1]).toEqual(mockSession);
      expect(state.sessions[2]).toEqual(mockSession2);
      expect(state.error).toBe(null);
    });

    it('should handle error on rejected', async () => {
      const store = createTestStore();
      const errorMessage = 'Failed to fetch sessions';
      
      vi.mocked(companyCoachingService.getUserSessions).mockRejectedValue(
        new Error(errorMessage)
      );

      await store.dispatch(fetchUserSessions());

      const state = store.getState().companyCoaching;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should handle non-Error rejection', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.getUserSessions).mockRejectedValue('String error');

      await store.dispatch(fetchUserSessions());

      const state = store.getState().companyCoaching;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to fetch user sessions');
    });

    it('should handle empty sessions list', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.getUserSessions).mockResolvedValue([]);

      await store.dispatch(fetchUserSessions());

      const state = store.getState().companyCoaching;
      expect(state.userSessions).toEqual([]);
      expect(Object.keys(state.sessions)).toHaveLength(0);
    });

    it('should respect limit parameter', async () => {
      const store = createTestStore();
      const sessions = [mockSession];
      
      vi.mocked(companyCoachingService.getUserSessions).mockResolvedValue(sessions);

      await store.dispatch(fetchUserSessions(5));

      expect(companyCoachingService.getUserSessions).toHaveBeenCalledWith(5);
    });
  });

  describe('fetchSessionsByCompany thunk', () => {
    it('should set isLoading to true on pending', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.getSessionsByCompany).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(fetchSessionsByCompany('TechCorp'));

      await new Promise(resolve => setTimeout(resolve, 0));

      const state = store.getState().companyCoaching;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update state correctly on fulfilled', async () => {
      const store = createTestStore();
      const sessions = [mockSession];
      
      vi.mocked(companyCoachingService.getSessionsByCompany).mockResolvedValue(sessions);

      await store.dispatch(fetchSessionsByCompany('TechCorp'));

      const state = store.getState().companyCoaching;
      expect(state.isLoading).toBe(false);
      expect(state.sessions[1]).toEqual(mockSession);
      expect(state.error).toBe(null);
    });

    it('should handle error on rejected', async () => {
      const store = createTestStore();
      const errorMessage = 'Company not found';
      
      vi.mocked(companyCoachingService.getSessionsByCompany).mockRejectedValue(
        new Error(errorMessage)
      );

      await store.dispatch(fetchSessionsByCompany('TechCorp'));

      const state = store.getState().companyCoaching;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should handle non-Error rejection', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.getSessionsByCompany).mockRejectedValue('String error');

      await store.dispatch(fetchSessionsByCompany('TechCorp'));

      const state = store.getState().companyCoaching;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to fetch sessions by company');
    });

    it('should handle multiple sessions for same company', async () => {
      const store = createTestStore();
      const sessions = [mockSession, { ...mockSession, id: 3 }];
      
      vi.mocked(companyCoachingService.getSessionsByCompany).mockResolvedValue(sessions);

      await store.dispatch(fetchSessionsByCompany('TechCorp'));

      const state = store.getState().companyCoaching;
      expect(state.sessions[1]).toEqual(mockSession);
      expect(state.sessions[3]).toBeDefined();
    });

    it('should not modify userSessions array', async () => {
      const store = createTestStore();
      
      // Set up initial userSessions
      vi.mocked(companyCoachingService.getUserSessions).mockResolvedValue([mockSession2]);
      await store.dispatch(fetchUserSessions());

      // Fetch by company
      vi.mocked(companyCoachingService.getSessionsByCompany).mockResolvedValue([mockSession]);
      await store.dispatch(fetchSessionsByCompany('TechCorp'));

      const state = store.getState().companyCoaching;
      expect(state.userSessions).toEqual([mockSession2]);
    });
  });

  describe('setCurrentSession reducer', () => {
    it('should set current session', () => {
      const store = createTestStore();

      store.dispatch(setCurrentSession(mockSession));

      const state = store.getState().companyCoaching;
      expect(state.currentSession).toEqual(mockSession);
    });

    it('should clear current session when set to null', () => {
      const store = createTestStore();

      // Set a session
      store.dispatch(setCurrentSession(mockSession));
      expect(store.getState().companyCoaching.currentSession).toEqual(mockSession);

      // Clear it
      store.dispatch(setCurrentSession(null));
      expect(store.getState().companyCoaching.currentSession).toBe(null);
    });

    it('should replace existing current session', () => {
      const store = createTestStore();

      store.dispatch(setCurrentSession(mockSession));
      expect(store.getState().companyCoaching.currentSession?.id).toBe(1);

      store.dispatch(setCurrentSession(mockSession2));
      expect(store.getState().companyCoaching.currentSession?.id).toBe(2);
    });
  });

  describe('clearError reducer', () => {
    it('should clear error', async () => {
      const store = createTestStore();

      // Create an error
      vi.mocked(companyCoachingService.getSession).mockRejectedValue(
        new Error('Test error')
      );
      await store.dispatch(fetchSession(1));

      expect(store.getState().companyCoaching.error).toBe('Test error');

      // Clear error
      store.dispatch(clearError());

      const state = store.getState().companyCoaching;
      expect(state.error).toBe(null);
    });

    it('should not affect other state properties', async () => {
      const store = createTestStore();

      // Set up some state
      vi.mocked(companyCoachingService.createSession).mockResolvedValue(mockSession);
      await store.dispatch(createSession(mockCreateRequest));

      // Create an error
      vi.mocked(companyCoachingService.getSession).mockRejectedValue(
        new Error('Test error')
      );
      await store.dispatch(fetchSession(2));

      // Clear error
      store.dispatch(clearError());

      const state = store.getState().companyCoaching;
      expect(state.error).toBe(null);
      expect(state.sessions[1]).toEqual(mockSession);
      expect(state.currentSession).toEqual(mockSession);
    });

    it('should work when no error exists', () => {
      const store = createTestStore();

      store.dispatch(clearError());

      const state = store.getState().companyCoaching;
      expect(state.error).toBe(null);
    });
  });

  describe('state transitions', () => {
    it('should handle loading state transitions correctly', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.getSession).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockSession), 100))
      );

      // Start loading
      const promise = store.dispatch(fetchSession(1));
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(store.getState().companyCoaching.isLoading).toBe(true);

      // Complete loading
      await promise;
      expect(store.getState().companyCoaching.isLoading).toBe(false);
    });

    it('should handle generating state transitions correctly', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.createSession).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockSession), 100))
      );

      // Start generating
      const promise = store.dispatch(createSession(mockCreateRequest));
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(store.getState().companyCoaching.isGenerating).toBe(true);

      // Complete generating
      await promise;
      expect(store.getState().companyCoaching.isGenerating).toBe(false);
    });

    it('should not mix isLoading and isGenerating states', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.getSession).mockImplementation(
        () => new Promise(() => {})
      );
      vi.mocked(companyCoachingService.createSession).mockImplementation(
        () => new Promise(() => {})
      );

      // Start fetch (isLoading)
      store.dispatch(fetchSession(1));
      await new Promise(resolve => setTimeout(resolve, 0));
      
      let state = store.getState().companyCoaching;
      expect(state.isLoading).toBe(true);
      expect(state.isGenerating).toBe(false);

      // Start create (isGenerating)
      store.dispatch(createSession(mockCreateRequest));
      await new Promise(resolve => setTimeout(resolve, 0));

      state = store.getState().companyCoaching;
      expect(state.isLoading).toBe(true);
      expect(state.isGenerating).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid successive calls', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.getSession)
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce(mockSession2);

      // Dispatch multiple calls rapidly
      const promise1 = store.dispatch(fetchSession(1));
      const promise2 = store.dispatch(fetchSession(2));

      await Promise.all([promise1, promise2]);

      const state = store.getState().companyCoaching;
      expect(state.sessions[1]).toEqual(mockSession);
      expect(state.sessions[2]).toEqual(mockSession2);
    });

    it('should handle mixed success and failure', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.getSession)
        .mockResolvedValueOnce(mockSession)
        .mockRejectedValueOnce(new Error('Failed'));

      await store.dispatch(fetchSession(1));
      await store.dispatch(fetchSession(2));

      const state = store.getState().companyCoaching;
      expect(state.sessions[1]).toEqual(mockSession);
      expect(state.sessions[2]).toBeUndefined();
      expect(state.error).toBe('Failed');
    });

    it('should preserve sessions when fetch fails', async () => {
      const store = createTestStore();
      
      // First, successfully create a session
      vi.mocked(companyCoachingService.createSession).mockResolvedValue(mockSession);
      await store.dispatch(createSession(mockCreateRequest));

      // Then, fail to fetch another
      vi.mocked(companyCoachingService.getSession).mockRejectedValue(
        new Error('Fetch failed')
      );
      await store.dispatch(fetchSession(2));

      const state = store.getState().companyCoaching;
      expect(state.sessions[1]).toEqual(mockSession);
      expect(state.error).toBe('Fetch failed');
    });

    it('should handle creating multiple sessions', async () => {
      const store = createTestStore();
      
      // Create first session
      vi.mocked(companyCoachingService.createSession).mockResolvedValue(mockSession);
      await store.dispatch(createSession(mockCreateRequest));

      expect(store.getState().companyCoaching.currentSession?.id).toBe(1);

      // Create second session (should replace current)
      vi.mocked(companyCoachingService.createSession).mockResolvedValue(mockSession2);
      await store.dispatch(createSession(mockCreateRequest));

      const state = store.getState().companyCoaching;
      expect(state.currentSession?.id).toBe(2);
      expect(state.sessions[1]).toEqual(mockSession);
      expect(state.sessions[2]).toEqual(mockSession2);
      expect(state.userSessions).toHaveLength(2);
    });

    it('should handle fetching sessions when none exist', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.getUserSessions).mockResolvedValue([]);

      await store.dispatch(fetchUserSessions());

      const state = store.getState().companyCoaching;
      expect(state.userSessions).toEqual([]);
      expect(state.error).toBe(null);
    });

    it('should handle company filter with no results', async () => {
      const store = createTestStore();
      
      vi.mocked(companyCoachingService.getSessionsByCompany).mockResolvedValue([]);

      await store.dispatch(fetchSessionsByCompany('NonExistentCorp'));

      const state = store.getState().companyCoaching;
      expect(Object.keys(state.sessions)).toHaveLength(0);
      expect(state.error).toBe(null);
    });
  });
});
