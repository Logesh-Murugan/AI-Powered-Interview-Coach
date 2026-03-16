/**
 * Study Plan Slice
 * State management for AI-powered study plan generation
 * 
 * Requirements: INT-1.4
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import studyPlanService from '../../services/studyPlanService';
import type {
  StudyPlan,
  CreateStudyPlanRequest,
  UpdateProgressRequest,
} from '../../services/studyPlanService';

interface StudyPlanState {
  // Study plans keyed by plan_id
  plans: Record<number, StudyPlan>;
  // Currently active plan
  activePlan: StudyPlan | null;
  // Loading state for fetching
  isLoading: boolean;
  // Loading state for generating new plan
  isGenerating: boolean;
  // Error message
  error: string | null;
}

const initialState: StudyPlanState = {
  plans: {},
  activePlan: null,
  isLoading: false,
  isGenerating: false,
  error: null,
};

// Async thunks

/**
 * Create a new study plan
 */
export const createStudyPlan = createAsyncThunk<
  StudyPlan,
  CreateStudyPlanRequest
>(
  'studyPlan/create',
  async (request, { rejectWithValue }) => {
    try {
      return await studyPlanService.createStudyPlan(request);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to create study plan');
    }
  }
);

/**
 * Fetch a specific study plan
 */
export const fetchStudyPlan = createAsyncThunk<StudyPlan, number>(
  'studyPlan/fetch',
  async (planId, { rejectWithValue }) => {
    try {
      return await studyPlanService.getStudyPlan(planId);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch study plan');
    }
  }
);

/**
 * Fetch the active study plan
 */
export const fetchActivePlan = createAsyncThunk<StudyPlan | null, void>(
  'studyPlan/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      return await studyPlanService.getActiveStudyPlan();
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch active study plan');
    }
  }
);

/**
 * Update study plan progress
 */
export const updateProgress = createAsyncThunk<
  StudyPlan,
  { planId: number; request: UpdateProgressRequest }
>(
  'studyPlan/updateProgress',
  async ({ planId, request }, { rejectWithValue }) => {
    try {
      return await studyPlanService.updateProgress(planId, request);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to update progress');
    }
  }
);

/**
 * Abandon a study plan
 */
export const abandonPlan = createAsyncThunk<number, number>(
  'studyPlan/abandon',
  async (planId, { rejectWithValue }) => {
    try {
      await studyPlanService.abandonPlan(planId);
      return planId;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to abandon study plan');
    }
  }
);

const studyPlanSlice = createSlice({
  name: 'studyPlan',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create study plan
    builder
      .addCase(createStudyPlan.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(createStudyPlan.fulfilled, (state, action) => {
        state.isGenerating = false;
        const plan = action.payload;
        state.plans[plan.id] = plan;
        state.activePlan = plan;
      })
      .addCase(createStudyPlan.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
      });

    // Fetch study plan
    builder
      .addCase(fetchStudyPlan.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudyPlan.fulfilled, (state, action) => {
        state.isLoading = false;
        const plan = action.payload;
        state.plans[plan.id] = plan;
      })
      .addCase(fetchStudyPlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch active plan
    builder
      .addCase(fetchActivePlan.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActivePlan.fulfilled, (state, action) => {
        state.isLoading = false;
        const plan = action.payload;
        if (plan) {
          state.plans[plan.id] = plan;
          state.activePlan = plan;
        } else {
          state.activePlan = null;
        }
      })
      .addCase(fetchActivePlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.activePlan = null;
      });

    // Update progress
    builder
      .addCase(updateProgress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        const plan = action.payload;
        state.plans[plan.id] = plan;
        if (state.activePlan?.id === plan.id) {
          state.activePlan = plan;
        }
      })
      .addCase(updateProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Abandon plan
    builder
      .addCase(abandonPlan.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(abandonPlan.fulfilled, (state, action) => {
        state.isLoading = false;
        const planId = action.payload;
        if (state.plans[planId]) {
          state.plans[planId].status = 'abandoned';
        }
        if (state.activePlan?.id === planId) {
          state.activePlan = null;
        }
      })
      .addCase(abandonPlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = studyPlanSlice.actions;
export default studyPlanSlice.reducer;
