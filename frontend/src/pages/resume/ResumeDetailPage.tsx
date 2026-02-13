/**
 * Resume Detail Page
 * Display detailed resume information with extracted data
 * 
 * Requirements: 6.7-6.10, 7.1-7.10, 8.1-8.10, 9.1-9.10, 10.1-10.7
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
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
  Code,
  Psychology,
  Build,
  Language,
  CheckCircle,
  HourglassEmpty,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { resumeService, type Resume } from '../../services/resumeService';
import { format } from 'date-fns';

function ResumeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadResume(parseInt(id));
    }
  }, [id]);

  const loadResume = async (resumeId: number) => {
    setLoading(true);
    setError(null);

    try {
      const data = await resumeService.getResumeById(resumeId);
      setResume(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load resume');
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
      setError(err.message || 'Failed to delete resume');
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

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDuration = (months: number): string => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading resume details...
        </Typography>
      </Container>
    );
  }

  if (error || !resume) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Resume not found'}</Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/resumes')}
          sx={{ mt: 2 }}
        >
          Back to Resumes
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/resumes')}
          sx={{ mb: 2 }}
        >
          Back to Resumes
        </Button>

        <Paper elevation={3} sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" gutterBottom>
                {resume.filename}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <Chip
                  icon={getStatusIcon(resume.status)}
                  label={getStatusLabel(resume.status)}
                  color={resume.status === 'completed' ? 'success' : 'default'}
                />
                <Typography variant="body2" color="text.secondary">
                  Uploaded: {format(new Date(resume.created_at), 'MMM dd, yyyy HH:mm')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Size: {formatFileSize(resume.file_size)}
                </Typography>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                href={resume.file_url}
                target="_blank"
              >
                Download
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>

      {/* Summary Stats */}
      {(resume.seniority_level || resume.total_experience_months) && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {resume.seniority_level && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Seniority Level
                  </Typography>
                  <Typography variant="h5">{resume.seniority_level}</Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
          {resume.total_experience_months && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Experience
                  </Typography>
                  <Typography variant="h5">
                    {formatDuration(resume.total_experience_months)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
          {resume.skills && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Skills Identified
                  </Typography>
                  <Typography variant="h5">
                    {Object.values(resume.skills).flat().length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
          {resume.experience && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Work Experience
                  </Typography>
                  <Typography variant="h5">{resume.experience.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Skills Section */}
      {resume.skills && Object.keys(resume.skills).length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            <Code sx={{ mr: 1, verticalAlign: 'middle' }} />
            Skills
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            {resume.skills.technical_skills && resume.skills.technical_skills.length > 0 && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Code fontSize="small" color="primary" />
                    <Typography variant="subtitle1">Technical Skills</Typography>
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {resume.skills.technical_skills.map((skill, idx) => (
                      <Chip key={idx} label={skill} color="primary" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}

            {resume.skills.soft_skills && resume.skills.soft_skills.length > 0 && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Psychology fontSize="small" color="secondary" />
                    <Typography variant="subtitle1">Soft Skills</Typography>
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {resume.skills.soft_skills.map((skill, idx) => (
                      <Chip key={idx} label={skill} color="secondary" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}

            {resume.skills.tools && resume.skills.tools.length > 0 && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Build fontSize="small" color="success" />
                    <Typography variant="subtitle1">Tools & Technologies</Typography>
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {resume.skills.tools.map((tool, idx) => (
                      <Chip key={idx} label={tool} color="success" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}

            {resume.skills.languages && resume.skills.languages.length > 0 && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Language fontSize="small" color="info" />
                    <Typography variant="subtitle1">Languages</Typography>
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {resume.skills.languages.map((lang, idx) => (
                      <Chip key={idx} label={lang} color="info" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Experience Timeline */}
      {resume.experience && resume.experience.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            <Work sx={{ mr: 1, verticalAlign: 'middle' }} />
            Work Experience
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Timeline position="right">
            {resume.experience.map((exp, idx) => (
              <TimelineItem key={idx}>
                <TimelineOppositeContent color="text.secondary">
                  <Typography variant="body2">
                    {format(new Date(exp.start_date), 'MMM yyyy')} -{' '}
                    {exp.end_date ? format(new Date(exp.end_date), 'MMM yyyy') : 'Present'}
                  </Typography>
                  <Typography variant="caption">
                    {formatDuration(exp.duration_months)}
                  </Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color="primary" />
                  {idx < resume.experience!.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="h6">{exp.job_title}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {exp.company_name}
                  </Typography>
                  <Typography variant="body2">{exp.description}</Typography>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </Paper>
      )}

      {/* Education Section */}
      {resume.education && resume.education.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            <School sx={{ mr: 1, verticalAlign: 'middle' }} />
            Education
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <List>
            {resume.education.map((edu, idx) => (
              <ListItem key={idx} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <ListItemText
                  primary={
                    <Typography variant="h6">
                      {edu.degree_type} in {edu.field_of_study}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        {edu.institution_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Graduated: {edu.graduation_year}
                      </Typography>
                    </>
                  }
                />
                {idx < resume.education!.length - 1 && <Divider sx={{ width: '100%', mt: 2 }} />}
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Extracted Text (Collapsible) */}
      {resume.extracted_text && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Extracted Text
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box
            sx={{
              maxHeight: 300,
              overflow: 'auto',
              bgcolor: 'grey.50',
              p: 2,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
            }}
          >
            {resume.extracted_text}
          </Box>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Resume?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{resume.filename}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
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

export default ResumeDetailPage;
