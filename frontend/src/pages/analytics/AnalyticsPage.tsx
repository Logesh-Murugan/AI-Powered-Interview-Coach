import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { TrendingUp, BarChart, CompareArrows } from '@mui/icons-material';
import analyticsService, {
  AnalyticsOverview,
  PerformanceComparison,
} from '../../services/analyticsService';
import AnalyticsOverviewSection from '../../components/analytics/AnalyticsOverviewSection';
import ScoreChart from '../../components/analytics/ScoreChart';
import CategoryPerformance from '../../components/analytics/CategoryPerformance';
import StrengthsWeaknesses from '../../components/analytics/StrengthsWeaknesses';
import PracticeRecommendations from '../../components/analytics/PracticeRecommendations';
import PerformanceComparisonSection from '../../components/analytics/PerformanceComparisonSection';

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
        console.warn('Performance comparison not available:', compErr);
        setComparisonError(
          compErr.response?.data?.detail || 
          'Performance comparison requires a target role and completed interviews'
        );
      }
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.response?.data?.detail || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Performance Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your progress, identify strengths, and get personalized recommendations
        </Typography>
      </Box>

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
          <Grid item xs={12} lg={6}>
            <CategoryPerformance categories={analytics.category_performance} />
          </Grid>
          <Grid item xs={12} lg={6}>
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
          <Alert severity="info">
            {comparisonError || 'Performance comparison not available'}
          </Alert>
        )}
      </TabPanel>
    </Container>
  );
};

export default AnalyticsPage;
