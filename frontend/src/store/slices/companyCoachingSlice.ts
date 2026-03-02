/**
 * Company Coaching Slice
 * State management for AI-powered company-specific interview coaching
 * 
 * Requirements: INT-1.4
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import companyCoachingService from '../../services/companyCoachingService';
import type {
  CoachingSession,
  CreateCoachingSessionRequest,
} from '../../services/companyCoachingService';

interface CompanyCoachingState {
  // Coaching sessions keyed by session_id
  sessions: Record<number, CoachingSession>;
  // List of user's sessions
  userSessions: CoachingSession[];
  // Currently active session
  currentSession: CoachingSession | null;
  // Loading state for fetching
  isLoading: boolean;
  // Loading state for generating new session
  isGenerating: boolean;
  // Error message
  error: string | null;
}

const initialState: CompanyCoachingState = {
  sessions: {},
  userSessions: [],
  currentSession: null,
  isLoading: false,
  isGenerating: false,
  error: null,
};

// Async thunks

/**
 * Create a new coaching session
 */
export const createSession = createAsyncThunk<
  CoachingSession,
  CreateCoachingSessionRequest
>(
  'companyCoaching/create',
  async (request, { rejectWithValue }) => {
    try {
      return await companyCoachingService.createSession(request);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to create coaching session');
    }
  }
);

/**
 * Fetch a specific coaching session
 */
export const fetchSession = createAsyncThunk<CoachingSession, number>(
  'companyCoaching/fetch',
  async (sessionId, { rejectWithValue }) => {
    try {
      return await companyCoachingService.getSession(sessionId);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch coaching session');
    }
  }
);

/**
 * Fetch user's coaching sessions
 */
export const fetchUserSessions = createAsyncThunk<
  CoachingSession[],
  number | undefined
>(
  'companyCoaching/fetchUserSessions',
  async (limit, { rejectWithValue }) => {
    try {
      return await companyCoachingService.getUserSessions(limit);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch user sessions');
    }
  }
);

/**
 * Fetch coaching sessions by company
 */
export const fetchSessionsByCompany = createAsyncThunk<
  CoachingSession[],
  string
>(
  'companyCoaching/fetchByCompany',
  async (companyName, { rejectWithValue }) => {
    try {
      return await companyCoachingService.getSessionsByCompany(companyName);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch sessions by company');
    }
  }
);

const companyCoachingSlice = createSlice({
  name: 'companyCoaching',
  initialState,
  reducers: {
    setCurrentSession: (state, action: PayloadAction<CoachingSession | null>) => {
      state.currentSession = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create session
    builder
      .addCase(createSession.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.isGenerating = false;
        const session = action.payload;
        state.sessions[session.id] = session;
        state.currentSession = session;
        // Add to user sessions if not already present
        if (!state.userSessions.find(s => s.id === session.id)) {
          state.userSessions.unshift(session);
        }
      })
      .addCase(createSession.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
      });

    // Fetch session
    builder
      .addCase(fetchSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.isLoading = false;
        const session = action.payload;
        state.sessions[session.id] = session;
        state.currentSession = session;
      })
      .addCase(fetchSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch user sessions
    builder
      .addCase(fetchUserSessions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserSessions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userSessions = action.payload;
        // Update sessions record
        action.payload.forEach(session => {
          state.sessions[session.id] = session;
        });
      })
      .addCase(fetchUserSessions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch sessions by company
    builder
      .addCase(fetchSessionsByCompany.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSessionsByCompany.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update sessions record
        action.payload.forEach(session => {
          state.sessions[session.id] = session;
        });
      })
      .addCase(fetchSessionsByCompany.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentSession, clearError } = companyCoachingSlice.actions;
export default companyCoachingSlice.reducer;
