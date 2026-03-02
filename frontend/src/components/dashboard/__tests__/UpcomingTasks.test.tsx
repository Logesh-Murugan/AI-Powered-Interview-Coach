/**
 * Unit Tests for UpcomingTasks Component
 * Tests rendering with and without active plan, loading states, and task display
 * 
 * Requirements: COMP-2.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import UpcomingTasks from '../UpcomingTasks';
import * as studyPlanService from '../../../services/studyPlanService';
import type { StudyPlan } from '../../../services/studyPlanService';

// Mock the study plan service
vi.mock('../../../services/studyPlanService');

const mockGetActiveStudyPlan = vi.mocked(studyPlanService.studyPlanService.getActiveStudyPlan);

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('UpcomingTasks', () => {
  const mockActivePlan: StudyPlan = {
    id: 1,
    user_id: 123,
    target_role: 'Software Engineer',
    duration_days: 30,
    available_hours_per_week: 10,
    plan_data: {
      overview: 'Learn software engineering fundamentals',
      weekly_milestones: [],
      daily_tasks: [
        {
          day: 1,
          date: '2024-01-15',
          tasks: [
            {
              skill: 'JavaScript Basics',
              activity: 'Complete variables and data types tutorial',
              duration_minutes: 30,
              completed: false,
            },
            {
              skill: 'Git Fundamentals',
              activity: 'Learn basic git commands',
              duration_minutes: 45,
              completed: false,
            },
          ],
        },
        {
          day: 2,
          date: '2024-01-16',
          tasks: [
            {
              skill: 'React Components',
              activity: 'Build your first React component',
              duration_minutes: 60,
              completed: false,
            },
            {
              skill: 'CSS Flexbox',
              activity: 'Practice flexbox layouts',
              duration_minutes: 40,
              completed: false,
            },
          ],
        },
        {
          day: 3,
          date: '2024-01-17',
          tasks: [
            {
              skill: 'API Integration',
              activity: 'Fetch data from REST API',
              duration_minutes: 50,
              completed: false,
            },
          ],
        },
      ],
      time_estimates: {
        total_hours: 120,
        hours_per_week: 10,
      },
    },
    status: 'active',
    progress_percentage: 25,
    total_tasks: 20,
    completed_tasks: 5,
    total_milestones: 4,
    completed_milestones: 1,
    execution_time_ms: 2000,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z',
  };

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner while fetching data', () => {
      mockGetActiveStudyPlan.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithRouter(<UpcomingTasks />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should not display content while loading', () => {
      mockGetActiveStudyPlan.mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<UpcomingTasks />);

      expect(screen.queryByText('Upcoming Tasks')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when API call fails (non-404)', async () => {
      mockGetActiveStudyPlan.mockRejectedValue({
        response: { status: 500 },
        message: 'Server error',
      });

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByText('Unable to load upcoming tasks')).toBeInTheDocument();
      });
    });

    it('should display error in an alert component', async () => {
      mockGetActiveStudyPlan.mockRejectedValue({
        response: { status: 500 },
        message: 'Server error',
      });

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Unable to load upcoming tasks');
      });
    });
  });

  describe('No Active Plan State', () => {
    it('should display no active plan message when 404 error', async () => {
      mockGetActiveStudyPlan.mockRejectedValue({
        response: { status: 404 },
        message: 'Not found',
      });

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByText("You don't have an active study plan yet.")).toBeInTheDocument();
      });
    });

    it('should display "Create Study Plan" button when no active plan', async () => {
      mockGetActiveStudyPlan.mockRejectedValue({
        response: { status: 404 },
        message: 'Not found',
      });

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create study plan/i })).toBeInTheDocument();
      });
    });

    it('should navigate to study plans page when create button is clicked', async () => {
      const user = userEvent.setup();
      mockGetActiveStudyPlan.mockRejectedValue({
        response: { status: 404 },
        message: 'Not found',
      });

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create study plan/i })).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /create study plan/i });
      await user.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('/ai/study-plans');
    });

    it('should display component title even without active plan', async () => {
      mockGetActiveStudyPlan.mockRejectedValue({
        response: { status: 404 },
        message: 'Not found',
      });

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByText('Upcoming Tasks')).toBeInTheDocument();
      });
    });
  });

  describe('Active Plan - Task Display', () => {
    it('should display component title', async () => {
      mockGetActiveStudyPlan.mockResolvedValue(mockActivePlan);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByText('Upcoming Tasks')).toBeInTheDocument();
      });
    });

    it('should display next 5 upcoming tasks', async () => {
      mockGetActiveStudyPlan.mockResolvedValue(mockActivePlan);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByText('JavaScript Basics')).toBeInTheDocument();
        expect(screen.getByText('Git Fundamentals')).toBeInTheDocument();
        expect(screen.getByText('React Components')).toBeInTheDocument();
        expect(screen.getByText('CSS Flexbox')).toBeInTheDocument();
        expect(screen.getByText('API Integration')).toBeInTheDocument();
      });
    });

    it('should display task activities', async () => {
      mockGetActiveStudyPlan.mockResolvedValue(mockActivePlan);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByText('Complete variables and data types tutorial')).toBeInTheDocument();
        expect(screen.getByText('Learn basic git commands')).toBeInTheDocument();
        expect(screen.getByText('Build your first React component')).toBeInTheDocument();
      });
    });

    it('should display day chips for each task', async () => {
      mockGetActiveStudyPlan.mockResolvedValue(mockActivePlan);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getAllByText('Day 1')).toHaveLength(2);
        expect(screen.getAllByText('Day 2')).toHaveLength(2);
        expect(screen.getByText('Day 3')).toBeInTheDocument();
      });
    });

    it('should display duration for each task', async () => {
      mockGetActiveStudyPlan.mockResolvedValue(mockActivePlan);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByText('30 min')).toBeInTheDocument();
        expect(screen.getByText('45 min')).toBeInTheDocument();
        expect(screen.getByText('60 min')).toBeInTheDocument();
        expect(screen.getByText('40 min')).toBeInTheDocument();
        expect(screen.getByText('50 min')).toBeInTheDocument();
      });
    });

    it('should display checkboxes for tasks (disabled)', async () => {
      mockGetActiveStudyPlan.mockResolvedValue(mockActivePlan);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes).toHaveLength(5);
        checkboxes.forEach(checkbox => {
          expect(checkbox).toBeDisabled();
        });
      });
    });

    it('should call getActiveStudyPlan on mount', async () => {
      mockGetActiveStudyPlan.mockResolvedValue(mockActivePlan);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(mockGetActiveStudyPlan).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Task Filtering', () => {
    it('should only show incomplete tasks', async () => {
      const planWithCompletedTasks: StudyPlan = {
        ...mockActivePlan,
        plan_data: {
          ...mockActivePlan.plan_data,
          daily_tasks: [
            {
              day: 1,
              date: '2024-01-15',
              tasks: [
                {
                  skill: 'Completed Task',
                  activity: 'This task is done',
                  duration_minutes: 30,
                  completed: true,
                },
                {
                  skill: 'Incomplete Task',
                  activity: 'This task is not done',
                  duration_minutes: 45,
                  completed: false,
                },
              ],
            },
          ],
        },
      };
      mockGetActiveStudyPlan.mockResolvedValue(planWithCompletedTasks);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByText('Incomplete Task')).toBeInTheDocument();
        expect(screen.queryByText('Completed Task')).not.toBeInTheDocument();
      });
    });

    it('should limit display to 5 tasks even if more exist', async () => {
      const planWithManyTasks: StudyPlan = {
        ...mockActivePlan,
        plan_data: {
          ...mockActivePlan.plan_data,
          daily_tasks: [
            {
              day: 1,
              date: '2024-01-15',
              tasks: Array.from({ length: 10 }, (_, i) => ({
                skill: `Task ${i + 1}`,
                activity: `Activity ${i + 1}`,
                duration_minutes: 30,
                completed: false,
              })),
            },
          ],
        },
      };
      mockGetActiveStudyPlan.mockResolvedValue(planWithManyTasks);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
        expect(screen.getByText('Task 5')).toBeInTheDocument();
        expect(screen.queryByText('Task 6')).not.toBeInTheDocument();
      });
    });
  });

  describe('All Tasks Completed State', () => {
    it('should display completion message when all tasks are done', async () => {
      const completedPlan: StudyPlan = {
        ...mockActivePlan,
        plan_data: {
          ...mockActivePlan.plan_data,
          daily_tasks: [
            {
              day: 1,
              date: '2024-01-15',
              tasks: [
                {
                  skill: 'Task 1',
                  activity: 'Activity 1',
                  duration_minutes: 30,
                  completed: true,
                },
              ],
            },
          ],
        },
      };
      mockGetActiveStudyPlan.mockResolvedValue(completedPlan);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByText('All tasks completed! 🎉')).toBeInTheDocument();
      });
    });

    it('should still show "View Full Study Plan" button when all tasks completed', async () => {
      const completedPlan: StudyPlan = {
        ...mockActivePlan,
        plan_data: {
          ...mockActivePlan.plan_data,
          daily_tasks: [
            {
              day: 1,
              date: '2024-01-15',
              tasks: [
                {
                  skill: 'Task 1',
                  activity: 'Activity 1',
                  duration_minutes: 30,
                  completed: true,
                },
              ],
            },
          ],
        },
      };
      mockGetActiveStudyPlan.mockResolvedValue(completedPlan);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view full study plan/i })).toBeInTheDocument();
      });
    });
  });

  describe('View Full Plan Button', () => {
    it('should display "View Full Study Plan" button', async () => {
      mockGetActiveStudyPlan.mockResolvedValue(mockActivePlan);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view full study plan/i })).toBeInTheDocument();
      });
    });

    it('should navigate to study plans page when button is clicked', async () => {
      const user = userEvent.setup();
      mockGetActiveStudyPlan.mockResolvedValue(mockActivePlan);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view full study plan/i })).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /view full study plan/i });
      await user.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('/ai/study-plans');
    });
  });

  describe('Edge Cases', () => {
    it('should handle plan with no daily tasks', async () => {
      const noDailyTasksPlan: StudyPlan = {
        ...mockActivePlan,
        plan_data: {
          ...mockActivePlan.plan_data,
          daily_tasks: [],
        },
      };
      mockGetActiveStudyPlan.mockResolvedValue(noDailyTasksPlan);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByText('All tasks completed! 🎉')).toBeInTheDocument();
      });
    });

    it('should handle very long task names', async () => {
      const longNamePlan: StudyPlan = {
        ...mockActivePlan,
        plan_data: {
          ...mockActivePlan.plan_data,
          daily_tasks: [
            {
              day: 1,
              date: '2024-01-15',
              tasks: [
                {
                  skill: 'This is a very long task name that should still display properly without breaking the layout',
                  activity: 'Activity',
                  duration_minutes: 30,
                  completed: false,
                },
              ],
            },
          ],
        },
      };
      mockGetActiveStudyPlan.mockResolvedValue(longNamePlan);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByText('This is a very long task name that should still display properly without breaking the layout')).toBeInTheDocument();
      });
    });

    it('should handle very long activity descriptions', async () => {
      const longActivityPlan: StudyPlan = {
        ...mockActivePlan,
        plan_data: {
          ...mockActivePlan.plan_data,
          daily_tasks: [
            {
              day: 1,
              date: '2024-01-15',
              tasks: [
                {
                  skill: 'Task',
                  activity: 'This is a very long activity description that explains in great detail what needs to be done for this particular task',
                  duration_minutes: 30,
                  completed: false,
                },
              ],
            },
          ],
        },
      };
      mockGetActiveStudyPlan.mockResolvedValue(longActivityPlan);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByText('This is a very long activity description that explains in great detail what needs to be done for this particular task')).toBeInTheDocument();
      });
    });

    it('should handle large duration values', async () => {
      const largeDurationPlan: StudyPlan = {
        ...mockActivePlan,
        plan_data: {
          ...mockActivePlan.plan_data,
          daily_tasks: [
            {
              day: 1,
              date: '2024-01-15',
              tasks: [
                {
                  skill: 'Long Task',
                  activity: 'This takes a while',
                  duration_minutes: 999,
                  completed: false,
                },
              ],
            },
          ],
        },
      };
      mockGetActiveStudyPlan.mockResolvedValue(largeDurationPlan);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        expect(screen.getByText('999 min')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible loading state', () => {
      mockGetActiveStudyPlan.mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<UpcomingTasks />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should have accessible buttons', async () => {
      mockGetActiveStudyPlan.mockResolvedValue(mockActivePlan);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /view full study plan/i });
        expect(button).toHaveAccessibleName();
      });
    });

    it('should have accessible checkboxes', async () => {
      mockGetActiveStudyPlan.mockResolvedValue(mockActivePlan);

      renderWithRouter(<UpcomingTasks />);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        checkboxes.forEach(checkbox => {
          expect(checkbox).toBeInTheDocument();
        });
      });
    });
  });
});
