/**
 * Voice Analysis Display Component
 * 
 * Displays voice analysis results from recording processing.
 * Shows speaking metrics, feedback, and improvement suggestions.
 * 
 * Requirements: Recording System Implementation
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Stack,
  Alert,
  Divider,
  Tooltip,
  Card,
  CardContent
} from '@mui/material';
import {
  Speed,
  VolumeUp,
  Pause,
  RecordVoiceOver,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material';
// Inline type to avoid import issues
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
  // Helper function to get color based on score
  const getScoreColor = (score: number, optimal: [number, number]) => {
    if (score >= optimal[0] && score <= optimal[1]) return 'success';
    if (score >= optimal[0] * 0.8 && score <= optimal[1] * 1.2) return 'warning';
    return 'error';
  };

  // Helper function to get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  // Format speaking pace feedback
  const getSpeakingPaceFeedback = () => {
    const { speaking_pace_wpm } = analysis;
    if (speaking_pace_wpm < 120) {
      return { message: 'Consider speaking a bit faster', icon: <TrendingUp />, severity: 'info' as const };
    } else if (speaking_pace_wpm > 180) {
      return { message: 'Consider speaking a bit slower', icon: <TrendingDown />, severity: 'info' as const };
    } else {
      return { message: 'Excellent speaking pace', icon: <CheckCircle />, severity: 'success' as const };
    }
  };

  // Format filler words feedback
  const getFillerWordsFeedback = () => {
    const { filler_word_count } = analysis;
    if (filler_word_count === 0) {
      return { message: 'Perfect! No filler words detected', severity: 'success' as const };
    } else if (filler_word_count <= 2) {
      return { message: 'Very good - minimal filler words', severity: 'success' as const };
    } else if (filler_word_count <= 5) {
      return { message: 'Good - few filler words used', severity: 'warning' as const };
    } else {
      return { message: 'Try to reduce filler words', severity: 'error' as const };
    }
  };

  const paceFeedback = getSpeakingPaceFeedback();
  const fillerFeedback = getFillerWordsFeedback();

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RecordVoiceOver color="primary" />
        Voice Analysis Results
      </Typography>

      {/* Overall Confidence Score */}
      <Card sx={{ mb: 3, bgcolor: 'background.default' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              Overall Confidence Score
            </Typography>
            <Chip
              label={`${Math.round(analysis.confidence_score * 100)}%`}
              color={getConfidenceColor(analysis.confidence_score)}
              size="medium"
              sx={{ fontSize: '1rem', fontWeight: 'bold', px: 1 }}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={analysis.confidence_score * 100}
            color={getConfidenceColor(analysis.confidence_score)}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 3 
        }}
      >
        {/* Speaking Pace */}
        <Box>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Speed color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {Math.round(analysis.speaking_pace_wpm)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Words per minute
              </Typography>
              <Chip
                size="small"
                label="120-180 optimal"
                color={getScoreColor(analysis.speaking_pace_wpm, [120, 180])}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Speaking Time */}
        <Box>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <VolumeUp color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {Math.round(analysis.total_speaking_time)}s
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Speaking time
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round((analysis.total_speaking_time / analysis.total_duration) * 100)}% of total
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Pauses */}
        <Box>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Pause color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {analysis.pause_count}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pauses
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg: {analysis.average_pause_duration.toFixed(1)}s
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Volume Consistency */}
        <Box>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <VolumeUp color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {Math.round(analysis.volume_consistency * 100)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Volume consistency
              </Typography>
              <Chip
                size="small"
                label={analysis.volume_consistency > 0.7 ? "Good" : "Needs work"}
                color={analysis.volume_consistency > 0.7 ? "success" : "warning"}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Feedback Section */}
      <Typography variant="h6" gutterBottom>
        Feedback & Suggestions
      </Typography>

      <Stack spacing={2} sx={{ mb: 3 }}>
        {/* Speaking Pace Feedback */}
        <Alert severity={paceFeedback.severity} icon={paceFeedback.icon}>
          <Typography variant="body2">
            <strong>Speaking Pace:</strong> {paceFeedback.message} 
            ({Math.round(analysis.speaking_pace_wpm)} WPM)
          </Typography>
        </Alert>

        {/* Filler Words Feedback */}
        <Alert severity={fillerFeedback.severity}>
          <Typography variant="body2">
            <strong>Filler Words:</strong> {fillerFeedback.message}
            {analysis.filler_word_count > 0 && (
              <>
                {' '}({analysis.filler_word_count} detected
                {analysis.detected_fillers.length > 0 && 
                  `: ${analysis.detected_fillers.join(', ')}`
                })
              </>
            )}
          </Typography>
        </Alert>

        {/* Volume Consistency Feedback */}
        <Alert severity={analysis.volume_consistency > 0.7 ? "success" : "info"}>
          <Typography variant="body2">
            <strong>Volume Consistency:</strong> 
            {analysis.volume_consistency > 0.8 
              ? " Excellent volume control throughout your answer"
              : analysis.volume_consistency > 0.6
              ? " Good volume control with minor variations"
              : " Consider maintaining more consistent volume levels"
            }
          </Typography>
        </Alert>

        {/* Pause Analysis */}
        {analysis.pause_count > 0 && (
          <Alert severity="info" icon={<Info />}>
            <Typography variant="body2">
              <strong>Pauses:</strong> You used {analysis.pause_count} strategic pauses
              {analysis.average_pause_duration > 2 
                ? " - consider shorter pauses for better flow"
                : " - good use of pauses for emphasis"
              }
              {analysis.longest_pause > 5 && 
                ` (longest: ${analysis.longest_pause.toFixed(1)}s)`
              }
            </Typography>
          </Alert>
        )}
      </Stack>

      {/* Transcription Section */}
      {showTranscription && transcription && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>
            Transcription
          </Typography>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              maxHeight: 200, 
              overflow: 'auto',
              fontStyle: transcription ? 'normal' : 'italic'
            }}
          >
            <Typography variant="body2">
              {transcription || "Transcription not available"}
            </Typography>
          </Paper>
        </>
      )}

      {/* Technical Details (Collapsible) */}
      {analysis.analysis_metadata && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Technical details: {analysis.analysis_metadata.word_count} words, 
            {' '}{Math.round(analysis.analysis_metadata.speech_ratio * 100)}% speech ratio,
            {' '}{analysis.analysis_metadata.sample_rate}Hz sample rate
          </Typography>
        </Box>
      )}
    </Paper>
  );
};