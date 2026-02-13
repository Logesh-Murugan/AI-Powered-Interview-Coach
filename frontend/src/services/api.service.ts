/**
 * API Service
 * Axios instance with interceptors for authentication and error handling
 */

import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/api.config';
import { APP_CONFIG } from '../config/app.config';

interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.api(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(this.handleError(err));
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          const refreshToken = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);

          if (!refreshToken) {
            this.handleLogout();
            return Promise.reject(this.handleError(error));
          }

          try {
            const response = await axios.post(
              `${API_CONFIG.BASE_URL}/auth/refresh`,
              { refresh_token: refreshToken }
            );

            const { access_token } = response.data;
            localStorage.setItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, access_token);

            this.processQueue(null);
            this.isRefreshing = false;

            return this.api(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError);
            this.handleLogout();
            return Promise.reject(this.handleError(refreshError));
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string; detail?: string }>;
      
      // Network error
      if (!axiosError.response) {
        return {
          message: 'Network error. Please check your connection.',
          code: 'NETWORK_ERROR',
        };
      }

      // Server error with response
      const status = axiosError.response.status;
      const data = axiosError.response.data;
      
      let message = 'An error occurred. Please try again.';
      
      if (data?.message) {
        message = data.message;
      } else if (data?.detail) {
        message = data.detail;
      } else {
        switch (status) {
          case 400:
            message = 'Invalid request. Please check your input.';
            break;
          case 401:
            message = 'Authentication required. Please log in.';
            break;
          case 403:
            message = 'Access denied. You do not have permission.';
            break;
          case 404:
            message = 'Resource not found.';
            break;
          case 409:
            message = 'Conflict. Resource already exists.';
            break;
          case 422:
            message = 'Validation error. Please check your input.';
            break;
          case 429:
            message = 'Too many requests. Please try again later.';
            break;
          case 500:
            message = 'Server error. Please try again later.';
            break;
          case 503:
            message = 'Service unavailable. Please try again later.';
            break;
        }
      }

      return {
        message,
        status,
        code: axiosError.code,
        details: data,
      };
    }

    // Non-Axios error
    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'UNKNOWN_ERROR',
      };
    }

    return {
      message: 'An unexpected error occurred.',
      code: 'UNKNOWN_ERROR',
    };
  }

  private processQueue(error: unknown): void {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve();
      }
    });

    this.failedQueue = [];
  }

  private handleLogout(): void {
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER);
    window.location.href = '/login';
  }

  // HTTP Methods
  public get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  public post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  public put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  public patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.patch<T>(url, data, config);
  }

  public delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }
}

export const apiService = new ApiService();
export default apiService;
export type { ApiError };
