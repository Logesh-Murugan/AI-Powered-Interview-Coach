/**
 * Media Recorder Hook
 * 
 * Custom React hook for handling audio/video recording functionality.
 * Provides a clean interface for recording management with error handling.
 * 
 * Requirements: Recording System Implementation
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { RecordingOptions, RecordingResult, MediaRecorderState } from '../types/recording';

export const useMediaRecorder = () => {
  const [state, setState] = useState<MediaRecorderState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    hasPermission: false,
    permissionError: null,
    recordingError: null,
    isSupported: typeof MediaRecorder !== 'undefined'
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check if MediaRecorder is supported
  useEffect(() => {
    const isSupported = typeof MediaRecorder !== 'undefined' && 
                       typeof navigator.mediaDevices !== 'undefined' &&
                       typeof navigator.mediaDevices.getUserMedia !== 'undefined';
    
    setState(prev => ({ ...prev, isSupported }));
  }, []);

  // Timer function
  const updateTimer = useCallback(() => {
    if (startTimeRef.current > 0) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setState(prev => ({ ...prev, recordingTime: elapsed }));
    }
  }, []);

  // Start timer
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = window.setInterval(updateTimer, 1000);
  }, [updateTimer]);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startTimeRef.current = 0;
  }, []);

  // Request media permissions
  const requestPermissions = useCallback(async (options: RecordingOptions = {}) => {
    try {
      setState(prev => ({ ...prev, permissionError: null }));

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      };

      if (options.includeVideo) {
        constraints.video = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      setState(prev => ({ ...prev, hasPermission: true, permissionError: null }));
      return stream;

    } catch (error: any) {
      let errorMessage = 'Failed to access media devices';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permission denied. Please allow microphone access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Media recording not supported in this browser.';
      }

      setState(prev => ({ 
        ...prev, 
        hasPermission: false, 
        permissionError: errorMessage 
      }));
      
      throw new Error(errorMessage);
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async (options: RecordingOptions = {}) => {
    try {
      if (!state.isSupported) {
        throw new Error('Media recording not supported in this browser');
      }

      setState(prev => ({ ...prev, recordingError: null }));

      // Request permissions if not already granted
      let stream = streamRef.current;
      if (!stream || !state.hasPermission) {
        stream = await requestPermissions(options);
      }

      if (!stream) {
        throw new Error('Failed to get media stream');
      }

      // Determine MIME type
      let mimeType = options.mimeType;
      if (!mimeType) {
        const supportedTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/wav'
        ];
        
        mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: options.audioBitsPerSecond || 128000,
        videoBitsPerSecond: options.videoBitsPerSecond || 2500000
      });

      chunksRef.current = [];

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event: any) => {
        const error = event.error || new Error('Recording failed');
        setState(prev => ({ 
          ...prev, 
          recordingError: error.message,
          isRecording: false 
        }));
        stopTimer();
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;

      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        isPaused: false,
        recordingTime: 0,
        recordingError: null 
      }));

      startTimer();

    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        recordingError: error.message,
        isRecording: false 
      }));
      throw error;
    }
  }, [state.isSupported, state.hasPermission, requestPermissions, startTimer, stopTimer]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
      stopTimer();
    }
  }, [state.isRecording, state.isPaused, stopTimer]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
      startTimer();
    }
  }, [state.isRecording, state.isPaused, startTimer]);

  // Stop recording
  const stopRecording = useCallback((): Promise<RecordingResult> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || !state.isRecording) {
        resolve({ audioBlob: null, videoBlob: null, duration: state.recordingTime });
        return;
      }

      const mediaRecorder = mediaRecorderRef.current;
      
      mediaRecorder.onstop = () => {
        try {
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: mimeType });
          
          // For now, we treat all recordings as audio
          // In the future, we could separate audio and video tracks
          const result: RecordingResult = {
            audioBlob: blob,
            videoBlob: null, // TODO: Implement video blob separation
            duration: state.recordingTime
          };

          resolve(result);
        } catch (error: any) {
          reject(new Error(`Failed to create recording blob: ${error.message}`));
        }
      };

      mediaRecorder.stop();
      
      setState(prev => ({ 
        ...prev, 
        isRecording: false, 
        isPaused: false 
      }));
      
      stopTimer();
    });
  }, [state.isRecording, state.recordingTime, stopTimer]);

  // Clean up resources
  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    stopTimer();
    chunksRef.current = [];

    setState(prev => ({ 
      ...prev, 
      isRecording: false, 
      isPaused: false,
      recordingTime: 0,
      hasPermission: false,
      permissionError: null,
      recordingError: null
    }));
  }, [stopTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Format recording time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    ...state,
    formattedTime: formatTime(state.recordingTime),
    
    // Actions
    requestPermissions,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cleanup,
    
    // Utilities
    formatTime
  };
};