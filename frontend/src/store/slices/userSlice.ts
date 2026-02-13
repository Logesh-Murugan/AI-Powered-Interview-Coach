/**
 * User Slice
 * User profile state management
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api.config';

interface UserProfile {
  id: number;
  email: string;
  name: string;
  target_role?: string;
  experience_level?: string;
  created_at: string;
  updated_at: string;
}

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
};

export const fetchUserProfile = createAsyncThunk<UserProfile>(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get<UserProfile>(API_ENDPOINTS.USERS.ME);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk<UserProfile, Partial<UserProfile>>(
  'user/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const response = await apiService.put<UserProfile>(
        API_ENDPOINTS.USERS.UPDATE_PROFILE,
        data
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to update profile');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;
