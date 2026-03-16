import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Alert,
  Grid,
  Paper,
  Tabs,
  Tab,
  Button,
  CircularProgress,
} from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { TrendingUp, BarChart, CompareArrows, Download } from '@mui/icons-material';
import analyticsService, {
  type AnalyticsOverview,
  type PerformanceComparison,
} from '../../services/analyticsService';
import AnalyticsOverviewSection from '../../components/analytics/AnalyticsOverviewSection';
import ScoreChart from '../../components/analytics/ScoreChart';
import CategoryPerformance from '../../components/analytics/CategoryPerformance';
import StrengthsWeaknesses from '../../components/analytics/StrengthsWeaknesses';
import PracticeRecommendations from '../../components/analytics/PracticeRecommendations';
import PerformanceComparisonSection from '../../components/analytics/PerformanceComparisonSection';
import api from '../../services/api.service';

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AnalyticsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [comparison, setComparison] = useState<PerformanceComparison | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load analytics overview
      const analyticsData = await analyticsService.getAnalyticsOverview();
      setAnalytics(analyticsData);

      // Try to load performance comparison (may fail if user has no target role or sessions)
      try {
        const comparisonData = await analyticsService.getPerformanceComparison();
        setComparison(comparisonData);
        setComparisonError(null);
      } catch (compErr: any) {
        // Silently handle comparison errors - this is expected for users without target role
        const errorDetail = compErr.response?.data?.detail || '';
        if (errorDetail.includes('target role')) {
          setComparisonError(
            'To see how you compare with others, please set your target role in your profile settings.'
          );
        } else if (errorDetail.includes('complete at least one')) {
          setComparisonError(
            'Complete at least one interview session to see performance comparisons.'
          );
        } else if (errorDetail.includes('Not enough users')) {
          setComparisonError(
            'Not enough users in your cohort yet for meaningful comparison. Check back later!'
          );
        } else {
          setComparisonError(
            'Performance comparison requires a target role and completed interviews.'
          );
        }
      }
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.response?.data?.detail || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExportReport = async () => {
    try {
      setExporting(true);
      setExportError(null);

      // Call export endpoint
      const response = await api.get('/export/analytics', {
        responseType: 'blob', // Important for file download
      });

      // Create blob from response
      const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      link.download = `analytics_report_${date}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exporting report:', err);
      setExportError(err.response?.data?.detail || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LoadingSpinner variant="fullPage" size="large" text="Loading analytics..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <ErrorAlert
          message={error}
          onRetry={loadAnalytics}
        />
      </Container>
    );
  }

  if (!analytics) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">
          No analytics data available. Complete some interview sessions to see your performance metrics.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Performance Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your progress, identify strengths, and get personalized recommendations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <Download />}
          onClick={handleExportReport}
          disabled={exporting || !analytics}
        >
          {exporting ? 'Exporting...' : 'Export Report'}
        </Button>
      </Box>

      {/* Export Error Alert */}
      {exportError && (
        <Alert severity="error" onClose={() => setExportError(null)} sx={{ mb: 3 }}>
          {exportError}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="analytics tabs"
          variant="fullWidth"
        >
          <Tab
            icon={<TrendingUp />}
            label="Overview"
            id="analytics-tab-0"
            aria-controls="analytics-tabpanel-0"
          />
          <Tab
            icon={<BarChart />}
            label="Performance"
            id="analytics-tab-1"
            aria-controls="analytics-tabpanel-1"
          />
          <Tab
            icon={<CompareArrows />}
            label="Comparison"
            id="analytics-tab-2"
            aria-controls="analytics-tabpanel-2"
            disabled={!comparison}
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {/* Overview Tab */}
        <AnalyticsOverviewSection analytics={analytics} />
        
        <Box sx={{ mt: 4 }}>
          <ScoreChart data={analytics.score_over_time} />
        </Box>

        <Box sx={{ mt: 4 }}>
          <PracticeRecommendations recommendations={analytics.practice_recommendations} />
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Performance Tab */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <CategoryPerformance categories={analytics.category_performance} />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <StrengthsWeaknesses
              strengths={analytics.top_5_strengths}
              weaknesses={analytics.top_5_weaknesses}
              categoryPerformance={analytics.category_performance}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <ScoreChart data={analytics.score_over_time} />
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Comparison Tab */}
        {comparison ? (
          <PerformanceComparisonSection comparison={comparison} />
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <CompareArrows sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Performance Comparison Not Available
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {comparisonError || 'Performance comparison not available'}
            </Typography>
            {comparisonError?.includes('target role') && (
              <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Note:</strong> Performance comparison requires a target role to be set in your profile.
                </Typography>
                <Typography variant="body2">
                  This feature will be available once you set your target role (e.g., "Software Engineer", "Data Scientist").
                  Profile editing functionality is coming soon!
                </Typography>
              </Alert>
            )}
          </Paper>
        )}
      </TabPanel>
    </Container>
  );
};

export default AnalyticsPage;
