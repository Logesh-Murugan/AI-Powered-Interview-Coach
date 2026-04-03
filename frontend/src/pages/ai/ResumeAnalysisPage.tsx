/**
 * Premium Resume Analysis Page
 * High-end AI "Cognitive Intelligence Scan" interface
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  Alert,
  Stack,
  Chip,
  Divider,
  alpha,
  useTheme,
  Grid,
} from '@mui/material';
import {
  ArrowBack,
  Code,
  Timeline as TimelineIcon,
  Warning,
  TrendingUp,
  History,
  Psychology,
  Build,
  Language as LanguageIcon,
  AutoAwesome,
  Memory,
  Bolt,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store';
import type { RootState } from '../../store';
import { analyzeResume, fetchAnalysis, fetchHistory, clearError } from '../../store/slices/resumeAnalysisSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { format } from 'date-fns';
import { GlassCard, GradientButton, GradientText } from '../../components/common/PremiumComponents';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      <AnimatePresence mode="wait">
        {value === index && (
          <MotionBox
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            sx={{ py: 4 }}
          >
            {children}
          </MotionBox>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResumeAnalysisPage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const [tabValue, setTabValue] = useState(0);
  const [pollAttempts, setPollAttempts] = useState(0);

  const { currentAnalysis, history, isLoading, isGenerating, error } = useAppSelector(
    (state: RootState) => state.resumeAnalysis
  );

  useEffect(() => {
    if (resumeId) {
      const id = parseInt(resumeId);
      dispatch(fetchAnalysis(id)).then((action) => {
        // If analysis doesn't exist, trigger generation
        if (action.meta.requestStatus === 'rejected') {
          const payload = action.payload as { status?: number };
          if (payload?.status === 404) {
            const targetRole = 'Software Engineer'; // Default or from profile
            dispatch(analyzeResume({ resumeId: id, request: { target_role: targetRole } }));
          }
        }
      });
      dispatch(fetchHistory({ resumeId: id, limit: 10 }));
    }
  }, [resumeId, dispatch]);

  useEffect(() => {
    if (!resumeId || currentAnalysis || pollAttempts >= 12) return;
    if (isLoading) return;

    const id = parseInt(resumeId);
    const timer = setTimeout(() => {
      setPollAttempts((p) => p + 1);
      dispatch(fetchAnalysis(id));
    }, pollAttempts < 6 ? 3000 : 5000);

    return () => clearTimeout(timer);
  }, [resumeId, currentAnalysis, isLoading, pollAttempts, dispatch]);

  const analysisData = currentAnalysis?.analysis_data;
  const { skill_inventory, experience_timeline, skill_gaps, improvement_roadmap } = analysisData || {};
  const analysisHistory = resumeId ? history[parseInt(resumeId)] || [] : [];
  const isAIGenerated = currentAnalysis?.status === 'success' && !analysisData?.fallback_used;

  const handleRetry = () => {
    if (resumeId) {
      dispatch(clearError());
      dispatch(fetchAnalysis(parseInt(resumeId)));
    }
  };

  const handleRescan = () => {
    if (resumeId) {
      const id = parseInt(resumeId);
      dispatch(clearError());
      const targetRole = 'Software Engineer';
      dispatch(analyzeResume({ resumeId: id, request: { target_role: targetRole, force_refresh: true } }));
      setPollAttempts(0);
    }
  };

  if (isLoading && !currentAnalysis) return <LoadingSpinner variant="fullPage" text="SYNCHRONIZING WITH AI NEURALS..." />;
  
  // Show generating state if analysis is not ready yet but in progress
  const isCurrentlyGenerating = isGenerating || (isLoading && !currentAnalysis) || (currentAnalysis?.status === 'processing');
  
  if (isCurrentlyGenerating) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <GlassCard sx={{ p: 8, maxWidth: 600, mx: 'auto' }}>
          <AutoAwesome sx={{ fontSize: 80, color: 'primary.main', mb: 3, opacity: 0.8 }} className="pulse-animation" />
          <Typography variant="h4" sx={{ fontWeight: 1000, mb: 2, fontFamily: 'Orbitron' }}>AI SCAN IN PROGRESS</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontWeight: 600 }}>
            OUR NEURAL NETWORK IS CURRENTLY ANALYZING YOUR VECTOR. THIS PROCESS TYPICALLY TAKES 15-30 SECONDS.
          </Typography>
          <LoadingSpinner variant="fullPage" />
        </GlassCard>
      </Box>
    );
  }

  if (error) return (
    <Box sx={{ py: 10, textAlign: 'center' }}>
      <GlassCard sx={{ p: 8, maxWidth: 600, mx: 'auto' }}>
        <Warning sx={{ fontSize: 80, color: 'error.main', mb: 3, opacity: 0.8 }} />
        <Typography variant="h4" sx={{ fontWeight: 1000, mb: 2, fontFamily: 'Orbitron', color: 'error.main' }}>NEURAL LINK FAILED</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontWeight: 600 }}>
          THE AI REASONING ENGINE ENCOUNTERED A SYMBOLIC LOGIC CONFLICT OR CONNECTION TIMEOUT.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <GradientButton onClick={handleRetry} startIcon={<History />}>RETRY LINK</GradientButton>
          <GradientButton onClick={handleRescan} startIcon={<Bolt />} sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.2) }}>
            RE-INITIALIZE ANALYSIS
          </GradientButton>
        </Stack>
      </GlassCard>
    </Box>
  );

  if (!currentAnalysis) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <GlassCard sx={{ p: 8, maxWidth: 600, mx: 'auto' }}>
          <Psychology sx={{ fontSize: 80, color: 'primary.main', mb: 3, opacity: 0.5 }} />
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 2, fontFamily: 'Orbitron' }}>ANALYSIS OFFLINE</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
            NEURAL SCAN DATA FOR THIS VECTOR IS CURRENTLY UNAVAILABLE OR INITIALIZING.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <GradientButton onClick={handleRescan} startIcon={<Bolt />}>INITIALIZE AI SCAN</GradientButton>
            <GradientButton variant="outlined" onClick={() => navigate(`/resumes/${resumeId}`)} sx={{ bgcolor: 'transparent !important', border: `1px solid ${alpha(theme.palette.divider, 0.1)} !important`, color: 'text.primary !important' }}>
              DOSSIER
            </GradientButton>
          </Stack>
        </GlassCard>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 8 }}>
      {/* Header Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3, opacity: 0.6 }}>
        <Link component="button" variant="caption" onClick={() => navigate('/resumes')} sx={{ color: 'inherit', fontWeight: 800 }}>REPOSITORY</Link>
        <Link component="button" variant="caption" onClick={() => navigate(`/resumes/${resumeId}`)} sx={{ color: 'inherit', fontWeight: 800 }}>IDENTITY VECTOR</Link>
        <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main' }}>AI SCAN</Typography>
      </Breadcrumbs>

      {/* Main Analysis Header */}
      <GlassCard 
        sx={{ 
          p: 6, 
          mb: 4, 
          background: isAIGenerated 
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)` 
            : undefined,
          border: isAIGenerated ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}` : undefined,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, bgcolor: 'primary.main', opacity: 0.1, filter: 'blur(100px)', borderRadius: '50%' }} />
        
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ position: 'relative', zIndex: 1, mb: analysisData?.fallback_used ? 4 : 0 }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
               <Psychology sx={{ fontSize: 40, color: 'primary.main' }} />
               <Typography variant="h3" sx={{ fontWeight: 1000, fontFamily: 'Orbitron' }}>INTELLIGENCE <GradientText>SCAN</GradientText></Typography>
               {isAIGenerated && <Chip label="NEURAL-ACTIVE" size="small" sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', fontWeight: 900, border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }} />}
               {analysisData?.fallback_used && <Chip label="FALLBACK NLP" size="small" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', fontWeight: 900, border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}` }} />}
            </Stack>
            
            <Stack direction="row" spacing={3} alignItems="center">
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Memory sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>SCAN COMPLETED: {format(new Date(currentAnalysis.analyzed_at), 'dd MMM yyyy • HH:mm')}</Typography>
               </Box>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Bolt sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main' }}>LATENCY: {currentAnalysis.execution_time_ms === 0 ? 'N/A' : `${currentAnalysis.execution_time_ms}MS`}</Typography>
               </Box>
               {currentAnalysis.from_cache && !analysisData?.fallback_used && <Chip label="CACHED" size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 900 }} />}
            </Stack>
          </Box>
          <Stack direction="row" spacing={2}>
            <GradientButton 
              onClick={handleRescan} 
              startIcon={<Bolt />} 
              sx={{ 
                bgcolor: analysisData?.fallback_used ? alpha(theme.palette.warning.main, 0.2) + ' !important' : undefined 
              }}
            >
              RE-SCAN
            </GradientButton>
            <GradientButton variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(`/resumes/${resumeId}`)} sx={{ bgcolor: 'transparent !important', border: `1px solid ${alpha(theme.palette.divider, 0.1)} !important`, color: 'text.primary !important' }}>
               DOSSIER
            </GradientButton>
          </Stack>
        </Stack>

        {analysisData?.fallback_used && (
           <Box sx={{ mt: 4, p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.05), border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`, color: 'warning.main', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Warning sx={{ fontSize: 20 }} />
              <Typography variant="caption" sx={{ fontWeight: 900, letterSpacing: '0.05em' }}>
                INTELLIGENCE DOSSIER INCOMPLETE: NEURAL AGENT TIMEOUT. COGNITIVE VECTORS GENERATED VIA FALLBACK NLP. 
              </Typography>
           </Box>
        )}

        {analysisData?.analysis_summary && (
          <Box sx={{ mt: 6, p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.4), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
             <Typography variant="body1" sx={{ fontWeight: 500, lineHeight: 1.8, fontStyle: 'italic' }}>
                "{analysisData.analysis_summary}"
             </Typography>
          </Box>
        )}
      </GlassCard>

      {/* Tabs Control */}
      <GlassCard sx={{ p: 0, mb: 4, overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, v) => setTabValue(v)} 
          variant="fullWidth"
          sx={{
            '& .MuiTabs-indicator': { height: 4 },
            '& .MuiTab-root': { py: 3, fontWeight: 900, fontFamily: 'Orbitron', letterSpacing: '0.1em', fontSize: '0.8rem' }
          }}
        >
          <Tab icon={<AutoAwesome sx={{ mb: 1 }} />} label="SKILLS" />
          <Tab icon={<TimelineIcon sx={{ mb: 1 }} />} label="TIMELINE" />
          <Tab icon={<Warning sx={{ mb: 1 }} />} label="GAPS" />
          <Tab icon={<TrendingUp sx={{ mb: 1 }} />} label="ROADMAP" />
          <Tab icon={<History sx={{ mb: 1 }} />} label="ARCHIVE" />
        </Tabs>
      </GlassCard>

      {/* Content Panes */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={4}>
           {[
             { title: 'TECHNICAL STACK', data: skill_inventory?.technical_skills, icon: <Code />, color: 'primary' },
             { title: 'SOFT CAPABILITIES', data: skill_inventory?.soft_skills, icon: <Psychology />, color: 'secondary' },
             { title: 'ARSENAL (TOOLS)', data: skill_inventory?.tools, icon: <Build />, color: 'warning' },
             { title: 'DIALECTS', data: skill_inventory?.languages, icon: <LanguageIcon />, color: 'info' },
           ].map((sector, i) => (
             <Grid key={i} size={{ xs: 12, md: 6 }}>
                <GlassCard sx={{ p: 4, height: '100%', borderLeft: `6px solid ${(theme.palette as any)[sector.color].main}` }}>
                   <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                      {sector.icon}
                      <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', fontSize: '0.9rem' }}>{sector.title}</Typography>
                      {sector.data && <Chip label={sector.data.length} size="small" sx={{ fontWeight: 900, bgcolor: alpha((theme.palette as any)[sector.color].main, 0.1), color: (theme.palette as any)[sector.color].main }} />}
                   </Stack>
                   <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                      {sector.data?.map((s: string, idx: number) => (
                        <Chip key={idx} label={s.toUpperCase()} variant="outlined" sx={{ fontWeight: 800, px: 1, borderRadius: 1.5, borderColor: alpha((theme.palette as any)[sector.color].main, 0.2), bgcolor: alpha((theme.palette as any)[sector.color].main, 0.05) }} />
                      ))}
                      {(!sector.data || sector.data.length === 0) && <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled' }}>NO DATA DETECTED</Typography>}
                   </Box>
                </GlassCard>
             </Grid>
           ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
         <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 3 }}>
               <GlassCard sx={{ p: 4, textAlign: 'center', height: '100%' }}>
                  <Typography variant="h1" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', mb: 1, color: 'primary.main' }}>
                     {Math.round((experience_timeline?.total_years || 0) * 10) / 10}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: '0.2em' }}>CHRONO-YEARS</Typography>
               </GlassCard>
            </Grid>
            <Grid size={{ xs: 12, md: 9 }}>
               <GlassCard sx={{ p: 4, height: '100%', position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                     <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>EXPERIENCE LATTICE</Typography>
                     <Chip label={experience_timeline?.seniority_level?.toUpperCase() || 'UNKNOWN'} color="primary" sx={{ fontWeight: 900 }} />
                  </Box>
                  <Divider sx={{ mb: 3, opacity: 0.1 }} />
                  <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary', mb: 4, fontWeight: 500 }}>
                     {experience_timeline?.analysis || 'NO TEMPORAL ANALYSIS AVAILABLE.'}
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" spacing={1}>
                     {experience_timeline?.companies?.map((c: string, idx: number) => (
                       <Chip key={idx} label={c.toUpperCase()} variant="outlined" size="small" sx={{ fontWeight: 800 }} />
                     ))}
                  </Stack>
               </GlassCard>
            </Grid>
         </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
         <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Stack spacing={4}>
               {currentAnalysis?.analysis_data?.skill_gaps && Array.isArray((currentAnalysis.analysis_data.skill_gaps as any).items || currentAnalysis.analysis_data.skill_gaps) && 
                 ((currentAnalysis.analysis_data.skill_gaps as any).items || (currentAnalysis.analysis_data.skill_gaps as any)).map((gap: any, i: number) => (
                  <MotionBox key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                     <GlassCard sx={{ p: 4, borderLeft: `6px solid ${theme.palette.error.main}` }}>
                        <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', mb: 2, color: 'error.main' }}>GAP-{i+1}: {(gap.gap || gap).toUpperCase()}</Typography>
                        <Stack spacing={1.5}>
                           {gap.recommendations?.map((rec: string, idx: number) => (
                             <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                <ArrowBack sx={{ transform: 'rotate(180deg)', fontSize: 16, mt: 0.5, color: 'primary.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{rec}</Typography>
                             </Box>
                           ))}
                        </Stack>
                     </GlassCard>
                  </MotionBox>
                ))}
               {(!currentAnalysis?.analysis_data?.skill_gaps || (Array.isArray(currentAnalysis.analysis_data.skill_gaps) && (currentAnalysis.analysis_data.skill_gaps as any).length === 0)) && (
                 <GlassCard sx={{ p: 6, textAlign: 'center' }}>
                    <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>ZERO GAPS DETECTED</Typography>
                    <Typography variant="body1" color="text.secondary">THE IDENTITY VECTOR MATCHES THE TARGET ROLE SYMMETRY.</Typography>
                 </GlassCard>
               )}
            </Stack>
         </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
         <Box sx={{ maxWidth: 900, mx: 'auto' }}>
            <GlassCard sx={{ p: 6 }}>
               <Typography variant="h5" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', mb: 6, textAlign: 'center' }}>NEURAL <GradientText>ROADMAP</GradientText></Typography>
               
               <Grid container spacing={4}>
                  <Grid size={{ xs: 12, md: 6 }}>
                     <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: '0.2em', display: 'block', mb: 3 }}>TACTICAL OBJECTIVES (SHORT-TERM)</Typography>
                     <Stack spacing={2}>
                        {((currentAnalysis?.analysis_data?.improvement_roadmap as any)?.short_term || []).map((goal: any, i: number) => {
                          const goalText = typeof goal === 'string' ? goal : goal?.skill || goal?.milestone || JSON.stringify(goal);
                          return (
                            <Box key={i} sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                               <Typography variant="body2" sx={{ fontWeight: 700 }}>{goalText.toUpperCase()}</Typography>
                            </Box>
                          );
                        })}
                     </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                     <Typography variant="caption" sx={{ fontWeight: 900, color: theme.palette.secondary.main, letterSpacing: '0.2em', display: 'block', mb: 3 }}>STRATEGIC MILESTONES (LONG-TERM)</Typography>
                     <Stack spacing={2}>
                        {((currentAnalysis?.analysis_data?.improvement_roadmap as any)?.long_term || []).map((goal: any, i: number) => {
                          const goalText = typeof goal === 'string' ? goal : goal?.skill || goal?.milestone || JSON.stringify(goal);
                          return (
                            <Box key={i} sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.secondary.main, 0.05), border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}` }}>
                               <Typography variant="body2" sx={{ fontWeight: 700 }}>{goalText.toUpperCase()}</Typography>
                            </Box>
                          );
                        })}
                     </Stack>
                  </Grid>
               </Grid>
            </GlassCard>
         </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
         <Stack spacing={2} sx={{ maxWidth: 800, mx: 'auto' }}>
            {analysisHistory.map((h: any, i: number) => (
              <GlassCard key={i} sx={{ p: 3, '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.6) } }}>
                 <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                       <Typography variant="body2" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>{format(new Date(h.analyzed_at), 'dd MMM yyyy • HH:mm').toUpperCase()}</Typography>
                       <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>MATCH: {h.analysis_data?.skill_gaps?.match_percentage || 'N/A'}%</Typography>
                    </Box>
                    <Chip label="ARCHIVED" size="small" variant="outlined" sx={{ fontWeight: 900, fontSize: '0.65rem' }} />
                 </Stack>
              </GlassCard>
            ))}
         </Stack>
      </TabPanel>
    </Box>
  );
}

export default ResumeAnalysisPage;