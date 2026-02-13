/**
 * Interview Slice
 * Interview session state management
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface Question {
  id: number;
  question_text: string;
  category: string;
  difficulty: string;
  time_limit_seconds: number;
  question_number: number;
}

interface InterviewSession {
  session_id: number;
  role: string;
  difficulty: string;
  status: string;
  question_count: number;
  categories: string[] | null;
  start_time: string;
  current_question: Question | null;
}

interface InterviewState {
  currentSession: InterviewSession | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: InterviewState = {
  currentSession: null,
  isLoading: false,
  error: null,
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    setCurrentSession: (state, action: PayloadAction<InterviewSession | null>) => {
      state.currentSession = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearInterviewError: (state) => {
      state.error = null;
    },
    clearSession: (state) => {
      state.currentSession = null;
      state.error = null;
    },
  },
});

export const {
  setCurrentSession,
  setLoading,
  setError,
  clearInterviewError,
  clearSession,
} = interviewSlice.actions;
export default interviewSlice.reducer;
