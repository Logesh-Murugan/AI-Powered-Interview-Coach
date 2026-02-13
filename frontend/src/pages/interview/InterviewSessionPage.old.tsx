/**
 * Interview Session Page
 * Display questions with timer and handle answer submission
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
} from '@mui/material';
import { Send, Timer, NavigateNext } from '@mui/icons-material';
import apiService from '../../services/api.service';

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
  
  const autoSaveTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  // Load question
  const loadQuestion = useCallback(async (questionNumber: number) => {
    if (!sessionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.get(`/interviews/${sessionId}/questions/${questionNumber}`);
      const questionData = response.data as Question;
      
      setQuestion(questionData);
      setTimeRemaining(questionData.time_limit_seconds);
      
      // Try to load draft
      try {
        const draftResponse = await apiService.get(`/interviews/${sessionId}/drafts/${questionData.id}`);
        const draftData = draftResponse.data as { draft_text: string; last_saved_at: string };
        setAnswer(draftData.draft_text || '');
        setDraft(draftData.draft_text || '');
      } catch {
        // No draft exists, that's fine
        setAnswer('');
        setDraft('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load question');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Auto-save draft (Req 17.1-17.5)
  const saveDraft = useCallback(async (text: string) => {
    if (!sessionId || !question || text === draft) return;
    
    try {
      await apiService.post(
        `/interviews/${sessionId}/drafts?question_id=${question.id}`,
        { draft_text: text }
      );
      setDraft(text);
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  }, [sessionId, question, draft]);

  // Handle answer change with auto-save
  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setAnswer(text);
    
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Set new timer for 30 seconds (Req 17.1)
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft(text);
    }, 30000);
  };

  // Submit answer (Req 16.1-16.10)
  const handleSubmit = async () => {
    if (!sessionId || !question) return;
    
    // Validate answer length (Req 16.3)
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
      
      // Clear auto-save timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      // Navigate based on completion status
      if (session_completed) {
        navigate(`/interviews/${sessionId}/summary`);
      } else if (all_questions_answered) {
        navigate(`/interviews/${sessionId}/summary`);
      } else {
        // Load next question
        loadQuestion(question.question_number + 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  // Countdown timer (Req 15.3-15.5)
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

  // Load first question on mount
  useEffect(() => {
    loadQuestion(1);
  }, [loadQuestion]);

  // Cleanup timers on unmount
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

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress
  const timeProgress = question
    ? ((question.time_limit_seconds - timeRemaining) / question.time_limit_seconds) * 100
    : 0;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
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
      {/* Timer and Progress */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Question {question.question_number}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={timeProgress}
              color={timeRemaining < 60 ? 'error' : 'primary'}
            />
          </Box>
          <Chip
            icon={<Timer />}
            label={formatTime(timeRemaining)}
            color={timeRemaining < 60 ? 'error' : 'default'}
            variant="outlined"
          />
        </Stack>
      </Paper>

      {/* Question */}
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip label={question.category.replace('_', ' ')} size="small" color="primary" />
          <Chip label={question.difficulty} size="small" variant="outlined" />
        </Stack>
        
        <Typography variant="h5" gutterBottom>
          {question.question_text}
        </Typography>
      </Paper>

      {/* Answer Input */}
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          Your Answer
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
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
            {draft && draft !== answer && ' • Draft saved'}
          </Typography>
          
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
        </Stack>
      </Paper>
    </Container>
  );
}

export default InterviewSessionPage;
