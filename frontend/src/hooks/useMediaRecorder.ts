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
    
    // Log browser capabilities for debugging
    if (isSupported) {
      console.log('🎤 MediaRecorder capabilities:');
      console.log('- MediaRecorder available:', typeof MediaRecorder !== 'undefined');
      console.log('- getUserMedia available:', typeof navigator.mediaDevices?.getUserMedia !== 'undefined');
      
      // Test common MIME types
      const testTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
        'audio/mpeg'
      ];
      
      console.log('- Supported MIME types:');
      testTypes.forEach(type => {
        try {
          const supported = MediaRecorder.isTypeSupported(type);
          console.log(`  ${type}: ${supported}`);
        } catch (error) {
          console.log(`  ${type}: error checking`);
        }
      });
    } else {
      console.warn('❌ MediaRecorder not supported in this browser');
    }
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

      // First, check if devices are available
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log('Available devices:', {
          audio: audioDevices.length,
          video: videoDevices.length,
          audioDevices: audioDevices.map(d => ({ id: d.deviceId, label: d.label })),
          videoDevices: videoDevices.map(d => ({ id: d.deviceId, label: d.label }))
        });

        if (audioDevices.length === 0) {
          throw new Error('No microphone found. Please connect a microphone and refresh the page.');
        }

        if (options.includeVideo && videoDevices.length === 0) {
          console.warn('No camera found, will record audio only');
          options.includeVideo = false;
        }
      } catch (enumError) {
        console.warn('Could not enumerate devices:', enumError);
        // Continue anyway - browser might still grant access
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 44100, min: 16000 },
          channelCount: { ideal: 1 }
        }
      };

      if (options.includeVideo) {
        constraints.video = {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        };
      }

      // Clean up existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      console.log('Requesting media permissions with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Verify stream is active
      if (!stream || !stream.active) {
        throw new Error('Media stream is not active');
      }

      // Verify audio track exists
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio track available');
      }

      console.log('Media permissions granted:', {
        audioTracks: audioTracks.length,
        videoTracks: stream.getVideoTracks().length,
        streamActive: stream.active
      });

      streamRef.current = stream;
      setState(prev => ({ ...prev, hasPermission: true, permissionError: null }));
      return stream;

    } catch (error: any) {
      console.error('Permission request failed:', error);
      
      let errorMessage = 'Failed to access media devices';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permission denied. Please allow microphone access in your browser settings and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and refresh the page.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Media recording not supported in this browser. Please use Chrome, Firefox, or Safari.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is being used by another application. Please close other apps (Zoom, Teams, Discord) and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera/microphone constraints not supported. Trying with basic settings...';
        
        // Retry with basic constraints
        try {
          const basicConstraints: MediaStreamConstraints = {
            audio: true
          };
          
          if (options.includeVideo) {
            basicConstraints.video = true;
          }
          
          const basicStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
          streamRef.current = basicStream;
          setState(prev => ({ ...prev, hasPermission: true, permissionError: null }));
          return basicStream;
        } catch (retryError: any) {
          errorMessage = `Media access failed: ${retryError.message}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
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

      // Enhanced MIME type detection with better fallbacks
      let mimeType = options.mimeType;
      if (!mimeType) {
        // Different MIME types for video vs audio
        const supportedTypes = options.includeVideo ? [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm;codecs=h264,opus',
          'video/webm',
          'video/mp4;codecs=h264,aac',
          'video/mp4'
        ] : [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          'audio/ogg',
          'audio/mp4;codecs=mp4a.40.2',
          'audio/mp4',
          'audio/mpeg',
          'audio/wav'
        ];
        
        // Find the first supported type
        mimeType = supportedTypes.find(type => {
          try {
            const isSupported = MediaRecorder.isTypeSupported(type);
            console.log(`MIME type ${type}: ${isSupported ? 'supported' : 'not supported'}`);
            return isSupported;
          } catch (error) {
            console.warn(`Error checking MIME type ${type}:`, error);
            return false;
          }
        });

        // If no specific type is supported, try without codecs
        if (!mimeType) {
          const basicTypes = ['audio/webm', 'audio/ogg', 'audio/mp4'];
          mimeType = basicTypes.find(type => {
            try {
              return MediaRecorder.isTypeSupported(type);
            } catch {
              return false;
            }
          });
        }

        // Final fallback - let browser choose
        if (!mimeType) {
          console.warn('No supported MIME types found, letting browser choose default');
          mimeType = undefined;
        }
      }

      console.log(`Using MIME type: ${mimeType || 'browser default'}`);

      // Create MediaRecorder with progressive fallback
      let mediaRecorder: MediaRecorder;
      try {
        const recorderOptions: MediaRecorderOptions = {};
        
        if (mimeType) {
          recorderOptions.mimeType = mimeType;
        }

        // Only add bitrate if supported and MIME type is set
        if (mimeType && options.audioBitsPerSecond) {
          try {
            recorderOptions.audioBitsPerSecond = options.audioBitsPerSecond;
          } catch (error) {
            console.warn('audioBitsPerSecond not supported:', error);
          }
        }

        if (mimeType && options.videoBitsPerSecond && options.includeVideo) {
          try {
            recorderOptions.videoBitsPerSecond = options.videoBitsPerSecond;
          } catch (error) {
            console.warn('videoBitsPerSecond not supported:', error);
          }
        }

        console.log('Creating MediaRecorder with options:', recorderOptions);
        mediaRecorder = new MediaRecorder(stream, recorderOptions);
        
      } catch (error: any) {
        console.warn('MediaRecorder with options failed, trying basic configuration:', error);
        
        // Fallback 1: Try with just MIME type
        try {
          if (mimeType) {
            mediaRecorder = new MediaRecorder(stream, { mimeType });
          } else {
            throw new Error('No MIME type available');
          }
        } catch (fallbackError: any) {
          console.warn('MediaRecorder with MIME type failed, trying without options:', fallbackError);
          
          // Fallback 2: Basic MediaRecorder without any options
          try {
            mediaRecorder = new MediaRecorder(stream);
          } catch (basicError: any) {
            throw new Error(`MediaRecorder creation failed: ${basicError.message}. Your browser may not support audio recording.`);
          }
        }
      }

      chunksRef.current = [];

      // Set up event handlers with better error reporting
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log(`Data chunk received: ${event.data.size} bytes`);
        }
      };

      mediaRecorder.onerror = (event: any) => {
        const error = event.error || new Error('Recording failed');
        console.error('MediaRecorder error event:', error);
        setState(prev => ({ 
          ...prev, 
          recordingError: `Recording error: ${error.message}`,
          isRecording: false 
        }));
        stopTimer();
      };

      mediaRecorder.onstart = () => {
        console.log('MediaRecorder started successfully');
        setState(prev => ({ 
          ...prev, 
          isRecording: true, 
          isPaused: false,
          recordingTime: 0,
          recordingError: null 
        }));
        startTimer();
      };

      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped');
      };

      // Start recording with multi-stage fallback
      try {
        console.log('Starting MediaRecorder stage 1 (with 1000ms timeslice)...');
        mediaRecorder.start(1000); 
        mediaRecorderRef.current = mediaRecorder;
        console.log('MediaRecorder started successfully Stage 1');
      } catch (startError: any) {
        console.warn('MediaRecorder Stage 1 start failed, retrying Stage 2 (no timeslice):', startError);
        try {
          mediaRecorder.start();
          mediaRecorderRef.current = mediaRecorder;
          console.log('MediaRecorder started successfully Stage 2');
        } catch (retryError: any) {
          console.error('MediaRecorder Stage 2 failed, full architectural fallback required:', retryError);
          
          // Final attempt: Create a BARE recorder and start it
          try {
             console.log('Stage 3: Attempting bare-metal recorder creation...');
             const bareRecorder = new MediaRecorder(stream);
             bareRecorder.ondataavailable = mediaRecorder.ondataavailable;
             bareRecorder.onerror = mediaRecorder.onerror;
             bareRecorder.onstart = mediaRecorder.onstart;
             bareRecorder.onstop = mediaRecorder.onstop;
             bareRecorder.start();
             mediaRecorderRef.current = bareRecorder;
             console.log('MediaRecorder started successfully Stage 3 (Bare Metal)');
          } catch (finalError: any) {
             let errorMessage = `All biometric uplink attempts failed: ${finalError.message}`;
             if (finalError.name === 'NotSupportedError') {
               errorMessage = 'Recording not supported with current hardware/browser settings.';
             }
             throw new Error(errorMessage);
          }
        }
      }

    } catch (error: any) {
      console.error('Start recording error:', error);
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
      const stream = streamRef.current;
      
      mediaRecorder.onstop = () => {
        try {
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: mimeType });
          
          // Determine if this is a video recording
          const hasVideo = stream && stream.getVideoTracks().length > 0;
          const isVideoMimeType = mimeType.includes('video');
          
          let audioBlob = null;
          let videoBlob = null;
          
          if (hasVideo || isVideoMimeType) {
            // This is a video recording (contains both audio and video)
            videoBlob = blob;
            console.log('Video recording captured:', {
              size: blob.size,
              type: blob.type,
              duration: state.recordingTime
            });
          } else {
            // This is audio-only recording
            audioBlob = blob;
            console.log('Audio recording captured:', {
              size: blob.size,
              type: blob.type,
              duration: state.recordingTime
            });
          }
          
          const result: RecordingResult = {
            audioBlob: audioBlob,
            videoBlob: videoBlob,
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
    stream: streamRef.current,
    
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