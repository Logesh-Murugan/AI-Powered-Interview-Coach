/**
 * Coaching Session Card Component
 * Display coaching session summary with view details functionality
 * 
 * Requirements: INT-1.9
 */

import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Stack,
  Chip,
} from '@mui/material';
import {
  Business,
  QuestionAnswer,
  Visibility,
  CalendarToday,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { CoachingSession } from '../../services/companyCoachingService';

interface CoachingSessionCardProps {
  session: CoachingSession;
  onViewDetails: () => void;
}

function CoachingSessionCard({ session, onViewDetails }: CoachingSessionCardProps) {
  const { company_name, target_role, predicted_questions, created_at } = session;

  return (
    <Card
      sx={{
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          {/* Company Name and Role */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Business color="primary" />
              <Typography variant="h6" component="div">
                {company_name}
              </Typography>
            </Stack>
            <Chip
              label={target_role}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>

          {/* Session Stats */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <QuestionAnswer fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary" component="div">
                {predicted_questions?.length || 0} questions
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <CalendarToday fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary" component="div">
                {format(new Date(created_at), 'MMM dd, yyyy')}
              </Typography>
            </Stack>
          </Stack>

          {/* View Details Button */}
          <Button
            variant="contained"
            startIcon={<Visibility />}
            onClick={onViewDetails}
            fullWidth
          >
            View Details
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default CoachingSessionCard;
