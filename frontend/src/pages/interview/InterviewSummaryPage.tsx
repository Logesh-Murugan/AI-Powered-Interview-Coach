/**
 * Premium Interview Summary Page
 * High-end AI-powered session analytics and performance dossier
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Chip,
  Stack,
  Divider,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha,
  useTheme,
  CircularProgress,
} from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { VoiceAnalysisDisplay } from '../../components/interview/VoiceAnalysisDisplay';
import { VideoAnalysisDisplay } from '../../components/interview/VideoAnalysisDisplay';
import {
  TrendingUp,
  TrendingDown,
  Home,
  Replay,
  CheckCircle,
  EmojiEvents,
  ExpandMore,
  Assessment,
  Timer,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import apiService from '../../services/api.service';
import SuccessConfetti from '../../components/animations/SuccessConfetti';
import { GlassCard, GradientButton, GradientText } from '../../components/common/PremiumComponents';

const MotionBox = motion.create(Box);

interface SessionSummary {
  id: number;
  session_id: number;
  overall_session_score: number;
  avg_content_quality: number;
  avg_clarity: number;
  avg_confidence: number;
  avg_technical_accuracy: number;
  score_trend: number | null;
  previous_session_score: number | null;
  top_strengths: string[];
  top_improvements: string[];
  category_performance: Record<string, number>;
  total_questions: number;
  total_time_seconds: number;
}

interface Answer {
  id: number;
  question_id: number;
  question_text: string;
  answer_text: string;
  audio_url: string | null;
  video_url: string | null;
  transcription: string | null;
  voice_analysis: any;
  video_analysis: any;
}

function InterviewSummaryPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const loadSummary = async () => {
      if (!sessionId) return;
      setLoading(true);
      try {
        const response = await apiService.get(`/interviews/${sessionId}/summary`);
        const summaryData = response.data as SessionSummary;
        setSummary(summaryData);
        
        try {
          const answersResponse = await apiService.get(`/interviews/${sessionId}/answers`);
          setAnswers(answersResponse.data as Answer[]);
        } catch {}

        if (summaryData.overall_session_score >= 70) setShowConfetti(true);
      } catch (err: any) {
        setError(err.message || 'Data retrieval failed.');
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, [sessionId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}M ${secs}S`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  if (loading) return <LoadingSpinner variant="fullPage" />;
  if (error || !summary) return <Box sx={{ p: 4 }}><ErrorAlert message={error || 'Signal lost.'} onRetry={() => sessionId && navigate(`/interviews/${sessionId}/summary`)} /></Box>;

  return (
    <Box sx={{ pb: 8 }}>
      {showConfetti && <SuccessConfetti show={showConfetti} />}

      {/* Hero Performance Section */}
      <MotionBox
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        sx={{ mb: 6 }}
      >
        <GlassCard sx={{ p: 6, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
           <Box sx={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, bgcolor: 'primary.main', opacity: 0.1, filter: 'blur(100px)', borderRadius: '50%' }} />
           
           <EmojiEvents sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
           <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontFamily: 'Orbitron' }}>SESSION <GradientText>SYNTHESIS</GradientText></Typography>
           
           <Box sx={{ position: 'relative', display: 'inline-flex', my: 4 }}>
              <CircularProgress 
                variant="determinate" 
                value={100} 
                size={200} 
                thickness={2} 
                sx={{ color: alpha(theme.palette.divider, 0.1) }} 
              />
              <CircularProgress 
                variant="determinate" 
                value={summary.overall_session_score} 
                size={200} 
                thickness={4} 
                sx={{ 
                  color: getScoreColor(summary.overall_session_score),
                  position: 'absolute',
                  left: 0,
                  boxShadow: `0 0 20px ${getScoreColor(summary.overall_session_score)}44`
                }} 
              />
              <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                 <Typography variant="h2" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>
                    <CountUp end={summary.overall_session_score} duration={2} decimals={1} />
                 </Typography>
                 <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.2em' }}>SCORE</Typography>
              </Box>
           </Box>

           <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
              {summary.score_trend !== null && (
                 <Chip 
                   icon={summary.score_trend >= 0 ? <TrendingUp /> : <TrendingDown />}
                   label={`${Math.abs(summary.score_trend).toFixed(1)}% TREND`}
                   color={summary.score_trend >= 0 ? 'success' : 'error'}
                   sx={{ fontWeight: 900, borderRadius: 1 }}
                 />
              )}
              <Chip label={summary.overall_session_score >= 80 ? 'EXPERT' : 'TACTICAL'} variant="outlined" sx={{ fontWeight: 800, borderRadius: 1 }} />
           </Stack>
        </GlassCard>
      </MotionBox>

      {/* Bento Stats Matrix */}
          <Grid container spacing={3} sx={{ mb: 6 }}>
             {[
               { label: 'VECTORS PROCESSED', value: summary.total_questions, icon: <Assessment /> },
               { label: 'ACTIVE DURATION', value: formatTime(summary.total_time_seconds), icon: <Timer /> },
               { label: 'ACCURACY RATING', value: `${summary.avg_technical_accuracy.toFixed(1)}%`, icon: <CheckCircle /> },
               { label: 'COMPLETION DELTA', value: '100%', icon: <TrendingUp /> },
             ].map((stat, i) => (
               <Grid key={i} size={{ xs: 6, md: 3 }}>
              <GlassCard sx={{ p: 3, textAlign: 'center' }}>
                 <Box sx={{ color: 'primary.main', mb: 1, opacity: 0.5 }}>{stat.icon}</Box>
                 <Typography variant="h4" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>{stat.value}</Typography>
                 <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.1em' }} >{stat.label}</Typography>
              </GlassCard>
           </Grid>
         ))}
      </Grid>

      {/* Detailed Diagnostics */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
         <Grid size={{ xs: 12, lg: 8 }}>
            <GlassCard sx={{ p: 4, height: '100%' }}>
               <Typography variant="h5" sx={{ fontWeight: 900, mb: 4, fontFamily: 'Orbitron' }}>DIAGNOSTIC REPORT</Typography>
               <Stack spacing={4}>
                  {[
                    { label: 'CONTENT INTEGRITY', val: summary.avg_content_quality },
                    { label: 'ARTICULATION CLARITY', val: summary.avg_clarity },
                    { label: 'CONFIDENCE VECTOR', val: summary.avg_confidence },
                  ].map((diag, i) => (
                    <Box key={i}>
                       <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 900 }}>{diag.label}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main' }}>{diag.val}%</Typography>
                       </Stack>
                       <LinearProgress variant="determinate" value={diag.val} sx={{ height: 6, borderRadius: 3 }} />
                    </Box>
                  ))}
               </Stack>
            </GlassCard>
         </Grid>
         <Grid size={{ xs: 12, lg: 4 }}>
            <GlassCard sx={{ p: 4, height: '100%', bgcolor: alpha(theme.palette.success.main, 0.05) }}>
               <Typography variant="h6" sx={{ fontWeight: 900, mb: 3, fontFamily: 'Orbitron' }}>CORE STRENGTHS</Typography>
               <Stack spacing={1}>
                  {summary.top_strengths.map((str, i) => (
                    <Chip key={i} label={str} color="success" sx={{ justifyContent: 'flex-start', fontWeight: 800, borderRadius: 1 }} icon={<CheckCircle />} />
                  ))}
               </Stack>
            </GlassCard>
         </Grid>
      </Grid>

      {/* Recording Analysis Dossier */}
      {answers.length > 0 && (
         <Box sx={{ mb: 6 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 4, fontFamily: 'Orbitron' }}>SITUATIONAL ANALYSIS</Typography>
            <Stack spacing={2}>
               {answers.map((ans, i) => (
                 <Accordion key={i} sx={{ bgcolor: 'transparent', boxShadow: 'none', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: '16px !important', overflow: 'hidden', mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 3, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) } }}>
                       <Stack direction="row" spacing={2} alignItems="center">
                          <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{i + 1}</Box>
                          <Typography sx={{ fontWeight: 700 }}>{ans.question_text.length > 60 ? ans.question_text.substring(0, 60) + '...' : ans.question_text}</Typography>
                       </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 3 }}>
                       <Divider sx={{ mb: 3, opacity: 0.1 }} />
                       <Stack spacing={4}>
                          <Box>
                             <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', display: 'block', mb: 1 }}>YOUR RESPONSE</Typography>
                             <Typography sx={{ lineHeight: 1.6, color: 'text.secondary' }}>{ans.answer_text}</Typography>
                          </Box>
                          {ans.voice_analysis && <VoiceAnalysisDisplay analysis={ans.voice_analysis} transcription={ans.transcription || undefined} showTranscription={true} />}
                          {ans.video_analysis && <VideoAnalysisDisplay analysis={ans.video_analysis} showDetails={true} />}
                       </Stack>
                    </AccordionDetails>
                 </Accordion>
               ))}
            </Stack>
         </Box>
      )}

      {/* Action Vector */}
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ pt: 4 }}>
         <Button startIcon={<Home />} size="large" onClick={() => navigate('/dashboard')}>TERMINATE SESSION</Button>
         <GradientButton size="large" onClick={() => navigate('/interviews')} startIcon={<Replay />}>
            RE-INITIALIZE PRACTICE
         </GradientButton>
      </Stack>
    </Box>
  );
}

export default InterviewSummaryPage;
