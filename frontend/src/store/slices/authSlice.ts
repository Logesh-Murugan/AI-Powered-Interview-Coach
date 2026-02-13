/**
 * Auth Slice
 * Authentication state management
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api.config';
import { APP_CONFIG } from '../../config/app.config';

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

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER) || 'null'),
  accessToken: localStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN),
  refreshToken: localStorage.getItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN),
  isAuthenticated: !!localStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN),
  isLoading: false,
  error: null,
};

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
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Login failed');
    }
  }
);

export const register = createAsyncThunk<AuthResponse, RegisterData>(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const response = await apiService.post<AuthResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        data
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Registration failed');
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
      localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER);
      localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    },
    clearError: (state) => {
      state.error = null;
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
        state.user = action.payload.user;
        state.accessToken = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.isAuthenticated = true;
        
        // Persist to localStorage
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER, JSON.stringify(action.payload.user));
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, action.payload.access_token);
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, action.payload.refresh_token);
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
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER);
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        // Still clear credentials even if logout fails
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER);
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
      });
  },
});

export const { setCredentials, clearCredentials, clearError } = authSlice.actions;
export default authSlice.reducer;
