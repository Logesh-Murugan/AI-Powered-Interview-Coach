/**
 * Premium Resume Detail Page
 * High-end AI analysis report with glassmorphic visuals and animations
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Chip,
  Grid,
  Divider,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
  IconButton,
} from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  ArrowBack,
  Download,
  Delete,
  Work,
  School,
} from '@mui/icons-material';
import { resumeService, type Resume } from '../../services/resumeService';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../store';
import { analyzeResume, fetchAnalysis, clearError } from '../../store/slices/resumeAnalysisSlice';
import ResumeAnalysisCard from '../../components/ai/ResumeAnalysisCard';
import { GlassCard } from '../../components/common/PremiumComponents';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

function ResumeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);

  const { currentAnalysis, isLoading: analysisLoading, isGenerating, error: analysisError } = useAppSelector(
    (state) => state.resumeAnalysis
  );
  const userProfile = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (id) {
      loadResume(parseInt(id));
      dispatch(fetchAnalysis(parseInt(id)));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (!resume || autoStarted) return;
    if ((resume.status === 'completed' || resume.status === 'text_extracted' || resume.status === 'skills_extracted') && !currentAnalysis) {
      dispatch(clearError());
      const targetRole = userProfile?.target_role || 'Software Engineer';
      dispatch(analyzeResume({ resumeId: resume.id, request: { target_role: targetRole } }));
      setAutoStarted(true);
    }
  }, [resume, currentAnalysis, autoStarted, dispatch, userProfile]);

  const loadResume = async (resumeId: number) => {
    setLoading(true);
    try {
      const data = await resumeService.getResumeById(resumeId);
      setResume(data);
    } catch (err: any) {
      setError(err.message || 'Transmission failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!resume) return;
    setDeleting(true);
    try {
      await resumeService.deleteResume(resume.id);
      navigate('/resumes');
    } catch (err: any) {
      setError(err.message || 'Decommissioning failed.');
      setDeleting(false);
    }
  };

  const handleGenerateAnalysis = () => {
    if (!resume) return;
    dispatch(clearError());
    const targetRole = userProfile?.target_role || 'Software Engineer';
    dispatch(analyzeResume({ resumeId: resume.id, request: { target_role: targetRole } }));
  };

  const handleRegenerateAnalysis = () => {
    if (!resume) return;
    const targetRole = userProfile?.target_role || 'Software Engineer';
    dispatch(analyzeResume({ resumeId: resume.id, request: { target_role: targetRole, force_refresh: true } }));
  };

  if (loading) return <LoadingSpinner variant="fullPage" />;

  if (error || !resume) return (
    <Box sx={{ p: 4 }}>
      <ErrorAlert message={error || 'Entity not found.'} onRetry={() => id && loadResume(parseInt(id))} />
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/resumes')} sx={{ mt: 2 }}>RETURN TO REPOSITORY</Button>
    </Box>
  );

  return (
    <Box sx={{ pb: 8 }}>
      {/* Premium Header */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ mb: 6 }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <IconButton onClick={() => navigate('/resumes')} sx={{ bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
             <ArrowBack />
          </IconButton>
          <Stack direction="row" spacing={2}>
             <Button variant="outlined" startIcon={<Download />} href={resume.file_url} target="_blank">EXPORT PDF</Button>
             <Button variant="outlined" color="error" startIcon={<Delete />} onClick={() => setDeleteDialogOpen(true)}>TERMINATE</Button>
          </Stack>
        </Stack>

        <GlassCard sx={{ p: 4, position: 'relative', overflow: 'hidden' }}>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
               <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontFamily: 'Orbitron' }}>
                 {resume.filename.toUpperCase()}
               </Typography>
               <Stack direction="row" spacing={2} alignItems="center">
                  <Chip 
                    label={resume.status.toUpperCase()} 
                    color={resume.status === 'completed' ? 'success' : 'warning'} 
                    sx={{ fontWeight: 900, borderRadius: 1 }} 
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    RECORDED: {format(new Date(resume.created_at), 'MMM dd, yyyy')}
                  </Typography>
               </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
               <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h2" sx={{ fontWeight: 900, color: 'primary.main', fontFamily: 'Orbitron' }}>
                    {currentAnalysis?.analysis_data?.experience_timeline?.seniority_level || resume.seniority_level || 'LVL 0'}
                  </Typography>
                  <Typography variant="overline" sx={{ letterSpacing: '0.2em', fontWeight: 800 }}>SENIORITY VECTOR</Typography>
               </Box>
            </Grid>
          </Grid>
        </GlassCard>
      </MotionBox>

      <Grid container spacing={4}>
        {/* Left Control Column */}
        <Grid size={{ xs: 12, lg: 4 }}>
           <Stack spacing={4}>
              <ResumeAnalysisCard
                analysis={currentAnalysis}
                isLoading={analysisLoading}
                isGenerating={isGenerating}
                error={analysisError}
                onGenerate={handleGenerateAnalysis}
                onRegenerate={handleRegenerateAnalysis}
                onViewDetails={() => navigate(`/ai/resume-analysis/${resume.id}`)}
              />
              
              <GlassCard sx={{ p: 4 }}>
                 <Typography variant="h6" sx={{ fontWeight: 900, mb: 3, fontFamily: 'Orbitron' }}>SKILL MATRIX</Typography>
                 <Stack spacing={3}>
                    {resume.skills && Object.entries(resume.skills).map(([key, list], i) => (
                      <Box key={i}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1, textTransform: 'uppercase' }}>
                          {key.replace('_', ' ')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {(list as string[]).map((skill, j) => (
                            <Chip key={j} label={skill} size="small" variant="outlined" sx={{ borderRadius: 1, fontWeight: 600 }} />
                          ))}
                        </Box>
                      </Box>
                    ))}
                 </Stack>
              </GlassCard>
           </Stack>
        </Grid>

        {/* Right Data Column */}
        <Grid size={{ xs: 12, lg: 8 }}>
           <Stack spacing={4}>
              {resume.experience && resume.experience.length > 0 && (
                <GlassCard sx={{ p: 4 }}>
                   <Typography variant="h5" sx={{ fontWeight: 900, mb: 4, fontFamily: 'Orbitron' }}><Work sx={{ mr: 2 }} /> EXPERIENCE TIMELINE</Typography>
                   <Timeline position="left">
                      {resume.experience.map((exp, idx) => (
                        <TimelineItem key={idx}>
                          <TimelineOppositeContent sx={{ mt: 1, flex: 0.2 }}>
                             <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                               {format(new Date(exp.start_date), 'MMM yyyy').toUpperCase()} — {exp.end_date ? format(new Date(exp.end_date), 'MMM yyyy').toUpperCase() : 'PRESENT'}
                             </Typography>
                          </TimelineOppositeContent>
                          <TimelineSeparator>
                             <TimelineDot color="primary" variant="outlined" sx={{ borderWidth: 2 }} />
                             {idx < resume.experience!.length - 1 && <TimelineConnector />}
                          </TimelineSeparator>
                          <TimelineContent sx={{ py: '12px', px: 2 }}>
                             <Typography variant="h6" sx={{ fontWeight: 900 }}>{exp.job_title.toUpperCase()}</Typography>
                             <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700, mb: 1 }}>{exp.company_name}</Typography>
                             <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{exp.description}</Typography>
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                   </Timeline>
                </GlassCard>
              )}

              {resume.education && resume.education.length > 0 && (
                <GlassCard sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, mb: 4, fontFamily: 'Orbitron' }}><School sx={{ mr: 2 }} /> ACADEMIC LOGS</Typography>
                    <List>
                      {resume.education.map((edu, idx) => (
                        <ListItem key={idx} sx={{ px: 0, py: 2 }}>
                           <ListItemIcon><School color="primary" /></ListItemIcon>
                           <ListItemText 
                              primary={<Typography variant="h6" sx={{ fontWeight: 800 }}>{edu.degree_type.toUpperCase()} IN {edu.field_of_study.toUpperCase()}</Typography>}
                              secondary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{edu.institution_name} • {edu.graduation_year}</Typography>}
                           />
                        </ListItem>
                      ))}
                    </List>
                </GlassCard>
              )}
           </Stack>
        </Grid>
      </Grid>

      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 2, bgcolor: 'background.paper', backdropFilter: 'blur(10px)' } }}>
        <DialogTitle sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>TERMINATE DATA?</DialogTitle>
        <DialogContent>
          <Typography variant="body1">Are you sure you want to delete this intelligence vector? This action cannot be reversed.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>CANCEL</Button>
          <Button onClick={handleDelete} color="error" variant="contained">{deleting ? 'TERMINATING...' : 'CONFIRM TERMINATION'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ResumeDetailPage;
