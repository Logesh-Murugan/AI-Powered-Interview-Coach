/**
 * Evaluation Card Component
 * Compact display of evaluation scores with expandable feedback
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Collapse,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import StarIcon from '@mui/icons-material/Star';

interface EvaluationCardProps {
  questionNumber: number;
  questionText: string;
  scores: {
    content_quality: number;
    clarity: number;
    confidence: number;
    technical_accuracy: number;
    overall_score: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  };
  onViewDetails?: () => void;
}

function EvaluationCard({
  questionNumber,
  questionText,
  scores,
  feedback,
  onViewDetails,
}: EvaluationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
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

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Question {questionNumber}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {questionText.length > 100 ? `${questionText.substring(0, 100)}...` : questionText}
            </Typography>
          </Box>
          <Chip
            label={getScoreLabel(scores.overall_score)}
            color={getScoreColor(scores.overall_score)}
            size="small"
          />
        </Box>

        {/* Overall Score */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Overall Score</Typography>
            <Typography variant="body2" fontWeight="bold">
              {scores.overall_score.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={scores.overall_score}
            sx={{ height: 8, borderRadius: 4 }}
            color={getScoreColor(scores.overall_score)}
          />
        </Box>

        {/* Expandable Details */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />

          {/* Score Breakdown */}
          <Typography variant="subtitle2" gutterBottom>
            Score Breakdown
          </Typography>
          <Box sx={{ mb: 2 }}>
            {[
              { label: 'Content Quality', value: scores.content_quality },
              { label: 'Clarity', value: scores.clarity },
              { label: 'Confidence', value: scores.confidence },
              { label: 'Technical Accuracy', value: scores.technical_accuracy },
            ].map((item) => (
              <Box key={item.label} sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption">{item.label}</Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {item.value.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={item.value}
                  sx={{ height: 4, borderRadius: 2 }}
                  color={getScoreColor(item.value)}
                />
              </Box>
            ))}
          </Box>

          {/* Strengths */}
          {feedback.strengths.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="subtitle2">Strengths</Typography>
              </Box>
              <List dense>
                {feedback.strengths.slice(0, 2).map((strength, index) => (
                  <ListItem key={index} sx={{ py: 0, pl: 0 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <StarIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={strength}
                      primaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Improvements */}
          {feedback.improvements.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <TipsAndUpdatesIcon color="warning" fontSize="small" />
                <Typography variant="subtitle2">Areas for Improvement</Typography>
              </Box>
              <List dense>
                {feedback.improvements.slice(0, 2).map((improvement, index) => (
                  <ListItem key={index} sx={{ py: 0, pl: 0 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <TipsAndUpdatesIcon color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={improvement}
                      primaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Suggestions */}
          {feedback.suggestions.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <LightbulbIcon color="info" fontSize="small" />
                <Typography variant="subtitle2">Suggestions</Typography>
              </Box>
              <List dense>
                {feedback.suggestions.slice(0, 2).map((suggestion, index) => (
                  <ListItem key={index} sx={{ py: 0, pl: 0 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <LightbulbIcon color="info" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={suggestion}
                      primaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Collapse>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            size="small"
            startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show Less' : 'Show More'}
          </Button>
          {onViewDetails && (
            <Button size="small" variant="outlined" onClick={onViewDetails}>
              View Full Details
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default EvaluationCard;
