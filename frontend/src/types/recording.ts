/**
 * Recording System Types
 * 
 * Type definitions for the video/audio recording system.
 * Centralized types to avoid import issues.
 */

export interface RecordingOptions {
  includeVideo?: boolean;
  audioBitsPerSecond?: number;
  videoBitsPerSecond?: number;
  mimeType?: string;
}

export interface RecordingResult {
  audioBlob: Blob | null;
  videoBlob: Blob | null;
  duration: number;
}

export interface MediaRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  hasPermission: boolean;
  permissionError: string | null;
  recordingError: string | null;
  isSupported: boolean;
}

export interface VoiceAnalysis {
  speaking_pace_wpm: number;
  total_speaking_time: number;
  total_duration: number;
  pause_count: number;
  average_pause_duration: number;
  longest_pause: number;
  filler_word_count: number;
  detected_fillers: string[];
  volume_consistency: number;
  confidence_score: number;
  analysis_metadata: {
    word_count: number;
    speech_ratio: number;
    sample_rate?: number;
    audio_length_seconds: number;
    error?: string;
  };
}

export interface RecordingUploadResponse {
  success: boolean;
  answer_id: number;
  audio_url: string;
  video_url?: string;
  recording_duration: number;
  recording_format: string;
  transcription: string;
  voice_analysis: VoiceAnalysis;
  processing_metadata: {
    transcription_info: {
      language: string;
      language_probability: number;
      segments_count: number;
    };
    processed_at: string;
    whisper_model: string;
    processing_duration: number;
  };
}

// Re-export all types for convenience
export type {
  RecordingOptions as RecordingOpts,
  RecordingResult as RecordingRes,
  MediaRecorderState as RecorderState,
  VoiceAnalysis as VoiceAnalysisData,
  RecordingUploadResponse as UploadResponse
};