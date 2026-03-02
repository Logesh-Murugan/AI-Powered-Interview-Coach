/**
 * Component Tests for StudyPlanCard
 * Tests rendering, loading states, error states, and interactions
 * 
 * Requirements: INT-1.8
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import StudyPlanCard from '../StudyPlanCard';
import type { StudyPlan } from '../../../services/studyPlanService';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('StudyPlanCard', () => {
  const mockActivePlan: StudyPlan = {
    id: 1,
    user_id: 123,
    target_role: 'Software Engineer',
    duration_days: 30,
    available_hours_per_week: 10,
    plan_data: {
      overview: 'Learn software engineering fundamentals',
      weekly_milestones: [
        {
          week: 1,
          milestone: 'Learn JavaScript basics',
          skills_covered: ['Variables', 'Functions', 'Arrays'],
          completed: false,
        },
        {
          week: 2,
          milestone: 'Learn React fundamentals',
          skills_covered: ['Components', 'Props', 'State'],
          completed: false,
        },
      ],
      daily_tasks: [],
      time_estimates: {
        total_hours: 120,
        hours_per_week: 10,
      },
    },
    status: 'active',
    progress_percentage: 35,
    total_tasks: 20,
    completed_tasks: 7,
    total_milestones: 4,
    completed_milestones: 1,
    execution_time_ms: 2000,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z',
  };

  const defaultProps = {
    activePlan: null,
    isLoading: false,
    error: null,
  };

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Loading State', () => {
    it('should display loading spinner when isLoading is true', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Loading study plan...')).toBeInTheDocument();
    });

    it('should not display content when loading', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} isLoading={true} />);

      expect(screen.queryByText('Create Study Plan')).not.toBeInTheDocument();
      expect(screen.queryByText('View Full Plan')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error exists', () => {
      const errorMessage = 'Failed to load study plan';
      renderWithRouter(<StudyPlanCard {...defaultProps} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should display "Go to Study Plans" button on error', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} error="Error occurred" />);

      const button = screen.getByRole('button', { name: /go to study plans/i });
      expect(button).toBeInTheDocument();
    });

    it('should navigate to study plans page when button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StudyPlanCard {...defaultProps} error="Error occurred" />);

      const button = screen.getByRole('button', { name: /go to study plans/i });
      await user.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('/ai/study-plans');
    });

    it('should display Study Plan title in error state', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} error="Error" />);

      expect(screen.getByText('Study Plan')).toBeInTheDocument();
    });
  });

  describe('No Active Plan State', () => {
    it('should display "No Active Study Plan" message', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} />);

      expect(screen.getByText('No Active Study Plan')).toBeInTheDocument();
    });

    it('should display descriptive text about creating a plan', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} />);

      expect(
        screen.getByText(/create a personalized learning roadmap/i)
      ).toBeInTheDocument();
    });

    it('should display "Create Study Plan" button', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} />);

      const button = screen.getByRole('button', { name: /create study plan/i });
      expect(button).toBeInTheDocument();
    });

    it('should navigate to study plans page when create button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StudyPlanCard {...defaultProps} />);

      const button = screen.getByRole('button', { name: /create study plan/i });
      await user.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('/ai/study-plans');
    });

    it('should display school icon', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} />);

      // School icon should be present (MUI icons render as SVG)
      const card = screen.getByText('No Active Study Plan').closest('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Active Plan Display', () => {
    it('should display study plan title', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={mockActivePlan} />);

      expect(screen.getByText('Study Plan')).toBeInTheDocument();
    });

    it('should display target role chip', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={mockActivePlan} />);

      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    it('should display status chip', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={mockActivePlan} />);

      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    it('should display progress percentage', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={mockActivePlan} />);

      expect(screen.getByText('35%')).toBeInTheDocument();
    });

    it('should display overall progress label', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={mockActivePlan} />);

      expect(screen.getByText('Overall Progress')).toBeInTheDocument();
    });

    it('should display progress bar', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={mockActivePlan} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '35');
    });

    it('should display completed tasks count', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={mockActivePlan} />);

      expect(screen.getByText('7 of 20 tasks completed')).toBeInTheDocument();
    });

    it('should display "View Full Plan" button', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={mockActivePlan} />);

      const button = screen.getByRole('button', { name: /view full plan/i });
      expect(button).toBeInTheDocument();
    });

    it('should navigate to study plans page when view button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={mockActivePlan} />);

      const button = screen.getByRole('button', { name: /view full plan/i });
      await user.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('/ai/study-plans');
    });
  });

  describe('Next Milestone Preview', () => {
    it('should display next milestone when available', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={mockActivePlan} />);

      expect(screen.getByText(/next milestone: week 1/i)).toBeInTheDocument();
    });

    it('should display next milestone title', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={mockActivePlan} />);

      expect(screen.getByText('Learn JavaScript basics')).toBeInTheDocument();
    });

    it('should display first 3 skills', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={mockActivePlan} />);

      expect(screen.getByText('Variables')).toBeInTheDocument();
      expect(screen.getByText('Functions')).toBeInTheDocument();
      expect(screen.getByText('Arrays')).toBeInTheDocument();
    });

    it('should not display next milestone when all milestones are completed', () => {
      const completedPlan: StudyPlan = {
        ...mockActivePlan,
        plan_data: {
          ...mockActivePlan.plan_data,
          weekly_milestones: [
            {
              week: 1,
              milestone: 'Completed milestone',
              skills_covered: ['Skill 1'],
              completed: true,
            },
          ],
        },
      };

      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={completedPlan} />);

      expect(screen.queryByText(/next milestone/i)).not.toBeInTheDocument();
    });

    it('should display "+X more" chip when more than 3 skills', () => {
      const planWithManySkills: StudyPlan = {
        ...mockActivePlan,
        plan_data: {
          ...mockActivePlan.plan_data,
          weekly_milestones: [
            {
              week: 1,
              milestone: 'Learn many skills',
              skills_covered: ['Skill 1', 'Skill 2', 'Skill 3', 'Skill 4', 'Skill 5'],
              completed: false,
            },
          ],
        },
      };

      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={planWithManySkills} />);

      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('should skip completed milestones and show next incomplete one', () => {
      const planWithCompletedMilestone: StudyPlan = {
        ...mockActivePlan,
        plan_data: {
          ...mockActivePlan.plan_data,
          weekly_milestones: [
            {
              week: 1,
              milestone: 'Completed milestone',
              skills_covered: ['Skill 1'],
              completed: true,
            },
            {
              week: 2,
              milestone: 'Next milestone',
              skills_covered: ['Skill 2'],
              completed: false,
            },
          ],
        },
      };

      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={planWithCompletedMilestone} />);

      expect(screen.getByText(/next milestone: week 2/i)).toBeInTheDocument();
      expect(screen.getByText('Next milestone')).toBeInTheDocument();
    });
  });

  describe('Status Variations', () => {
    it('should display completed status with default color', () => {
      const completedPlan: StudyPlan = {
        ...mockActivePlan,
        status: 'completed',
      };

      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={completedPlan} />);

      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    });

    it('should display abandoned status with default color', () => {
      const abandonedPlan: StudyPlan = {
        ...mockActivePlan,
        status: 'abandoned',
      };

      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={abandonedPlan} />);

      expect(screen.getByText('ABANDONED')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle 0% progress', () => {
      const zeroPlan: StudyPlan = {
        ...mockActivePlan,
        progress_percentage: 0,
        completed_tasks: 0,
      };

      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={zeroPlan} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('0 of 20 tasks completed')).toBeInTheDocument();
    });

    it('should handle 100% progress', () => {
      const completePlan: StudyPlan = {
        ...mockActivePlan,
        progress_percentage: 100,
        completed_tasks: 20,
      };

      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={completePlan} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('20 of 20 tasks completed')).toBeInTheDocument();
    });

    it('should handle plan with no milestones', () => {
      const noMilestonesPlan: StudyPlan = {
        ...mockActivePlan,
        plan_data: {
          ...mockActivePlan.plan_data,
          weekly_milestones: [],
        },
      };

      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={noMilestonesPlan} />);

      expect(screen.queryByText(/next milestone/i)).not.toBeInTheDocument();
    });

    it('should handle plan with undefined weekly_milestones', () => {
      const undefinedMilestonesPlan: StudyPlan = {
        ...mockActivePlan,
        plan_data: {
          ...mockActivePlan.plan_data,
          weekly_milestones: undefined as any,
        },
      };

      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={undefinedMilestonesPlan} />);

      // Should not crash
      expect(screen.getByText('Study Plan')).toBeInTheDocument();
    });

    it('should handle milestone with empty skills array', () => {
      const emptySkillsPlan: StudyPlan = {
        ...mockActivePlan,
        plan_data: {
          ...mockActivePlan.plan_data,
          weekly_milestones: [
            {
              week: 1,
              milestone: 'Milestone with no skills',
              skills_covered: [],
              completed: false,
            },
          ],
        },
      };

      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={emptySkillsPlan} />);

      expect(screen.getByText('Milestone with no skills')).toBeInTheDocument();
      // No skill chips should be displayed
      expect(screen.queryByText('Variables')).not.toBeInTheDocument();
    });

    it('should handle very long target role name', () => {
      const longRolePlan: StudyPlan = {
        ...mockActivePlan,
        target_role: 'Senior Principal Staff Software Engineering Architect Lead',
      };

      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={longRolePlan} />);

      expect(
        screen.getByText('Senior Principal Staff Software Engineering Architect Lead')
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible loading state', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} isLoading={true} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} />);

      const button = screen.getByRole('button', { name: /create study plan/i });
      expect(button).toHaveAccessibleName();
    });

    it('should have accessible progress bar', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={mockActivePlan} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow');
    });

    it('should have accessible view button', () => {
      renderWithRouter(<StudyPlanCard {...defaultProps} activePlan={mockActivePlan} />);

      const button = screen.getByRole('button', { name: /view full plan/i });
      expect(button).toHaveAccessibleName();
    });
  });
});
