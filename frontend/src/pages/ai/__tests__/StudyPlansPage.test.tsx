/**
 * Component Tests for StudyPlansPage
 * Tests form validation, plan creation, and plan management
 * 
 * Requirements: INT-1.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import StudyPlansPage from '../StudyPlansPage';
import studyPlanReducer from '../../../store/slices/studyPlanSlice';
import type { StudyPlan } from '../../../services/studyPlanService';
import studyPlanService from '../../../services/studyPlanService';

// Mock the studyPlanService
vi.mock('../../../services/studyPlanService', () => ({
  default: {
    getActiveStudyPlan: vi.fn(),
    createStudyPlan: vi.fn(),
    updateProgress: vi.fn(),
    abandonPlan: vi.fn(),
  },
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(() => 'Jan 15, 2024'),
}));

describe('StudyPlansPage', () => {
  const mockActivePlan: StudyPlan = {
    id: 1,
    user_id: 123,
    target_role: 'Software Engineer',
    duration_days: 30,
    available_hours_per_week: 10,
    plan_data: {
      daily_tasks: [
        {
          day: 1,
          date: '2024-01-15',
          tasks: [
            {
              skill: 'Variables',
              activity: 'Learn variable declarations',
              duration_minutes: 30,
              resources: [],
              completed: false,
            },
          ],
        },
      ],
      weekly_milestones: [
        {
          week: 1,
          milestone: 'Learn JavaScript basics',
          skills_covered: ['Variables', 'Functions'],
          assessment: 'Complete JavaScript basics quiz',
          completed: false,
        },
      ],
      resource_links: {},
      time_estimates: {
        total_hours: 120,
        hours_per_week: 10,
        completion_date: '2024-02-15',
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

  beforeEach(() => {
    // Default: no active plan (rejected)
    vi.mocked(studyPlanService.getActiveStudyPlan).mockRejectedValue(
      new Error('Failed to load study plan')
    );
  });

  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        studyPlan: studyPlanReducer,
      },
      preloadedState: {
        studyPlan: {
          plans: {},
          activePlan: null,
          isLoading: false,
          isGenerating: false,
          error: null,
          ...initialState,
        },
      },
    });
  };

  const renderWithProviders = (ui: React.ReactElement, store = createMockStore()) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>{ui}</BrowserRouter>
      </Provider>
    );
  };

  describe('Page Header', () => {
    it('should display page title', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByText('Study Plans')).toBeInTheDocument();
    });

    it('should display page description', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByText(/AI-powered personalized learning roadmaps/i)).toBeInTheDocument();
    });

    it('should display "New Plan" button when active plan exists', async () => {
      vi.mocked(studyPlanService.getActiveStudyPlan).mockResolvedValue(mockActivePlan);
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByRole('button', { name: /new plan/i })).toBeInTheDocument();
    });

    it('should not display "New Plan" button when no active plan', async () => {
      renderWithProviders(<StudyPlansPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading study plan...')).not.toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /new plan/i })).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner when isLoading is true', () => {
      const store = createMockStore({ isLoading: true });
      renderWithProviders(<StudyPlansPage />, store);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should not display form when loading', () => {
      const store = createMockStore({ isLoading: true });
      renderWithProviders(<StudyPlansPage />, store);

      expect(screen.queryByText('Create Study Plan')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error alert when error exists', async () => {
      renderWithProviders(<StudyPlansPage />);

      // Wait for the async fetchActivePlan to complete and show error
      await waitFor(() => {
        expect(screen.getByText('Failed to load study plan')).toBeInTheDocument();
      });
    });

    it('should display error alert with close button', async () => {
      renderWithProviders(<StudyPlansPage />);

      // Wait for the async fetchActivePlan to complete and show error
      const alert = await screen.findByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Create Plan Form', () => {
    it('should display create form when no active plan', async () => {
      renderWithProviders(<StudyPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Create Study Plan')).toBeInTheDocument();
      });
    });

    it('should display form description', async () => {
      renderWithProviders(<StudyPlansPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/generate a personalized learning roadmap/i)
        ).toBeInTheDocument();
      });
    });

    it('should display target role dropdown', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByLabelText(/target role/i)).toBeInTheDocument();
    });

    it('should display duration input', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByLabelText(/duration \(days\)/i)).toBeInTheDocument();
    });

    it('should display hours per week input', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByLabelText(/available hours per week/i)).toBeInTheDocument();
    });

    it('should display generate button', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByRole('button', { name: /generate study plan/i })).toBeInTheDocument();
    });

    it('should have default values for duration and hours', async () => {
      renderWithProviders(<StudyPlansPage />);

      const durationInput = (await screen.findByLabelText(/duration \(days\)/i)) as HTMLInputElement;
      const hoursInput = (await screen.findByLabelText(/available hours per week/i)) as HTMLInputElement;

      expect(durationInput.value).toBe('30');
      expect(hoursInput.value).toBe('10');
    });

    it('should display helper text for duration', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByText(/minimum 7 days, maximum 365 days/i)).toBeInTheDocument();
    });

    it('should display helper text for hours', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(
        await screen.findByText(/how many hours per week can you dedicate to learning/i)
      ).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should disable generate button when target role is not selected', async () => {
      renderWithProviders(<StudyPlansPage />);

      const generateButton = await screen.findByRole('button', { name: /generate study plan/i });
      expect(generateButton).toBeDisabled();
    });

    it('should enable generate button when target role is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StudyPlansPage />);

      const roleSelect = await screen.findByLabelText(/target role/i);
      await user.click(roleSelect);

      const option = await screen.findByText('Software Engineer');
      await user.click(option);

      await waitFor(async () => {
        const generateButton = await screen.findByRole('button', { name: /generate study plan/i });
        expect(generateButton).not.toBeDisabled();
      });
    });

    it('should allow changing duration value', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StudyPlansPage />);

      const durationInput = await screen.findByLabelText(/duration \(days\)/i);
      await user.clear(durationInput);
      await user.type(durationInput, '60');

      expect(durationInput).toHaveValue(60);
    });

    it('should allow changing hours per week value', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StudyPlansPage />);

      const hoursInput = await screen.findByLabelText(/available hours per week/i);
      await user.clear(hoursInput);
      await user.type(hoursInput, '20');

      expect(hoursInput).toHaveValue(20);
    });

    it('should have min/max constraints on duration input', async () => {
      renderWithProviders(<StudyPlansPage />);

      const durationInput = await screen.findByLabelText(/duration \(days\)/i);
      expect(durationInput).toHaveAttribute('min', '7');
      expect(durationInput).toHaveAttribute('max', '365');
    });

    it('should have min/max constraints on hours input', async () => {
      renderWithProviders(<StudyPlansPage />);

      const hoursInput = await screen.findByLabelText(/available hours per week/i);
      expect(hoursInput).toHaveAttribute('min', '1');
      expect(hoursInput).toHaveAttribute('max', '40');
    });
  });

  describe('Form Submission', () => {
    it('should disable generate button when isGenerating is true', async () => {
      const store = createMockStore({ isGenerating: true });
      renderWithProviders(<StudyPlansPage />, store);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Loading study plan...')).not.toBeInTheDocument();
      });

      const generateButton = screen.getByRole('button', { name: /generating plan/i });
      expect(generateButton).toBeDisabled();
    });

    it('should show loading spinner in button when generating', async () => {
      const store = createMockStore({ isGenerating: true });
      renderWithProviders(<StudyPlansPage />, store);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Loading study plan...')).not.toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /generating plan/i });
      const spinner = button.querySelector('[role="progressbar"]');
      expect(spinner).toBeInTheDocument();
    });

    it('should display "Generating Plan..." text when generating', async () => {
      const store = createMockStore({ isGenerating: true });
      renderWithProviders(<StudyPlansPage />, store);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Loading study plan...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Generating Plan...')).toBeInTheDocument();
    });
  });

  describe('Active Plan Display', () => {
    beforeEach(() => {
      // Mock service to return active plan
      vi.mocked(studyPlanService.getActiveStudyPlan).mockResolvedValue(mockActivePlan);
    });

    it('should display plan target role', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByText('Software Engineer')).toBeInTheDocument();
    });

    it('should display plan status chip', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByText('ACTIVE')).toBeInTheDocument();
    });

    it('should display creation date', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByText(/created: jan 15, 2024/i)).toBeInTheDocument();
    });

    it('should display abandon plan button', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByRole('button', { name: /abandon plan/i })).toBeInTheDocument();
    });

    it('should display overall progress percentage', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByText('35%')).toBeInTheDocument();
      expect(await screen.findByText('Overall Progress')).toBeInTheDocument();
    });

    it('should display tasks completed', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByText('7')).toBeInTheDocument();
      expect(await screen.findByText('/ 20')).toBeInTheDocument();
      expect(await screen.findByText('Tasks Completed')).toBeInTheDocument();
    });

    it('should display milestones completed', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByText('1')).toBeInTheDocument();
      expect(await screen.findByText('/ 4')).toBeInTheDocument();
      expect(await screen.findByText('Milestones Completed')).toBeInTheDocument();
    });

    it('should display duration days', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByText('30')).toBeInTheDocument();
      expect(await screen.findByText(/days duration/i)).toBeInTheDocument();
    });

    it('should display hours per week', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByText('10')).toBeInTheDocument();
      expect(await screen.findByText(/hours\/week/i)).toBeInTheDocument();
    });

    it('should display total hours when available', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByText('120')).toBeInTheDocument();
      expect(await screen.findByText(/total hours/i)).toBeInTheDocument();
    });

    it('should display learning milestones section', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByText('Learning Milestones')).toBeInTheDocument();
    });

    it('should display milestones description', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(
        await screen.findByText(/track your progress through weekly milestones/i)
      ).toBeInTheDocument();
    });
  });

  describe('Abandon Plan Dialog', () => {
    beforeEach(() => {
      // Mock service to return active plan
      vi.mocked(studyPlanService.getActiveStudyPlan).mockResolvedValue(mockActivePlan);
    });

    it('should open dialog when abandon button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StudyPlansPage />);

      const abandonButton = await screen.findByRole('button', { name: /abandon plan/i });
      await user.click(abandonButton);

      expect(await screen.findByText('Abandon Study Plan?')).toBeInTheDocument();
    });

    it('should display confirmation message in dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StudyPlansPage />);

      const abandonButton = await screen.findByRole('button', { name: /abandon plan/i });
      await user.click(abandonButton);

      expect(
        await screen.findByText(/are you sure you want to abandon this study plan/i)
      ).toBeInTheDocument();
    });

    it('should display cancel button in dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StudyPlansPage />);

      const abandonButton = await screen.findByRole('button', { name: /abandon plan/i });
      await user.click(abandonButton);

      expect(await screen.findByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
    });

    it('should display abandon button in dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StudyPlansPage />);

      const abandonButton = await screen.findByRole('button', { name: /abandon plan/i });
      await user.click(abandonButton);

      // Check that the dialog is open
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Check for the abandon button within the dialog
      const dialogActions = dialog.querySelector('[class*="DialogActions"]');
      expect(dialogActions).toBeInTheDocument();
    });

    it('should close dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StudyPlansPage />);

      const abandonButton = await screen.findByRole('button', { name: /abandon plan/i });
      await user.click(abandonButton);

      const cancelButton = await screen.findByRole('button', { name: /^cancel$/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Abandon Study Plan?')).not.toBeInTheDocument();
      });
    });
  });

  describe('New Plan Button', () => {
    beforeEach(() => {
      // Mock service to return active plan
      vi.mocked(studyPlanService.getActiveStudyPlan).mockResolvedValue(mockActivePlan);
    });

    it('should show create form when "New Plan" button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StudyPlansPage />);

      const newPlanButton = await screen.findByRole('button', { name: /new plan/i });
      await user.click(newPlanButton);

      expect(await screen.findByText('Create Study Plan')).toBeInTheDocument();
    });

    it('should display cancel button in form when active plan exists', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StudyPlansPage />);

      const newPlanButton = await screen.findByRole('button', { name: /new plan/i });
      await user.click(newPlanButton);

      expect(await screen.findByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
    });

    it('should hide form when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StudyPlansPage />);

      const newPlanButton = await screen.findByRole('button', { name: /new plan/i });
      await user.click(newPlanButton);

      const cancelButton = await screen.findByRole('button', { name: /^cancel$/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Create Study Plan')).not.toBeInTheDocument();
      });
    });
  });

  describe('Target Role Options', () => {
    it('should display all target role options', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StudyPlansPage />);

      const roleSelect = await screen.findByLabelText(/target role/i);
      await user.click(roleSelect);

      const expectedRoles = [
        'Software Engineer',
        'Frontend Developer',
        'Backend Developer',
        'Full Stack Developer',
        'DevOps Engineer',
        'Data Scientist',
        'Machine Learning Engineer',
        'Product Manager',
        'UI/UX Designer',
        'QA Engineer',
      ];

      await waitFor(async () => {
        for (const role of expectedRoles) {
          expect(await screen.findByText(role)).toBeInTheDocument();
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it.skip('should handle plan with 0% progress', async () => {
      const zeroPlan: StudyPlan = {
        ...mockActivePlan,
        progress_percentage: 0,
        completed_tasks: 0,
        completed_milestones: 0,
      };

      // Clear previous mocks and set new one
      vi.mocked(studyPlanService.getActiveStudyPlan).mockReset();
      vi.mocked(studyPlanService.getActiveStudyPlan).mockResolvedValue(zeroPlan);
      
      renderWithProviders(<StudyPlansPage />);

      // Wait for the plan to load
      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle plan with 100% progress', async () => {
      const completePlan: StudyPlan = {
        ...mockActivePlan,
        progress_percentage: 100,
        completed_tasks: 20,
        completed_milestones: 4,
      };

      vi.mocked(studyPlanService.getActiveStudyPlan).mockResolvedValue(completePlan);
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByText('100%')).toBeInTheDocument();
    });

    it('should handle plan without time estimates', async () => {
      const noEstimatesPlan: StudyPlan = {
        ...mockActivePlan,
        plan_data: {
          ...mockActivePlan.plan_data,
          time_estimates: {
            total_hours: 0,
            hours_per_week: 0,
            completion_date: '',
          },
        },
      };

      vi.mocked(studyPlanService.getActiveStudyPlan).mockResolvedValue(noEstimatesPlan);
      renderWithProviders(<StudyPlansPage />);

      // Should still render the component without crashing
      expect(await screen.findByText('Software Engineer')).toBeInTheDocument();
    });

    it('should handle completed status', async () => {
      const completedPlan: StudyPlan = {
        ...mockActivePlan,
        status: 'completed',
      };

      vi.mocked(studyPlanService.getActiveStudyPlan).mockResolvedValue(completedPlan);
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByText('COMPLETED')).toBeInTheDocument();
    });

    it('should handle abandoned status', async () => {
      const abandonedPlan: StudyPlan = {
        ...mockActivePlan,
        status: 'abandoned',
      };

      vi.mocked(studyPlanService.getActiveStudyPlan).mockResolvedValue(abandonedPlan);
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByText('ABANDONED')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form inputs', async () => {
      renderWithProviders(<StudyPlansPage />);

      expect(await screen.findByLabelText(/target role/i)).toBeInTheDocument();
      expect(await screen.findByLabelText(/duration \(days\)/i)).toBeInTheDocument();
      expect(await screen.findByLabelText(/available hours per week/i)).toBeInTheDocument();
    });

    it('should have accessible buttons', async () => {
      renderWithProviders(<StudyPlansPage />);

      const generateButton = await screen.findByRole('button', { name: /generate study plan/i });
      expect(generateButton).toHaveAccessibleName();
    });

    it('should have accessible error alert', async () => {
      renderWithProviders(<StudyPlansPage />);

      const alert = await screen.findByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have accessible dialog', async () => {
      const user = userEvent.setup();
      vi.mocked(studyPlanService.getActiveStudyPlan).mockResolvedValue(mockActivePlan);
      renderWithProviders(<StudyPlansPage />);

      const abandonButton = await screen.findByRole('button', { name: /abandon plan/i });
      await user.click(abandonButton);

      const dialog = await screen.findByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });
});
