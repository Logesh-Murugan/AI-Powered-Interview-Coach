/**
 * Premium Company Coaching Page
 * High-end AI "Tactical Company Briefing" interface
 */

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Stack,
  Grid,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Checkbox,
  FormControlLabel,
  alpha,
  useTheme,
} from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import {
  Business,
  Add,
  ExpandMore,
  CheckCircle,
  QuestionAnswer,
  Checklist,
  AutoAwesome,
  Work,
  GpsFixed,
  VerifiedUser,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  createSession,
  fetchSession,
  fetchUserSessions,
  setCurrentSession,
  clearError,
} from '../../store/slices/companyCoachingSlice';
import CoachingSessionCard from '../../components/ai/CoachingSessionCard';
import { GlassCard, GradientButton, GradientText } from '../../components/common/PremiumComponents';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

const TARGET_ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'DevOps Engineer', 'Data Scientist', 'Machine Learning Engineer', 'Product Manager',
  'UI/UX Designer', 'QA Engineer', 'Cloud Architect', 'Security Engineer',
  'Mobile Developer', 'Data Engineer', 'Technical Lead',
];

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
          <MotionBox initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} sx={{ py: 4 }}>
            {children}
          </MotionBox>
        )}
      </AnimatePresence>
    </div>
  );
}

function CompanyCoachingPage() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { userSessions, currentSession, isLoading, isGenerating, error } = useAppSelector((state) => state.companyCoaching);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [checklistState, setChecklistState] = useState<Record<number, boolean>>({});

  useEffect(() => {
    dispatch(fetchUserSessions());
  }, [dispatch]);

  const handleCreateSession = async () => {
    if (!companyName || !targetRole) return;
    await dispatch(createSession({ company_name: companyName, target_role: targetRole }));
    setShowCreateForm(false);
    setCompanyName('');
    setTargetRole('');
    setTabValue(0);
  };

  const handleViewDetails = async (session: any) => {
    const result = await dispatch(fetchSession(session.id));
    if (fetchSession.fulfilled.match(result)) {
      setTabValue(0);
      const initialChecklistState: Record<number, boolean> = {};
      (result.payload.pre_interview_checklist || []).forEach((_: any, idx: number) => {
        initialChecklistState[idx] = false;
      });
      setChecklistState(initialChecklistState);
    }
  };

  const filteredSessions = companyFilter ? userSessions.filter((s) => s.company_name === companyFilter) : userSessions;
  const uniqueCompanies = Array.from(new Set(userSessions.map((s) => s.company_name))).sort();

  return (
    <Box sx={{ pb: 8 }}>
      <MotionBox initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 3 }}>
        <Box>
           <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontFamily: 'Orbitron' }}>TACTICAL <GradientText>COACHING</GradientText></Typography>
           <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>AI-POWERED COMPANY-SPECIFIC INTELLIGENCE RIGS</Typography>
        </Box>
        {!showCreateForm && (
           <GradientButton startIcon={<Add />} onClick={() => setShowCreateForm(true)} size="large">INITIALIZE NEW RIG</GradientButton>
        )}
      </MotionBox>

      {error && <Box sx={{ mb: 4 }}><ErrorAlert message={error} onDismiss={() => dispatch(clearError())} /></Box>}

      <AnimatePresence>
        {showCreateForm && (
          <MotionBox initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} sx={{ mb: 6, overflow: 'hidden' }}>
            <GlassCard sx={{ p: 4, border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}` }}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 3, fontFamily: 'Orbitron' }}>COACHING RIG CONFIGURATION</Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField 
                    fullWidth 
                    label="TARGET ENTITY (COMPANY)" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)}
                    InputProps={{ sx: { borderRadius: 3, fontWeight: 700, fontFamily: 'Orbitron', fontSize: '0.8rem' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField 
                    select 
                    fullWidth 
                    label="TARGET ROLE" 
                    value={targetRole} 
                    onChange={(e) => setTargetRole(e.target.value)}
                    InputProps={{ sx: { borderRadius: 3, fontWeight: 700, fontFamily: 'Orbitron', fontSize: '0.8rem' } }}
                  >
                    {TARGET_ROLES.map((role) => <MenuItem key={role} value={role}>{role.toUpperCase()}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <GradientButton variant="outlined" onClick={() => setShowCreateForm(false)} sx={{ bgcolor: 'transparent !important', color: 'text.primary !important' }}>ABORT</GradientButton>
                    <GradientButton onClick={handleCreateSession} disabled={isGenerating || !companyName || !targetRole} startIcon={isGenerating ? <LoadingSpinner size="small" /> : <AutoAwesome />}>
                       {isGenerating ? 'ANALYZING ENTITY...' : 'SYNCHRONIZE COACH'}
                    </GradientButton>
                  </Stack>
                </Grid>
              </Grid>
            </GlassCard>
          </MotionBox>
        )}
      </AnimatePresence>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: currentSession ? 4 : 12 }}>
          <GlassCard sx={{ p: 4 }}>
             <Stack spacing={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron', fontSize: '0.9rem' }}>DEPLOYED RIGS</Typography>
                   {uniqueCompanies.length > 1 && (
                     <TextField 
                       select 
                       size="small" 
                       value={companyFilter} 
                       onChange={(e) => setCompanyFilter(e.target.value)} 
                       label="FILTER" 
                       sx={{ minWidth: 120 }}
                       InputProps={{ sx: { borderRadius: 2, fontSize: '0.7rem', fontWeight: 900 } }}
                     >
                       <MenuItem value="">ALL</MenuItem>
                       {uniqueCompanies.map((c) => <MenuItem key={c} value={c}>{c.toUpperCase()}</MenuItem>)}
                     </TextField>
                   )}
                </Box>
                <Divider sx={{ opacity: 0.1 }} />
                <Stack spacing={2}>
                   {filteredSessions.map((session) => (
                      <CoachingSessionCard key={session.id} session={session} onViewDetails={() => handleViewDetails(session)} />
                   ))}
                   {filteredSessions.length === 0 && <Typography sx={{ py: 4, textAlign: 'center', opacity: 0.5, fontWeight: 700 }}>NO RIGS ACTIVE</Typography>}
                </Stack>
             </Stack>
          </GlassCard>
        </Grid>

        {currentSession && (
          <Grid size={{ xs: 12, md: 8 }}>
            <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
               <Box sx={{ p: 4, bgcolor: alpha(theme.palette.primary.main, 0.05), borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                     <Business color="primary" sx={{ fontSize: 32 }} />
                     <Box>
                        <Typography variant="h5" sx={{ fontWeight: 1000, fontFamily: 'Orbitron' }}>{currentSession.company_name.toUpperCase()}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.1em' }}><VerifiedUser sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} /> SECURED INTEL • {currentSession.target_role.toUpperCase()}</Typography>
                     </Box>
                  </Stack>
               </Box>

               <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="fullWidth" sx={{ '& .MuiTabs-indicator': { height: 4 }, '& .MuiTab-root': { fontWeight: 900, fontFamily: 'Orbitron', py: 2.5 } }}>
                 <Tab label="INTEL OVERVIEW" />
                 <Tab label="PREDICTIONS" />
                 <Tab label="CHECKLIST" />
               </Tabs>

               <Box sx={{ p: 4 }}>
                  <TabPanel value={tabValue} index={0}>
                     <Stack spacing={4}>
                        <Box>
                           <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', display: 'block', mb: 2, letterSpacing: '0.2em' }}>ENTITY CULTURE</Typography>
                           <Typography variant="body1" sx={{ lineHeight: 1.8, fontWeight: 500 }}>{currentSession?.company_overview?.culture || 'ANALYSING...'}</Typography>
                        </Box>
                        <Box>
                           <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', display: 'block', mb: 2, letterSpacing: '0.2em' }}>CORE VALUES</Typography>
                           <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                              {currentSession?.company_overview?.values?.map((v: string, i: number) => <Chip key={i} label={v.toUpperCase()} sx={{ fontWeight: 900, bgcolor: alpha(theme.palette.primary.main, 0.1), border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }} />)}
                           </Box>
                        </Box>
                        <Box>
                           <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', display: 'block', mb: 2, letterSpacing: '0.2em' }}>PROCESS VECTOR</Typography>
                           <Typography variant="body1" sx={{ lineHeight: 1.8, fontWeight: 500 }}>{currentSession?.company_overview?.interview_process || 'ANALYSING...'}</Typography>
                        </Box>
                     </Stack>
                  </TabPanel>

                  <TabPanel value={tabValue} index={1}>
                     <Stack spacing={2}>
                        {currentSession?.predicted_questions?.map((q: any, i: number) => (
                           <Accordion key={i} sx={{ bgcolor: 'transparent', boxShadow: 'none', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: '12px !important', overflow: 'hidden' }}>
                              <AccordionSummary expandIcon={<ExpandMore />}>
                                 <Stack direction="row" spacing={2} alignItems="center">
                                    <QuestionAnswer color="primary" sx={{ fontSize: 18 }} />
                                    <Typography sx={{ fontWeight: 800 }}>{q.question.toUpperCase()}</Typography>
                                    <Chip label={q.difficulty.toUpperCase()} size="small" color={q.difficulty === 'hard' ? 'error' : q.difficulty === 'medium' ? 'warning' : 'success'} sx={{ fontWeight: 900, height: 18, fontSize: '0.6rem' }} />
                                 </Stack>
                              </AccordionSummary>
                              <AccordionDetails sx={{ p: 3, bgcolor: alpha(theme.palette.background.paper, 0.2) }}>
                                 <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', mb: 1, color: 'text.secondary' }}>RATIONALE</Typography>
                                 <Typography variant="body2" sx={{ fontWeight: 500 }}>{q.why_asked}</Typography>
                              </AccordionDetails>
                           </Accordion>
                        ))}
                     </Stack>
                  </TabPanel>

                  <TabPanel value={tabValue} index={2}>
                     <Stack spacing={3}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                           <Checklist color="primary" />
                           <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>PRE-FLIGHT CHECKLIST</Typography>
                        </Stack>
                        <Stack spacing={1}>
                           {currentSession?.pre_interview_checklist?.map((item: string, i: number) => (
                              <Box key={i} sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.3), display: 'flex', alignItems: 'center', border: `1px solid ${alpha(theme.palette.divider, 0.05)}` }}>
                                 <Checkbox checked={checklistState[i] || false} onChange={() => setChecklistState(prev => ({ ...prev, [i]: !prev[i] }))} color="primary" />
                                 <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.toUpperCase()}</Typography>
                              </Box>
                           ))}
                        </Stack>
                     </Stack>
                  </TabPanel>
               </Box>
            </GlassCard>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default CompanyCoachingPage;
