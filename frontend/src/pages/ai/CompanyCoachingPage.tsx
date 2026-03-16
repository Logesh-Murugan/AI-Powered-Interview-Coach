/**
 * Company Coaching Page
 * Create and view AI-powered company-specific interview coaching sessions
 * 
 * Requirements: INT-1.9
 */

import { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
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
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Card,
} from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import {
  Business,
  Add,
  ExpandMore,
  CheckCircle,
  TipsAndUpdates,
  Star,
  QuestionAnswer,
  Checklist,
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

const TARGET_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Scientist',
  'Machine Learning Engineer',
  'Product Manager',
  'UI/UX Designer',
  'QA Engineer',
  'Cloud Architect',
  'Security Engineer',
  'Mobile Developer',
  'Data Engineer',
  'Technical Lead',
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`coaching-tabpanel-${index}`}
      aria-labelledby={`coaching-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function CompanyCoachingPage() {
  const dispatch = useAppDispatch();
  const { userSessions, currentSession, isLoading, isGenerating, error } = useAppSelector(
    (state) => state.companyCoaching
  );

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
    if (!companyName || !targetRole) {
      return;
    }

    await dispatch(
      createSession({
        company_name: companyName,
        target_role: targetRole,
      })
    );

    setShowCreateForm(false);
    setCompanyName('');
    setTargetRole('');
    setTabValue(0);
  };

  const handleViewDetails = async (session: typeof userSessions[0]) => {
    const result = await dispatch(fetchSession(session.id));
    if (!fetchSession.fulfilled.match(result)) {
      return;
    }

    const fullSession = result.payload;
    dispatch(setCurrentSession(fullSession));
    setTabValue(0);

    // Safe initialization of checklist state with null checks
    const initialChecklistState: Record<number, boolean> = {};
    const checklist = fullSession?.pre_interview_checklist ?? [];
    checklist.forEach((_, idx) => {
      initialChecklistState[idx] = false;
    });
    setChecklistState(initialChecklistState);
  };

  const handleChecklistToggle = (index: number) => {
    setChecklistState((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const uniqueCompanies = Array.from(new Set(userSessions.map((s) => s.company_name))).sort();

  const filteredSessions = companyFilter
    ? userSessions.filter((s) => s.company_name === companyFilter)
    : userSessions;

  const getDifficultyColor = (difficulty: string): 'success' | 'warning' | 'error' => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
              Company Coaching
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI-powered company-specific interview preparation
            </Typography>
          </Box>
          {!showCreateForm && (
            <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreateForm(true)}>
              New Session
            </Button>
          )}
        </Box>

        {error && (
          <ErrorAlert
            message={error}
            onRetry={() => dispatch(fetchUserSessions())}
            onDismiss={() => dispatch(clearError())}
          />
        )}

        {showCreateForm && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Create Coaching Session
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Get personalized interview coaching for a specific company and role
            </Typography>

            <Stack spacing={3}>
              <TextField
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                fullWidth
                required
                placeholder="e.g., Google, Amazon, Microsoft"
              />

              <TextField
                select
                label="Target Role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                fullWidth
                required
              >
                {TARGET_ROLES.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </TextField>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleCreateSession}
                  disabled={isGenerating || !companyName || !targetRole}
                  startIcon={isGenerating ? <LoadingSpinner size="small" /> : <Add />}
                  fullWidth
                >
                  {isGenerating ? 'Generating Session...' : 'Generate Coaching Session'}
                </Button>
                <Button variant="outlined" onClick={() => setShowCreateForm(false)} fullWidth>
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {isLoading && userSessions.length === 0 && (
          <LoadingSpinner variant="fullPage" text="Loading coaching sessions..." />
        )}

        {!isLoading && userSessions.length > 0 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: currentSession ? 4 : 12 }}>
              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Your Sessions ({filteredSessions.length})</Typography>
                    {uniqueCompanies.length > 1 && (
                      <TextField
                        select
                        size="small"
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                        sx={{ minWidth: 150 }}
                        label="Filter by Company"
                      >
                        <MenuItem value="">All Companies</MenuItem>
                        {uniqueCompanies.map((company) => (
                          <MenuItem key={company} value={company}>
                            {company}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  </Box>

                  <Divider />

                  <Stack spacing={2}>
                    {filteredSessions.map((session) => (
                      <CoachingSessionCard
                        key={session.id}
                        session={session}
                        onViewDetails={() => void handleViewDetails(session)}
                      />
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            </Grid>

            {currentSession && (
              <Grid size={{ xs: 12, md: 8 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom>
                    {currentSession.company_name} - {currentSession.target_role}
                  </Typography>

                  <Tabs
                    value={tabValue}
                    onChange={(_, newValue) => setTabValue(newValue)}
                    sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                  >
                    <Tab label="Company Overview" />
                    <Tab label="Predicted Questions" />
                    <Tab label="Checklist" />
                  </Tabs>

                  <TabPanel value={tabValue} index={0}>
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Company Culture
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {currentSession?.company_overview?.culture || 'No culture information available'}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Core Values
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {/* Safe array access with default empty array */}
                          {(currentSession?.company_overview?.values ?? []).map((value, idx) => (
                            <Chip key={idx} label={value} color="primary" />
                          ))}
                          {(!currentSession?.company_overview?.values || currentSession.company_overview.values.length === 0) && (
                            <Typography variant="body2" color="text.secondary">
                              No core values information available
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Interview Process
                        </Typography>
                        <Typography variant="body1">
                          {currentSession?.company_overview?.interview_process || 'No interview process information available'}
                        </Typography>
                      </Box>
                    </Stack>
                  </TabPanel>

                  <TabPanel value={tabValue} index={1}>
                    <Stack spacing={2}>
                      {/* Safe array access with default empty array */}
                      {(currentSession?.predicted_questions ?? []).map((q, idx) => (
                        <Accordion key={idx}>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                              <QuestionAnswer fontSize="small" />
                              <Typography sx={{ flexGrow: 1 }}>{q?.question || 'Question not available'}</Typography>
                              <Chip label={q?.difficulty || 'medium'} size="small" color={getDifficultyColor(q?.difficulty || 'medium')} />
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Stack spacing={2}>
                              <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Category
                                </Typography>
                                <Chip label={q?.category || 'General'} size="small" />
                              </Box>
                              <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                  Why This Question?
                                </Typography>
                                <Typography variant="body2">{q?.why_asked || 'No explanation available'}</Typography>
                              </Box>
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                      {(!currentSession?.predicted_questions || currentSession.predicted_questions.length === 0) && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                          No predicted questions available
                        </Typography>
                      )}
                    </Stack>
                  </TabPanel>

                  <TabPanel value={tabValue} index={2}>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Checklist color="primary" />
                        <Typography variant="h6">Pre-Interview Checklist</Typography>
                      </Stack>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={1}>
                          {/* Safe array access with default empty array */}
                          {(currentSession?.pre_interview_checklist ?? []).map((item, idx) => (
                            <FormControlLabel
                              key={idx}
                              control={
                                <Checkbox
                                  checked={checklistState[idx] || false}
                                  onChange={() => handleChecklistToggle(idx)}
                                />
                              }
                              label={item || 'Checklist item not available'}
                            />
                          ))}
                          {(!currentSession?.pre_interview_checklist || currentSession.pre_interview_checklist.length === 0) && (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                              No checklist items available
                            </Typography>
                          )}
                        </Stack>
                      </Paper>
                    </Stack>
                  </TabPanel>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}

        {!isLoading && userSessions.length === 0 && !showCreateForm && (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Business sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No Coaching Sessions Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Create your first coaching session to get company-specific interview preparation
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreateForm(true)} size="large">
              Create Coaching Session
            </Button>
          </Paper>
        )}
      </Box>
    </Container>
  );
}

export default CompanyCoachingPage;
