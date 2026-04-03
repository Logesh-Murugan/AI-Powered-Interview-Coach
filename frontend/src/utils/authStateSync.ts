/**
 * Authentication State Synchronization Utility
 * Ensures Redux state and localStorage are in sync
 */

import { APP_CONFIG } from '../config/app.config';

export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
  user: any | null;
}

/**
 * Get authentication tokens from localStorage
 */
export const getAuthTokensFromStorage = (): AuthTokens => {
  try {
    const accessToken = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    const userStr = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER);
    
    let user = null;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch {
        // Invalid JSON, clear it
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER);
      }
    }
    
    return {
      accessToken,
      refreshToken,
      user,
    };
  } catch {
    return {
      accessToken: null,
      refreshToken: null,
      user: null,
    };
  }
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthStorage = (): void => {
  localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER);
};

/**
 * Check if user has valid authentication tokens
 */
export const hasValidAuthTokens = (): boolean => {
  const { accessToken, refreshToken } = getAuthTokensFromStorage();
  return !!(accessToken && refreshToken);
};