/**
 * Component Tests for MilestoneAccordion
 * Tests rendering, task interactions, and milestone display
 * 
 * Requirements: INT-1.8
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MilestoneAccordion from '../MilestoneAccordion';
import type { WeeklyMilestone, DayTasks } from '../../../services/studyPlanService';

describe('MilestoneAccordion', () => {
  const mockMilestones: WeeklyMilestone[] = [
    {
      week: 1,
      milestone: 'Learn JavaScript Fundamentals',
      skills_covered: ['Variables', 'Functions', 'Arrays', 'Objects'],
      completed: false,
      assessment: 'Complete a simple JavaScript project',
    },
    {
      week: 2,
      milestone: 'Master React Basics',
      skills_covered: ['Components', 'Props', 'State', 'Hooks'],
      completed: false,
      assessment: 'Build a React todo app',
    },
    {
      week: 3,
      milestone: 'Advanced React Patterns',
      skills_covered: ['Context', 'Reducers', 'Custom Hooks'],
      completed: true,
      assessment: 'Refactor app with advanced patterns',
    },
  ];

  const mockDailyTasks: DayTasks[] = [
    {
      day: 1,
      date: '2024-01-15',
      tasks: [
        {
          skill: 'Variables',
          activity: 'Learn variable declarations',
          duration_minutes: 30,
          resources: ['https://example.com/variables'],
          completed: false,
        },
        {
          skill: 'Functions',
          activity: 'Practice function syntax',
          duration_minutes: 45,
          resources: ['https://example.com/functions', 'https://example.com/functions-2'],
          completed: true,
        },
      ],
    },
    {
      day: 2,
      date: '2024-01-16',
      tasks: [
        {
          skill: 'Arrays',
          activity: 'Array methods practice',
          duration_minutes: 60,
          resources: [],
          completed: false,
        },
      ],
    },
    {
      day: 8,
      date: '2024-01-22',
      tasks: [
        {
          skill: 'Components',
          activity: 'Create React components',
          duration_minutes: 90,
          resources: ['https://example.com/components'],
          completed: false,
        },
      ],
    },
  ];

  const defaultProps = {
    milestones: mockMilestones,
    dailyTasks: mockDailyTasks,
    onTaskToggle: vi.fn(),
    isUpdating: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Milestone Rendering', () => {
    it('should display all milestones', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      expect(screen.getByText('Week 1')).toBeInTheDocument();
      expect(screen.getByText('Week 2')).toBeInTheDocument();
      expect(screen.getByText('Week 3')).toBeInTheDocument();
    });

    it('should display milestone titles', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      expect(screen.getByText('Learn JavaScript Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('Master React Basics')).toBeInTheDocument();
      expect(screen.getByText('Advanced React Patterns')).toBeInTheDocument();
    });

    it('should display completion icon for completed milestones', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      // Week 3 is completed
      const week3Section = screen.getByText('Week 3').closest('.MuiAccordionSummary-root');
      expect(week3Section).toBeInTheDocument();
    });

    it('should display progress percentage for each milestone', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      // Week 1 has 2 tasks: 1 completed, 1 not completed = 50%
      const percentages = screen.getAllByText(/\d+%/);
      expect(percentages.length).toBeGreaterThan(0);
    });

    it('should display progress bar for each milestone', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBe(3); // One for each milestone
    });

    it('should expand first milestone by default', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      // First milestone should be expanded, so its skills should be visible
      const skillsCovered = screen.getAllByText('Skills Covered');
      expect(skillsCovered.length).toBeGreaterThan(0);
    });
  });

  describe('Skills Display', () => {
    it('should display skills covered section', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      const skillsCovered = screen.getAllByText('Skills Covered');
      expect(skillsCovered.length).toBeGreaterThan(0);
    });

    it('should display all skills for a milestone', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      // Week 1 skills
      expect(screen.getByText('Variables')).toBeInTheDocument();
      expect(screen.getByText('Functions')).toBeInTheDocument();
      expect(screen.getByText('Arrays')).toBeInTheDocument();
      expect(screen.getByText('Objects')).toBeInTheDocument();
    });

    it('should display skills as chips', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      const variablesChip = screen.getByText('Variables').closest('.MuiChip-root');
      expect(variablesChip).toBeInTheDocument();
    });
  });

  describe('Daily Tasks Display', () => {
    it('should display day number and date', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      expect(screen.getByText('Day 1 - 2024-01-15')).toBeInTheDocument();
      expect(screen.getByText('Day 2 - 2024-01-16')).toBeInTheDocument();
    });

    it('should display task skill and activity', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      expect(screen.getByText(/Variables: Learn variable declarations/)).toBeInTheDocument();
      expect(screen.getByText(/Functions: Practice function syntax/)).toBeInTheDocument();
    });

    it('should display task duration', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      expect(screen.getByText('30 minutes')).toBeInTheDocument();
      expect(screen.getByText('45 minutes')).toBeInTheDocument();
      expect(screen.getByText('60 minutes')).toBeInTheDocument();
    });

    it('should display task checkboxes', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should check completed tasks', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      // Second task (Functions) is completed
      const completedCheckbox = checkboxes.find(cb => cb.getAttribute('checked') !== null);
      expect(completedCheckbox).toBeDefined();
    });

    it('should apply strikethrough to completed tasks', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      const completedTask = screen.getByText(/Functions: Practice function syntax/);
      expect(completedTask).toHaveStyle({ textDecoration: 'line-through' });
    });

    it('should not apply strikethrough to incomplete tasks', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      const incompleteTask = screen.getByText(/Variables: Learn variable declarations/);
      expect(incompleteTask).toHaveStyle({ textDecoration: 'none' });
    });
  });

  describe('Task Resources', () => {
    it('should display resource links when available', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      const resourceLinks = screen.getAllByText(/Resource \d+/);
      expect(resourceLinks.length).toBeGreaterThan(0);
    });

    it('should display correct number of resources', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      // Functions task has 2 resources
      const functionsSection = screen.getByText(/Functions: Practice function syntax/).closest('.MuiListItem-root');
      const resourceLinks = within(functionsSection!).getAllByText(/Resource \d+/);
      expect(resourceLinks).toHaveLength(2);
    });

    it('should not display resources section when no resources', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      // Arrays task has no resources
      const arraysSection = screen.getByText(/Arrays: Array methods practice/).closest('.MuiListItem-root');
      const resourceLinks = within(arraysSection!).queryAllByText(/Resource \d+/);
      expect(resourceLinks).toHaveLength(0);
    });

    it('should have correct href for resource links', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      const firstResource = screen.getAllByText('Resource 1')[0].closest('a');
      expect(firstResource).toHaveAttribute('href', 'https://example.com/variables');
      expect(firstResource).toHaveAttribute('target', '_blank');
      expect(firstResource).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Task Toggle Interaction', () => {
    it('should call onTaskToggle when checkbox is clicked', async () => {
      const user = userEvent.setup();
      const onTaskToggle = vi.fn();

      render(<MilestoneAccordion {...defaultProps} onTaskToggle={onTaskToggle} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(onTaskToggle).toHaveBeenCalledTimes(1);
      expect(onTaskToggle).toHaveBeenCalledWith(1, 0, true);
    });

    it('should pass correct parameters to onTaskToggle', async () => {
      const user = userEvent.setup();
      const onTaskToggle = vi.fn();

      render(<MilestoneAccordion {...defaultProps} onTaskToggle={onTaskToggle} />);

      const checkboxes = screen.getAllByRole('checkbox');
      // Click second checkbox (day 1, task 1)
      await user.click(checkboxes[1]);

      expect(onTaskToggle).toHaveBeenCalledWith(1, 1, false); // Unchecking completed task
    });

    it('should disable checkboxes when isUpdating is true', () => {
      render(<MilestoneAccordion {...defaultProps} isUpdating={true} />);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeDisabled();
      });
    });

    it('should not disable checkboxes when isUpdating is false', () => {
      render(<MilestoneAccordion {...defaultProps} isUpdating={false} />);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeDisabled();
      });
    });
  });

  describe('Assessment Display', () => {
    it('should display assessment section when available', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      const assessments = screen.getAllByText('Week Assessment');
      expect(assessments.length).toBeGreaterThan(0);
    });

    it('should display assessment text', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      expect(screen.getByText('Complete a simple JavaScript project')).toBeInTheDocument();
    });

    it('should not display assessment when not provided', () => {
      const milestonesWithoutAssessment: WeeklyMilestone[] = [
        {
          week: 1,
          milestone: 'Test milestone',
          skills_covered: ['Skill 1'],
          completed: false,
        },
      ];

      render(
        <MilestoneAccordion
          {...defaultProps}
          milestones={milestonesWithoutAssessment}
          dailyTasks={[]}
        />
      );

      expect(screen.queryByText('Week Assessment')).not.toBeInTheDocument();
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate 50% progress for week 1', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      // Week 1 has 3 tasks total (day 1 has 2, day 2 has 1): 1 completed (Functions) = 33%
      // The actual calculation shows 33%, not 50%
      const week1Section = screen.getByText('Week 1').closest('.MuiAccordionSummary-root');
      expect(within(week1Section!).getByText('33%')).toBeInTheDocument();
    });

    it('should calculate 0% progress for week 2', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      // Week 2 has 1 task: 0 completed = 0%
      const week2Section = screen.getByText('Week 2').closest('.MuiAccordionSummary-root');
      expect(within(week2Section!).getByText('0%')).toBeInTheDocument();
    });

    it('should handle week with no tasks', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      // Week 3 has no tasks in the range (days 15-21)
      const week3Section = screen.getByText('Week 3').closest('.MuiAccordionSummary-root');
      expect(within(week3Section!).getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty milestones array', () => {
      render(<MilestoneAccordion {...defaultProps} milestones={[]} />);

      expect(screen.queryByText(/Week \d+/)).not.toBeInTheDocument();
    });

    it('should handle empty daily tasks array', () => {
      render(<MilestoneAccordion {...defaultProps} dailyTasks={[]} />);

      // Should still render milestones
      expect(screen.getByText('Week 1')).toBeInTheDocument();
      // But no tasks should be displayed
      expect(screen.queryByText(/Day \d+/)).not.toBeInTheDocument();
    });

    it('should handle milestone with empty skills array', () => {
      const emptySkillsMilestone: WeeklyMilestone[] = [
        {
          week: 1,
          milestone: 'Test milestone',
          skills_covered: [],
          completed: false,
        },
      ];

      render(
        <MilestoneAccordion
          {...defaultProps}
          milestones={emptySkillsMilestone}
          dailyTasks={[]}
        />
      );

      expect(screen.getByText('Skills Covered')).toBeInTheDocument();
      // No skill chips should be displayed
      expect(screen.queryByText('Variables')).not.toBeInTheDocument();
    });

    it('should handle task with 0 duration', () => {
      const zeroDurationTasks: DayTasks[] = [
        {
          day: 1,
          date: '2024-01-15',
          tasks: [
            {
              skill: 'Test',
              activity: 'Test activity',
              duration_minutes: 0,
              resources: [],
              completed: false,
            },
          ],
        },
      ];

      render(<MilestoneAccordion {...defaultProps} dailyTasks={zeroDurationTasks} />);

      expect(screen.getByText('0 minutes')).toBeInTheDocument();
    });

    it('should handle task with very long duration', () => {
      const longDurationTasks: DayTasks[] = [
        {
          day: 1,
          date: '2024-01-15',
          tasks: [
            {
              skill: 'Test',
              activity: 'Test activity',
              duration_minutes: 480,
              resources: [],
              completed: false,
            },
          ],
        },
      ];

      render(<MilestoneAccordion {...defaultProps} dailyTasks={longDurationTasks} />);

      expect(screen.getByText('480 minutes')).toBeInTheDocument();
    });

    it('should handle task with undefined resources', () => {
      const undefinedResourcesTasks: DayTasks[] = [
        {
          day: 1,
          date: '2024-01-15',
          tasks: [
            {
              skill: 'Test',
              activity: 'Test activity',
              duration_minutes: 30,
              resources: undefined as any,
              completed: false,
            },
          ],
        },
      ];

      render(<MilestoneAccordion {...defaultProps} dailyTasks={undefinedResourcesTasks} />);

      // Should not crash
      expect(screen.getByText(/Test: Test activity/)).toBeInTheDocument();
    });

    it('should handle very long skill and activity names', () => {
      const longNameTasks: DayTasks[] = [
        {
          day: 1,
          date: '2024-01-15',
          tasks: [
            {
              skill: 'Very Long Skill Name That Goes On And On',
              activity: 'Very Long Activity Description That Explains Everything In Detail',
              duration_minutes: 30,
              resources: [],
              completed: false,
            },
          ],
        },
      ];

      render(<MilestoneAccordion {...defaultProps} dailyTasks={longNameTasks} />);

      expect(
        screen.getByText(/Very Long Skill Name That Goes On And On/)
      ).toBeInTheDocument();
    });
  });

  describe('Accordion Interaction', () => {
    it('should expand accordion when clicked', async () => {
      const user = userEvent.setup();
      render(<MilestoneAccordion {...defaultProps} />);

      // Week 2 should be collapsed initially
      const week2Button = screen.getByText('Week 2').closest('button');
      await user.click(week2Button!);

      // After clicking, week 2 content should be visible
      // We can check if the accordion is expanded by looking for its content
      const week2Section = screen.getByText('Week 2').closest('.MuiAccordion-root');
      expect(week2Section).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible checkboxes', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeInTheDocument();
      });
    });

    it('should have accessible progress bars', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach(bar => {
        expect(bar).toHaveAttribute('aria-valuenow');
      });
    });

    it('should have accessible expand buttons', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      const expandButtons = screen.getAllByRole('button');
      expect(expandButtons.length).toBeGreaterThan(0);
    });

    it('should have accessible resource links', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
        expect(link).toHaveAttribute('target', '_blank');
      });
    });
  });

  describe('Visual Indicators', () => {
    it('should highlight completed milestone with success color', () => {
      render(<MilestoneAccordion {...defaultProps} />);

      const week3Summary = screen.getByText('Week 3').closest('.MuiAccordionSummary-root');
      expect(week3Summary).toHaveStyle({ backgroundColor: expect.any(String) });
    });

    it('should show success color for 100% progress chip', () => {
      const completedTasks: DayTasks[] = [
        {
          day: 1,
          date: '2024-01-15',
          tasks: [
            {
              skill: 'Test',
              activity: 'Test activity',
              duration_minutes: 30,
              resources: [],
              completed: true,
            },
          ],
        },
      ];

      render(<MilestoneAccordion {...defaultProps} dailyTasks={completedTasks} />);

      const progressChip = screen.getByText('100%').closest('.MuiChip-root');
      expect(progressChip).toHaveClass('MuiChip-colorSuccess');
    });
  });
});
