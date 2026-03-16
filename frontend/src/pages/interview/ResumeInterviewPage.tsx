/**
 * Resume Interview Page
 * Allows users to continue an in-progress interview session
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Stack,
  Chip,
  Alert,
} from '@mui/material';
import { PlayArrow, ArrowBack } from '@mui/icons-material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import api from '../../services/api.service';

interface ResumeSessionData {
  session_id: number;
  role: string;
  difficulty: string;
  status: string;
  question_count: number;
  answered_count: number;
  progress_percentage: number;
  next_question: {
    id: number;
    question_text: string;
    category: string;
    difficulty: string;
    time_limit_seconds: number;
    question_number: number;
  };
}

function ResumeInterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [sessionData, setSessionData] = useState<ResumeSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get<ResumeSessionData>(`/interviews/${sessionId}/resume`);
      setSessionData(response.data);
    } catch (err: any) {
      console.error('Failed to load session:', err);
      setError(err.response?.data?.detail || 'Failed to load session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (sessionData) {
      navigate(`/interviews/${sessionId}/session`, {
        state: { resuming: true, questionNumber: sessionData.next_question.question_number }
      });
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return <LoadingSpinner text="Loading session..." />;
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <ErrorAlert message={error} />
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBackToDashboard}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  if (!sessionData) {
    return null;
  }

  const remainingQuestions = sessionData.question_count - sessionData.answered_count;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={handleBackToDashboard}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            Resume Interview
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            You have an in-progress interview session. Continue from where you left off!
          </Alert>

          <Stack spacing={3}>
            {/* Session Info */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Session Details
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Chip label={`Role: ${sessionData.role}`} />
                <Chip label={`Difficulty: ${sessionData.difficulty}`} color="primary" />
                <Chip label={`Status: ${sessionData.status.replace('_', ' ').toUpperCase()}`} color="warning" />
              </Stack>
            </Box>

            {/* Progress */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Progress
              </Typography>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {sessionData.answered_count} of {sessionData.question_count} questions answered
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {sessionData.progress_percentage}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={sessionData.progress_percentage}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary" align="center">
                  {remainingQuestions} question{remainingQuestions !== 1 ? 's' : ''} remaining
                </Typography>
              </Stack>
            </Box>

            {/* Next Question Preview */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Next Question
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip
                      label={`Question ${sessionData.next_question.question_number}`}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      label={sessionData.next_question.category}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${Math.floor(sessionData.next_question.time_limit_seconds / 60)} min`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                  <Typography variant="body1">
                    {sessionData.next_question.question_text}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
              <Button
                variant="outlined"
                onClick={handleBackToDashboard}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                onClick={handleContinue}
              >
                Continue Interview
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

export default ResumeInterviewPage;
