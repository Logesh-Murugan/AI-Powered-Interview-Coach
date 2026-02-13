/**
 * Redux Store Configuration
 * Centralized state management with Redux Toolkit
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import userReducer from './slices/userSlice.js';
import interviewReducer from './slices/interviewSlice.js';
import resumeReducer from './slices/resumeSlice.js';
import uiReducer from './slices/uiSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    interview: interviewReducer,
    resume: resumeReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
