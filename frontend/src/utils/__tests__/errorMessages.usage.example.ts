/**
 * Usage examples for errorMessages utility
 * This file demonstrates how to use the error message mapping utility
 */

import { getErrorMessage, getValidationErrors, isNetworkError, logError } from '../errorMessages';

// Example 1: Basic error message mapping in a service
async function exampleServiceCall() {
  try {
    // Make API call
    const response = await fetch('/api/v1/some-endpoint');
    return response.json();
  } catch (error) {
    // Get user-friendly error message
    const message = getErrorMessage(error);
    console.error('API call failed:', message);
    throw new Error(message);
  }
}

// Example 2: Using in Redux thunk
import { createAsyncThunk } from '@reduxjs/toolkit';

export const fetchData = createAsyncThunk(
  'data/fetch',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/v1/data/${id}`);
      return response.json();
    } catch (error) {
      // Log error with context
      logError(error, 'fetchData');
      
      // Return user-friendly message
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Example 3: Handling validation errors in a form component
import React from 'react';

function ExampleFormComponent() {
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});

  const handleSubmit = async (formData: any) => {
    try {
      await fetch('/api/v1/submit', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
    } catch (error) {
      // Check if it's a validation error
      const validationErrors = getValidationErrors(error);
      
      if (validationErrors) {
        // Display field-specific errors
        setErrors(validationErrors);
      } else {
        // Display general error message
        alert(getErrorMessage(error));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields with error display */}
      {errors.name && <span className="error">{errors.name.join(', ')}</span>}
    </form>
  );
}

// Example 4: Conditional error handling based on error type
async function exampleWithConditionalHandling() {
  try {
    await fetch('/api/v1/data');
  } catch (error) {
    if (isNetworkError(error)) {
      // Show offline indicator
      console.log('Network error detected - showing offline mode');
    } else {
      // Show error message
      console.log('Error:', getErrorMessage(error));
    }
  }
}

// Example 5: Using in ErrorAlert component
import { Alert, Button } from '@mui/material';

interface ErrorAlertProps {
  error: unknown;
  onRetry?: () => void;
}

function ErrorAlertComponent({ error, onRetry }: ErrorAlertProps) {
  const message = getErrorMessage(error);
  
  return (
    <Alert 
      severity="error"
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        )
      }
    >
      {message}
    </Alert>
  );
}

export {
  exampleServiceCall,
  fetchData,
  ExampleFormComponent,
  exampleWithConditionalHandling,
  ErrorAlertComponent,
};
