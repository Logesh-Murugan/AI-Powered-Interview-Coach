/**
 * Premium Voice Analysis Display
 * High-end AI-driven acoustic telemetry interface
 */

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Stack,
  Alert,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import {
  Speed,
  VolumeUp,
  Pause as PauseIcon,
  RecordVoiceOver,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  GraphicEq,
  HistoryEdu
} from '@mui/icons-material';
import { GlassCard, GradientText } from '../common/PremiumComponents';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

interface VoiceAnalysis {
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

export interface VoiceAnalysisDisplayProps {
  analysis: VoiceAnalysis;
  transcription?: string;
  showTranscription?: boolean;
}

export const VoiceAnalysisDisplay: React.FC<VoiceAnalysisDisplayProps> = ({
  analysis,
  transcription,
  showTranscription = true
}) => {
  const theme = useTheme();

  const getScoreColor = (score: number, optimal: [number, number]) => {
    if (score >= optimal[0] && score <= optimal[1]) return theme.palette.success.main;
    if (score >= optimal[0] * 0.8 && score <= optimal[1] * 1.2) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return theme.palette.success.main;
    if (confidence >= 0.6) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const paceFeedback = (() => {
    const { speaking_pace_wpm } = analysis;
    if (speaking_pace_wpm < 120) return { m: 'RECEPTION SLOW: INCREASE VELOCITY', i: <TrendingUp />, c: 'info' as const };
    if (speaking_pace_wpm > 180) return { m: 'RECEPTION FAST: MODULATE VELOCITY', i: <TrendingDown />, c: 'warning' as const };
    return { m: 'OPTIMAL ACOUSTIC VELOCITY', i: <CheckCircle />, c: 'success' as const };
  })();

  const fillerFeedback = (() => {
    const { filler_word_count } = analysis;
    if (filler_word_count === 0) return { m: 'ZERO ARTIFACTS DETECTED', c: 'success' as const };
    if (filler_word_count <= 2) return { m: 'MINIMAL ARTIFACT INTERFERENCE', c: 'success' as const };
    if (filler_word_count <= 5) return { m: 'MODERATE ARTIFACT PRESENCE', c: 'warning' as const };
    return { m: 'HIGH ARTIFACT DENSITY DETECTED', c: 'error' as const };
  })();

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={3}>
         <GraphicEq color="primary" />
         <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', letterSpacing: '0.1em' }}>ACOUSTIC TELEMETRY</Typography>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
         {/* Confidence Vector */}
         <Grid size={12}>
            <GlassCard sx={{ p: 4, bgcolor: alpha(theme.palette.background.paper, 0.4) }}>
               <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, fontFamily: 'Orbitron', fontSize: '0.8rem' }}>CONFIDENCE VECTOR RATING</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 1000, color: getConfidenceColor(analysis.confidence_score), fontFamily: 'Orbitron' }}>
                     {Math.round(analysis.confidence_score * 100)}%
                  </Typography>
               </Stack>
               <LinearProgress 
                 variant="determinate" 
                 value={analysis.confidence_score * 100} 
                 sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.divider, 0.1),
                    '& .MuiLinearProgress-bar': { bgcolor: getConfidenceColor(analysis.confidence_score) }
                 }} 
               />
            </GlassCard>
         </Grid>

         {/* Metric Bento */}
         {[
           { label: 'VELOCITY (WPM)', value: Math.round(analysis.speaking_pace_wpm), icon: <Speed />, color: getScoreColor(analysis.speaking_pace_wpm, [120, 180]) },
           { label: 'UPLINK TIME', value: `${Math.round(analysis.total_speaking_time)}S`, icon: <RecordVoiceOver />, color: theme.palette.primary.main },
           { label: 'PAUSE NODES', value: analysis.pause_count, icon: <PauseIcon />, color: theme.palette.secondary.main },
           { label: 'SIGNAL STABILITY', value: `${Math.round(analysis.volume_consistency * 100)}%`, icon: <VolumeUp />, color: analysis.volume_consistency > 0.7 ? theme.palette.success.main : theme.palette.warning.main },
         ].map((stat, i) => (
           <Grid key={i} size={{ xs: 6, md: 3 }}>
              <GlassCard sx={{ p: 3, textAlign: 'center', borderBottom: `3px solid ${stat.color}` }}>
                 <Box sx={{ color: stat.color, mb: 1, opacity: 0.6 }}>{stat.icon}</Box>
                 <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>{stat.value}</Typography>
                 <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.05em' }}>{stat.label}</Typography>
              </GlassCard>
           </Grid>
         ))}
      </Grid>

      {/* Diagnostics Alerts */}
      <Stack spacing={2} sx={{ mb: 4 }}>
         <Alert 
           severity={paceFeedback.c} 
           icon={paceFeedback.i}
           sx={{ borderRadius: 3, fontWeight: 800, bgcolor: alpha(theme.palette[paceFeedback.c].main, 0.05), border: `1px solid ${alpha(theme.palette[paceFeedback.c].main, 0.2)}` }}
         >
            {paceFeedback.m}
         </Alert>
         <Alert 
           severity={fillerFeedback.c}
           sx={{ borderRadius: 3, fontWeight: 800, bgcolor: alpha(theme.palette[fillerFeedback.c].main, 0.05), border: `1px solid ${alpha(theme.palette[fillerFeedback.c].main, 0.2)}` }}
         >
            {fillerFeedback.m} {analysis.filler_word_count > 0 && `(${analysis.filler_word_count} ARTIFACTS)`}
         </Alert>
      </Stack>

      {/* Transcription Archive */}
      {showTranscription && transcription && (
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
             <HistoryEdu color="primary" sx={{ fontSize: 18 }} />
             <Typography variant="caption" sx={{ fontWeight: 900, fontFamily: 'Orbitron', letterSpacing: '0.1em' }}>TRANSCRIPTION ARCHIVE</Typography>
          </Stack>
          <GlassCard 
            sx={{ 
               p: 3, 
               bgcolor: alpha(theme.palette.background.paper, 0.2),
               maxHeight: 200, 
               overflow: 'auto',
               '&::-webkit-scrollbar': { width: '4px' },
               '&::-webkit-scrollbar-thumb': { bgcolor: alpha(theme.palette.primary.main, 0.2), borderRadius: '4px' }
            }}
          >
            <Typography variant="body2" sx={{ lineHeight: 1.8, color: 'text.secondary', fontWeight: 500 }}>
              {transcription}
            </Typography>
          </GlassCard>
        </Box>
      )}

      {/* Technical Metadata */}
      <Box sx={{ mt: 3, opacity: 0.4 }}>
         <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', textAlign: 'right' }}>
            METADATA: {analysis.analysis_metadata.word_count} WORDS | {(analysis.analysis_metadata.speech_ratio * 100).toFixed(1)}% RATIO | {analysis.analysis_metadata.sample_rate}HZ
         </Typography>
      </Box>
    </Box>
  );
};