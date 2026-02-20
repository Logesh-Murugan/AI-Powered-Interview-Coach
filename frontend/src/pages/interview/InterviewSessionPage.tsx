/**
 * Enhanced Interview Session Page
 * With animations, better timer, and smooth transitions
 * 
 * Requirements: 15.1-17.7
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  LinearProgress,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Fade,
} from '@mui/material';
import { Send, Timer, NavigateNext, CheckCircle, Save } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '../../services/api.service';
import FadeIn from '../../components/animations/FadeIn';

interface Question {
  id: number;
  question_text: string;
  category: string;
  difficulty: string;
  time_limit_seconds: number;
  question_number: number;
}

function InterviewSessionPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false); // Track if we've ever saved a draft
  
  const autoSaveTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  const loadQuestion = useCallback(async (questionNumber: number) => {
    if (!sessionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.get(`/interviews/${sessionId}/questions/${questionNumber}`);
      const questionData = response.data as Question;
      
      setQuestion(questionData);
      setTimeRemaining(questionData.time_limit_seconds);
      
      // Only fetch draft if we've saved one before (avoids unnecessary 404s)
      if (hasSavedDraft) {
        try {
          const draftResponse = await apiService.get(`/interviews/${sessionId}/drafts/${questionData.id}`);
          const draftData = draftResponse.data as { draft_text: string; last_saved_at: string };
          setAnswer(draftData.draft_text || '');
          setDraft(draftData.draft_text || '');
        } catch {
          // Draft doesn't exist - start fresh
          setAnswer('');
          setDraft('');
        }
      } else {
        // No drafts saved yet - start fresh
        setAnswer('');
        setDraft('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load question');
    } finally {
      setLoading(false);
    }
  }, [sessionId, hasSavedDraft]);

  const saveDraft = useCallback(async (text: string) => {
    if (!sessionId || !question || text === draft) return;
    
    setSaving(true);
    setSaved(false);
    
    try {
      await apiService.post(
        `/interviews/${sessionId}/drafts?question_id=${question.id}`,
        { draft_text: text }
      );
      setDraft(text);
      setHasSavedDraft(true); // Mark that we've saved at least one draft
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save draft:', err);
      setSaving(false);
    }
  }, [sessionId, question, draft]);

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setAnswer(text);
    
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft(text);
    }, 30000);
  };

  const handleSubmit = async () => {
    if (!sessionId || !question) return;
    
    if (answer.length < 10) {
      setError('Answer must be at least 10 characters');
      return;
    }
    
    if (answer.length > 5000) {
      setError('Answer must not exceed 5000 characters');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await apiService.post(
        `/interviews/${sessionId}/answers?question_id=${question.id}`,
        { answer_text: answer }
      );
      
      const responseData = response.data as {
        all_questions_answered: boolean;
        session_completed: boolean;
      };
      
      const { all_questions_answered, session_completed } = responseData;
      
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      if (session_completed || all_questions_answered) {
        navigate(`/interviews/${sessionId}/summary`);
      } else {
        loadQuestion(question.question_number + 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (timeRemaining > 0) {
      countdownTimerRef.current = setInterval(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      
      return () => {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
      };
    }
  }, [timeRemaining]);

  useEffect(() => {
    loadQuestion(1);
  }, [loadQuestion]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeProgress = question
    ? ((question.time_limit_seconds - timeRemaining) / question.time_limit_seconds) * 100
    : 0;
  
  const getTimerColor = () => {
    if (timeRemaining > 60) return 'success';
    if (timeRemaining > 30) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading question...
        </Typography>
      </Container>
    );
  }

  if (!question) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load question</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <FadeIn>
        <motion.div
          animate={timeRemaining < 30 ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 1, repeat: timeRemaining < 30 ? Infinity : 0 }}
        >
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Question {question.question_number}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={timeProgress}
                  color={getTimerColor()}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Chip
                icon={<Timer />}
                label={formatTime(timeRemaining)}
                color={getTimerColor()}
                variant="outlined"
                sx={{ 
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  px: 2
                }}
              />
            </Stack>
          </Paper>
        </motion.div>
      </FadeIn>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip label={question.category.replace('_', ' ')} size="small" color="primary" />
              <Chip label={question.difficulty} size="small" variant="outlined" />
            </Stack>
            
            <Typography variant="h5" gutterBottom>
              {question.question_text}
            </Typography>
          </Paper>
        </motion.div>
      </AnimatePresence>

      <FadeIn delay={0.2}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Your Answer
            </Typography>
            
            <AnimatePresence>
              {saving && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Chip
                    icon={<Save />}
                    label="Saving..."
                    size="small"
                    color="info"
                  />
                </motion.div>
              )}
              {saved && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Chip
                    icon={<CheckCircle />}
                    label="Saved"
                    size="small"
                    color="success"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
          
          {error && (
            <Fade in={!!error}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            </Fade>
          )}
          
          <TextField
            fullWidth
            multiline
            rows={12}
            value={answer}
            onChange={handleAnswerChange}
            placeholder="Type your answer here... (minimum 10 characters)"
            disabled={submitting}
            sx={{ mb: 2 }}
          />
          
          <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {answer.length} / 5000 characters
            </Typography>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={submitting || answer.length < 10}
                startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
                endIcon={<NavigateNext />}
              >
                {submitting ? 'Submitting...' : 'Submit Answer'}
              </Button>
            </motion.div>
          </Stack>
        </Paper>
      </FadeIn>
    </Container>
  );
}

export default InterviewSessionPage;
