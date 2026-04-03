/**
 * Premium Video Analysis Display
 * High-end AI-driven visual telemetry interface
 */

import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  LinearProgress,
  Grid,
  Alert,
  alpha,
  useTheme,
  Divider
} from '@mui/material';
import {
  Videocam,
  Lightbulb,
  CameraAlt,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info,
  Layers
} from '@mui/icons-material';
import { GlassCard, GradientText } from '../common/PremiumComponents';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

export interface VideoAnalysis {
  video_properties?: {
    width: number;
    height: number;
    fps: number;
    frame_count: number;
    duration: number;
    resolution: string;
  };
  lighting?: {
    average_brightness: number;
    brightness_consistency: number;
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    feedback: string;
  };
  stability?: {
    average_motion: number;
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    feedback: string;
  };
  overall_quality?: {
    score: number;
    rating: 'poor' | 'fair' | 'good' | 'excellent';
  };
  error?: string;
  analysis_metadata?: {
    frames_analyzed?: number;
    analysis_available?: boolean;
    reason?: string;
  };
}

export interface VideoAnalysisDisplayProps {
  analysis: VideoAnalysis;
  showDetails?: boolean;
}

export const VideoAnalysisDisplay: React.FC<VideoAnalysisDisplayProps> = ({
  analysis,
  showDetails = true
}) => {
  const theme = useTheme();

  const getQualityColor = (quality: string): string => {
    switch (quality) {
      case 'excellent': return theme.palette.success.main;
      case 'good': return theme.palette.info.main;
      case 'fair': return theme.palette.warning.main;
      case 'poor': return theme.palette.error.main;
      default: return theme.palette.text.disabled;
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent':
      case 'good': return <CheckCircle sx={{ fontSize: 16 }} />;
      case 'fair': return <Warning sx={{ fontSize: 16 }} />;
      case 'poor': return <ErrorIcon sx={{ fontSize: 16 }} />;
      default: return <Info sx={{ fontSize: 16 }} />;
    }
  };

  if (analysis.error || analysis.analysis_metadata?.analysis_available === false) {
    return (
      <GlassCard sx={{ p: 4, bgcolor: alpha(theme.palette.info.main, 0.05), border: `1px solid ${theme.palette.info.main}44` }}>
        <Stack direction="row" spacing={2} alignItems="center">
           <Info color="info" />
           <Typography variant="body2" sx={{ fontWeight: 800 }}>
             {analysis.error || analysis.analysis_metadata?.reason || 'VISUAL TELEMETRY OFFLINE: DATA ARCHIVE INACCESSIBLE.'}
           </Typography>
        </Stack>
      </GlassCard>
    );
  }

  const { video_properties, lighting, stability, overall_quality } = analysis;

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={3}>
         <Videocam color="primary" />
         <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', letterSpacing: '0.1em' }}>VISUAL TELEMETRY</Typography>
      </Stack>

      <Grid container spacing={3}>
        {/* Overall Integrity Score */}
        {overall_quality && (
          <Grid size={12}>
            <GlassCard sx={{ p: 4, borderLeft: `6px solid ${getQualityColor(overall_quality.rating)}` }}>
               <Stack direction="row" spacing={3} alignItems="center">
                  <Box>
                     <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', display: 'block', mb: 0.5 }}>INTEGRITY RATING</Typography>
                     <Typography variant="h4" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', color: getQualityColor(overall_quality.rating) }}>
                        {(overall_quality.score * 100).toFixed(0)}%
                     </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ opacity: 0.1 }} />
                  <Box sx={{ flex: 1 }}>
                     <Chip 
                        icon={getQualityIcon(overall_quality.rating)}
                        label={overall_quality.rating.toUpperCase()}
                        sx={{ 
                           fontWeight: 900, 
                           fontFamily: 'Orbitron', 
                           fontSize: '0.7rem',
                           bgcolor: alpha(getQualityColor(overall_quality.rating), 0.1),
                           color: getQualityColor(overall_quality.rating),
                           border: `1px solid ${alpha(getQualityColor(overall_quality.rating), 0.3)}`,
                           mb: 1.5
                        }}
                     />
                     <LinearProgress 
                        variant="determinate" 
                        value={overall_quality.score * 100} 
                        sx={{ 
                           height: 6, 
                           borderRadius: 3, 
                           bgcolor: alpha(theme.palette.divider, 0.1),
                           '& .MuiLinearProgress-bar': { bgcolor: getQualityColor(overall_quality.rating) }
                        }} 
                     />
                  </Box>
               </Stack>
            </GlassCard>
          </Grid>
        )}

        {/* Diagonal Metrics */}
        {showDetails && (
          <>
            {lighting && (
               <Grid size={{ xs: 12, md: 6 }}>
                  <GlassCard sx={{ p: 3, height: '100%' }}>
                     <Stack spacing={2.5}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                           <Stack direction="row" spacing={1} alignItems="center">
                              <Lightbulb color="primary" sx={{ fontSize: 20 }} />
                              <Typography variant="subtitle2" sx={{ fontWeight: 900, fontFamily: 'Orbitron', fontSize: '0.75rem' }}>LUMINANCE QUALITY</Typography>
                           </Stack>
                           <Chip 
                              label={lighting.quality.toUpperCase()} 
                              size="small"
                              sx={{ fontWeight: 900, fontSize: '0.6rem', height: 18, color: getQualityColor(lighting.quality), bgcolor: 'transparent', border: `1px solid ${getQualityColor(lighting.quality)}` }} 
                           />
                        </Stack>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.75rem', minHeight: 40 }}>{lighting.feedback}</Typography>
                        <Box>
                           <Stack direction="row" justifyContent="space-between" mb={0.5}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>BRIGHTNESS</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 800 }}>{lighting.average_brightness.toFixed(0)} / 255</Typography>
                           </Stack>
                           <LinearProgress 
                              variant="determinate" 
                              value={(lighting.average_brightness / 255) * 100} 
                              sx={{ height: 4, borderRadius: 2, bgcolor: alpha(theme.palette.divider, 0.05) }} 
                           />
                        </Box>
                     </Stack>
                  </GlassCard>
               </Grid>
            )}

            {stability && (
               <Grid size={{ xs: 12, md: 6 }}>
                  <GlassCard sx={{ p: 3, height: '100%' }}>
                     <Stack spacing={2.5}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                           <Stack direction="row" spacing={1} alignItems="center">
                              <CameraAlt color="primary" sx={{ fontSize: 20 }} />
                              <Typography variant="subtitle2" sx={{ fontWeight: 900, fontFamily: 'Orbitron', fontSize: '0.75rem' }}>MOTION STABILITY</Typography>
                           </Stack>
                           <Chip 
                              label={stability.quality.toUpperCase()} 
                              size="small"
                              sx={{ fontWeight: 900, fontSize: '0.6rem', height: 18, color: getQualityColor(stability.quality), bgcolor: 'transparent', border: `1px solid ${getQualityColor(stability.quality)}` }} 
                           />
                        </Stack>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.75rem', minHeight: 40 }}>{stability.feedback}</Typography>
                        <Box>
                           <Stack direction="row" justifyContent="space-between" mb={0.5}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>SMOOTHNESS</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 800 }}>{(100 - Math.min(100, stability.average_motion * 2)).toFixed(0)}%</Typography>
                           </Stack>
                           <LinearProgress 
                              variant="determinate" 
                              value={100 - Math.min(100, stability.average_motion * 2)} 
                              sx={{ height: 4, borderRadius: 2, bgcolor: alpha(theme.palette.divider, 0.05) }} 
                           />
                        </Box>
                     </Stack>
                  </GlassCard>
               </Grid>
            )}

            {/* Hardware Vector */}
            {video_properties && (
               <Grid size={12}>
                  <Box sx={{ p: 2, borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.2), border: `1px solid ${alpha(theme.palette.divider, 0.05)}` }}>
                     <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5} px={1}>
                        <Layers sx={{ color: 'primary.main', fontSize: 16 }} />
                        <Typography variant="caption" sx={{ fontWeight: 900, fontFamily: 'Orbitron', letterSpacing: '0.05em' }}>HARDWARE VECTOR ARCHIVE</Typography>
                     </Stack>
                     <Grid container spacing={2}>
                        {[
                           { l: 'RESOLUTION', v: video_properties.resolution },
                           { l: 'FPS', v: `${video_properties.fps.toFixed(1)} FPS` },
                           { l: 'DURATION', v: `${video_properties.duration.toFixed(1)}S` },
                           { l: 'FRAMES', v: video_properties.frame_count },
                        ].map((item, i) => (
                           <Grid key={i} size={{ xs: 6, sm: 3 }}>
                              <Box sx={{ px: 2 }}>
                                 <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, display: 'block', mb: 0.2 }}>{item.l}</Typography>
                                 <Typography variant="body2" sx={{ fontWeight: 900, fontFamily: 'monospace' }}>{item.v}</Typography>
                              </Box>
                           </Grid>
                        ))}
                     </Grid>
                  </Box>
               </Grid>
            )}
          </>
        )}
      </Grid>

      {/* Metadata Footnote */}
      {analysis.analysis_metadata?.frames_analyzed && (
        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, mt: 3, display: 'block', textAlign: 'right' }}>
          DIAGNOSTICS DERIVED FROM {analysis.analysis_metadata.frames_analyzed} VECTOR SAMPLES
        </Typography>
      )}
    </Box>
  );
};
