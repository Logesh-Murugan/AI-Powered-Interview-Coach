/**
 * Milestone Accordion Component
 * Display study plan milestones with task checklists
 * 
 * Requirements: INT-1.8
 */

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  Checkbox,
  FormControlLabel,
  Stack,
  List,
  ListItem,
  Link,
  LinearProgress,
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  Schedule,
  School,
  Link as LinkIcon,
} from '@mui/icons-material';
import type { WeeklyMilestone, DayTasks } from '../../services/studyPlanService';

interface MilestoneAccordionProps {
  milestones: WeeklyMilestone[];
  dailyTasks: DayTasks[];
  onTaskToggle: (day: number, taskIndex: number, completed: boolean) => void;
  isUpdating?: boolean;
}

function MilestoneAccordion({
  milestones,
  dailyTasks,
  onTaskToggle,
  isUpdating = false,
}: MilestoneAccordionProps) {
  // Group daily tasks by week
  const getTasksForWeek = (weekNumber: number): DayTasks[] => {
    const startDay = (weekNumber - 1) * 7 + 1;
    const endDay = weekNumber * 7;
    return dailyTasks.filter(dt => dt.day >= startDay && dt.day <= endDay);
  };

  // Calculate completion percentage for a week
  const getWeekProgress = (weekNumber: number): number => {
    const weekTasks = getTasksForWeek(weekNumber);
    if (weekTasks.length === 0) return 0;
    
    const totalTasks = weekTasks.reduce((sum, dt) => sum + dt.tasks.length, 0);
    const completedTasks = weekTasks.reduce(
      (sum, dt) => sum + dt.tasks.filter(t => t.completed).length,
      0
    );
    
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  return (
    <Box>
      {milestones.map((milestone, index) => {
        const weekTasks = getTasksForWeek(milestone.week);
        const weekProgress = getWeekProgress(milestone.week);
        const isCompleted = milestone.completed;

        return (
          <Accordion key={index} defaultExpanded={index === 0}>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                bgcolor: isCompleted ? 'success.lighter' : 'background.paper',
              }}
            >
              <Box sx={{ width: '100%', pr: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1" fontWeight="medium">
                      Week {milestone.week}
                    </Typography>
                    {isCompleted && (
                      <CheckCircle fontSize="small" color="success" />
                    )}
                  </Stack>
                  <Chip
                    label={`${weekProgress}%`}
                    size="small"
                    color={weekProgress === 100 ? 'success' : 'default'}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {milestone.milestone}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={weekProgress}
                  sx={{ mt: 1, height: 4, borderRadius: 1 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={3}>
                {/* Skills Covered */}
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <School fontSize="small" color="primary" />
                    <Typography variant="subtitle2">Skills Covered</Typography>
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {milestone.skills_covered.map((skill, idx) => (
                      <Chip key={idx} label={skill} size="small" color="primary" variant="outlined" />
                    ))}
                  </Box>
                </Box>

                {/* Daily Tasks */}
                {weekTasks.map((dayTask) => (
                  <Box key={dayTask.day}>
                    <Typography variant="subtitle2" gutterBottom>
                      Day {dayTask.day} - {dayTask.date}
                    </Typography>
                    <List dense disablePadding>
                      {dayTask.tasks.map((task, taskIdx) => (
                        <ListItem
                          key={taskIdx}
                          disablePadding
                          sx={{
                            mb: 1,
                            p: 1,
                            bgcolor: 'background.default',
                            borderRadius: 1,
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={task.completed}
                                onChange={(e) => onTaskToggle(dayTask.day, taskIdx, e.target.checked)}
                                disabled={isUpdating}
                              />
                            }
                            label={
                              <Box sx={{ width: '100%' }}>
                                <Typography
                                  variant="body2"
                                  fontWeight="medium"
                                  sx={{
                                    textDecoration: task.completed ? 'line-through' : 'none',
                                    color: task.completed ? 'text.secondary' : 'text.primary',
                                  }}
                                >
                                  {task.skill}: {task.activity}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                  <Schedule fontSize="small" sx={{ fontSize: 14 }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {task.duration_minutes} minutes
                                  </Typography>
                                </Stack>
                                {task.resources && task.resources.length > 0 && (
                                  <Box sx={{ mt: 0.5 }}>
                                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                      {task.resources.map((resource, resIdx) => (
                                        <Link
                                          key={resIdx}
                                          href={resource}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            fontSize: '0.75rem',
                                            textDecoration: 'none',
                                            '&:hover': { textDecoration: 'underline' },
                                          }}
                                        >
                                          <LinkIcon sx={{ fontSize: 12, mr: 0.25 }} />
                                          Resource {resIdx + 1}
                                        </Link>
                                      ))}
                                    </Stack>
                                  </Box>
                                )}
                              </Box>
                            }
                            sx={{ width: '100%', m: 0 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ))}

                {/* Assessment */}
                {milestone.assessment && (
                  <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="info.main" gutterBottom>
                      Week Assessment
                    </Typography>
                    <Typography variant="body2">
                      {milestone.assessment}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}

export default MilestoneAccordion;
