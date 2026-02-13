/**
 * Interview Summary Page
 * Display comprehensive session performance summary
 * 
 * Requirements: 19.1-19.12
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Home,
  Replay,
  CheckCircle,
  EmojiEvents,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import apiService from '../../services/api.service';
import SuccessConfetti from '../../components/animations/SuccessConfetti';
import FadeIn from '../../components/animations/FadeIn';
import AnimatedCard from '../../components/animations/AnimatedCard';
import ScaleButton from '../../components/animations/ScaleButton';

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

function InterviewSummaryPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const loadSummary = async () => {
      if (!sessionId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiService.get(`/interviews/${sessionId}/summary`);
        const summaryData = response.data as SessionSummary;
        setSummary(summaryData);
        
        // Show confetti if score is good
        if (summaryData.overall_session_score >= 70) {
          setShowConfetti(true);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load session summary');
      } finally {
        setLoading(false);
      }
    };
    
    loadSummary();
  }, [sessionId]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number): 'error' | 'warning' | 'success' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Generating your performance summary...
        </Typography>
      </Container>
    );
  }

  if (error || !summary) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Failed to load summary'}</Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Confetti Animation */}
      {showConfetti && <SuccessConfetti show={showConfetti} />}
      
      {/* Header */}
      <FadeIn delay={0.1}>
        <Paper elevation={3} sx={{ p: 4, mb: 3, textAlign: 'center' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <EmojiEvents sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          </motion.div>
          
          <Typography variant="h3" gutterBottom>
            Session Complete!
          </Typography>
          
          <Typography variant="h4" color="primary" gutterBottom>
            Overall Score: <CountUp 
              end={summary.overall_session_score} 
              duration={2} 
              decimals={1}
              suffix="%"
            />
          </Typography>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Chip
              label={getScoreLabel(summary.overall_session_score)}
              color={getScoreColor(summary.overall_session_score)}
            />
          </motion.div>
        
          {/* Score Trend */}
          {summary.score_trend !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Box sx={{ mt: 2 }}>
                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                  {summary.score_trend > 0 ? (
                    <>
                      <TrendingUp color="success" />
                      <Typography variant="body1" color="success.main">
                        +{summary.score_trend.toFixed(1)}% from last session
                      </Typography>
                    </>
                  ) : summary.score_trend < 0 ? (
                    <>
                      <TrendingDown color="error" />
                      <Typography variant="body1" color="error.main">
                        {summary.score_trend.toFixed(1)}% from last session
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      Same as last session
                    </Typography>
                  )}
                </Stack>
              </Box>
            </motion.div>
          )}
        </Paper>
      </FadeIn>

      {/* Session Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FadeIn delay={0.2}>
            <AnimatedCard>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Questions Answered
                </Typography>
                <Typography variant="h4">
                  <CountUp end={summary.total_questions} duration={1.5} />
                </Typography>
              </CardContent>
            </AnimatedCard>
          </FadeIn>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FadeIn delay={0.3}>
            <AnimatedCard>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Time
                </Typography>
                <Typography variant="h4">{formatTime(summary.total_time_seconds)}</Typography>
              </CardContent>
            </AnimatedCard>
          </FadeIn>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FadeIn delay={0.4}>
            <AnimatedCard>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Avg. Time/Question
                </Typography>
                <Typography variant="h4">
                  {formatTime(Math.floor(summary.total_time_seconds / summary.total_questions))}
                </Typography>
              </CardContent>
            </AnimatedCard>
          </FadeIn>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FadeIn delay={0.5}>
            <AnimatedCard>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Completion Rate
                </Typography>
                <Typography variant="h4">
                  <CountUp end={100} duration={1.5} suffix="%" />
                </Typography>
              </CardContent>
            </AnimatedCard>
          </FadeIn>
        </Grid>
      </Grid>

      {/* Detailed Scores */}
      <FadeIn delay={0.6}>
        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Performance Breakdown
          </Typography>
          <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" gutterBottom>
              Content Quality
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <LinearProgress
                variant="determinate"
                value={summary.avg_content_quality}
                color={getScoreColor(summary.avg_content_quality)}
                sx={{ flex: 1, height: 8, borderRadius: 4 }}
              />
              <Typography variant="body1" fontWeight="bold">
                <CountUp end={summary.avg_content_quality} duration={2} decimals={1} suffix="%" />
              </Typography>
            </Stack>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" gutterBottom>
              Clarity
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <LinearProgress
                variant="determinate"
                value={summary.avg_clarity}
                color={getScoreColor(summary.avg_clarity)}
                sx={{ flex: 1, height: 8, borderRadius: 4 }}
              />
              <Typography variant="body1" fontWeight="bold">
                <CountUp end={summary.avg_clarity} duration={2} decimals={1} suffix="%" />
              </Typography>
            </Stack>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" gutterBottom>
              Confidence
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <LinearProgress
                variant="determinate"
                value={summary.avg_confidence}
                color={getScoreColor(summary.avg_confidence)}
                sx={{ flex: 1, height: 8, borderRadius: 4 }}
              />
              <Typography variant="body1" fontWeight="bold">
                <CountUp end={summary.avg_confidence} duration={2} decimals={1} suffix="%" />
              </Typography>
            </Stack>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" gutterBottom>
              Technical Accuracy
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <LinearProgress
                variant="determinate"
                value={summary.avg_technical_accuracy}
                color={getScoreColor(summary.avg_technical_accuracy)}
                sx={{ flex: 1, height: 8, borderRadius: 4 }}
              />
              <Typography variant="body1" fontWeight="bold">
                <CountUp end={summary.avg_technical_accuracy} duration={2} decimals={1} suffix="%" />
              </Typography>
            </Stack>
          </Grid>
        </Grid>
        </Paper>
      </FadeIn>

      {/* Category Performance */}
      {Object.keys(summary.category_performance).length > 0 && (
        <FadeIn delay={0.7}>
          <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Category Performance
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={2}>
            {Object.entries(summary.category_performance).map(([category, score]) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={category}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {category.replace('_', ' ')}
                    </Typography>
                    <Typography variant="h5" color={getScoreColor(score)}>
                      {score.toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          </Paper>
        </FadeIn>
      )}

      {/* Strengths and Improvements */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FadeIn delay={0.8}>
            <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <CheckCircle color="success" />
              <Typography variant="h5">Top Strengths</Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1}>
              {summary.top_strengths.map((strength, index) => (
                <Chip
                  key={index}
                  label={strength}
                  color="success"
                  variant="outlined"
                  sx={{ justifyContent: 'flex-start' }}
                />
              ))}
            </Stack>
            </Paper>
          </FadeIn>
        </Grid>
        
        <Grid size={{ xs: 12, md: 6 }}>
          <FadeIn delay={0.9}>
            <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <TrendingUp color="primary" />
              <Typography variant="h5">Areas to Improve</Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1}>
              {summary.top_improvements.map((improvement, index) => (
                <Chip
                  key={index}
                  label={improvement}
                  color="primary"
                  variant="outlined"
                  sx={{ justifyContent: 'flex-start' }}
                />
              ))}
            </Stack>
            </Paper>
          </FadeIn>
        </Grid>
      </Grid>

      {/* Actions */}
      <FadeIn delay={1.0}>
        <Stack direction="row" spacing={2} justifyContent="center">
          <ScaleButton>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Home />}
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </ScaleButton>
          <ScaleButton>
            <Button
              variant="contained"
              size="large"
              startIcon={<Replay />}
              onClick={() => navigate('/interviews')}
            >
              Start New Session
            </Button>
          </ScaleButton>
        </Stack>
      </FadeIn>
    </Container>
  );
}

export default InterviewSummaryPage;
