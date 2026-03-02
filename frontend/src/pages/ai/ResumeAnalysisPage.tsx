/**
 * Resume Analysis Page
 * Full analysis view with tabs for different sections
 * 
 * Requirements: INT-1.5, INT-1.7
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  Alert,
  Stack,
  Chip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
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
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector, RootState } from '../../store';
import { fetchAnalysis, fetchHistory } from '../../store/slices/resumeAnalysisSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import SkillGapsSection from '../../components/ai/SkillGapsSection';
import ImprovementRoadmap from '../../components/ai/ImprovementRoadmap';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function ResumeAnalysisPage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [tabValue, setTabValue] = useState(0);

  const { currentAnalysis, history, isLoading, error } = useAppSelector(
    (state: RootState) => state.resumeAnalysis
  );

  useEffect(() => {
    if (resumeId) {
      const id = parseInt(resumeId);
      dispatch(fetchAnalysis(id));
      dispatch(fetchHistory({ resumeId: id, limit: 5 }));
    }
  }, [resumeId, dispatch]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRetry = () => {
    if (resumeId) {
      dispatch(fetchAnalysis(parseInt(resumeId)));
    }
  };

  if (isLoading) {
    return <LoadingSpinner variant="fullPage" text="Loading analysis..." />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorAlert
          message={error}
          onRetry={handleRetry}
        />
      </Container>
    );
  }

  if (!currentAnalysis) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          No analysis found. Please generate an analysis from the resume detail page.
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/resumes/${resumeId}`)}
          sx={{ mt: 2 }}
        >
          Back to Resume
        </Button>
      </Container>
    );
  }

  const { analysis_data, analyzed_at, from_cache, execution_time_ms } = currentAnalysis;
  const { skill_inventory, experience_timeline, skill_gaps, improvement_roadmap } = analysis_data;
  const analysisHistory = resumeId ? history[parseInt(resumeId)] || [] : [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/resumes')}
          sx={{ cursor: 'pointer' }}
        >
          Resumes
        </Link>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate(`/resumes/${resumeId}`)}
          sx={{ cursor: 'pointer' }}
        >
          Resume Details
        </Link>
        <Typography variant="body2" color="text.primary">
          Analysis
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" gutterBottom>
              <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
              Resume Analysis
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="body2" color="text.secondary">
                Analyzed: {format(new Date(analyzed_at), 'MMM dd, yyyy HH:mm')}
              </Typography>
              {from_cache && (
                <Chip label="From Cache" size="small" color="info" variant="outlined" />
              )}
              <Chip
                label={`${execution_time_ms}ms`}
                size="small"
                variant="outlined"
              />
            </Stack>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/resumes/${resumeId}`)}
          >
            Back
          </Button>
        </Stack>
      </Paper>

      {/* Tabs */}
      <Paper elevation={2}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab icon={<Code />} label="Skills Inventory" iconPosition="start" />
          <Tab icon={<TimelineIcon />} label="Experience Timeline" iconPosition="start" />
          <Tab icon={<Warning />} label="Skill Gaps" iconPosition="start" />
          <Tab icon={<TrendingUp />} label="Improvement Roadmap" iconPosition="start" />
          <Tab icon={<History />} label="History" iconPosition="start" />
        </Tabs>

        {/* Skills Inventory Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ px: 3 }}>
            <Grid container spacing={3}>
              {/* Technical Skills */}
              {skill_inventory.technical_skills && skill_inventory.technical_skills.length > 0 && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <Code color="primary" />
                        <Typography variant="h6">Technical Skills</Typography>
                        <Chip label={skill_inventory.technical_skills.length} size="small" />
                      </Stack>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {skill_inventory.technical_skills.map((skill: string, idx: number) => (
                          <Chip key={idx} label={skill} color="primary" variant="outlined" />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Soft Skills */}
              {skill_inventory.soft_skills && skill_inventory.soft_skills.length > 0 && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <Psychology color="secondary" />
                        <Typography variant="h6">Soft Skills</Typography>
                        <Chip label={skill_inventory.soft_skills.length} size="small" />
                      </Stack>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {skill_inventory.soft_skills.map((skill: string, idx: number) => (
                          <Chip key={idx} label={skill} color="secondary" variant="outlined" />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Tools */}
              {skill_inventory.tools && skill_inventory.tools.length > 0 && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <Build color="success" />
                        <Typography variant="h6">Tools & Technologies</Typography>
                        <Chip label={skill_inventory.tools.length} size="small" />
                      </Stack>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {skill_inventory.tools.map((tool: string, idx: number) => (
                          <Chip key={idx} label={tool} color="success" variant="outlined" />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Languages */}
              {skill_inventory.languages && skill_inventory.languages.length > 0 && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <LanguageIcon color="info" />
                        <Typography variant="h6">Languages</Typography>
                        <Chip label={skill_inventory.languages.length} size="small" />
                      </Stack>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {skill_inventory.languages.map((lang: string, idx: number) => (
                          <Chip key={idx} label={lang} color="info" variant="outlined" />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        </TabPanel>

        {/* Experience Timeline Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ px: 3 }}>
            <Card>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Experience
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {experience_timeline.total_years} years
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Seniority Level
                    </Typography>
                    <Typography variant="h5">
                      {experience_timeline.seniority_level}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Companies
                    </Typography>
                    <Typography variant="h5">
                      {experience_timeline.companies?.length || 0}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Roles
                    </Typography>
                    <Typography variant="h5">
                      {experience_timeline.roles?.length || 0}
                    </Typography>
                  </Grid>
                </Grid>

                {experience_timeline.analysis && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="body1">
                      {experience_timeline.analysis}
                    </Typography>
                  </>
                )}

                {experience_timeline.companies && experience_timeline.companies.length > 0 && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Companies Worked At:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {experience_timeline.companies.map((company: string, idx: number) => (
                        <Chip key={idx} label={company} variant="outlined" />
                      ))}
                    </Box>
                  </>
                )}

                {experience_timeline.roles && experience_timeline.roles.length > 0 && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Roles Held:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {experience_timeline.roles.map((role: string, idx: number) => (
                        <Chip key={idx} label={role} color="primary" variant="outlined" />
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Skill Gaps Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ px: 3 }}>
            <SkillGapsSection skillGaps={skill_gaps} />
          </Box>
        </TabPanel>

        {/* Improvement Roadmap Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ px: 3 }}>
            <ImprovementRoadmap roadmap={improvement_roadmap} />
          </Box>
        </TabPanel>

        {/* History Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ px: 3 }}>
            <Typography variant="h6" gutterBottom>
              Analysis History
            </Typography>
            {analysisHistory.length === 0 ? (
              <Alert severity="info">No previous analyses found.</Alert>
            ) : (
              <List>
                {analysisHistory.map((analysis: any, idx: number) => (
                  <ListItem
                    key={idx}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body1">
                            {format(new Date(analysis.analyzed_at), 'MMM dd, yyyy HH:mm')}
                          </Typography>
                          {analysis.from_cache && (
                            <Chip label="Cached" size="small" color="info" variant="outlined" />
                          )}
                        </Stack>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          Target Role: {analysis.analysis_data.skill_gaps.target_role} •
                          Match: {analysis.analysis_data.skill_gaps.match_percentage}% •
                          Execution: {analysis.execution_time_ms}ms
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
}

export default ResumeAnalysisPage;
