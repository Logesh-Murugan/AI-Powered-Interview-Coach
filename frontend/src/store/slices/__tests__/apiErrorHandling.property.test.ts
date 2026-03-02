/**
 * Property-Based Tests for API Error Handling
 * **Validates: Requirements COMP-5.5, COMP-5.7, COMP-5.9**
 * 
 * Tests universal error handling behavior across all API operations using fast-check.
 * Verifies that for ANY API call that fails:
 * 1. The UI displays a user-friendly error message
 * 2. The error message is appropriate to the error type
 * 3. Network errors show "Network error. Please check your connection."
 * 4. 401 errors show "Authentication required. Please log in."
 * 5. 403 errors show "Access denied. You do not have permission."
 * 6. 404 errors show "Resource not found."
 * 7. 408 errors show "Request timed out. The AI agent took too long to respond."
 * 8. 422 errors show validation error messages
 * 9. 429 errors show "Too many requests. Please try again later."
 * 10. 500 errors show "Server error. Please try again later."
 * 11. 503 errors show "Service temporarily unavailable. Please try again later."
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getErrorMessage, isNetworkError, isTimeoutError, isValidationError } from '../../../utils/errorMessages';

// Type definitions for error scenarios
interface ErrorScenario {
  type: 'network' | 'http' | 'validation' | 'timeout';
  status?: number;
  message?: string;
  validationErrors?: Record<string, string[]>;
}

// Error type generators
const networkErrorArbitrary = fc.constant<ErrorScenario>({
  type: 'network',
  message: 'Network Error',
});

const httpErrorArbitrary = fc.record({
  type: fc.constant('http' as const),
  status: fc.constantFrom(401, 403, 404, 408, 422, 429, 500, 503),
  message: fc.option(
    fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0 && /[a-zA-Z0-9]/.test(s)), // Must contain alphanumeric
    { nil: undefined }
  ),
});

const validationErrorArbitrary = fc.record({
  type: fc.constant('validation' as const),
  status: fc.constant(422),
  validationErrors: fc.dictionary(
    fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/).filter(s => s.length >= 1 && s.length <= 20), // Valid field names
    fc.array(
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0 && /[a-zA-Z0-9]/.test(s)), // Must contain alphanumeric
      { minLength: 1, maxLength: 3 }
    )
  ).filter(dict => Object.keys(dict).length > 0), // Ensure at least one field
});

const timeoutErrorArbitrary = fc.constant<ErrorScenario>({
  type: 'timeout',
  status: 408,
  message: 'Request timeout',
});

// Combined error arbitrary
const errorScenarioArbitrary = fc.oneof(
  networkErrorArbitrary,
  httpErrorArbitrary,
  validationErrorArbitrary,
  timeoutErrorArbitrary
);

// Helper to create error object from scenario
function createErrorFromScenario(scenario: ErrorScenario): any {
  if (scenario.type === 'network') {
    return {
      message: scenario.message || 'Network Error',
      // No response property indicates network error
    };
  }

  if (scenario.type === 'validation' && scenario.validationErrors) {
    return {
      status: 422,
      response: {
        status: 422,
        data: {
          errors: scenario.validationErrors,
        },
      },
    };
  }

  // HTTP error
  return {
    status: scenario.status,
    message: scenario.message,
    response: {
      status: scenario.status,
      data: {
        message: scenario.message,
        detail: scenario.message,
      },
    },
  };
}

describe('API Error Handling Property-Based Tests', () => {
  describe('Property 2: Error Message Appropriateness', () => {
    /**
     * Universal Property: For ANY API error, a user-friendly message is returned
     * This is the most fundamental property - every error must have a message
     */
    it('should return a user-friendly error message for any error type', () => {
      fc.assert(
        fc.property(
          errorScenarioArbitrary,
          (scenario) => {
            const error = createErrorFromScenario(scenario);
            const message = getErrorMessage(error);

            // Message should be a non-empty string
            expect(typeof message).toBe('string');
            expect(message.length).toBeGreaterThan(0);

            // Message should not contain technical jargon
            expect(message).not.toMatch(/undefined|null|NaN/i);
            expect(message).not.toMatch(/\[object Object\]/);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Network errors always show connection message
     */
    it('should show "Network error. Please check your connection." for network errors', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (errorMessage) => {
            const error = {
              message: `Network ${errorMessage}`,
              // No response property
            };

            const message = getErrorMessage(error);

            expect(message).toBe('Network error. Please check your connection.');
            expect(isNetworkError(error)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: 401 errors always show authentication message
     */
    it('should show "Authentication required. Please log in." for 401 errors', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          (customMessage) => {
            const error = {
              status: 401,
              message: customMessage,
              response: {
                status: 401,
                data: {
                  message: customMessage,
                },
              },
            };

            const message = getErrorMessage(error);

            expect(message).toBe('Authentication required. Please log in.');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: 403 errors always show permission message
     */
    it('should show "Access denied. You do not have permission." for 403 errors', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          (customMessage) => {
            const error = {
              status: 403,
              message: customMessage,
              response: {
                status: 403,
                data: {
                  message: customMessage,
                },
              },
            };

            const message = getErrorMessage(error);

            expect(message).toBe('Access denied. You do not have permission.');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: 404 errors always show not found message
     */
    it('should show "Resource not found." for 404 errors', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          (customMessage) => {
            const error = {
              status: 404,
              message: customMessage,
              response: {
                status: 404,
                data: {
                  message: customMessage,
                },
              },
            };

            const message = getErrorMessage(error);

            expect(message).toBe('Resource not found.');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: 408 errors always show timeout message
     */
    it('should show "Request timed out. The AI agent took too long to respond." for 408 errors', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          (customMessage) => {
            const error = {
              status: 408,
              message: customMessage,
              response: {
                status: 408,
                data: {
                  message: customMessage,
                },
              },
            };

            const message = getErrorMessage(error);

            expect(message).toBe('Request timed out. The AI agent took too long to respond.');
            expect(isTimeoutError(error)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: 422 validation errors show field-specific messages
     */
    it('should show validation error messages for 422 errors with field errors', () => {
      fc.assert(
        fc.property(
          fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 3 })
          ),
          (validationErrors) => {
            // Skip empty dictionaries
            if (Object.keys(validationErrors).length === 0) return;

            const error = {
              status: 422,
              response: {
                status: 422,
                data: {
                  errors: validationErrors,
                },
              },
            };

            const message = getErrorMessage(error);

            // Message should contain field names
            const fieldNames = Object.keys(validationErrors);
            const hasFieldName = fieldNames.some(field => 
              message.toLowerCase().includes(field.replace(/_/g, ' ').toLowerCase())
            );
            expect(hasFieldName).toBe(true);

            // Should be identified as validation error
            expect(isValidationError(error)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: 422 errors without field errors show generic validation message
     */
    it('should show generic validation message for 422 errors without field errors', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          (customMessage) => {
            const error = {
              status: 422,
              response: {
                status: 422,
                data: {
                  detail: customMessage,
                  message: customMessage,
                },
              },
            };

            const message = getErrorMessage(error);

            // Should contain either formatted custom message or generic validation message
            const hasActionableGuidance = customMessage && 
              /please|try|check|required|invalid|must|should|cannot|error|failed/i.test(customMessage);
            if (customMessage && customMessage.trim().length >= 5 && /[a-z]/i.test(customMessage) && hasActionableGuidance) {
              // Should be formatted version of custom message
              const trimmed = customMessage.trim();
              const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
              const expected = /[.!?]$/.test(formatted) ? formatted : formatted + '.';
              expect(message).toBe(expected);
            } else {
              expect(message).toBe('Validation error. Please check your input.');
            }

            expect(isValidationError(error)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: 429 errors always show rate limit message
     */
    it('should show "Too many requests. Please try again later." for 429 errors', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          (customMessage) => {
            const error = {
              status: 429,
              message: customMessage,
              response: {
                status: 429,
                data: {
                  message: customMessage,
                },
              },
            };

            const message = getErrorMessage(error);

            expect(message).toBe('Too many requests. Please try again later.');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: 500 errors always show server error message
     */
    it('should show "Server error. Please try again later." for 500 errors', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          (customMessage) => {
            const error = {
              status: 500,
              message: customMessage,
              response: {
                status: 500,
                data: {
                  message: customMessage,
                },
              },
            };

            const message = getErrorMessage(error);

            expect(message).toBe('Server error. Please try again later.');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: 503 errors always show service unavailable message
     */
    it('should show "Service temporarily unavailable. Please try again later." for 503 errors', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          (customMessage) => {
            const error = {
              status: 503,
              message: customMessage,
              response: {
                status: 503,
                data: {
                  message: customMessage,
                },
              },
            };

            const message = getErrorMessage(error);

            expect(message).toBe('Service temporarily unavailable. Please try again later.');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Error messages are consistent for the same error type
     */
    it('should return consistent messages for the same error type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(401, 403, 404, 408, 429, 500, 503),
          (status) => {
            const error1 = {
              status,
              response: { status, data: { message: 'Error 1' } },
            };
            const error2 = {
              status,
              response: { status, data: { message: 'Error 2' } },
            };

            const message1 = getErrorMessage(error1);
            const message2 = getErrorMessage(error2);

            // Same status should produce same message
            expect(message1).toBe(message2);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Error messages are user-friendly (no technical details)
     */
    it('should not expose technical details in error messages', () => {
      fc.assert(
        fc.property(
          errorScenarioArbitrary,
          (scenario) => {
            const error = createErrorFromScenario(scenario);
            const message = getErrorMessage(error);

            // Should not contain technical terms
            expect(message).not.toMatch(/stack trace|exception|throw|catch/i);
            expect(message).not.toMatch(/error code|errno|syscall/i);
            expect(message).not.toMatch(/ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i);
            
            // Should not contain raw JSON
            expect(message).not.toMatch(/^\{.*\}$/);
            
            // Should not contain undefined/null
            expect(message).not.toMatch(/undefined|null/i);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Error messages are actionable
     */
    it('should provide actionable guidance in error messages', () => {
      fc.assert(
        fc.property(
          errorScenarioArbitrary,
          (scenario) => {
            const error = createErrorFromScenario(scenario);
            const message = getErrorMessage(error);

            // Message should suggest an action or provide context
            const hasActionableGuidance = 
              message.includes('Please') ||
              message.includes('try again') ||
              message.includes('check') ||
              message.includes('log in') ||
              message.includes('permission') ||
              message.includes('not found') ||
              message.includes('unavailable') ||
              message.includes('timed out') ||
              message.includes('Validation error') ||
              message.includes(':'); // Validation errors with field names contain colons

            expect(hasActionableGuidance).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Null/undefined errors return fallback message
     */
    it('should return fallback message for null/undefined errors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined),
          (error) => {
            const message = getErrorMessage(error);

            expect(message).toBe('An unexpected error occurred. Please try again.');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Unknown status codes return fallback or custom message
     */
    it('should handle unknown status codes gracefully', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 599 }).filter(
            status => ![401, 403, 404, 408, 422, 429, 500, 503].includes(status)
          ),
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          (status, customMessage) => {
            const error = {
              status,
              message: customMessage,
              response: {
                status,
                data: {
                  message: customMessage,
                  detail: customMessage,
                },
              },
            };

            const message = getErrorMessage(error);

            // Should return either formatted custom message or fallback
            expect(typeof message).toBe('string');
            expect(message.length).toBeGreaterThan(0);
            
            if (customMessage && customMessage.trim().length > 0 && /[a-zA-Z0-9]/.test(customMessage)) {
              // Should be formatted version of custom message
              const trimmed = customMessage.trim();
              const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
              const expected = /[.!?]$/.test(formatted) ? formatted : formatted + '.';
              expect(message).toBe(expected);
            } else {
              expect(message).toBe('An unexpected error occurred. Please try again.');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Error messages are properly formatted
     */
    it('should return properly formatted error messages', () => {
      fc.assert(
        fc.property(
          errorScenarioArbitrary,
          (scenario) => {
            const error = createErrorFromScenario(scenario);
            const message = getErrorMessage(error);

            // Should not be empty or just whitespace
            expect(message.trim().length).toBeGreaterThan(0);
            
            const trimmed = message.trim();
            
            // For non-validation errors, should have proper formatting
            // Skip formatting checks for messages that are just punctuation or very short
            if ((scenario.type !== 'validation' || !scenario.validationErrors) && /[a-zA-Z]/.test(trimmed)) {
              // Should start with capital letter
              expect(trimmed[0]).toMatch(/[A-Z]/);
              // Should end with period or appropriate punctuation
              expect(trimmed).toMatch(/[.!]$/);
              // Should not have multiple spaces
              expect(trimmed).not.toMatch(/\s{2,}/);
            } else if (scenario.type === 'validation' && scenario.validationErrors) {
              // Validation errors may have different format (field: message)
              // Just ensure they're not empty and contain meaningful content
              expect(trimmed.length).toBeGreaterThan(0);
              // Should contain a colon (field: message format)
              expect(trimmed).toMatch(/:/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Validation errors with multiple fields are formatted correctly
     */
    it('should format multiple validation errors correctly', () => {
      fc.assert(
        fc.property(
          fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 3 }),
            { minKeys: 2, maxKeys: 5 }
          ),
          (validationErrors) => {
            const error = {
              status: 422,
              response: {
                status: 422,
                data: {
                  errors: validationErrors,
                },
              },
            };

            const message = getErrorMessage(error);

            // Should contain multiple field names
            const fieldNames = Object.keys(validationErrors);
            const fieldCount = fieldNames.filter(field => 
              message.toLowerCase().includes(field.replace(/_/g, ' ').toLowerCase())
            ).length;

            // At least some fields should be mentioned
            expect(fieldCount).toBeGreaterThan(0);
            
            // Should use semicolon to separate multiple errors
            if (fieldNames.length > 1) {
              expect(message).toMatch(/;/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Error type detection functions are consistent
     */
    it('should have consistent error type detection', () => {
      fc.assert(
        fc.property(
          errorScenarioArbitrary,
          (scenario) => {
            const error = createErrorFromScenario(scenario);

            // Only one type should be true
            const isNetwork = isNetworkError(error);
            const isTimeout = isTimeoutError(error);
            const isValidation = isValidationError(error);

            const trueCount = [isNetwork, isTimeout, isValidation].filter(Boolean).length;

            // At most one should be true (some errors might not match any specific type)
            expect(trueCount).toBeLessThanOrEqual(1);

            // Verify type detection matches scenario
            if (scenario.type === 'network') {
              expect(isNetwork).toBe(true);
            }
            if (scenario.type === 'timeout' || scenario.status === 408) {
              expect(isTimeout).toBe(true);
            }
            if (scenario.type === 'validation' || scenario.status === 422) {
              expect(isValidation).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
