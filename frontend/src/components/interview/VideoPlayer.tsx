/**
 * Video Player Component
 * 
 * Component for playing back recorded interview videos.
 * Provides video controls and responsive layout.
 * 
 * Requirements: Recording System Implementation - Video Playback
 */

import React, { useRef, useState } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Stack,
  Slider,
  Tooltip,
  Alert
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit
} from '@mui/icons-material';

export interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  width?: string | number;
  height?: string | number;
  autoPlay?: boolean;
  showControls?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  title,
  width = '100%',
  height = 'auto',
  autoPlay = false,
  showControls = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Play/Pause toggle
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => {
        console.error('Play failed:', err);
        setError('Failed to play video. Please try again.');
      });
    }
  };

  // Mute/Unmute toggle
  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Fullscreen toggle
  const handleFullscreenToggle = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Time update handler
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  // Duration loaded handler
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  // Seek handler
  const handleSeek = (_event: Event, value: number | number[]) => {
    if (!videoRef.current) return;
    const time = value as number;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  // Volume change handler
  const handleVolumeChange = (_event: Event, value: number | number[]) => {
    if (!videoRef.current) return;
    const vol = value as number;
    videoRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <Paper elevation={2} sx={{ overflow: 'hidden' }} ref={containerRef}>
      {title && (
        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ position: 'relative', bgcolor: 'black' }}>
        <video
          ref={videoRef}
          src={videoUrl}
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            maxWidth: '100%',
            display: 'block'
          }}
          autoPlay={autoPlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={(e) => {
            console.error('Video error:', e);
            setError('Failed to load video. The file may be corrupted or in an unsupported format.');
          }}
        >
          Your browser does not support video playback.
        </video>

        {showControls && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              p: 1
            }}
          >
            {/* Progress bar */}
            <Slider
              value={currentTime}
              max={duration || 100}
              onChange={handleSeek}
              sx={{
                color: 'primary.main',
                '& .MuiSlider-thumb': {
                  width: 12,
                  height: 12
                }
              }}
            />

            {/* Controls */}
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Play/Pause */}
              <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
                <IconButton onClick={handlePlayPause} sx={{ color: 'white' }}>
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
              </Tooltip>

              {/* Time display */}
              <Typography variant="body2" sx={{ color: 'white', minWidth: 80 }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>

              {/* Volume control */}
              <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
                <IconButton onClick={handleMuteToggle} sx={{ color: 'white' }}>
                  {isMuted ? <VolumeOff /> : <VolumeUp />}
                </IconButton>
              </Tooltip>

              <Box sx={{ width: 100 }}>
                <Slider
                  value={volume}
                  max={1}
                  step={0.1}
                  onChange={handleVolumeChange}
                  sx={{
                    color: 'white',
                    '& .MuiSlider-thumb': {
                      width: 10,
                      height: 10
                    }
                  }}
                />
              </Box>

              <Box sx={{ flexGrow: 1 }} />

              {/* Fullscreen */}
              <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                <IconButton onClick={handleFullscreenToggle} sx={{ color: 'white' }}>
                  {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        )}
      </Box>
    </Paper>
  );
};
