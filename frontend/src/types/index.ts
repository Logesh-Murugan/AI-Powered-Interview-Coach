/**
 * Types Index
 * 
 * Central export point for all application types.
 */

// Recording system types
export * from './recording';

// Re-export commonly used types with shorter names
export type {
  RecordingOptions,
  RecordingResult,
  MediaRecorderState,
  VoiceAnalysis,
  RecordingUploadResponse
} from './recording';