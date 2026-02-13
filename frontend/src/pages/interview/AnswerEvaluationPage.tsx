/**
 * Answer Evaluation Page
 * Displays detailed evaluation feedback for an interview answer
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import StarIcon from '@mui/icons-material/Star';
import api from '../../services/api.service';

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

      // Get evaluation data
      const response = await api.get(`/evaluations/${answerId}`);
      setEvaluation(response.data as EvaluationData);
    } catch (err: any) {
      console.error('Error loading evaluation:', err);
      setError(err.response?.data?.detail || 'Failed to load evaluation');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
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

  const handleBack = () => {
    navigate(`/interviews/${sessionId}/summary`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !evaluation) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Evaluation not found'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to Summary
        </Button>
      </Box>
    );
  }

  const { scores, feedback } = evaluation;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to Summary
        </Button>
        <Typography variant="h4" component="h1" sx={{ flex: 1 }}>
          Answer Evaluation
        </Typography>
        <Chip
          label={getScoreLabel(scores.overall_score)}
          color={getScoreColor(scores.overall_score) as any}
        />
      </Box>

      {/* Overall Score */}
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Overall Score
        </Typography>
        <Typography variant="h2" color="primary" sx={{ mb: 2 }}>
          {scores.overall_score.toFixed(1)}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={scores.overall_score}
          sx={{ height: 10, borderRadius: 5 }}
          color={getScoreColor(scores.overall_score) as any}
        />
      </Paper>

      {/* Score Breakdown */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Score Breakdown
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {[
            { label: 'Content Quality', value: scores.content_quality },
            { label: 'Clarity', value: scores.clarity },
            { label: 'Confidence', value: scores.confidence },
            { label: 'Technical Accuracy', value: scores.technical_accuracy },
          ].map((item) => (
            <Grid key={item.label} size={{ xs: 12, sm: 6 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{item.label}</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {item.value.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={item.value}
                  sx={{ height: 8, borderRadius: 4 }}
                  color={getScoreColor(item.value) as any}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Strengths */}
      {feedback.strengths.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="h6">Strengths</Typography>
          </Box>
          <List>
            {feedback.strengths.map((strength, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <StarIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={strength} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Areas for Improvement */}
      {feedback.improvements.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TipsAndUpdatesIcon color="warning" />
            <Typography variant="h6">Areas for Improvement</Typography>
          </Box>
          <List>
            {feedback.improvements.map((improvement, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <TipsAndUpdatesIcon color="warning" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={improvement} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Suggestions */}
      {feedback.suggestions.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LightbulbIcon color="info" />
            <Typography variant="h6">Suggestions</Typography>
          </Box>
          <List>
            {feedback.suggestions.map((suggestion, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LightbulbIcon color="info" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={suggestion} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Example Answer */}
      {feedback.example_answer && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Example Answer
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {feedback.example_answer}
          </Typography>
        </Paper>
      )}

      {/* Footer */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button variant="contained" size="large" onClick={handleBack}>
          Back to Summary
        </Button>
      </Box>
    </Box>
  );
}

export default AnswerEvaluationPage;
