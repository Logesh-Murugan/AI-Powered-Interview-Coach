/**
 * Premium Resume Analysis Card Component
 * High-end AI-powered insights with glassmorphic design and animations
 */

import {
  Typography,
  Box,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  LinearProgress,
  alpha,
  useTheme,
  Grid,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Psychology,
  Refresh,
  AutoAwesome,
  FlashOn as FlashIcon,
  Timeline as RoadmapIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { ResumeAnalysis } from '../../services/resumeAnalysisService';
import { GlassCard, GradientButton } from '../common/PremiumComponents';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

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
  const theme = useTheme();

  // 1. Loading/Generation State
  if (!analysis && (isGenerating || isLoading)) {
    return (
      <GlassCard sx={{ p: 4, position: 'relative', overflow: 'hidden' }}>
        <Box className="ai-shimmer" sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, zIndex: 1 }} />
        <Stack spacing={4} alignItems="center" sx={{ py: 6 }}>
          <Box sx={{ position: 'relative' }}>
             <CircularProgress size={80} thickness={2} sx={{ color: 'primary.main', opacity: 0.3 }} />
             <MotionBox
               animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
               transition={{ repeat: Infinity, duration: 2 }}
               sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'primary.main' }}
             >
               <AutoAwesome sx={{ fontSize: 40 }} />
             </MotionBox>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.02em', fontFamily: 'Orbitron' }}>SYNTHESIZING INTELLIGENCE</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>Our AI agent is cross-referencing your experience with industry benchmarks. This deep-scan takes 15–30 seconds.</Typography>
          </Box>
          <LinearProgress variant="indeterminate" sx={{ width: '100%', height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.1) }} />
        </Stack>
      </GlassCard>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <GlassCard sx={{ p: 4, border: `2px solid ${theme.palette.error.main}33` }}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 3, mb: 3 }}>{error}</Alert>
        <GradientButton fullWidth onClick={onGenerate} startIcon={<Refresh />}>RE-INITIALIZE ANALYSIS</GradientButton>
      </GlassCard>
    );
  }

  // 3. No Analysis State
  if (!analysis) {
    return (
      <GlassCard sx={{ p: 6, textAlign: 'center', background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 100%)` }}>
        <Box sx={{ 
          width: 80, 
          height: 80, 
          borderRadius: 4, 
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 4,
          color: 'primary.main',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
        }}>
          <Psychology sx={{ fontSize: 40 }} />
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, fontFamily: 'Orbitron' }}>COLLECTIVE BRAIN</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 4 }}>Unlock personalized career growth insights, skill gap analysis, and tailored improvement roadmaps powered by InterviewMaster AI.</Typography>
        <GradientButton size="large" onClick={onGenerate} startIcon={<AutoAwesome />}>LAUNCH AI SCAN</GradientButton>
      </GlassCard>
    );
  }

  // 4. Results State
  const { analysis_data, analyzed_at, execution_time_ms, status } = analysis;
  const isAIGenerated = status === 'success' && !(analysis_data as any).fallback_used;

  return (
    <GlassCard sx={{ 
      p: 4, 
      border: isAIGenerated ? `1px solid ${alpha(theme.palette.success.main, 0.3)}` : `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
      background: isAIGenerated ? `radial-gradient(circle at top right, ${alpha(theme.palette.success.main, 0.1)}, transparent 40%)` : undefined,
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: isAIGenerated ? 'success.main' : 'warning.main', color: 'white' }}>
              <Psychology />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>RESUME INTELLIGENCE</Typography>
            {isAIGenerated && <Chip label="AI SUCCESS" color="success" size="small" sx={{ fontWeight: 900, borderRadius: 1 }} />}
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            LAST SCANNED: {format(new Date(analyzed_at), 'MMM dd, HH:mm')} • LATTICE DELAY: {execution_time_ms}ms
          </Typography>
        </Box>
        <IconButton onClick={onRegenerate} sx={{ bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
          <Refresh sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 4, opacity: 0.1 }} />

      {/* Summary Insight */}
      {(analysis_data as any).analysis_summary && (
        <Box sx={{ 
          p: 2.5, 
          borderRadius: 4, 
          bgcolor: alpha(theme.palette.background.paper, 0.5), 
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          mb: 4
        }}>
          <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.primary', fontWeight: 500 }}>
            "{(analysis_data as any).analysis_summary}"
          </Typography>
        </Box>
      )}

      {/* Stats Bento */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: 'SKILLS', val: analysis_data.skill_inventory?.technical_skills?.length || 0, color: 'primary' },
          { label: 'GAPS', val: (analysis_data.skill_gaps?.required_missing?.length || 0) + (analysis_data.skill_gaps?.preferred_missing?.length || 0), color: 'error' },
          { label: 'MATCH', val: `${analysis_data.skill_gaps?.match_percentage || 0}%`, color: 'success' }
        ].map((stat, i) => (
          <Grid key={i} size={{ xs: 4 }}>
            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 3, bgcolor: alpha((theme.palette as any)[stat.color].main, 0.05), border: `1px solid ${alpha((theme.palette as any)[stat.color].main, 0.1)}` }}>
              <Typography variant="h4" sx={{ fontWeight: 900, color: `${stat.color}.main`, fontFamily: 'Orbitron' }}>{stat.val}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.1em' }} >{stat.label}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Roadmap & Details */}
      <Stack spacing={2} sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
           <RoadmapIcon color="info" />
           <Typography variant="body2" sx={{ fontWeight: 600 }}>{analysis_data.improvement_roadmap?.milestones?.length || 0} Growth Milestones Identified</Typography>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
           <FlashIcon color="warning" />
           <Typography variant="body2" sx={{ fontWeight: 600 }}>Matched for {analysis_data.skill_gaps?.target_role?.toUpperCase() || 'CORE ROLE'}</Typography>
        </Stack>
      </Stack>

      {onViewDetails && (
        <GradientButton fullWidth size="large" onClick={onViewDetails} startIcon={<AutoAwesome />}>
          OPEN INTELLIGENCE REPORT
        </GradientButton>
      )}
    </GlassCard>
  );
}

export default ResumeAnalysisCard;