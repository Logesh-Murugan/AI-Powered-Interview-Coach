/**
 * Premium Answer Evaluation Page
 * High-end Intelligence Feedback and performance breakdown interface
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
  Stack,
  Button,
} from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  TipsAndUpdates as TipsAndUpdatesIcon,
  Lightbulb as LightbulbIcon,
  Star as StarIcon,
  Assessment,
  Timeline,
  EmojiEvents,
  AutoAwesome,
} from '@mui/icons-material';
import api from '../../services/api.service';
import { motion } from 'framer-motion';
import { GlassCard, GradientButton, GradientText } from '../../components/common/PremiumComponents';

const MotionBox = motion.create(Box);

interface EvaluationScores {
  content_quality: number;
  clarity: number;
  confidence: number;
  technical_accuracy: number;
  overall_score: number;
}

interface EvaluationFeedback {
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  example_answer?: string;
}

interface EvaluationData {
  evaluation_id: number;
  answer_id: number;
  scores: EvaluationScores;
  feedback: EvaluationFeedback;
  evaluated_at?: string;
  question_text?: string;
  answer_text?: string;
}

function AnswerEvaluationPage() {
  const { sessionId, answerId } = useParams<{ sessionId: string; answerId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvaluation();
  }, [answerId]);

  const loadEvaluation = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/evaluations/${answerId}`);
      setEvaluation(response.data as EvaluationData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'FAILED TO RETRIEVE INTELLIGENCE DATA');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'ELITE';
    if (score >= 80) return 'ADVANCED';
    if (score >= 70) return 'PROFICIENT';
    if (score >= 60) return 'NOMINAL';
    return 'SUBOPTIMAL';
  };

  if (loading) return <LoadingSpinner variant="fullPage" />;
  if (error || !evaluation) return (
    <Box sx={{ p: 4 }}>
      <ErrorAlert message={error || 'INTELLIGENCE RECORD NOT FOUND'} onRetry={loadEvaluation} />
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/interviews/${sessionId}/summary`)} sx={{ mt: 2 }}>BACK TO SUMMARY</Button>
    </Box>
  );

  const { scores, feedback } = evaluation;

  return (
    <Box sx={{ pb: 8 }}>
      {/* Header Section */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}
      >
        <Box>
           <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/interviews/${sessionId}/summary`)} sx={{ mb: 2, fontWeight: 700 }}>BACK TO SUMMARY</Button>
           <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontFamily: 'Orbitron' }}>INTELLIGENCE <GradientText>FEEDBACK</GradientText></Typography>
           <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              DEEP-SCAN ANALYSIS AND PERFORMANCE PARAMETERS
           </Typography>
        </Box>
        <GlassCard sx={{ p: 1, px: 3, borderRadius: 3, bgcolor: alpha(getScoreColor(scores.overall_score), 0.1), border: `1px solid ${alpha(getScoreColor(scores.overall_score), 0.2)}` }}>
           <Typography variant="caption" sx={{ fontWeight: 900, color: getScoreColor(scores.overall_score), fontFamily: 'Orbitron' }}>RANK: {getScoreLabel(scores.overall_score)}</Typography>
        </GlassCard>
      </MotionBox>

      {/* Primary Analytics Grid */}
      <Grid container spacing={4}>
         {/* Overall Assessment */}
         <Grid size={{ xs: 12, md: 4 }}>
            <GlassCard sx={{ p: 4, textAlign: 'center', height: '100%', position: 'relative', overflow: 'hidden' }}>
               <Box sx={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, bgcolor: getScoreColor(scores.overall_score), opacity: 0.1, filter: 'blur(40px)', borderRadius: '50%' }} />
               <Typography variant="h6" sx={{ fontWeight: 900, mb: 4, color: 'text.secondary', fontFamily: 'Orbitron', letterSpacing: '0.1em' }}>AGGREGATE SCORE</Typography>
               <Box sx={{ position: 'relative', display: 'inline-block', mb: 4 }}>
                  <CircularProgress 
                    variant="determinate" 
                    value={scores.overall_score} 
                    size={160} 
                    thickness={6} 
                    sx={{ color: getScoreColor(scores.overall_score), filter: `drop-shadow(0 0 10px ${alpha(getScoreColor(scores.overall_score), 0.3)})` }} 
                  />
                  <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                     <Typography variant="h3" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>{scores.overall_score.toFixed(0)}</Typography>
                     <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>PERCENTILE</Typography>
                  </Box>
               </Box>
               <Divider sx={{ mb: 4, opacity: 0.1 }} />
               <Grid container spacing={2}>
                  {[
                    { l: 'CONTENT', v: scores.content_quality, i: <Assessment /> },
                    { l: 'CLARITY', v: scores.clarity, i: <Timeline /> },
                    { l: 'ACCURACY', v: scores.technical_accuracy, i: <AutoAwesome /> },
                  ].map((stat, i) => (
                    <Grid key={i} size={4}>
                       <Box sx={{ color: getScoreColor(stat.v), mb: 1, opacity: 0.6 }}>{stat.i}</Box>
                       <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron', fontSize: '1rem' }}>{stat.v.toFixed(0)}</Typography>
                       <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.6rem', color: 'text.secondary' }}>{stat.l}</Typography>
                    </Grid>
                  ))}
               </Grid>
            </GlassCard>
         </Grid>

         {/* Feedback Module */}
         <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={4}>
               {/* Strengths & Improvements */}
               <Grid container spacing={4}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                     <GlassCard sx={{ p: 4, height: '100%', borderLeft: `4px solid ${theme.palette.success.main}` }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                           <CheckCircleIcon color="success" />
                           <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>STRENGTHS</Typography>
                        </Stack>
                        <List dense>
                           {feedback.strengths.map((s, i) => (
                             <ListItem key={i} sx={{ px: 0, alignItems: 'flex-start' }}>
                                <ListItemIcon sx={{ minWidth: 28, mt: 0.5 }}><StarIcon color="success" sx={{ fontSize: 16 }} /></ListItemIcon>
                                <ListItemText primary={s} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} />
                             </ListItem>
                           ))}
                        </List>
                     </GlassCard>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                     <GlassCard sx={{ p: 4, height: '100%', borderLeft: `4px solid ${theme.palette.warning.main}` }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                           <TipsAndUpdatesIcon color="warning" />
                           <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>GAPS</Typography>
                        </Stack>
                        <List dense>
                           {feedback.improvements.map((s, i) => (
                             <ListItem key={i} sx={{ px: 0, alignItems: 'flex-start' }}>
                                <ListItemIcon sx={{ minWidth: 28, mt: 0.5 }}><TipsAndUpdatesIcon color="warning" sx={{ fontSize: 16 }} /></ListItemIcon>
                                <ListItemText primary={s} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} />
                             </ListItem>
                           ))}
                        </List>
                     </GlassCard>
                  </Grid>
               </Grid>

               {/* Suggestions & Example */}
               <GlassCard sx={{ p: 4 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                     <LightbulbIcon color="info" />
                     <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>OPTIMIZATION PROTOCOLS</Typography>
                  </Stack>
                  <Grid container spacing={4}>
                     <Grid size={{ xs: 12, md: 6 }}>
                        <List dense>
                           {feedback.suggestions.map((s, i) => (
                             <ListItem key={i} sx={{ px: 0, alignItems: 'flex-start' }}>
                                <ListItemIcon sx={{ minWidth: 28, mt: 0.5 }}><LightbulbIcon color="info" sx={{ fontSize: 16 }} /></ListItemIcon>
                                <ListItemText primary={s} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} />
                             </ListItem>
                           ))}
                        </List>
                     </Grid>
                     {feedback.example_answer && (
                       <Grid size={{ xs: 12, md: 6 }}>
                          <Box sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.4), border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                             <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', mb: 2, display: 'block' }}>ELITE-TIER EXAMPLE ANSWER</Typography>
                             <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', lineHeight: 1.6 }}>"{feedback.example_answer}"</Typography>
                          </Box>
                       </Grid>
                     )}
                  </Grid>
               </GlassCard>
            </Stack>
         </Grid>
      </Grid>

      {/* Footer Navigation */}
      <Box sx={{ mt: 6, textAlign: 'center' }}>
         <GradientButton size="large" onClick={() => navigate(`/interviews/${sessionId}/summary`)}>RETURN TO MISSION SUMMARY</GradientButton>
      </Box>
    </Box>
  );
}

export default AnswerEvaluationPage;
