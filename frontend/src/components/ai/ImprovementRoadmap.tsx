/**
 * Improvement Roadmap Component
 * Display learning roadmap with milestones in timeline/stepper format
 * 
 * Requirements: INT-1.7
 */

import {
  Paper,
  Typography,
  Box,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
  Alert,
  LinearProgress,
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
  TrendingUp,
  Schedule,
  CheckCircle,
  School,
} from '@mui/icons-material';
import type { ImprovementRoadmap as RoadmapType } from '../../services/resumeAnalysisService';

interface ImprovementRoadmapProps {
  roadmap: RoadmapType;
}

function ImprovementRoadmap({ roadmap }: ImprovementRoadmapProps) {
  const { timeline_weeks, hours_per_week, total_hours, milestones, success_tips } = roadmap;

  if (!milestones || milestones.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
          Improvement Roadmap
        </Typography>
        <Alert severity="info">
          No improvement roadmap available. Your skills already match the target role well!
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
          Improvement Roadmap
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 1 }}>
          <Chip
            icon={<Schedule />}
            label={`${timeline_weeks} weeks`}
            color="primary"
            variant="outlined"
          />
          {hours_per_week && (
            <Chip
              label={`${hours_per_week} hrs/week`}
              color="info"
              variant="outlined"
            />
          )}
          {total_hours && (
            <Chip
              label={`${total_hours} total hours`}
              color="secondary"
              variant="outlined"
            />
          )}
        </Stack>
      </Box>

      {/* Timeline View */}
      <Timeline position="right">
        {milestones.map((milestone, index) => (
          <TimelineItem key={index}>
            <TimelineOppositeContent color="text.secondary">
              <Typography variant="body2" fontWeight="medium">
                {milestone.weeks}
              </Typography>
              <Typography variant="caption">
                {milestone.estimated_hours}h
              </Typography>
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color="primary">
                <School fontSize="small" />
              </TimelineDot>
              {index < milestones.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Milestone {milestone.milestone_number}
                </Typography>

                {/* Skills to Learn */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Skills to Learn:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {milestone.skills_to_learn.map((skill, idx) => (
                      <Chip key={idx} label={skill} size="small" color="primary" />
                    ))}
                  </Box>
                </Box>

                {/* Activities */}
                {milestone.activities && milestone.activities.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Activities:
                    </Typography>
                    <List dense disablePadding>
                      {milestone.activities.map((activity, idx) => (
                        <ListItem key={idx} disablePadding sx={{ pl: 0 }}>
                          <ListItemText
                            primary={activity}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Progress indicator (placeholder - could be made interactive) */}
                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      0%
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={0} />
                </Box>
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>

      {/* Success Tips */}
      {success_tips && success_tips.length > 0 && (
        <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Success Tips:
          </Typography>
          <List dense disablePadding>
            {success_tips.map((tip, index) => (
              <ListItem key={index} disablePadding>
                <ListItemText
                  primary={tip}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}
    </Paper>
  );
}

export default ImprovementRoadmap;
