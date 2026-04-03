/**
 * Premium Resume List Page
 * High-end gallery for managing resume intelligence vectors
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  MenuItem,
  alpha,
  useTheme,
  InputAdornment,
} from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import {
  Add,
  Delete,
  Description,
  Search as SearchIcon,
  FilterList,
} from '@mui/icons-material';
import { resumeService, type Resume } from '../../services/resumeService';
import { format } from 'date-fns';
import { GlassCard, GradientButton, GradientText } from '../../components/common/PremiumComponents';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

function ResumeListPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [filteredResumes, setFilteredResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  const [filterUploadDate, setFilterUploadDate] = useState(searchParams.get('uploadDate') || 'all');

  useEffect(() => {
    loadResumes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [resumes, searchText, filterUploadDate]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchText) params.search = searchText;
    if (filterUploadDate !== 'all') params.uploadDate = filterUploadDate;
    setSearchParams(params);
  }, [searchText, filterUploadDate]);

  const loadResumes = async () => {
    setLoading(true);
    try {
      const response = await resumeService.getResumes();
      setResumes(response.resumes);
    } catch (err: any) {
      setError(err.message || 'Entity retrieval failed.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...resumes];
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(resume => resume.filename.toLowerCase().includes(searchLower));
    }
    if (filterUploadDate !== 'all') {
      const now = new Date();
      const daysAgo = filterUploadDate === '7days' ? 7 : filterUploadDate === '30days' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(resume => new Date(resume.created_at) >= cutoffDate);
    }
    setFilteredResumes(filtered);
  };

  const handleDeleteConfirm = async () => {
    if (!resumeToDelete) return;
    setDeleting(true);
    try {
      await resumeService.deleteResume(resumeToDelete.id);
      setResumes(resumes.filter(r => r.id !== resumeToDelete.id));
      setDeleteDialogOpen(false);
      setResumeToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Decommissioning failed.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner variant="fullPage" />;

  return (
    <Box sx={{ pb: 8 }}>
      {/* Header Section */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ mb: 6, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 3 }}
      >
        <Box>
          <Typography variant="h3" sx={{ mb: 1, fontFamily: 'Orbitron', fontWeight: 900 }}>
            INTELLIGENCE <GradientText>REPOSITORY</GradientText>
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Management of your primary data vectors for AI analysis.
          </Typography>
        </Box>
        <GradientButton 
          startIcon={<Add />} 
          onClick={() => navigate('/resumes/upload')}
          size="large"
        >
          UPLOAD NEW VECTOR
        </GradientButton>
      </MotionBox>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} sx={{ mb: 4 }} />}

      {/* Control Panel */}
      <GlassCard sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              placeholder="SEARCH BY VECTOR FILENAME..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ mr: 2 }}>
                    <SearchIcon color="primary" />
                  </InputAdornment>
                ),
                sx: { 
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.background.paper, 0.4),
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  letterSpacing: '0.1em',
                  fontFamily: 'Orbitron'
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              select
              value={filterUploadDate}
              onChange={(e) => setFilterUploadDate(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ mr: 2 }}>
                    <FilterList color="primary" />
                  </InputAdornment>
                ),
                sx: { 
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.background.paper, 0.4),
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  fontFamily: 'Orbitron'
                }
              }}
            >
              <MenuItem value="all">ALL EPOCHS</MenuItem>
              <MenuItem value="7days">PAST 7 CYCLES</MenuItem>
              <MenuItem value="30days">PAST 30 CYCLES</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </GlassCard>

      {/* Results Matrix */}
      {filteredResumes.length === 0 ? (
        <Box sx={{ py: 10, textAlign: 'center', opacity: 0.5 }}>
          <Description sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h6" sx={{ fontFamily: 'Orbitron', fontWeight: 900 }}>NO DATA DETECTED IN LOCAL SECTOR</Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          <AnimatePresence>
            {filteredResumes.map((resume, idx) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={resume.id}>
                <MotionBox
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  sx={{ height: '100%' }}
                >
                  <GlassCard sx={{ 
                    p: 0, 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden', 
                    transition: 'all 0.4s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: `0 0 30px ${alpha(theme.palette.primary.main, 0.2)}`
                    }
                  }}>
                    <Box sx={{ p: 4, flex: 1 }}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                        <Box sx={{ 
                          p: 1.5, 
                          borderRadius: 3, 
                          bgcolor: alpha(theme.palette.primary.main, 0.1), 
                          color: 'primary.main',
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                          display: 'flex'
                        }}>
                          <Description />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body1" noWrap sx={{ fontWeight: 900, fontFamily: 'Orbitron', fontSize: '1rem' }}>
                            {resume.filename.toUpperCase()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                            SECURED: {format(new Date(resume.created_at), 'dd/MM/yyyy')}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack spacing={2} sx={{ mb: 4 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                           <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: '0.1em' }}>STATUS</Typography>
                           <Chip 
                             label={resume.status.toUpperCase()} 
                             size="small" 
                             color={resume.status === 'completed' ? 'success' : 'warning'} 
                             sx={{ fontWeight: 900, borderRadius: 1.5, height: 22, fontSize: '0.65rem' }} 
                           />
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                           <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: '0.1em' }}>SENIORITY</Typography>
                           <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', fontFamily: 'Orbitron' }}>{resume.seniority_level?.toUpperCase() || 'UNKNOWN'}</Typography>
                        </Stack>
                      </Stack>
                    </Box>

                    <Box sx={{ p: 2, display: 'flex', gap: 2, bgcolor: alpha(theme.palette.background.paper, 0.3), borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                      <Button 
                        fullWidth 
                        variant="text" 
                        onClick={() => navigate(`/resumes/${resume.id}`)}
                        sx={{ fontWeight: 900, color: 'text.primary', borderRadius: 3, py: 1.5 }}
                      >
                        OPEN RECORD
                      </Button>
                      <IconButton 
                        color="error" 
                        onClick={(e) => { e.stopPropagation(); setResumeToDelete(resume); setDeleteDialogOpen(true); }}
                        sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), borderRadius: 3, px: 2 }}
                      >
                         <Delete />
                      </IconButton>
                    </Box>
                    {(resume.status === 'completed' || resume.status === 'text_extracted' || resume.status === 'skills_extracted') && (
                       <Box sx={{ p: 2, pt: 0, bgcolor: alpha(theme.palette.background.paper, 0.3) }}>
                          <GradientButton 
                            fullWidth 
                            onClick={() => navigate(`/ai/resume-analysis/${resume.id}`)}
                            sx={{ borderRadius: 3, py: 1.5 }}
                          >
                            AI SCAN
                          </GradientButton>
                       </Box>
                    )}
                  </GlassCard>
                </MotionBox>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 5, p: 2, bgcolor: 'background.paper', backdropFilter: 'blur(10px)', backgroundImage: 'none', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` } }}
      >
        <DialogTitle sx={{ fontWeight: 1000, fontFamily: 'Orbitron', fontSize: '1.2rem' }}>DECOMMISSION VECTOR?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontWeight: 500 }}>Are you sure you want to terminate "{resumeToDelete?.filename}"? This record will be purged from the lattice permanently.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting} sx={{ fontWeight: 700 }}>ABORT</Button>
          <GradientButton onClick={handleDeleteConfirm} sx={{ bgcolor: `${theme.palette.error.main} !important`, px: 4 }} disabled={deleting}>
            {deleting ? 'PURGING...' : 'CONFIRM PURGE'}
          </GradientButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ResumeListPage;
