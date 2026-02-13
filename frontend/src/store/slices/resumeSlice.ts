/**
 * Resume Slice
 * Resume management state
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface Resume {
  id: string;
  filename: string;
  status: 'pending' | 'parsed' | 'failed';
  created_at: string;
}

interface ResumeState {
  resumes: Resume[];
  currentResume: Resume | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ResumeState = {
  resumes: [],
  currentResume: null,
  isLoading: false,
  error: null,
};

const resumeSlice = createSlice({
  name: 'resume',
  initialState,
  reducers: {
    setResumes: (state, action: PayloadAction<Resume[]>) => {
      state.resumes = action.payload;
    },
    setCurrentResume: (state, action: PayloadAction<Resume | null>) => {
      state.currentResume = action.payload;
    },
    clearResumeError: (state) => {
      state.error = null;
    },
  },
});

export const { setResumes, setCurrentResume, clearResumeError } = resumeSlice.actions;
export default resumeSlice.reducer;
