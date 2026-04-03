/**
 * Premium Interview Start Page
 * High-end AI session configuration terminal
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  OutlinedInput,
  Stack,
  alpha,
  useTheme,
  Grid,
  Divider,
} from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { 
  PlayArrow, 
  Psychology, 
  Settings as SettingsIcon,
  Tune as DifficultyIcon,
  Layers as CategoryIcon,
} from '@mui/icons-material';
import apiService from '../../services/api.service';
import logger from '../../utils/logger';
import { GlassCard, GradientButton, GradientText } from '../../components/common/PremiumComponents';
import { motion } from 'framer-motion';

const ROLES = [
  'Software Engineer', 'Product Manager', 'Data Scientist', 'Marketing Manager',
  'Finance Analyst', 'UX Designer', 'DevOps Engineer', 'Business Analyst',
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert'];

const CATEGORIES = [
  'Technical', 'Behavioral', 'Domain_Specific', 'System_Design', 'Coding',
];

const MotionBox = motion.create(Box);

function InterviewStartPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [formData, setFormData] = useState({
    role: '',
    difficulty: 'Medium',
    question_count: 5,
    categories: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role) { setError('ROLE IDENTIFICATION REQUIRED'); return; }
    setLoading(true);
    try {
      const response = await apiService.post('/interviews', formData);
      const { session_id } = response.data as { session_id: number };
      navigate(`/interviews/${session_id}/session`);
    } catch (err: any) {
      logger.error('Error:', err);
      setError(err.message || 'LATTICE INITIALIZATION FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 8, maxWidth: 900, mx: 'auto' }}>
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ mb: 6, textAlign: 'center' }}
      >
        <Typography variant="h3" sx={{ mb: 1, fontFamily: 'Orbitron' }}>
           INITIALIZE <GradientText>INTERVIEW SIMULATION</GradientText>
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
           Calibrate your parameters for a specialized AI-driven simulation.
        </Typography>
      </MotionBox>

      {error && <ErrorAlert message={error} sx={{ mb: 4 }} onRetry={() => void handleSubmit(new Event('submit') as any)} />}

      <GlassCard sx={{ p: 5, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: 0, right: 0, p: 3, opacity: 0.1, color: 'primary.main' }}>
           <SettingsIcon sx={{ fontSize: 120 }} />
        </Box>

        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            {/* Sector 1: Role Identification */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mb: 2, display: 'block', letterSpacing: '0.2em' }}>
                <Psychology sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 1 }} /> PHASE 01: ROLE IDENTIFICATION
              </Typography>
              <TextField
                select
                fullWidth
                label="TARGET POSITION"
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                required
                InputProps={{
                  sx: { 
                    borderRadius: 3, 
                    fontWeight: 700, 
                    fontFamily: 'Orbitron',
                    '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 2 }
                  }
                }}
              >
                {ROLES.map((role) => (
                  <MenuItem key={role} value={role} sx={{ fontWeight: 600 }}>{role.toUpperCase()}</MenuItem>
                ))}
              </TextField>
            </Box>

            <Grid container spacing={4}>
              {/* Sector 2: Calibration */}
              <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'secondary.main', mb: 2, display: 'block', letterSpacing: '0.2em' }}>
                    <DifficultyIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 1 }} /> PHASE 02: CALIBRATION
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    label="DIFFICULTY MAGNITUDE"
                    value={formData.difficulty}
                    onChange={(e) => handleChange('difficulty', e.target.value)}
                    InputProps={{ sx: { borderRadius: 3, fontWeight: 700, fontFamily: 'Orbitron' } }}
                  >
                    {DIFFICULTIES.map((diff) => (
                      <MenuItem key={diff} value={diff} sx={{ fontWeight: 600 }}>{diff.toUpperCase()}</MenuItem>
                    ))}
                  </TextField>
              </Grid>

              {/* Sector 3: Scope */}
              <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'info.main', mb: 2, display: 'block', letterSpacing: '0.2em' }}>
                    VECTOR COUNT
                  </Typography>
                  <TextField
                    type="number"
                    fullWidth
                    label="TOTAL QUESTIONS"
                    value={formData.question_count}
                    onChange={(e) => handleChange('question_count', parseInt(e.target.value))}
                    InputProps={{ 
                      sx: { borderRadius: 3, fontWeight: 900, fontFamily: 'Orbitron' }
                    }}
                    inputProps={{ min: 1, max: 20 }}
                    helperText="MAX LIMIT: 20 VECTORS"
                  />
              </Grid>
            </Grid>

            {/* Sector 4: Domain Specialization */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main', mb: 2, display: 'block', letterSpacing: '0.2em' }}>
                <CategoryIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 1 }} /> PHASE 03: DOMAIN SPECIALIZATION
              </Typography>
              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: 800 }}>MODULE CATEGORIES (OPTIONAL)</InputLabel>
                <Select
                  multiple
                  value={formData.categories}
                  onChange={(e) => handleChange('categories', e.target.value as string[])}
                  input={<OutlinedInput label="MODULE CATEGORIES (OPTIONAL)" sx={{ borderRadius: 3 }} />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={value.replace('_', ' ').toUpperCase()} size="small" color="primary" sx={{ fontWeight: 800, borderRadius: 1 }} />
                      ))}
                    </Box>
                  )}
                >
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat} sx={{ fontWeight: 600 }}>{cat.replace('_', ' ').toUpperCase()}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Divider sx={{ opacity: 0.1 }} />

            <GradientButton 
               type="submit" 
               size="large" 
               fullWidth 
               disabled={loading}
               startIcon={loading ? <Box sx={{ display: 'flex' }}><LoadingSpinner size="small" /></Box> : <PlayArrow />}
               sx={{ py: 2, fontSize: '1.2rem', fontFamily: 'Orbitron' }}
            >
               {loading ? 'INITIALIZING LATTICE...' : 'LAUNCH SIMULATION'}
            </GradientButton>
          </Stack>
        </form>
      </GlassCard>
    </Box>
  );
}

export default InterviewStartPage;
