/**
 * Resume Analysis Card Component
 * Display analysis summary with generate/regenerate functionality
 * 
 * Requirements: INT-1.6, INT-1.7, INT-1.10
 */

import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Grid,
} from '@mui/material';
import {
  Psychology,
  Refresh,
  TrendingUp,
  CheckCircle,
  Schedule,
  Speed,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { ResumeAnalysis } from '../../services/resumeAnalysisService';

interface ResumeAnalysisCardProps {
  analysis: ResumeAnalysis | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
  onRegenerate: () => void;
  onViewDetails?: () => void;
}

function ResumeAnalysisCard({
  analysis,
  isLoading,
  isGenerating,
  error,
  onGenerate,
  onRegenerate,
  onViewDetails,
}: ResumeAnalysisCardProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading analysis...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={onGenerate}
            fullWidth
          >
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No analysis state
  if (!analysis) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2} alignItems="center" sx={{ py: 3 }}>
            <Psychology sx={{ fontSize: 60, color: 'primary.main' }} />
            <Typography variant="h6" align="center">
              AI-Powered Resume Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Get insights on your skills, experience, and improvement areas
            </Typography>
            <Button
              variant="contained"
              startIcon={isGenerating ? <CircularProgress size={20} /> : <Psychology />}
              onClick={onGenerate}
              disabled={isGenerating}
              size="large"
            >
              {isGenerating ? 'Generating Analysis...' : 'Generate Analysis'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Analysis exists - show summary
  const { analysis_data, analyzed_at, from_cache, cache_age_days, execution_time_ms } = analysis;
  const { skill_inventory, skill_gaps, improvement_roadmap } = analysis_data;

  const totalSkills =
    (skill_inventory.technical_skills?.length || 0) +
    (skill_inventory.soft_skills?.length || 0) +
    (skill_inventory.tools?.length || 0) +
    (skill_inventory.languages?.length || 0);

  const totalGaps =
    (skill_gaps.required_missing?.length || 0) +
    (skill_gaps.preferred_missing?.length || 0);

  const matchPercentage = skill_gaps.match_percentage || 0;

  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
              Resume Analysis
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Analyzed: {format(new Date(analyzed_at), 'MMM dd, yyyy HH:mm')}
              </Typography>
              {from_cache && (
                <Chip
                  label={`Cached (${cache_age_days}d old)`}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              )}
              <Chip
                label={`${execution_time_ms}ms`}
                size="small"
                icon={<Speed />}
                variant="outlined"
              />
            </Stack>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={isGenerating ? <CircularProgress size={16} /> : <Refresh />}
            onClick={onRegenerate}
            disabled={isGenerating}
          >
            {isGenerating ? 'Regenerating...' : 'Regenerate'}
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.lighter', borderRadius: 1 }}>
              <Typography variant="h4" color="primary.main">
                {totalSkills}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Skills Identified
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.lighter', borderRadius: 1 }}>
              <Typography variant="h4" color="warning.main">
                {totalGaps}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Skill Gaps
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.lighter', borderRadius: 1 }}>
              <Typography variant="h4" color="success.main">
                {matchPercentage}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Role Match
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Quick Insights */}
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CheckCircle fontSize="small" color="success" />
            <Typography variant="body2">
              <strong>{skill_inventory.technical_skills?.length || 0}</strong> technical skills
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <TrendingUp fontSize="small" color="primary" />
            <Typography variant="body2">
              <strong>{improvement_roadmap.milestones?.length || 0}</strong> learning milestones
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Schedule fontSize="small" color="info" />
            <Typography variant="body2">
              <strong>{improvement_roadmap.timeline_weeks || 0}</strong> weeks roadmap
            </Typography>
          </Stack>
        </Stack>

        {onViewDetails && (
          <Button
            variant="contained"
            fullWidth
            onClick={onViewDetails}
          >
            View Full Analysis
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default ResumeAnalysisCard;
