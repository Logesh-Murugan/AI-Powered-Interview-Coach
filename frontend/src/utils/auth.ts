/**
 * Auth Utilities
 * Token validation and refresh logic
 */

import { jwtDecode } from 'jwt-decode';
import { APP_CONFIG } from '../config/app.config';
import { API_CONFIG } from '../config/api.config';
import axios from 'axios';

interface JwtPayload {
  exp: number;
  sub: string;
  type?: string;
}

interface RefreshResponse {
  access_token: string;
  token_type: string;
}

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Date.now() / 1000;
    
    // Token is expired if exp is less than current time
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
};

/**
 * Check if token will expire soon (within 5 minutes)
 */
export const isTokenExpiringSoon = (token: string | null): boolean => {
  if (!token) return true;

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Date.now() / 1000;
    const fiveMinutes = 5 * 60;
    
    return decoded.exp < currentTime + fiveMinutes;
  } catch {
    return true;
  }
};

/**
 * Get token expiration time
 */
export const getTokenExpiration = (token: string | null): Date | null => {
  if (!token) return null;

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
};

/**
 * Validate access token
 */
export const validateAccessToken = (): boolean => {
  const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  return !isTokenExpired(token);
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);

  if (!refreshToken || isTokenExpired(refreshToken)) {
    clearAuthTokens();
    return null;
  }

  try {
    const response = await axios.post<RefreshResponse>(
      `${API_CONFIG.BASE_URL}/auth/refresh`,
      { refresh_token: refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const { access_token } = response.data;
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, access_token);
    
    return access_token;
  } catch (error) {
    clearAuthTokens();
    return null;
  }
};

/**
 * Clear all auth tokens from storage
 */
export const clearAuthTokens = (): void => {
  localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER);
};

/**
 * Check if user is authenticated with valid token
 */
export const isAuthenticated = (): boolean => {
  const accessToken = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);

  // Must have both tokens
  if (!accessToken || !refreshToken) {
    return false;
  }

  // Access token must be valid or refresh token must be valid
  return !isTokenExpired(accessToken) || !isTokenExpired(refreshToken);
};

/**
 * Get current user from storage
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};
