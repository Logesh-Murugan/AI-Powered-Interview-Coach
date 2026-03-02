import '@testing-library/jest-dom';

// Mock IntersectionObserver for framer-motion
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Suppress JSDOM network errors that occur during Material-UI component rendering
// These errors are internal to JSDOM and don't affect actual test behavior
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Filter out JSDOM network errors
  const errorString = args[0]?.toString() || '';
  if (
    errorString.includes('UND_ERR_INVALID_ARG') ||
    errorString.includes('InvalidArgumentError') ||
    errorString.includes('invalid onError method')
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Suppress unhandled promise rejections from JSDOM
process.on('unhandledRejection', (reason: any) => {
  const errorString = reason?.toString() || '';
  if (
    errorString.includes('UND_ERR_INVALID_ARG') ||
    errorString.includes('InvalidArgumentError') ||
    errorString.includes('invalid onError method')
  ) {
    return;
  }
  throw reason;
});
