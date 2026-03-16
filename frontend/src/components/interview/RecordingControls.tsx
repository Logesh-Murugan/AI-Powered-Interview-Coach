/**
 * Recording Controls Component
 * 
 * UI component for audio/video recording during interviews.
 * Provides recording controls, timer, and visual feedback.
 * 
 * Requirements: Recording System Implementation
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  LinearProgress,
  Paper,
  Fade,
  CircularProgress
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  PlayArrow,
  Pause,
  Stop,
  Warning,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useMediaRecorder } from '../../hooks/useMediaRecorder';
import type { RecordingOptions, RecordingResult } from '../../types/recording';

export interface RecordingControlsProps {
  onRecordingComplete: (result: RecordingResult) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  disabled?: boolean;
  maxDuration?: number; // Maximum recording duration in seconds
  includeVideo?: boolean;
  showVideoToggle?: boolean;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
  disabled = false,
  maxDuration = 600, // 10 minutes default
  includeVideo = false,
  showVideoToggle = true
}) => {
  const [videoEnabled, setVideoEnabled] = useState(includeVideo);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    isRecording,
    isPaused,
    recordingTime,
    hasPermission,
    permissionError,
    recordingError,
    isSupported,
    formattedTime,
    requestPermissions,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cleanup
  } = useMediaRecorder();

  // Handle start recording
  const handleStartRecording = useCallback(async () => {
    try {
      const options: RecordingOptions = {
        includeVideo: videoEnabled,
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: videoEnabled ? 2500000 : undefined
      };

      await startRecording(options);
      onRecordingStart?.();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [videoEnabled, startRecording, onRecordingStart]);

  // Handle stop recording
  const handleStopRecording = useCallback(async () => {
    try {
      setIsProcessing(true);
      const result = await stopRecording();
      onRecordingComplete(result);
      onRecordingStop?.();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [stopRecording, onRecordingComplete, onRecordingStop]);

  // Handle pause/resume
  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  }, [isPaused, pauseRecording, resumeRecording]);

  // Request permissions
  const handleRequestPermissions = useCallback(async () => {
    try {
      await requestPermissions({ includeVideo: videoEnabled });
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  }, [requestPermissions, videoEnabled]);

  // Calculate progress percentage
  const progressPercentage = maxDuration > 0 ? (recordingTime / maxDuration) * 100 : 0;

  // Determine progress color based on time remaining
  const getProgressColor = () => {
    if (progressPercentage > 90) return 'error';
    if (progressPercentage > 75) return 'warning';
    return 'primary';
  };

  // Check if recording should auto-stop
  React.useEffect(() => {
    if (isRecording && recordingTime >= maxDuration) {
      handleStopRecording();
    }
  }, [isRecording, recordingTime, maxDuration, handleStopRecording]);

  // Show not supported message
  if (!isSupported) {
    return (
      <Paper elevation={1} sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ErrorIcon />
          <Typography variant="body2">
            Recording not supported in this browser. Please use Chrome, Firefox, or Safari.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, bgcolor: 'background.paper' }}>
      <Stack spacing={2}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" color="text.primary">
            Record Your Answer
          </Typography>
          
          {showVideoToggle && (
            <Tooltip title={videoEnabled ? "Disable video recording" : "Enable video recording"}>
              <IconButton
                onClick={() => setVideoEnabled(!videoEnabled)}
                disabled={disabled || isRecording}
                color={videoEnabled ? "primary" : "default"}
              >
                {videoEnabled ? <Videocam /> : <VideocamOff />}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Permission Error */}
        {permissionError && (
          <Alert 
            severity="warning" 
            action={
              <Button size="small" onClick={handleRequestPermissions}>
                Grant Permission
              </Button>
            }
          >
            {permissionError}
          </Alert>
        )}

        {/* Recording Error */}
        {recordingError && (
          <Alert severity="error">
            {recordingError}
          </Alert>
        )}

        {/* Recording Status */}
        {(isRecording || hasPermission) && (
          <Box>
            <Stack direction="row" spacing={2} alignItems="center" mb={1}>
              <Chip
                icon={isRecording ? <Mic /> : <MicOff />}
                label={
                  isRecording 
                    ? (isPaused ? "Paused" : "Recording") 
                    : "Ready"
                }
                color={
                  isRecording 
                    ? (isPaused ? "warning" : "error") 
                    : "success"
                }
                variant={isRecording ? "filled" : "outlined"}
              />
              
              {videoEnabled && (
                <Chip
                  icon={isRecording ? <Videocam /> : <VideocamOff />}
                  label="Video"
                  color={isRecording ? "primary" : "default"}
                  variant="outlined"
                  size="small"
                />
              )}
              
              <Typography variant="h6" color="text.primary" fontFamily="monospace">
                {formattedTime}
              </Typography>
            </Stack>

            {/* Progress Bar */}
            {isRecording && maxDuration > 0 && (
              <Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(progressPercentage, 100)}
                  color={getProgressColor()}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.secondary" mt={0.5}>
                  {Math.max(0, maxDuration - recordingTime)}s remaining
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Control Buttons */}
        <Stack direction="row" spacing={2} justifyContent="center">
          {!isRecording ? (
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={isProcessing ? <CircularProgress size={20} /> : <PlayArrow />}
              onClick={handleStartRecording}
              disabled={disabled || isProcessing}
              sx={{ minWidth: 140 }}
            >
              {isProcessing ? "Processing..." : "Start Recording"}
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                color="warning"
                startIcon={isPaused ? <PlayArrow /> : <Pause />}
                onClick={handlePauseResume}
                disabled={disabled}
              >
                {isPaused ? "Resume" : "Pause"}
              </Button>
              
              <Button
                variant="contained"
                color="error"
                startIcon={isProcessing ? <CircularProgress size={20} /> : <Stop />}
                onClick={handleStopRecording}
                disabled={disabled || isProcessing}
                sx={{ minWidth: 120 }}
              >
                {isProcessing ? "Saving..." : "Stop"}
              </Button>
            </>
          )}
        </Stack>

        {/* Instructions */}
        {!hasPermission && !permissionError && (
          <Alert severity="info">
            Click "Start Recording" to begin. You'll be asked for microphone permission.
            {videoEnabled && " Camera permission will also be requested for video recording."}
          </Alert>
        )}

        {/* Recording Tips */}
        {hasPermission && !isRecording && (
          <Fade in>
            <Alert severity="success" icon={<CheckCircle />}>
              <Typography variant="body2">
                <strong>Ready to record!</strong> Speak clearly and ensure you're in a quiet environment.
                {videoEnabled && " Make sure you're well-lit and centered in the camera view."}
              </Typography>
            </Alert>
          </Fade>
        )}

        {/* Time Warning */}
        {isRecording && progressPercentage > 75 && (
          <Alert severity="warning" icon={<Warning />}>
            <Typography variant="body2">
              {progressPercentage > 90 
                ? "Recording will stop automatically in a few seconds!"
                : "You're running out of time. Consider wrapping up your answer."
              }
            </Typography>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};