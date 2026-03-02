import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getErrorMessage,
  getValidationErrors,
  isNetworkError,
  isTimeoutError,
  isValidationError,
  logError,
} from '../errorMessages';

describe('errorMessages utility', () => {
  describe('getErrorMessage', () => {
    it('should return default message for null/undefined', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred. Please try again.');
    });

    it('should map network errors to connection message', () => {
      const networkError = {
        message: 'Network Error',
      };
      expect(getErrorMessage(networkError)).toBe('Network error. Please check your connection.');
    });

    it('should map 401 errors to authentication message', () => {
      const error401 = {
        response: { status: 401 },
      };
      expect(getErrorMessage(error401)).toBe('Authentication required. Please log in.');
    });

    it('should map 403 errors to permission message', () => {
      const error403 = {
        response: { status: 403 },
      };
      expect(getErrorMessage(error403)).toBe('Access denied. You do not have permission.');
    });

    it('should map 404 errors to not found message', () => {
      const error404 = {
        response: { status: 404 },
      };
      expect(getErrorMessage(error404)).toBe('Resource not found.');
    });

    it('should map 408 errors to timeout message', () => {
      const error408 = {
        response: { status: 408 },
      };
      expect(getErrorMessage(error408)).toBe('Request timed out. The AI agent took too long to respond.');
    });

    it('should map 422 errors with field errors to specific validation messages', () => {
      const error422 = {
        response: {
          status: 422,
          data: {
            errors: {
              name: ['Name is required', 'Name must be at least 2 characters'],
              email: ['Invalid email format'],
            },
          },
        },
      };
      const message = getErrorMessage(error422);
      expect(message).toContain('name:');
      expect(message).toContain('Name is required');
      expect(message).toContain('email:');
      expect(message).toContain('Invalid email format');
    });

    it('should map 422 errors without field errors to generic validation message', () => {
      const error422 = {
        response: {
          status: 422,
          data: {
            detail: 'Invalid input data',
          },
        },
      };
      expect(getErrorMessage(error422)).toBe('Invalid input data.');
    });

    it('should map 422 errors with no detail to fallback message', () => {
      const error422 = {
        response: {
          status: 422,
        },
      };
      expect(getErrorMessage(error422)).toBe('Validation error. Please check your input.');
    });

    it('should map 429 errors to rate limit message', () => {
      const error429 = {
        response: { status: 429 },
      };
      expect(getErrorMessage(error429)).toBe('Too many requests. Please try again later.');
    });

    it('should map 500 errors to server error message', () => {
      const error500 = {
        response: { status: 500 },
      };
      expect(getErrorMessage(error500)).toBe('Server error. Please try again later.');
    });

    it('should map 503 errors to service unavailable message', () => {
      const error503 = {
        response: { status: 503 },
      };
      expect(getErrorMessage(error503)).toBe('Service temporarily unavailable. Please try again later.');
    });

    it('should extract message from response data detail', () => {
      const error = {
        response: {
          status: 400,
          data: {
            detail: 'Custom error message',
          },
        },
      };
      expect(getErrorMessage(error)).toBe('Custom error message.');
    });

    it('should extract message from response data message', () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: 'Another custom message',
          },
        },
      };
      expect(getErrorMessage(error)).toBe('Another custom message.');
    });

    it('should extract message from error message property', () => {
      const error = {
        message: 'Direct error message',
      };
      expect(getErrorMessage(error)).toBe('Direct error message.');
    });

    it('should return default message for unknown error types', () => {
      const error = {
        someProperty: 'value',
      };
      expect(getErrorMessage(error)).toBe('An unexpected error occurred. Please try again.');
    });

    it('should handle status from error.status property', () => {
      const error = {
        status: 500,
      };
      expect(getErrorMessage(error)).toBe('Server error. Please try again later.');
    });
  });

  describe('getValidationErrors', () => {
    it('should extract validation errors from 422 response', () => {
      const error422 = {
        response: {
          status: 422,
          data: {
            errors: {
              name: ['Name is required'],
              email: ['Invalid email'],
            },
          },
        },
      };
      const validationErrors = getValidationErrors(error422);
      expect(validationErrors).toEqual({
        name: ['Name is required'],
        email: ['Invalid email'],
      });
    });

    it('should return null for non-422 errors', () => {
      const error500 = {
        response: { status: 500 },
      };
      expect(getValidationErrors(error500)).toBeNull();
    });

    it('should return null for 422 without errors object', () => {
      const error422 = {
        response: {
          status: 422,
          data: {
            detail: 'Validation failed',
          },
        },
      };
      expect(getValidationErrors(error422)).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(getValidationErrors(null)).toBeNull();
      expect(getValidationErrors(undefined)).toBeNull();
    });
  });

  describe('isNetworkError', () => {
    it('should return true for network errors', () => {
      const networkError = {
        message: 'Network Error',
      };
      expect(isNetworkError(networkError)).toBe(true);
    });

    it('should return true for connection errors', () => {
      const connectionError = {
        message: 'Connection failed',
      };
      expect(isNetworkError(connectionError)).toBe(true);
    });

    it('should return false for errors with response', () => {
      const error = {
        message: 'Network Error',
        response: { status: 500 },
      };
      expect(isNetworkError(error)).toBe(false);
    });

    it('should return false for non-network errors', () => {
      const error = {
        message: 'Some other error',
      };
      expect(isNetworkError(error)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(undefined)).toBe(false);
    });
  });

  describe('isTimeoutError', () => {
    it('should return true for 408 status', () => {
      const error408 = {
        response: { status: 408 },
      };
      expect(isTimeoutError(error408)).toBe(true);
    });

    it('should return true for timeout message', () => {
      const timeoutError = {
        message: 'Request timeout',
      };
      expect(isTimeoutError(timeoutError)).toBe(true);
    });

    it('should return false for non-timeout errors', () => {
      const error = {
        response: { status: 500 },
      };
      expect(isTimeoutError(error)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isTimeoutError(null)).toBe(false);
      expect(isTimeoutError(undefined)).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('should return true for 422 status', () => {
      const error422 = {
        response: { status: 422 },
      };
      expect(isValidationError(error422)).toBe(true);
    });

    it('should return false for non-422 errors', () => {
      const error500 = {
        response: { status: 500 },
      };
      expect(isValidationError(error500)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isValidationError(null)).toBe(false);
      expect(isValidationError(undefined)).toBe(false);
    });
  });

  describe('logError', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should log error to console', () => {
      const error = {
        message: 'Test error',
      };
      logError(error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log error with context', () => {
      const error = {
        message: 'Test error',
      };
      logError(error, 'TestContext');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestContext]'),
        expect.anything(),
        expect.anything()
      );
    });

    it('should log status code if present', () => {
      const error = {
        response: { status: 500 },
      };
      logError(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.anything(),
        'Status:',
        500
      );
    });

    it('should log response data if present', () => {
      const error = {
        response: {
          status: 422,
          data: { errors: { name: ['Required'] } },
        },
      };
      logError(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.anything(),
        'Response data:',
        expect.objectContaining({ errors: { name: ['Required'] } })
      );
    });

    it('should log stack trace if present', () => {
      const error = new Error('Test error');
      logError(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.anything(),
        'Stack trace:',
        expect.stringContaining('Error: Test error')
      );
    });
  });
});
