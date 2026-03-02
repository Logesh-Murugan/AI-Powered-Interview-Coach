/**
 * Redux Store Configuration
 * Centralized state management with Redux Toolkit
 */

import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import interviewReducer from './slices/interviewSlice';
import resumeReducer from './slices/resumeSlice';
import uiReducer from './slices/uiSlice';
import resumeAnalysisReducer from './slices/resumeAnalysisSlice';
import studyPlanReducer from './slices/studyPlanSlice';
import companyCoachingReducer from './slices/companyCoachingSlice';
import cacheStatsReducer from './slices/cacheStatsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    interview: interviewReducer,
    resume: resumeReducer,
    ui: uiReducer,
    resumeAnalysis: resumeAnalysisReducer,
    studyPlan: studyPlanReducer,
    companyCoaching: companyCoachingReducer,
    cacheStats: cacheStatsReducer,
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

// Typed hooks for use throughout the app
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
