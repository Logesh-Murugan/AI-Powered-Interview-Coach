/**
 * Resume Analysis Card Component - Redesigned for AI Agent Response
 * Display analysis summary with enhanced UI for AI-generated insights
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
  LinearProgress,
} from '@mui/material';
import {
  Psychology,
  Refresh,
  TrendingUp,
  CheckCircle,
  Schedule,
  Speed,
  AutoAwesome,
  Warning,
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
  // In-progress state (analysis queued/running)
  if (!analysis && (isGenerating || isLoading)) {
    return (
      <Card sx={{ border: '2px solid', borderColor: 'primary.light' }}>
        <CardContent>
          <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
            <Box sx={{ position: 'relative' }}>
              <CircularProgress size={48} thickness={4} />
              <AutoAwesome 
                sx={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  fontSize: 20,
                  color: 'primary.main'
                }} 
              />
            </Box>
            <Typography variant="h6" color="primary.main">
              🤖 AI Analysis in Progress
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Our AI agent is analyzing your resume. This usually takes 10–20 seconds. 
              We'll show results automatically when ready.
            </Typography>
            <LinearProgress sx={{ width: '100%', height: 8, borderRadius: 4 }} />
          </Stack>
        </CardContent>
      </Card>
    );
  }
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
      <Card sx={{ border: '2px solid', borderColor: 'error.light' }}>
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
      <Card sx={{ border: '2px dashed', borderColor: 'primary.light', bgcolor: 'primary.lighter' }}>
        <CardContent>
          <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
            <Box sx={{ position: 'relative' }}>
              <Psychology sx={{ fontSize: 80, color: 'primary.main' }} />
              <AutoAwesome 
                sx={{ 
                  position: 'absolute', 
                  top: -5, 
                  right: -5,
                  fontSize: 24,
                  color: 'secondary.main'
                }} 
              />
            </Box>
            <Typography variant="h6" align="center" color="primary.main">
              🚀 AI-Powered Resume Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Get personalized insights on your skills, experience gaps, and career growth opportunities 
              powered by advanced AI technology.
            </Typography>
            <Button
              variant="contained"
              startIcon={isGenerating ? <CircularProgress size={20} /> : <Psychology />}
              onClick={onGenerate}
              disabled={isGenerating}
              size="large"
              sx={{ minWidth: 200 }}
            >
              {isGenerating ? 'Generating Analysis...' : '🤖 Generate AI Analysis'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }
  // Analysis exists - show summary
  const { analysis_data, analyzed_at, from_cache, cache_age_days, execution_time_ms, status } = analysis;
  const { skill_inventory, skill_gaps, improvement_roadmap } = analysis_data;

  // Check if this is AI-generated or fallback
  const isAIGenerated = status === 'success' && !(analysis_data as any).fallback_used;

  const totalSkills =
    (skill_inventory.technical_skills?.length || 0) +
    (skill_inventory.soft_skills?.length || 0) +
    (skill_inventory.tools?.length || 0) +
    (skill_inventory.languages?.length || 0);

  const totalGaps =
    (skill_gaps.required_missing?.length || 0) +
    (skill_gaps.preferred_missing?.length || 0);

  const matchPercentage = skill_gaps.match_percentage !== undefined && skill_gaps.match_percentage !== null 
    ? skill_gaps.match_percentage 
    : 0;
  
  const milestonesCount = improvement_roadmap.milestones?.length || 
    (improvement_roadmap.recommendations ? 1 : 0);
  
  const timelineWeeks = improvement_roadmap.timeline_weeks || 0;

  return (
    <Card 
      sx={{ 
        border: '2px solid', 
        borderColor: isAIGenerated ? 'success.light' : 'warning.light',
        bgcolor: isAIGenerated ? 'success.lighter' : 'warning.lighter'
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Psychology sx={{ color: isAIGenerated ? 'success.main' : 'warning.main' }} />
              <Typography variant="h6" color={isAIGenerated ? 'success.main' : 'warning.main'}>
                Resume Analysis
              </Typography>
              {isAIGenerated && (
                <Chip 
                  label="🤖 AI Generated" 
                  color="success" 
                  variant="filled"
                  size="small"
                />
              )}
              {(analysis_data as any).fallback_used && (
                <Chip 
                  label="⚠️ Fallback" 
                  color="warning" 
                  variant="filled"
                  size="small"
                />
              )}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
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
                label={`⚡ ${execution_time_ms}ms`}
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
            sx={{ 
              color: isAIGenerated ? 'success.main' : 'warning.main',
              borderColor: isAIGenerated ? 'success.main' : 'warning.main'
            }}
          >
            {isGenerating ? 'Regenerating...' : 'Regenerate'}
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* AI Analysis Summary */}
        {(analysis_data as any).analysis_summary && (
          <>
            <Alert 
              severity={isAIGenerated ? "success" : "warning"} 
              icon={isAIGenerated ? <AutoAwesome /> : <Warning />}
              sx={{ mb: 2 }}
            >
              <Typography variant="body2">
                <strong>{isAIGenerated ? '🧠 AI Insight:' : '⚠️ Fallback Analysis:'}</strong> {(analysis_data as any).analysis_summary}
              </Typography>
            </Alert>
          </>
        )}

        {/* Summary Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
          <Box sx={{ 
            textAlign: 'center', 
            p: 2, 
            bgcolor: 'primary.lighter', 
            borderRadius: 2,
            border: '2px solid',
            borderColor: 'primary.light'
          }}>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {totalSkills}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              Skills Identified
            </Typography>
          </Box>
          <Box sx={{ 
            textAlign: 'center', 
            p: 2, 
            bgcolor: 'warning.lighter', 
            borderRadius: 2,
            border: '2px solid',
            borderColor: 'warning.light'
          }}>
            <Typography variant="h4" color="warning.main" fontWeight="bold">
              {totalGaps}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              Skill Gaps
            </Typography>
          </Box>
          <Box sx={{ 
            textAlign: 'center', 
            p: 2, 
            bgcolor: 'success.lighter', 
            borderRadius: 2,
            border: '2px solid',
            borderColor: 'success.light'
          }}>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {matchPercentage}%
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              Role Match
            </Typography>
          </Box>
        </Box>
        {/* Quick Insights */}
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CheckCircle fontSize="small" color="success" />
            <Typography variant="body2">
              <strong>{skill_inventory.technical_skills?.length || 0}</strong> technical skills identified
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <TrendingUp fontSize="small" color="primary" />
            <Typography variant="body2">
              <strong>{milestonesCount}</strong> {milestonesCount === 1 ? 'improvement recommendation' : 'learning milestones'}
            </Typography>
          </Stack>
          {timelineWeeks > 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Schedule fontSize="small" color="info" />
              <Typography variant="body2">
                <strong>{timelineWeeks}</strong> weeks development roadmap
              </Typography>
            </Stack>
          )}
          {isAIGenerated && (
            <Stack direction="row" spacing={1} alignItems="center">
              <AutoAwesome fontSize="small" color="secondary" />
              <Typography variant="body2" color="secondary.main" fontWeight="medium">
                Powered by advanced AI analysis
              </Typography>
            </Stack>
          )}
        </Stack>

        {onViewDetails && (
          <Button
            variant="contained"
            fullWidth
            onClick={onViewDetails}
            size="large"
            sx={{ 
              bgcolor: isAIGenerated ? 'success.main' : 'warning.main',
              '&:hover': {
                bgcolor: isAIGenerated ? 'success.dark' : 'warning.dark'
              }
            }}
          >
            {isAIGenerated ? '🚀 View Full AI Analysis' : '📊 View Analysis Details'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default ResumeAnalysisCard;