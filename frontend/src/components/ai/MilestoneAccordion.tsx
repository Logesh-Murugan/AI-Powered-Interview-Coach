/**
 * Milestone Accordion Component
 * Displays study plan milestones and daily tasks in an expandable format
 */

import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  LinearProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  RadioButtonUnchecked,
  Schedule,
  MenuBook,
} from '@mui/icons-material';
import type { WeeklyMilestone, DayTasks } from '../../services/studyPlanService';

interface MilestoneAccordionProps {
  milestones: WeeklyMilestone[];
  dailyTasks: DayTasks[];
  onTaskToggle: (day: number, taskIndex: number, completed: boolean) => void;
  isUpdating: boolean;
}

const MilestoneAccordion: React.FC<MilestoneAccordionProps> = ({
  milestones = [],
  dailyTasks = [],
  onTaskToggle,
  isUpdating,
}) => {
  // Group daily tasks by week
  const getTasksForWeek = (weekNumber: number) => {
    if (!dailyTasks || !Array.isArray(dailyTasks)) return [];
    const startDay = (weekNumber - 1) * 7 + 1;
    const endDay = weekNumber * 7;
    return dailyTasks.filter(day => day && day.day >= startDay && day.day <= endDay);
  };

  // Calculate progress for a week
  const getWeekProgress = (weekNumber: number) => {
    const weekTasks = getTasksForWeek(weekNumber);
    const totalTasks = weekTasks.reduce((sum, day) => sum + (day.tasks ? day.tasks.length : 0), 0);
    const completedTasks = weekTasks.reduce(
      (sum, day) => sum + (day.tasks ? day.tasks.filter(task => task.completed).length : 0),
      0
    );
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  };

  return (
    <Box>
      {milestones.map((milestone, index) => {
        const weekProgress = getWeekProgress(milestone.week);
        const weekTasks = getTasksForWeek(milestone.week);

        return (
          <Accordion key={milestone.week} defaultExpanded={index === 0}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ width: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="h6">
                    Week {milestone.week}: {milestone.milestone}
                  </Typography>
                  <Chip
                    icon={milestone.completed ? <CheckCircle /> : <RadioButtonUnchecked />}
                    label={milestone.completed ? 'Completed' : 'In Progress'}
                    color={milestone.completed ? 'success' : 'default'}
                    size="small"
                  />
                </Stack>
                
                <LinearProgress
                  variant="determinate"
                  value={weekProgress}
                  sx={{ mb: 1, height: 6, borderRadius: 3 }}
                />
                
                <Typography variant="body2" color="text.secondary">
                  {Math.round(weekProgress)}% complete • {milestone.skills_covered.join(', ')}
                </Typography>
              </Box>
            </AccordionSummary>
            
            <AccordionDetails>
              <Stack spacing={2}>
                {/* Assessment */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Assessment
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {milestone.assessment}
                  </Typography>
                </Box>

                <Divider />

                {/* Daily Tasks */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Daily Tasks
                  </Typography>
                  
                  {weekTasks.map((dayData) => (
                    <Box key={dayData.day} sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                        Day {dayData.day} - {dayData.date}
                      </Typography>
                      
                      <List dense>
                        {dayData.tasks && dayData.tasks.map((task, taskIndex) => (
                          <ListItem
                            key={taskIndex}
                            sx={{
                              pl: 0,
                              opacity: task.completed ? 0.7 : 1,
                              textDecoration: task.completed ? 'line-through' : 'none',
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <Checkbox
                                checked={task.completed}
                                onChange={(e) => onTaskToggle(dayData.day, taskIndex, e.target.checked)}
                                disabled={isUpdating}
                                size="small"
                              />
                            </ListItemIcon>
                            
                            <ListItemText
                              primary={task.activity}
                              secondary={
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                  <Chip
                                    label={task.skill}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Schedule fontSize="small" />
                                    <Typography variant="caption">
                                      {task.duration_minutes} min
                                    </Typography>
                                  </Box>
                                  {task.resources.length > 0 && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <MenuBook fontSize="small" />
                                      <Typography variant="caption">
                                        {task.resources.length} resource{task.resources.length > 1 ? 's' : ''}
                                      </Typography>
                                    </Box>
                                  )}
                                </Stack>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  ))}
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default MilestoneAccordion;