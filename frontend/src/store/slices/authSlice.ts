/**
 * Auth Slice
 * Authentication state management
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api.config';
import { APP_CONFIG } from '../../config/app.config';
import { userService, type UpdateProfileRequest, type UserProfile } from '../../services/userService';
import { getAuthTokensFromStorage, clearAuthStorage } from '../../utils/authStateSync';

interface User {
  id: number;
  email: string;
  name: string;
  target_role?: string;
  experience_level?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  registrationSuccess: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

interface RegisterResponse {
  message: string;
  user: User;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

const initialState: AuthState = (() => {
  const tokens = getAuthTokensFromStorage();
  return {
    user: tokens.user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    isAuthenticated: !!(tokens.accessToken && tokens.refreshToken && tokens.user),
    isLoading: false,
    error: null,
    registrationSuccess: false,
  };
})();

// Async thunks
export const login = createAsyncThunk<AuthResponse, LoginCredentials>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiService.post<AuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );
      return response.data;
    } catch (error: any) {
      const message = error?.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const register = createAsyncThunk<RegisterResponse, RegisterData>(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const response = await apiService.post<RegisterResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        data
      );
      return response.data;
    } catch (error: any) {
      const message = error?.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
  } catch {
    // Continue with logout even if API call fails
    return rejectWithValue('Logout API call failed');
  }
});

export const updateProfile = createAsyncThunk<UserProfile, UpdateProfileRequest>(
  'auth/updateProfile',
  async (request, { rejectWithValue }) => {
    try {
      const response = await userService.updateProfile(request);
      return response;
    } catch (error: any) {
      const message = error?.message || 'Profile update failed';
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      
      // Persist to localStorage
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER, JSON.stringify(action.payload.user));
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, action.payload.accessToken);
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, action.payload.refreshToken);
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      
      // Clear localStorage
      clearAuthStorage();
    },
    clearError: (state) => {
      state.error = null;
    },
    resetRegistrationSuccess: (state) => {
      state.registrationSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.isAuthenticated = true;
        
        // Persist to localStorage
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER, JSON.stringify(action.payload.user));
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, action.payload.access_token);
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, action.payload.refresh_token);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.registrationSuccess = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        
        // Clear localStorage
        clearAuthStorage();
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        // Still clear credentials even if logout fails
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        
        clearAuthStorage();
      });

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        
        // Update localStorage
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER, JSON.stringify(action.payload));
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCredentials, clearCredentials, clearError, resetRegistrationSuccess } = authSlice.actions;
export default authSlice.reducer;
