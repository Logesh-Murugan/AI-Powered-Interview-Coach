/**
 * Premium Recording Controls Component
 * High-end AI "Bio-Metric" recording interface
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Alert,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  LinearProgress,
  Fade,
  CircularProgress,
  alpha,
  useTheme
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
} from '@mui/icons-material';
import { useMediaRecorder } from '../../hooks/useMediaRecorder';
import { VideoPreview } from './VideoPreview';
import logger from '../../utils/logger';
import type { RecordingOptions, RecordingResult } from '../../types/recording';
import { GlassCard, GradientButton } from '../common/PremiumComponents';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

export interface RecordingControlsProps {
  onRecordingComplete: (result: RecordingResult) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  disabled?: boolean;
  maxDuration?: number; 
  includeVideo?: boolean;
  showVideoToggle?: boolean;
  // Optional external recorder state to synchronize with parent
  recorder?: {
    isRecording: boolean;
    isPaused: boolean;
    recordingTime: number;
    hasPermission: boolean;
    permissionError: string | null;
    recordingError: string | null;
    isSupported: boolean;
    formattedTime: string;
    stream: MediaStream | null;
    requestPermissions: (options?: RecordingOptions) => Promise<MediaStream>;
    startRecording: (options?: RecordingOptions) => Promise<void>;
    pauseRecording: () => void;
    resumeRecording: () => void;
    stopRecording: () => Promise<RecordingResult>;
  };
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
  disabled = false,
  maxDuration = 600,
  includeVideo = false,
  showVideoToggle = true,
  recorder: externalRecorder
}) => {
  const theme = useTheme();
  const [videoEnabled, setVideoEnabled] = useState(includeVideo);
  const [isProcessing, setIsProcessing] = useState(false);
  const [componentError, setComponentError] = useState<string | null>(null);

  const internalRecorder = useMediaRecorder();
  const recorder = externalRecorder || internalRecorder;

  const {
    isRecording,
    isPaused,
    recordingTime,
    hasPermission,
    permissionError,
    recordingError,
    isSupported,
    formattedTime,
    stream,
    requestPermissions,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  } = recorder;

  const handleStartRecording = useCallback(async () => {
    try {
      setComponentError(null);
      if (!isSupported) {
        setComponentError('RECODRING ARCHITECTURE NOT SUPPORTED.');
        return;
      }

      if (!hasPermission) {
        try {
          await requestPermissions({ includeVideo: videoEnabled });
        } catch (permError) {
          return;
        }
      }

      const options: RecordingOptions = {
        includeVideo: videoEnabled,
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: videoEnabled ? 2500000 : undefined
      };

      await startRecording(options);
      onRecordingStart?.();
    } catch (error: any) {
      logger.error('Recording start fail', error);
    }
  }, [videoEnabled, startRecording, onRecordingStart, isSupported, hasPermission, requestPermissions]);

  const handleStopRecording = useCallback(async () => {
    try {
      setIsProcessing(true);
      const result = await stopRecording();
      onRecordingComplete(result);
      onRecordingStop?.();
    } catch (error) {
      console.error('Stop fail:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [stopRecording, onRecordingComplete, onRecordingStop]);

  const handlePauseResume = useCallback(() => {
    if (isPaused) resumeRecording();
    else pauseRecording();
  }, [isPaused, pauseRecording, resumeRecording]);

  const progressPercentage = maxDuration > 0 ? (recordingTime / maxDuration) * 100 : 0;
  const getProgressColor = () => {
    if (progressPercentage > 90) return theme.palette.error.main;
    if (progressPercentage > 75) return theme.palette.warning.main;
    return theme.palette.primary.main;
  };

  React.useEffect(() => {
    if (isRecording && recordingTime >= maxDuration) handleStopRecording();
  }, [isRecording, recordingTime, maxDuration, handleStopRecording]);

  if (!isSupported) {
    return (
      <GlassCard sx={{ p: 3, bgcolor: alpha(theme.palette.error.main, 0.1), border: `1px solid ${theme.palette.error.main}` }}>
        <Typography variant="body2" sx={{ fontWeight: 900, color: 'error.main' }}>SIGNAL ARCHITECTURE OFFLINE: BROWSER INCOMPATIBLE.</Typography>
      </GlassCard>
    );
  }

  return (
    <Box>
      <Stack spacing={3}>
        {/* Header HUD */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron', letterSpacing: '0.1em' }}>
             {isRecording ? 'LIVE SIGNAL' : 'RECEPTION READY'}
          </Typography>
          
          {showVideoToggle && (
            <Tooltip title="TOGGLE VISUAL UPLINK">
              <IconButton
                onClick={() => setVideoEnabled(!videoEnabled)}
                disabled={disabled || isRecording}
                sx={{ 
                   bgcolor: videoEnabled ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.divider, 0.05),
                   color: videoEnabled ? 'primary.main' : 'text.disabled',
                   border: `1px solid ${videoEnabled ? alpha(theme.palette.primary.main, 0.3) : 'transparent'}`
                }}
              >
                {videoEnabled ? <Videocam sx={{ fontSize: 20 }} /> : <VideocamOff sx={{ fontSize: 20 }} />}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Permission & Error Alerts */}
        {(componentError || permissionError || recordingError) && (
           <Fade in>
             <Alert 
               severity={permissionError ? "warning" : "error"} 
               sx={{ 
                  borderRadius: 3, 
                  fontWeight: 700, 
                  bgcolor: alpha(theme.palette.error.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}` 
               }}
             >
               {(componentError || permissionError || recordingError)?.toUpperCase()}
             </Alert>
           </Fade>
        )}

        {/* Recording Visuals */}
        {(isRecording || hasPermission) && (
          <Box>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <MotionBox 
                animate={isRecording && !isPaused ? { opacity: [1, 0.5, 1], scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                 <Chip
                    icon={isRecording ? <Mic sx={{ fontSize: 16 }} /> : <MicOff sx={{ fontSize: 16 }} />}
                    label={isRecording ? (isPaused ? "STANDBY" : "ACTIVE") : "READY"}
                    sx={{ 
                      fontWeight: 1000, 
                      fontFamily: 'Orbitron', 
                      fontSize: '0.65rem',
                      bgcolor: isRecording ? (isPaused ? alpha(theme.palette.warning.main, 0.2) : alpha(theme.palette.error.main, 0.2)) : alpha(theme.palette.success.main, 0.2),
                      color: isRecording ? (isPaused ? 'warning.main' : 'error.main') : 'success.main',
                      border: `1px solid ${isRecording ? (isPaused ? theme.palette.warning.main : theme.palette.error.main) : theme.palette.success.main}`,
                      '& .MuiChip-icon': { color: 'inherit' }
                    }}
                 />
              </MotionBox>
              
              <Typography variant="h4" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', color: isRecording && !isPaused ? 'error.main' : 'text.primary' }}>
                {formattedTime}
              </Typography>
            </Stack>

            {isRecording && maxDuration > 0 && (
              <Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(progressPercentage, 100)}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4, 
                    bgcolor: alpha(theme.palette.divider, 0.1),
                    '& .MuiLinearProgress-bar': {
                       bgcolor: getProgressColor(),
                       boxShadow: `0 0 10px ${alpha(getProgressColor(), 0.4)}`
                    }
                  }}
                />
                <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', display: 'block', mt: 1, textAlign: 'right' }}>
                  {Math.max(0, maxDuration - recordingTime)}S REMAINING
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Interaction Hub */}
        <Stack direction="row" spacing={3} justifyContent="center">
          {!isRecording ? (
            <GradientButton
              onClick={handleStartRecording}
              disabled={disabled || isProcessing}
              startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
              sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
            >
              {isProcessing ? "INITIALIZING..." : "START UPLINK"}
            </GradientButton>
          ) : (
            <>
              <IconButton
                onClick={handlePauseResume}
                disabled={disabled}
                sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', p: 2, border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}` }}
              >
                {isPaused ? <PlayArrow /> : <Pause />}
              </IconButton>
              
              <IconButton
                onClick={handleStopRecording}
                disabled={disabled || isProcessing}
                sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', p: 2, border: `1px solid ${alpha(theme.palette.error.main, 0.3)}` }}
              >
                {isProcessing ? <CircularProgress size={20} color="inherit" /> : <Stop />}
              </IconButton>
            </>
          )}
        </Stack>

        {!hasPermission && !permissionError && (
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textAlign: 'center', display: 'block' }}>
            AWAITING BIOMETRIC PERMISSIONS...
          </Typography>
        )}
      </Stack>
    </Box>
  );
};