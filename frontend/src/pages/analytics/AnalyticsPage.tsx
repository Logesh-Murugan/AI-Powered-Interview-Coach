/**
 * Premium Analytics Page
 * High-end AI data command center for performance tracking
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  alpha,
  useTheme,
  Stack,
  Divider,
} from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { TrendingUp, BarChart, CompareArrows, Download, Assessment, Timeline, Hub } from '@mui/icons-material';
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
import { GlassCard, GradientButton, GradientText } from '../../components/common/PremiumComponents';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`analytics-tabpanel-${index}`} {...other}>
      <AnimatePresence mode="wait">
        {value === index && (
          <MotionBox
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            sx={{ py: 4 }}
          >
            {children}
          </MotionBox>
        )}
      </AnimatePresence>
    </div>
  );
}

const AnalyticsPage: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [comparison, setComparison] = useState<PerformanceComparison | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const analyticsData = await analyticsService.getAnalyticsOverview(forceRefresh);
      setAnalytics(analyticsData);
      try {
        const comparisonData = await analyticsService.getPerformanceComparison(forceRefresh);
        setComparison(comparisonData);
        setComparisonError(null);
      } catch (compErr: any) {
        setComparisonError('COMPARISON LATTICE DATA UNAVAILABLE');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'DATA SYNCHRONIZATION FAILED');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      setExporting(true);
      const response = await api.get('/export/analytics', { responseType: 'blob' });
      const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics_dossier_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export fail:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingSpinner variant="fullPage" />;
  if (error) return <Box sx={{ p: 4 }}><ErrorAlert message={error} onRetry={loadAnalytics} /></Box>;
  if (!analytics) return <Box sx={{ p: 4 }}><ErrorAlert message="NO DATA VECTORS FOUND. COMPLETE A SESSION TO INITIALIZE ANALYTICS." /></Box>;

  return (
    <Box sx={{ pb: 8 }}>
      {/* Premium Header */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontFamily: 'Orbitron' }}>
             DATA <GradientText>COMMAND CENTER</GradientText>
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
             Synchronized performance telemetry and growth mapping.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            onClick={() => loadAnalytics(true)} 
            startIcon={<TrendingUp />} 
            sx={{ borderRadius: 3, fontWeight: 700, borderColor: alpha(theme.palette.primary.main, 0.3) }}
          >
            RECALIBRATE
          </Button>
          <GradientButton
            startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <Download />}
            onClick={handleExportReport}
            disabled={exporting}
            size="large"
          >
            {exporting ? 'EXPORTING...' : 'EXPORT DOSSIER'}
          </GradientButton>
        </Stack>
      </MotionBox>

      {/* Tabs Hub */}
      <GlassCard sx={{ mb: 4, p: 0, borderRadius: 4, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant="fullWidth"
          sx={{
            '& .MuiTabs-indicator': { height: 4, borderRadius: '2px 2px 0 0' },
            '& .MuiTab-root': { py: 3, fontWeight: 900, fontFamily: 'Orbitron', letterSpacing: '0.1em', fontSize: '0.8rem' }
          }}
        >
          <Tab icon={<Timeline sx={{ mb: 1 }} />} label="TELEMERY" />
          <Tab icon={<Hub sx={{ mb: 1 }} />} label="CAPABILITIES" />
          <Tab icon={<CompareArrows sx={{ mb: 1 }} />} label="COMPARISON" disabled={!comparison} />
        </Tabs>
      </GlassCard>

      {/* Analytics Content */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={4}>
           <Grid size={{ xs: 12 }}>
              <AnalyticsOverviewSection analytics={analytics} />
           </Grid>
            <Grid size={{ xs: 12, lg: 8 }}>
               <ScoreChart analytics={analytics} />
            </Grid>

           <Grid size={{ xs: 12, lg: 4 }}>
              <PracticeRecommendations recommendations={analytics.practice_recommendations} />
           </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={4}>
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
            <Grid size={{ xs: 12 }}>
               <ScoreChart analytics={analytics} />
            </Grid>

        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {comparison ? (
          <PerformanceComparisonSection comparison={comparison} />
        ) : (
          <GlassCard sx={{ p: 6, textAlign: 'center' }}>
            <CompareArrows sx={{ fontSize: 80, color: alpha(theme.palette.divider, 0.1), mb: 3 }} />
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, fontFamily: 'Orbitron' }}>COMPARISON LATTICE LOCKED</Typography>
            <Typography variant="body1" color="text.secondary">{comparisonError}</Typography>
          </GlassCard>
        )}
      </TabPanel>
    </Box>
  );
};

export default AnalyticsPage;
