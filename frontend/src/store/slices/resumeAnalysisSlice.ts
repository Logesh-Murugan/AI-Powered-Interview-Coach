/**
 * Resume Analysis Slice
 * State management for AI-powered resume analysis
 * 
 * Requirements: INT-1.4
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import resumeAnalysisService from '../../services/resumeAnalysisService';
import type {
  ResumeAnalysis,
  AnalyzeResumeRequest,
  AnalysisHistoryResponse,
} from '../../services/resumeAnalysisService';

interface ResumeAnalysisState {
  // Analyses keyed by resume_id
  analyses: Record<number, ResumeAnalysis>;
  // Currently active analysis
  currentAnalysis: ResumeAnalysis | null;
  // Analysis history keyed by resume_id
  history: Record<number, ResumeAnalysis[]>;
  // Loading state for fetching
  isLoading: boolean;
  // Loading state for generating new analysis
  isGenerating: boolean;
  // Error message (non-404/ready errors)
  error: string | null;
}

const initialState: ResumeAnalysisState = {
  analyses: {},
  currentAnalysis: null,
  history: {},
  isLoading: false,
  isGenerating: false,
  error: null,
};

// Async thunks

/**
 * Trigger resume analysis
 */
export const analyzeResume = createAsyncThunk<
  ResumeAnalysis,
  { resumeId: number; request: AnalyzeResumeRequest },
  { rejectValue: { status?: number; message?: string } }
>(
  'resumeAnalysis/analyze',
  async ({ resumeId, request }, { rejectWithValue }) => {
    try {
      return await resumeAnalysisService.analyzeResume(resumeId, request);
    } catch (error: any) {
      if (error?.status === 404) {
        return rejectWithValue({ status: 404, message: 'Analysis not ready yet' });
      }
      if (typeof error?.message === 'string' && error.message.includes('not ready for analysis')) {
        return rejectWithValue({ status: 400, message: error.message });
      }
      if (error instanceof Error) {
        return rejectWithValue({ message: error.message });
      }
      return rejectWithValue({ message: 'Failed to analyze resume' });
    }
  }
);

/**
 * Fetch latest analysis for resume
 */
export const fetchAnalysis = createAsyncThunk<
  ResumeAnalysis,
  number,
  { rejectValue: { status?: number; message?: string } }
>(
  'resumeAnalysis/fetch',
  async (resumeId, { rejectWithValue }) => {
    try {
      return await resumeAnalysisService.getAnalysis(resumeId);
    } catch (error: any) {
      if (error?.status === 404) {
        return rejectWithValue({ status: 404, message: 'Analysis not ready yet' });
      }
      if (typeof error?.message === 'string' && error.message.includes('not ready for analysis')) {
        return rejectWithValue({ status: 400, message: error.message });
      }
      if (error instanceof Error) {
        return rejectWithValue({ message: error.message });
      }
      return rejectWithValue({ message: 'Failed to fetch analysis' });
    }
  }
);

/**
 * Fetch analysis history for resume
 */
export const fetchHistory = createAsyncThunk<
  AnalysisHistoryResponse & { resumeId: number },
  { resumeId: number; limit?: number },
  { rejectValue: { status?: number; message?: string } }
>(
  'resumeAnalysis/fetchHistory',
  async ({ resumeId, limit }, { rejectWithValue }) => {
    try {
      const response = await resumeAnalysisService.getAnalysisHistory(resumeId, limit);
      return { ...response, resumeId };
    } catch (error: any) {
      if (error?.status === 404) {
        return rejectWithValue({ status: 404, message: 'Analysis history not ready yet' });
      }
      if (typeof error?.message === 'string' && error.message.includes('not ready for analysis')) {
        return rejectWithValue({ status: 400, message: error.message });
      }
      if (error instanceof Error) {
        return rejectWithValue({ message: error.message });
      }
      return rejectWithValue({ message: 'Failed to fetch analysis history' });
    }
  }
);

const resumeAnalysisSlice = createSlice({
  name: 'resumeAnalysis',
  initialState,
  reducers: {
    setCurrentAnalysis: (state, action: PayloadAction<ResumeAnalysis | null>) => {
      state.currentAnalysis = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Analyze resume
    builder
      .addCase(analyzeResume.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(analyzeResume.fulfilled, (state, action) => {
        state.isGenerating = false;
        const analysis = action.payload;
        state.analyses[analysis.resume_id] = analysis;
        state.currentAnalysis = analysis;
      })
      .addCase(analyzeResume.rejected, (state, action) => {
        state.isGenerating = false;
        const payload = action.payload as { status?: number; message?: string } | undefined;
        if (payload?.status === 404 || payload?.status === 400) {
          state.isGenerating = true;
          state.error = null;
        } else {
          state.error = payload?.message ?? 'Failed to analyze resume';
        }
      });

    // Fetch analysis
    builder
      .addCase(fetchAnalysis.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalysis.fulfilled, (state, action) => {
        state.isLoading = false;
        const analysis = action.payload;
        state.analyses[analysis.resume_id] = analysis;
        state.currentAnalysis = analysis;
      })
      .addCase(fetchAnalysis.rejected, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as { status?: number; message?: string } | undefined;
        if (payload?.status === 404 || payload?.status === 400) {
          state.error = null;
          state.currentAnalysis = null;
          state.isGenerating = true;
        } else {
          state.error = payload?.message ?? 'Failed to fetch analysis';
        }
      });

    // Fetch history
    builder
      .addCase(fetchHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        const { resumeId, analyses } = action.payload;
        state.history[resumeId] = analyses;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as { status?: number; message?: string } | undefined;
        if (payload?.status === 404) {
          state.error = null;
        } else {
          state.error = payload?.message ?? 'Failed to fetch analysis history';
        }
      });
  },
});

export const { setCurrentAnalysis, clearError } = resumeAnalysisSlice.actions;
export default resumeAnalysisSlice.reducer;
