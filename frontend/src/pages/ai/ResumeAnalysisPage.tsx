/**
 * Resume Analysis Page - Redesigned for AI Agent Response
 * Full analysis view with enhanced UI/UX for AI-generated insights
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
import { useAppDispatch, useAppSelector } from '../../store';
import type { RootState } from '../../store';
import { fetchAnalysis, fetchHistory } from '../../store/slices/resumeAnalysisSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import SkillGapsSection from '../../components/ai/SkillGapsSection';
import ImprovementRoadmap from '../../components/ai/ImprovementRoadmap';
import { format } from 'date-fns';
import { clearError } from '../../store/slices/resumeAnalysisSlice';

// TypeScript interfaces for better type safety
interface SkillGap {
  gap: string;
  recommendations: string[];
}

interface ImprovementRoadmapData {
  short_term?: string[];
  long_term?: string[];
  milestones?: Array<{
    skill: string;
    duration: string;
  }>;
  timeline_weeks?: number;
  note?: string;
}

interface SkillInventory {
  technical_skills?: string[];
  soft_skills?: string[];
  tools?: string[];
  languages?: string[];
}

interface ExperienceTimeline {
  total_years: number;
  seniority_level: string;
  companies?: string[];
  roles?: string[];
  analysis?: string;
}

interface AnalysisData {
  skill_inventory: SkillInventory;
  experience_timeline: ExperienceTimeline;
  skill_gaps: SkillGap[] | any; // Allow legacy format
  improvement_roadmap: ImprovementRoadmapData | any; // Allow legacy format
  analysis_summary?: string;
  fallback_used?: boolean;
}

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
  const [pollAttempts, setPollAttempts] = useState(0);

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

  // Poll for analysis while waiting (handles initial 404/in-progress)
  useEffect(() => {
    if (!resumeId || currentAnalysis || pollAttempts >= 12) return; // Increased from 6 to 12
    if (isLoading) return; // wait for the current request to finish

    const id = parseInt(resumeId);
    const timer = setTimeout(() => {
      setPollAttempts((p) => p + 1);
      dispatch(fetchAnalysis(id));
    }, pollAttempts < 6 ? 3000 : 5000); // Faster polling initially, then slower

    return () => clearTimeout(timer);
  }, [resumeId, currentAnalysis, isLoading, pollAttempts, dispatch]);

  // Reset polling when analysis arrives
  useEffect(() => {
    if (currentAnalysis) {
      setPollAttempts(0);
    }
  }, [currentAnalysis]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRetry = () => {
    if (resumeId) {
      dispatch(clearError());
      dispatch(fetchAnalysis(parseInt(resumeId)));
    }
  };

  if (isLoading) {
    return <LoadingSpinner variant="fullPage" text="Loading AI analysis..." />;
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
        <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
          <Psychology sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No AI Analysis Available Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Generate an AI-powered analysis to get personalized insights on your skills, experience, and career growth opportunities.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/resumes/${resumeId}`)}
            size="large"
          >
            Go to Resume Details
          </Button>
        </Paper>
      </Container>
    );
  }

  const { analysis_data, analyzed_at, from_cache, execution_time_ms, status } = currentAnalysis;
  const { skill_inventory, experience_timeline, skill_gaps, improvement_roadmap } = analysis_data;
  const analysisHistory = resumeId ? history[parseInt(resumeId)] || [] : [];

  // Debug logging to help identify data structure issues
  useEffect(() => {
    if (analysis_data) {
      console.log('=== ANALYSIS DATA DEBUG ===');
      console.log('Full analysis_data:', analysis_data);
      console.log('skill_gaps:', skill_gaps);
      console.log('skill_gaps type:', typeof skill_gaps);
      console.log('skill_gaps is array?:', Array.isArray(skill_gaps));
      console.log('improvement_roadmap:', improvement_roadmap);
      console.log('improvement_roadmap type:', typeof improvement_roadmap);
      if (skill_gaps && Array.isArray(skill_gaps) && skill_gaps.length > 0) {
        console.log('First skill gap:', skill_gaps[0]);
        console.log('First skill gap type:', typeof skill_gaps[0]);
      }
    }
  }, [analysis_data]);

  // Check if this is AI-generated or fallback
  const isAIGenerated = status === 'success' && !(analysis_data as any).fallback_used;

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
          AI Analysis
        </Typography>
      </Breadcrumbs>

      {/* Header with AI Badge */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 3, 
          background: isAIGenerated 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            : undefined, 
          color: isAIGenerated ? 'white' : undefined 
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
              <Psychology sx={{ fontSize: 32 }} />
              <Typography variant="h4">
                Resume Analysis
              </Typography>
              {isAIGenerated && (
                <Chip 
                  label="🤖 AI Generated" 
                  color="success" 
                  variant="filled"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              )}
              {(analysis_data as any).fallback_used && (
                <Chip 
                  label="⚠️ Fallback Analysis" 
                  color="warning" 
                  variant="outlined"
                />
              )}
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Typography variant="body2" sx={{ opacity: isAIGenerated ? 0.9 : 0.7 }}>
                Analyzed: {format(new Date(analyzed_at), 'MMM dd, yyyy HH:mm')}
              </Typography>
              {from_cache && (
                <Chip 
                  label="From Cache" 
                  size="small" 
                  sx={{ 
                    bgcolor: isAIGenerated ? 'rgba(255,255,255,0.15)' : undefined,
                    color: isAIGenerated ? 'white' : undefined
                  }}
                />
              )}
              <Chip
                label={`⚡ ${execution_time_ms}ms`}
                size="small"
                sx={{ 
                  bgcolor: isAIGenerated ? 'rgba(255,255,255,0.15)' : undefined,
                  color: isAIGenerated ? 'white' : undefined
                }}
              />
            </Stack>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/resumes/${resumeId}`)}
            sx={{ 
              color: isAIGenerated ? 'white' : undefined,
              borderColor: isAIGenerated ? 'rgba(255,255,255,0.5)' : undefined,
              '&:hover': {
                borderColor: isAIGenerated ? 'white' : undefined,
                bgcolor: isAIGenerated ? 'rgba(255,255,255,0.1)' : undefined
              }
            }}
          >
            Back
          </Button>
        </Stack>
      </Paper>

      {/* Analysis Summary Card */}
      {(analysis_data as any).analysis_summary && (
        <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.lighter' }}>
          <Typography variant="h6" gutterBottom color="primary.main">
            🧠 AI Analysis Summary
          </Typography>
          <Typography variant="body1">
            {(analysis_data as any).analysis_summary}
          </Typography>
        </Paper>
      )}

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
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Technical Skills */}
              {skill_inventory.technical_skills && skill_inventory.technical_skills.length > 0 && (
                <Card sx={{ border: '2px solid', borderColor: 'primary.light' }}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <Code color="primary" />
                      <Typography variant="h6">Technical Skills</Typography>
                      <Chip label={skill_inventory.technical_skills.length} size="small" color="primary" />
                    </Stack>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {skill_inventory.technical_skills.map((skill: string, idx: number) => (
                        <Chip key={idx} label={String(skill)} color="primary" variant="outlined" />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Soft Skills */}
              {skill_inventory.soft_skills && skill_inventory.soft_skills.length > 0 && (
                <Card sx={{ border: '2px solid', borderColor: 'secondary.light' }}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <Psychology color="secondary" />
                      <Typography variant="h6">Soft Skills</Typography>
                      <Chip label={skill_inventory.soft_skills.length} size="small" color="secondary" />
                    </Stack>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {skill_inventory.soft_skills.map((skill: string, idx: number) => (
                        <Chip key={idx} label={String(skill)} color="secondary" variant="outlined" />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Tools */}
              {skill_inventory.tools && skill_inventory.tools.length > 0 && (
                <Card sx={{ border: '2px solid', borderColor: 'success.light' }}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <Build color="success" />
                      <Typography variant="h6">Tools & Technologies</Typography>
                      <Chip label={skill_inventory.tools.length} size="small" color="success" />
                    </Stack>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {skill_inventory.tools.map((tool: string, idx: number) => (
                        <Chip key={idx} label={String(tool)} color="success" variant="outlined" />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Languages */}
              {skill_inventory.languages && skill_inventory.languages.length > 0 && (
                <Card sx={{ border: '2px solid', borderColor: 'info.light' }}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <LanguageIcon color="info" />
                      <Typography variant="h6">Languages</Typography>
                      <Chip label={skill_inventory.languages.length} size="small" color="info" />
                    </Stack>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {skill_inventory.languages.map((lang: string, idx: number) => (
                        <Chip key={idx} label={String(lang)} color="info" variant="outlined" />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* Empty State */}
            {(!skill_inventory.technical_skills || skill_inventory.technical_skills.length === 0) &&
             (!skill_inventory.soft_skills || skill_inventory.soft_skills.length === 0) &&
             (!skill_inventory.tools || skill_inventory.tools.length === 0) &&
             (!skill_inventory.languages || skill_inventory.languages.length === 0) && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No skills were identified in this analysis. This may indicate the resume needs more detailed skill descriptions.
              </Alert>
            )}
          </Box>
        </TabPanel>

        {/* Experience Timeline Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ px: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'primary.lighter', borderRadius: 2, border: '2px solid', borderColor: 'primary.light' }}>
                    <Typography variant="h3" color="primary.main" fontWeight="bold">
                      {Math.round(experience_timeline.total_years * 10) / 10}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      Years Experience
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'secondary.lighter', borderRadius: 2, border: '2px solid', borderColor: 'secondary.light' }}>
                    <Typography variant="h5" color="secondary.main" fontWeight="bold">
                      {experience_timeline.seniority_level}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      Seniority Level
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'success.lighter', borderRadius: 2, border: '2px solid', borderColor: 'success.light' }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {experience_timeline.companies?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      Companies
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'info.lighter', borderRadius: 2, border: '2px solid', borderColor: 'info.light' }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {experience_timeline.roles?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      Roles
                    </Typography>
                  </Box>
                </Box>

                {experience_timeline.analysis && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Alert severity="info" icon={<Psychology />} sx={{ bgcolor: 'primary.lighter' }}>
                      <Typography variant="body1">
                        <strong>🧠 AI Insight:</strong> {experience_timeline.analysis}
                      </Typography>
                    </Alert>
                  </>
                )}

                {experience_timeline.companies && experience_timeline.companies.length > 0 && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      🏢 Companies Worked At:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {experience_timeline.companies.map((company: string, idx: number) => (
                        <Chip key={idx} label={String(company)} variant="outlined" size="medium" />
                      ))}
                    </Box>
                  </>
                )}

                {experience_timeline.roles && experience_timeline.roles.length > 0 && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      👔 Roles Held:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {experience_timeline.roles.map((role: string, idx: number) => (
                        <Chip key={idx} label={String(role)} color="primary" variant="outlined" size="medium" />
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
            <ErrorBoundary>
              {/* Handle both old format (SkillGaps object) and new AI format (array of gaps) */}
              {Array.isArray(skill_gaps) ? (
                // New AI format: array of {gap, recommendations} objects
                <Box>
                  <Typography variant="h6" gutterBottom>
                    <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Skill Gaps Analysis
                  </Typography>
                  {skill_gaps.length === 0 ? (
                    <Alert severity="success">
                      Great! No skill gaps identified. Your skills are well-rounded for your target role.
                    </Alert>
                  ) : (
                    <Box sx={{ display: 'grid', gap: 2 }}>
                      {skill_gaps.map((gapItem: any, idx: number) => (
                        <Card key={idx} sx={{ border: '2px solid', borderColor: 'warning.light' }}>
                          <CardContent>
                            <Typography variant="h6" color="warning.main" gutterBottom>
                              {typeof gapItem === 'object' && gapItem.gap 
                                ? String(gapItem.gap) 
                                : `Skill Gap ${idx + 1}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Recommendations:
                            </Typography>
                            {typeof gapItem === 'object' && gapItem.recommendations ? (
                              Array.isArray(gapItem.recommendations) ? (
                                <List dense>
                                  {gapItem.recommendations.map((rec: any, recIdx: number) => (
                                    <ListItem key={recIdx} sx={{ pl: 0 }}>
                                      <ListItemText 
                                        primary={String(rec)}
                                        sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem' } }}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              ) : (
                                <Typography variant="body1">
                                  {String(gapItem.recommendations)}
                                </Typography>
                              )
                            ) : (
                              <Typography variant="body1" color="text.secondary">
                                No specific recommendations available
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Box>
              ) : (
                // Old format: SkillGaps object
                <SkillGapsSection skillGaps={skill_gaps} />
              )}
            </ErrorBoundary>
          </Box>
        </TabPanel>

        {/* Improvement Roadmap Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ px: 3 }}>
            <ErrorBoundary>
              {/* Handle both old format (ImprovementRoadmap object) and new AI format */}
              {improvement_roadmap && typeof improvement_roadmap === 'object' && 'milestones' in improvement_roadmap ? (
                // Old format: ImprovementRoadmap object with milestones array
                <ImprovementRoadmap roadmap={improvement_roadmap} />
              ) : (
                // New AI format: simple object with milestones array or other structure
                <Box>
                  <Typography variant="h6" gutterBottom>
                    <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Improvement Roadmap
                  </Typography>
                  
                  {improvement_roadmap && typeof improvement_roadmap === 'object' ? (
                    <Box>
                      {/* Handle short_term array */}
                      {(improvement_roadmap as any).short_term && Array.isArray((improvement_roadmap as any).short_term) && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                            🎯 Short-term Goals (1-3 months):
                          </Typography>
                          <Box sx={{ display: 'grid', gap: 1 }}>
                            {(improvement_roadmap as any).short_term.map((goal: any, idx: number) => (
                              <Card key={idx} sx={{ border: '1px solid', borderColor: 'primary.light', bgcolor: 'primary.lighter' }}>
                                <CardContent sx={{ py: 2 }}>
                                  <Typography variant="body1">
                                    {String(goal)}
                                  </Typography>
                                </CardContent>
                              </Card>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Handle long_term array */}
                      {(improvement_roadmap as any).long_term && Array.isArray((improvement_roadmap as any).long_term) && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                            🚀 Long-term Goals (6-12 months):
                          </Typography>
                          <Box sx={{ display: 'grid', gap: 1 }}>
                            {(improvement_roadmap as any).long_term.map((goal: any, idx: number) => (
                              <Card key={idx} sx={{ border: '1px solid', borderColor: 'secondary.light', bgcolor: 'secondary.lighter' }}>
                                <CardContent sx={{ py: 2 }}>
                                  <Typography variant="body1">
                                    {String(goal)}
                                  </Typography>
                                </CardContent>
                              </Card>
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      {/* Handle milestones array (legacy format) */}
                      {(improvement_roadmap as any).milestones && Array.isArray((improvement_roadmap as any).milestones) && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                            🎯 Learning Milestones:
                          </Typography>
                          <Box sx={{ display: 'grid', gap: 2 }}>
                            {(improvement_roadmap as any).milestones.map((milestone: any, idx: number) => (
                              <Card key={idx} sx={{ border: '2px solid', borderColor: 'primary.light' }}>
                                <CardContent>
                                  <Typography variant="h6" color="primary.main" gutterBottom>
                                    {typeof milestone === 'object' && milestone.skill 
                                      ? String(milestone.skill)
                                      : `Milestone ${idx + 1}`}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Timeline:
                                  </Typography>
                                  <Typography variant="body1">
                                    {typeof milestone === 'object' && milestone.duration 
                                      ? String(milestone.duration)
                                      : 'Duration not specified'}
                                  </Typography>
                                </CardContent>
                              </Card>
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      {/* Handle timeline_weeks */}
                      {(improvement_roadmap as any).timeline_weeks && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="body1">
                            <strong>📅 Timeline:</strong> {String((improvement_roadmap as any).timeline_weeks)} weeks total
                          </Typography>
                        </Alert>
                      )}
                      
                      {/* Handle note */}
                      {(improvement_roadmap as any).note && (
                        <Alert severity="info">
                          <Typography variant="body1">
                            {String((improvement_roadmap as any).note)}
                          </Typography>
                        </Alert>
                      )}

                      {/* Show message if no recognized structure */}
                      {!(improvement_roadmap as any).short_term && 
                       !(improvement_roadmap as any).long_term && 
                       !(improvement_roadmap as any).milestones && 
                       !(improvement_roadmap as any).timeline_weeks && 
                       !(improvement_roadmap as any).note && (
                        <Alert severity="info">
                          <Typography variant="body1">
                            Improvement roadmap data is available but in an unrecognized format.
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            Debug: {JSON.stringify(improvement_roadmap, null, 2)}
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  ) : (
                    <Alert severity="info">
                      No improvement roadmap available. Your skills already match the target role well!
                    </Alert>
                  )}
                </Box>
              )}
            </ErrorBoundary>
          </Box>
        </TabPanel>

        {/* History Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ px: 3 }}>
            <Typography variant="h6" gutterBottom>
              📊 Analysis History
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
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: analysis.status === 'success' && !analysis.analysis_data.fallback_used ? 'primary.lighter' : 'background.paper'
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body1" fontWeight="medium" component="div">
                            {format(new Date(analysis.analyzed_at), 'MMM dd, yyyy HH:mm')}
                          </Typography>
                          {analysis.from_cache && (
                            <Chip label="Cached" size="small" color="info" variant="outlined" />
                          )}
                          {analysis.status === 'success' && !analysis.analysis_data.fallback_used && (
                            <Chip label="🤖 AI Generated" size="small" color="success" variant="filled" />
                          )}
                          {analysis.analysis_data.fallback_used && (
                            <Chip label="⚠️ Fallback" size="small" color="warning" variant="outlined" />
                          )}
                        </Stack>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary" component="div">
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