/**
 * Error message mapping utility
 * Maps different error types to user-friendly messages
 */

export interface ApiError {
  message?: string;
  status?: number;
  code?: string;
  details?: unknown;
  response?: {
    status?: number;
    data?: {
      message?: string;
      detail?: string;
      errors?: Record<string, string[]>;
    };
  };
}

/**
 * Maps an error object to a user-friendly error message
 * @param error - The error object from an API call or other source
 * @returns A user-friendly error message string
 */
export function getErrorMessage(error: unknown): string {
  // Handle null/undefined
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  const apiError = error as ApiError;

  // Check if it's a network error (no response from server)
  if (!apiError.response && apiError.message?.toLowerCase().includes('network')) {
    return 'Network error. Please check your connection.';
  }

  // Get status code from error object
  const status = apiError.status || apiError.response?.status;

  // Map HTTP status codes to user-friendly messages
  switch (status) {
    case 401:
      // 401 is handled by interceptor (redirect to login)
      // But we still provide a message in case it's needed
      return 'Authentication required. Please log in.';

    case 403:
      return 'Access denied. You do not have permission.';

    case 404:
      return 'Resource not found.';

    case 408:
      // Timeout error (AI agent timeout)
      return 'Request timed out. The AI agent took too long to respond.';

    case 422:
      // Validation error - try to extract specific field errors
      const validationErrors = apiError.response?.data?.errors;
      if (validationErrors && typeof validationErrors === 'object') {
        // Format validation errors as a readable message
        const errorMessages = Object.entries(validationErrors)
          .map(([field, messages]) => {
            const fieldName = field.replace(/_/g, ' ');
            return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
          })
          .join('; ');
        return errorMessages || 'Validation error. Please check your input.';
      }
      // Fallback for 422 without specific field errors
      // Use custom message if it's meaningful, otherwise use generic message
      const customMessage = apiError.response?.data?.detail || apiError.response?.data?.message;
      if (customMessage && typeof customMessage === 'string' && customMessage.trim().length > 0) {
        // Ensure the message is properly formatted and actionable
        const trimmed = customMessage.trim();
        // If message is too short, doesn't have letters, or doesn't provide actionable guidance, use generic message
        const hasActionableGuidance = 
          /please|try|check|required|invalid|must|should|cannot|error|failed/i.test(trimmed);
        if (trimmed.length < 5 || !/[a-z]/i.test(trimmed) || !hasActionableGuidance) {
          return 'Validation error. Please check your input.';
        }
        // Capitalize first letter if needed
        const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        // Ensure it ends with proper punctuation
        if (!/[.!?]$/.test(formatted)) {
          return formatted + '.';
        }
        return formatted;
      }
      return 'Validation error. Please check your input.';

    case 429:
      return 'Too many requests. Please try again later.';

    case 500:
      return 'Server error. Please try again later.';

    case 503:
      return 'Service temporarily unavailable. Please try again later.';

    default:
      // For other status codes or no status code
      // Try to extract a message from the error object
      const errorMessage = 
        apiError.response?.data?.detail ||
        apiError.response?.data?.message ||
        apiError.message;

      if (errorMessage && typeof errorMessage === 'string') {
        const trimmed = errorMessage.trim();
        // Ensure message is meaningful (not empty after trimming and contains at least one letter/digit)
        if (trimmed.length > 0 && /[a-zA-Z0-9]/.test(trimmed)) {
          // Capitalize first letter if needed
          const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
          // Ensure it ends with proper punctuation
          if (!/[.!?]$/.test(formatted)) {
            return formatted + '.';
          }
          return formatted;
        }
      }

      // Final fallback
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Extracts validation errors from a 422 response
 * @param error - The error object from an API call
 * @returns A record of field names to error messages, or null if not a validation error
 */
export function getValidationErrors(error: unknown): Record<string, string[]> | null {
  if (!error) {
    return null;
  }
  
  const apiError = error as ApiError;
  const status = apiError.status || apiError.response?.status;

  if (status === 422) {
    const validationErrors = apiError.response?.data?.errors;
    if (validationErrors && typeof validationErrors === 'object') {
      return validationErrors as Record<string, string[]>;
    }
  }

  return null;
}

/**
 * Checks if an error is a network error
 * @param error - The error object to check
 * @returns True if the error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) {
    return false;
  }
  
  const apiError = error as ApiError;
  return !apiError.response && 
         (apiError.message?.toLowerCase().includes('network') || 
          apiError.message?.toLowerCase().includes('connection') ||
          false);
}

/**
 * Checks if an error is a timeout error
 * @param error - The error object to check
 * @returns True if the error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (!error) {
    return false;
  }
  
  const apiError = error as ApiError;
  const status = apiError.status || apiError.response?.status;
  return status === 408 || 
         apiError.message?.toLowerCase().includes('timeout') ||
         false;
}

/**
 * Checks if an error is a validation error
 * @param error - The error object to check
 * @returns True if the error is a validation error (422)
 */
export function isValidationError(error: unknown): boolean {
  if (!error) {
    return false;
  }
  
  const apiError = error as ApiError;
  const status = apiError.status || apiError.response?.status;
  return status === 422;
}

/**
 * Logs an error to the console with details
 * @param error - The error to log
 * @param context - Optional context string to help identify where the error occurred
 */
export function logError(error: unknown, context?: string): void {
  const prefix = context ? `[${context}]` : '[Error]';
  
  console.error(prefix, 'Error occurred:', error);
  
  const apiError = error as ApiError;
  if (apiError.status || apiError.response?.status) {
    console.error(prefix, 'Status:', apiError.status || apiError.response?.status);
  }
  
  if (apiError.response?.data) {
    console.error(prefix, 'Response data:', apiError.response.data);
  }
  
  if (error instanceof Error && error.stack) {
    console.error(prefix, 'Stack trace:', error.stack);
  }
}
