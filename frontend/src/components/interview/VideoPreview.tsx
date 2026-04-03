/**
 * Premium Video Preview Component
 * High-end AI "Tactical Visual Uplink" interface
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  CircularProgress,
  alpha,
  useTheme
} from '@mui/material';
import {
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  Fullscreen,
  FullscreenExit,
  DragIndicator,
  GpsFixed
} from '@mui/icons-material';
import logger from '../../utils/logger';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

export interface VideoPreviewProps {
  stream: MediaStream | null;
  isRecording?: boolean;
  showControls?: boolean;
  width?: string | number;
  height?: string | number;
  draggable?: boolean;
  compact?: boolean;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  stream,
  isRecording = false,
  showControls = true,
  width = '100%',
  height = 'auto',
  draggable = false,
  compact = false
}) => {
  const theme = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth - (compact ? 220 : 440) : 20, 
    y: 20 
  });
  const dragStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!videoRef.current || !stream) {
      setIsVideoReady(false);
      setHasVideo(false);
      setHasAudio(false);
      return;
    }

    const video = videoRef.current;
    let mounted = true;

    const setupVideo = async () => {
      try {
        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();
        
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;

        if (mounted) {
          setHasVideo(videoTracks.length > 0 && videoTracks[0].enabled);
          setHasAudio(audioTracks.length > 0 && audioTracks[0].enabled);
        }

        const handleLoadedMetadata = () => { if (mounted) setIsVideoReady(true); };
        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        try { await video.play(); } catch (playError) { console.warn('Autoplay prevented'); }
        
        return () => { video.removeEventListener('loadedmetadata', handleLoadedMetadata); };
      } catch (error) {
        console.error('Video setup fail:', error);
      }
    };

    const cleanup = setupVideo();
    return () => {
      mounted = false;
      cleanup.then(c => c?.());
      if (video) { video.pause(); video.srcObject = null; }
    };
  }, [stream]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable) return;
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !draggable) return;
    const maxX = window.innerWidth - (compact ? 200 : 400);
    const maxY = window.innerHeight - (compact ? 200 : 300);
    setPosition({ x: Math.max(0, Math.min(e.clientX - dragStartPos.current.x, maxX)), y: Math.max(0, Math.min(e.clientY - dragStartPos.current.y, maxY)) });
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', () => setIsDragging(false));
      return () => { window.removeEventListener('mousemove', handleMouseMove); };
    }
  }, [isDragging]);

  const toggleFullscreen = () => {
     if (!containerRef.current) return;
     if (!isFullscreen) containerRef.current.requestFullscreen();
     else document.exitFullscreen();
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!stream) {
    return (
       <Box
          onMouseDown={handleMouseDown}
          sx={{
            width: compact ? 180 : width,
            height: compact ? 240 : (height === 'auto' ? 300 : height),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.background.paper, 0.4),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 6,
            position: draggable ? 'fixed' : 'relative',
            ...(draggable && { top: position.y, left: position.x, zIndex: 1000, cursor: isDragging ? 'grabbing' : 'grab' }),
          }}
       >
          <Stack alignItems="center" spacing={2} sx={{ opacity: 0.3 }}>
             <VideocamOff sx={{ fontSize: 48 }} />
             <Typography variant="caption" sx={{ fontWeight: 900, fontFamily: 'Orbitron', letterSpacing: '0.1em' }}>UPLINK OFFLINE</Typography>
          </Stack>
       </Box>
    );
  }

  return (
    <MotionBox
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      onMouseDown={handleMouseDown}
      sx={{
        width: compact ? 180 : width,
        height: compact ? 240 : height,
        position: draggable ? 'fixed' : 'relative',
        ...(draggable && { top: position.y, left: position.x, zIndex: 1000, cursor: isDragging ? 'grabbing' : 'grab' }),
        overflow: 'hidden',
        bgcolor: '#000',
        borderRadius: 6,
        border: `2px solid ${isRecording ? theme.palette.error.main : alpha(theme.palette.divider, 0.1)}`,
        boxShadow: isRecording ? `0 0 30px ${alpha(theme.palette.error.main, 0.3)}` : `0 20px 50px rgba(0,0,0,0.5)`,
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
      }}
    >
      {/* HUD Overlays */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
          {/* Scanning Lines Effect */}
          <Box sx={{ 
             position: 'absolute', top: 0, left: 0, right: 0, height: '100%', 
             background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
             backgroundSize: '100% 4px, 3px 100%', zIndex: 2, opacity: 0.4
          }} />
          
          {/* Corner Decors */}
          <Box sx={{ position: 'absolute', top: 10, left: 10, width: 20, height: 20, borderLeft: '2px solid white', borderTop: '2px solid white', opacity: 0.5 }} />
          <Box sx={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRight: '2px solid white', borderTop: '2px solid white', opacity: 0.5 }} />
          <Box sx={{ position: 'absolute', bottom: 10, left: 10, width: 20, height: 20, borderLeft: '2px solid white', borderBottom: '2px solid white', opacity: 0.5 }} />
          <Box sx={{ position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderRight: '2px solid white', borderBottom: '2px solid white', opacity: 0.5 }} />
      </Box>

      {/* Drag Indicator Overlay */}
      {draggable && (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.3)', zIndex: 10 }}>
           <DragIndicator sx={{ color: 'white', opacity: 0.5, fontSize: 18 }} />
        </Box>
      )}

      {/* Video Content */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', filter: isRecording ? 'contrast(1.1) brightness(1.1)' : 'none' }}
      />

      <AnimatePresence>
        {!isVideoReady && (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.9)', zIndex: 20 }}
          >
             <Stack alignItems="center" spacing={2}>
                <CircularProgress size={32} sx={{ color: 'primary.main' }} />
                <Typography variant="caption" sx={{ fontWeight: 900, fontFamily: 'Orbitron', color: 'white' }}>SYNCING UPLINK...</Typography>
             </Stack>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Telemetry Labels */}
      <Box sx={{ position: 'absolute', bottom: 12, left: 12, zIndex: 10, pointerEvents: 'none' }}>
         <Stack direction="row" spacing={1} alignItems="center">
            <GpsFixed sx={{ fontSize: 12, color: 'primary.main' }} />
            <Typography variant="caption" sx={{ fontWeight: 900, fontFamily: 'Orbitron', color: 'rgba(255,255,255,0.7)', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
               VISUAL FEED: {isRecording ? 'ENCRYPTED' : 'STANDBY'}
            </Typography>
         </Stack>
      </Box>

      {/* Control Overlays */}
      <Box sx={{ position: 'absolute', top: draggable ? 40 : 12, right: 12, zIndex: 10 }}>
         <Stack direction="row" spacing={1}>
            {isRecording && (
               <Chip 
                  label="REC" 
                  size="small" 
                  sx={{ 
                    height: 18, 
                    fontWeight: 1000, 
                    fontFamily: 'Orbitron', 
                    fontSize: '0.6rem', 
                    bgcolor: 'error.main', 
                    color: 'white',
                    animation: 'pulse 1.5s infinite',
                    '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.5 } }
                  }} 
               />
            )}
            {showControls && !compact && !draggable && (
               <IconButton onClick={toggleFullscreen} size="small" sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
                  {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
               </IconButton>
            )}
         </Stack>
      </Box>

      {/* Status Indicators Row */}
      {showControls && !compact && (
        <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
           <Stack direction="row" spacing={1}>
              <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: alpha(theme.palette.success.main, 0.2), border: `1px solid ${alpha(theme.palette.success.main, 0.4)}`, display: 'flex' }}>
                 {hasVideo ? <Videocam sx={{ fontSize: 12, color: theme.palette.success.main }} /> : <VideocamOff sx={{ fontSize: 12, color: theme.palette.error.main }} />}
              </Box>
              <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: alpha(theme.palette.success.main, 0.2), border: `1px solid ${alpha(theme.palette.success.main, 0.4)}`, display: 'flex' }}>
                 {hasAudio ? <Mic sx={{ fontSize: 12, color: theme.palette.success.main }} /> : <MicOff sx={{ fontSize: 12, color: theme.palette.error.main }} />}
              </Box>
           </Stack>
        </Box>
      )}
    </MotionBox>
  );
};
