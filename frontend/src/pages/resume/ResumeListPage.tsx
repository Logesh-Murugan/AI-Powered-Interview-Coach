/**
 * Resume List Page
 * Display all user resumes with actions
 * 
 * Requirements: 6.1-6.10
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Add,
  Visibility,
  Delete,
  Description,
  CheckCircle,
  HourglassEmpty,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { resumeService, type Resume } from '../../services/resumeService';
import { format } from 'date-fns';

function ResumeListPage() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await resumeService.getResumes();
      setResumes(response.resumes);
    } catch (err: any) {
      setError(err.message || 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (resume: Resume) => {
    setResumeToDelete(resume);
    setDeleteDialogOpen(true);
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
      setError(err.message || 'Failed to delete resume');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'extraction_failed':
        return <ErrorIcon color="error" />;
      default:
        return <HourglassEmpty color="warning" />;
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      uploaded: 'Uploaded',
      text_extracted: 'Text Extracted',
      skills_extracted: 'Skills Extracted',
      experience_parsed: 'Experience Parsed',
      education_parsed: 'Education Parsed',
      completed: 'Completed',
      extraction_failed: 'Failed',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    if (status === 'completed') return 'success';
    if (status === 'extraction_failed') return 'error';
    if (status === 'uploaded') return 'default';
    return 'warning';
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading resumes...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            My Resumes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your uploaded resumes and view extracted information
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/resumes/upload')}
        >
          Upload Resume
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Resume List */}
      {resumes.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Description sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No resumes uploaded yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload your resume to get personalized interview questions
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/resumes/upload')}
          >
            Upload Your First Resume
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {resumes.map((resume) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={resume.id}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 2 }}>
                    <Description color="primary" sx={{ mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" noWrap title={resume.filename}>
                        {resume.filename}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(resume.created_at), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                    {getStatusIcon(resume.status)}
                  </Stack>

                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Chip
                      label={getStatusLabel(resume.status)}
                      size="small"
                      color={getStatusColor(resume.status)}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Size: {formatFileSize(resume.file_size)}
                    </Typography>
                    {resume.seniority_level && (
                      <Typography variant="caption" color="text.secondary">
                        Level: {resume.seniority_level}
                      </Typography>
                    )}
                    {resume.total_experience_months && (
                      <Typography variant="caption" color="text.secondary">
                        Experience: {Math.floor(resume.total_experience_months / 12)} years
                      </Typography>
                    )}
                  </Stack>

                  {resume.skills && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Skills Extracted:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {Object.values(resume.skills).flat().slice(0, 3).map((skill, idx) => (
                          <Chip key={idx} label={skill} size="small" variant="outlined" />
                        ))}
                        {Object.values(resume.skills).flat().length > 3 && (
                          <Chip
                            label={`+${Object.values(resume.skills).flat().length - 3} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => navigate(`/resumes/${resume.id}`)}
                  >
                    View Details
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteClick(resume)}
                  >
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Resume?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{resumeToDelete?.filename}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ResumeListPage;
