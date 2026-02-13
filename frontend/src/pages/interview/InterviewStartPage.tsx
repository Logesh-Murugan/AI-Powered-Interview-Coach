import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SelectChangeEvent } from '@mui/material';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  Chip,
  OutlinedInput,
  Alert,
  CircularProgress,
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import apiService from '../../services/api.service';

const ROLES = [
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'Marketing Manager',
  'Finance Analyst',
  'UX Designer',
  'DevOps Engineer',
  'Business Analyst',
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert'];

const CATEGORIES = [
  'Technical',
  'Behavioral',
  'Domain_Specific',
  'System_Design',
  'Coding',
];

interface InterviewSessionCreate {
  role: string;
  difficulty: string;
  question_count: number;
  categories?: string[];
}

function InterviewStartPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<InterviewSessionCreate>({
    role: '',
    difficulty: 'Medium',
    question_count: 5,
    categories: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof InterviewSessionCreate, value: string | number | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleCategoryChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    handleChange('categories', typeof value === 'string' ? value.split(',') : value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.role) {
      setError('Please select a target role');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.post('/interviews', formData);
      const responseData = response.data as { session_id: number };
      const { session_id } = responseData;
      
      navigate('/interviews/' + session_id + '/session');
    } catch (err: any) {
      setError(err.message || 'Failed to create interview session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Start Interview Practice
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Customize your interview session to match your preparation needs
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            select
            fullWidth
            label="Target Role"
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
            required
            sx={{ mb: 3 }}
          >
            {ROLES.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Difficulty Level"
            value={formData.difficulty}
            onChange={(e) => handleChange('difficulty', e.target.value)}
            required
            sx={{ mb: 3 }}
          >
            {DIFFICULTIES.map((difficulty) => (
              <MenuItem key={difficulty} value={difficulty}>
                {difficulty}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            type="number"
            fullWidth
            label="Number of Questions"
            value={formData.question_count}
            onChange={(e) => handleChange('question_count', parseInt(e.target.value))}
            required
            slotProps={{ htmlInput: { min: 1, max: 20 } }}
            helperText="Choose between 1 and 20 questions"
            sx={{ mb: 3 }}
          />

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Question Categories (Optional)</InputLabel>
            <Select
              multiple
              value={formData.categories || []}
              onChange={handleCategoryChange}
              input={<OutlinedInput label="Question Categories (Optional)" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {category.replace('_', ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
          >
            {loading ? 'Creating Session...' : 'Start Interview'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default InterviewStartPage;
