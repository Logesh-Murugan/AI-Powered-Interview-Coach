import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import CompanyCoachingPage from '../CompanyCoachingPage';
import companyCoachingReducer from '../../../store/slices/companyCoachingSlice';
import type { CoachingSession } from '../../../services/companyCoachingService';
import * as companyCoachingService from '../../../services/companyCoachingService';

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(() => 'Jan 15, 2024'),
}));

// Mock the company coaching service
vi.mock('../../../services/companyCoachingService', () => ({
  default: {
    getUserSessions: vi.fn(),
    createSession: vi.fn(),
    getSession: vi.fn(),
  },
}));

describe('CompanyCoachingPage', () => {
  const mockSession: CoachingSession = {
    id: 1,
    user_id: 123,
    company_name: 'Google',
    target_role: 'Software Engineer',
    company_overview: {
      culture: 'Innovation-driven culture with focus on impact',
      values: ['Innovation', 'Collaboration', 'Excellence'],
      interview_process: 'Multi-stage technical interviews with coding and system design',
    },
    predicted_questions: [
      {
        question: 'Tell me about yourself',
        category: 'Behavioral',
        difficulty: 'Easy',
        why_asked: 'To understand your background and communication skills',
      },
      {
        question: 'Design a URL shortener',
        category: 'System Design',
        difficulty: 'Hard',
        why_asked: 'To assess system design and scalability knowledge',
      },
    ],
    star_examples: [
      {
        situation: 'Working on a critical project with tight deadline',
        task: 'Deliver feature on time while maintaining quality',
        action: 'Coordinated with team and prioritized tasks',
        result: 'Delivered successfully with 95% test coverage',
        relevant_skills: ['Leadership', 'Communication', 'Time Management'],
      },
    ],
    confidence_tips: [
      'Practice coding daily on LeetCode',
      'Review system design patterns',
      'Prepare behavioral stories using STAR method',
    ],
    pre_interview_checklist: [
      'Research company culture and values',
      'Prepare questions for interviewer',
      'Review job description',
    ],
    execution_time_ms: 3000,
    created_at: '2024-01-15T10:00:00Z',
  };

  const mockSession2: CoachingSession = {
    ...mockSession,
    id: 2,
    company_name: 'Amazon',
    target_role: 'Backend Developer',
    created_at: '2024-01-20T14:00:00Z',
  };

  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        companyCoaching: companyCoachingReducer,
      },
      preloadedState: {
        companyCoaching: {
          sessions: {},
          userSessions: [],
          currentSession: null,
          isLoading: false,
          isGenerating: false,
          error: null,
          ...initialState,
        },
      },
    });
  };

  const renderWithProviders = (ui: React.ReactElement, store = createMockStore(), mockSessions: CoachingSession[] = [], skipMockSetup = false) => {
    // Configure the mock service to return the sessions (unless skipMockSetup is true)
    if (!skipMockSetup) {
      vi.mocked(companyCoachingService.default.getUserSessions).mockResolvedValue(mockSessions);
    }
    
    return render(
      <Provider store={store}>
        <BrowserRouter>{ui}</BrowserRouter>
      </Provider>
    );
  };

  describe('Page Header', () => {
    it('should display page title', () => {
      renderWithProviders(<CompanyCoachingPage />);

      expect(screen.getByText('Company Coaching')).toBeInTheDocument();
    });

    it('should display page description', () => {
      renderWithProviders(<CompanyCoachingPage />);

      expect(screen.getByText(/AI-powered company-specific interview preparation/i)).toBeInTheDocument();
    });

    it('should display "New Session" button when not showing form', () => {
      renderWithProviders(<CompanyCoachingPage />);

      expect(screen.getByRole('button', { name: /new session/i })).toBeInTheDocument();
    });

    it('should hide "New Session" button when form is shown', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompanyCoachingPage />);

      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      await user.click(newSessionButton);

      expect(screen.queryByRole('button', { name: /new session/i })).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner when isLoading is true', () => {
      const store = createMockStore({ isLoading: true });
      renderWithProviders(<CompanyCoachingPage />, store);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should not display content when loading', () => {
      const store = createMockStore({ isLoading: true });
      renderWithProviders(<CompanyCoachingPage />, store);

      expect(screen.queryByText('Create Coaching Session')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error alert when error exists', async () => {
      // Mock the service to reject with an error
      vi.mocked(companyCoachingService.default.getUserSessions).mockRejectedValue(
        new Error('Failed to load coaching sessions')
      );

      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [], true);

      // Wait for the error to appear
      await waitFor(() => {
        expect(screen.getByText('Failed to load coaching sessions')).toBeInTheDocument();
      });
    });

    it('should display error alert with close button', async () => {
      // Mock the service to reject with an error
      vi.mocked(companyCoachingService.default.getUserSessions).mockRejectedValue(
        new Error('Error occurred')
      );

      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [], true);

      // Wait for the error alert to appear
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });
  });

  describe('Create Session Form', () => {
    it('should display create form when "New Session" button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompanyCoachingPage />);

      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      await user.click(newSessionButton);

      expect(screen.getByText('Create Coaching Session')).toBeInTheDocument();
    });

    it('should display form description', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompanyCoachingPage />);

      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      await user.click(newSessionButton);

      expect(
        screen.getByText(/get personalized interview coaching for a specific company and role/i)
      ).toBeInTheDocument();
    });

    it('should display company name input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompanyCoachingPage />);

      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      await user.click(newSessionButton);

      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    });

    it('should display target role dropdown', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompanyCoachingPage />);

      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      await user.click(newSessionButton);

      expect(screen.getByLabelText(/target role/i)).toBeInTheDocument();
    });

    it('should display generate button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompanyCoachingPage />);

      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      await user.click(newSessionButton);

      expect(screen.getByRole('button', { name: /generate coaching session/i })).toBeInTheDocument();
    });

    it('should display cancel button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompanyCoachingPage />);

      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      await user.click(newSessionButton);

      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
    });

    it('should hide form when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, []);

      // Wait for the empty state to appear
      await waitFor(() => {
        expect(screen.getByText('No Coaching Sessions Yet')).toBeInTheDocument();
      });

      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      await user.click(newSessionButton);

      // Wait for the form to appear - check for the form title specifically
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create coaching session/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
      await user.click(cancelButton);

      // Wait for the form title to disappear
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /create coaching session/i })).not.toBeInTheDocument();
      });
      
      // The empty state button should be visible after canceling
      expect(screen.getByRole('button', { name: /create coaching session/i })).toBeInTheDocument();
    });

    it('should have placeholder text for company name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompanyCoachingPage />);

      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      await user.click(newSessionButton);

      const input = screen.getByLabelText(/company name/i);
      expect(input).toHaveAttribute('placeholder', 'e.g., Google, Amazon, Microsoft');
    });
  });

  describe('Form Validation', () => {
    it('should disable generate button when company name is empty', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompanyCoachingPage />);

      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      await user.click(newSessionButton);

      const generateButton = screen.getByRole('button', { name: /generate coaching session/i });
      expect(generateButton).toBeDisabled();
    });

    it('should disable generate button when target role is not selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompanyCoachingPage />);

      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      await user.click(newSessionButton);

      const companyInput = screen.getByLabelText(/company name/i);
      await user.type(companyInput, 'Google');

      const generateButton = screen.getByRole('button', { name: /generate coaching session/i });
      expect(generateButton).toBeDisabled();
    });

    it('should enable generate button when both fields are filled', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompanyCoachingPage />);

      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      await user.click(newSessionButton);

      const companyInput = screen.getByLabelText(/company name/i);
      await user.type(companyInput, 'Google');

      const roleSelect = screen.getByLabelText(/target role/i);
      await user.click(roleSelect);

      const option = await screen.findByText('Software Engineer');
      await user.click(option);

      await waitFor(() => {
        const generateButton = screen.getByRole('button', { name: /generate coaching session/i });
        expect(generateButton).not.toBeDisabled();
      });
    });

    it('should allow typing in company name field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompanyCoachingPage />);

      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      await user.click(newSessionButton);

      const companyInput = screen.getByLabelText(/company name/i) as HTMLInputElement;
      await user.type(companyInput, 'Google');

      expect(companyInput.value).toBe('Google');
    });
  });

  describe('Form Submission', () => {
    it('should disable generate button when isGenerating is true', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isGenerating: true, showCreateForm: true });
      renderWithProviders(<CompanyCoachingPage />, store);

      // Click the "New Session" button to show the form
      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      await user.click(newSessionButton);

      const generateButton = screen.getByRole('button', { name: /generating session/i });
      expect(generateButton).toBeDisabled();
    });

    it('should show loading spinner in button when generating', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isGenerating: true, showCreateForm: true });
      renderWithProviders(<CompanyCoachingPage />, store);

      // Click the "New Session" button to show the form
      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      await user.click(newSessionButton);

      const button = screen.getByRole('button', { name: /generating session/i });
      const spinner = button.querySelector('[role="progressbar"]');
      expect(spinner).toBeInTheDocument();
    });

    it('should display "Generating Session..." text when generating', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isGenerating: true, showCreateForm: true });
      renderWithProviders(<CompanyCoachingPage />, store);

      // Click the "New Session" button to show the form
      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      await user.click(newSessionButton);

      expect(screen.getByText('Generating Session...')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no sessions exist', async () => {
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, []);

      // Wait for the fetchUserSessions to complete
      await waitFor(() => {
        expect(screen.getByText('No Coaching Sessions Yet')).toBeInTheDocument();
      });
    });

    it('should display empty state message', async () => {
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, []);

      // Wait for the fetchUserSessions to complete
      await waitFor(() => {
        expect(
          screen.getByText(/create your first coaching session to get company-specific interview preparation/i)
        ).toBeInTheDocument();
      });
    });

    it('should display create button in empty state', async () => {
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, []);

      // Wait for the fetchUserSessions to complete
      await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /create coaching session/i });
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('should show form when empty state button is clicked', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, []);

      // Wait for the fetchUserSessions to complete and empty state to appear
      await waitFor(() => {
        expect(screen.getByText('No Coaching Sessions Yet')).toBeInTheDocument();
      });

      const createButton = screen.getAllByRole('button', { name: /create coaching session/i })[0];
      await user.click(createButton);

      expect(screen.getByText('Create Coaching Session')).toBeInTheDocument();
    });
  });

  describe('Session List Display', () => {
    it('should display session cards when sessions exist', async () => {
      const store = createMockStore();
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });
    });

    it('should display session count', async () => {
      const store = createMockStore();
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession, mockSession2]);

      await waitFor(() => {
        expect(screen.getByText('Your Sessions (2)')).toBeInTheDocument();
      });
    });

    it('should display multiple session cards', async () => {
      const store = createMockStore();
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession, mockSession2]);

      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
        expect(screen.getByText('Amazon')).toBeInTheDocument();
      });
    });

    it('should not display empty state when sessions exist', async () => {
      const store = createMockStore();
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      await waitFor(() => {
        expect(screen.queryByText('No Coaching Sessions Yet')).not.toBeInTheDocument();
      });
    });
  });

  describe('Company Filter', () => {
    it('should display filter dropdown when multiple companies exist', async () => {
      const store = createMockStore();
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession, mockSession2]);

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by company/i)).toBeInTheDocument();
      });
    });

    it('should not display filter when only one company exists', async () => {
      const store = createMockStore();
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      await waitFor(() => {
        expect(screen.queryByLabelText(/filter by company/i)).not.toBeInTheDocument();
      });
    });

    it('should display "All Companies" option in filter', async () => {
      const user = userEvent.setup();
      const store = createMockStore();
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession, mockSession2]);

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by company/i)).toBeInTheDocument();
      });

      const filterSelect = screen.getByLabelText(/filter by company/i);
      await user.click(filterSelect);

      expect(await screen.findByText('All Companies')).toBeInTheDocument();
    });

    it('should display unique company names in filter', async () => {
      const user = userEvent.setup();
      const store = createMockStore();
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession, mockSession2]);

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by company/i)).toBeInTheDocument();
      });

      const filterSelect = screen.getByLabelText(/filter by company/i);
      await user.click(filterSelect);

      // Wait for the dropdown options to appear
      await waitFor(() => {
        const googleOptions = screen.getAllByText('Google');
        const amazonOptions = screen.getAllByText('Amazon');
        expect(googleOptions.length).toBeGreaterThan(0);
        expect(amazonOptions.length).toBeGreaterThan(0);
      });
    });

    it('should filter sessions when company is selected', async () => {
      const user = userEvent.setup();
      const store = createMockStore();
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession, mockSession2]);

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by company/i)).toBeInTheDocument();
      });

      const filterSelect = screen.getByLabelText(/filter by company/i);
      await user.click(filterSelect);

      // Use getAllByText and select the one in the dropdown menu
      const googleOptions = await screen.findAllByText('Google');
      const googleOptionInDropdown = googleOptions.find(el => el.closest('[role="option"]'));
      if (googleOptionInDropdown) {
        await user.click(googleOptionInDropdown);
      }

      await waitFor(() => {
        expect(screen.getByText('Your Sessions (1)')).toBeInTheDocument();
      });
    });
  });

  describe('Session Details Display', () => {
    it('should display session details when view details is clicked', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Google - Software Engineer')).toBeInTheDocument();
      });
    });

    it('should display tabs for session details', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /company overview/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /predicted questions/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /star examples/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /confidence tips/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /checklist/i })).toBeInTheDocument();
      });
    });

    it('should display company overview by default', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Company Culture')).toBeInTheDocument();
        expect(screen.getByText('Innovation-driven culture with focus on impact')).toBeInTheDocument();
      });
    });

    it('should display company values', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Core Values')).toBeInTheDocument();
        expect(screen.getByText('Innovation')).toBeInTheDocument();
        expect(screen.getByText('Collaboration')).toBeInTheDocument();
        expect(screen.getByText('Excellence')).toBeInTheDocument();
      });
    });

    it('should display interview process', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Interview Process')).toBeInTheDocument();
        expect(screen.getByText(/multi-stage technical interviews/i)).toBeInTheDocument();
      });
    });
  });

  describe('Predicted Questions Tab', () => {
    it('should display predicted questions when tab is clicked', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      const questionsTab = await screen.findByRole('tab', { name: /predicted questions/i });
      await user.click(questionsTab);

      await waitFor(() => {
        expect(screen.getByText('Tell me about yourself')).toBeInTheDocument();
        expect(screen.getByText('Design a URL shortener')).toBeInTheDocument();
      });
    });

    it('should display question difficulty badges', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      const questionsTab = await screen.findByRole('tab', { name: /predicted questions/i });
      await user.click(questionsTab);

      await waitFor(() => {
        expect(screen.getByText('Easy')).toBeInTheDocument();
        expect(screen.getByText('Hard')).toBeInTheDocument();
      });
    });

    it('should expand question accordion to show details', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      const questionsTab = await screen.findByRole('tab', { name: /predicted questions/i });
      await user.click(questionsTab);

      const accordion = await screen.findByText('Tell me about yourself');
      await user.click(accordion);

      await waitFor(() => {
        // Use getAllByText since there are multiple "Category" and "Why This Question?" elements
        const categoryElements = screen.getAllByText('Category');
        expect(categoryElements.length).toBeGreaterThan(0);
        expect(screen.getByText('Behavioral')).toBeInTheDocument();
        const whyQuestionElements = screen.getAllByText('Why This Question?');
        expect(whyQuestionElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('STAR Examples Tab', () => {
    it('should display STAR examples when tab is clicked', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      const starTab = await screen.findByRole('tab', { name: /star examples/i });
      await user.click(starTab);

      await waitFor(() => {
        expect(screen.getByText('Example 1')).toBeInTheDocument();
      });
    });

    it('should display STAR components', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      const starTab = await screen.findByRole('tab', { name: /star examples/i });
      await user.click(starTab);

      await waitFor(() => {
        expect(screen.getByText('Situation')).toBeInTheDocument();
        expect(screen.getByText('Task')).toBeInTheDocument();
        expect(screen.getByText('Action')).toBeInTheDocument();
        expect(screen.getByText('Result')).toBeInTheDocument();
      });
    });

    it('should display relevant skills for STAR example', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      const starTab = await screen.findByRole('tab', { name: /star examples/i });
      await user.click(starTab);

      await waitFor(() => {
        expect(screen.getByText('Leadership')).toBeInTheDocument();
        expect(screen.getByText('Communication')).toBeInTheDocument();
        expect(screen.getByText('Time Management')).toBeInTheDocument();
      });
    });
  });

  describe('Confidence Tips Tab', () => {
    it('should display confidence tips when tab is clicked', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      const tipsTab = await screen.findByRole('tab', { name: /confidence tips/i });
      await user.click(tipsTab);

      await waitFor(() => {
        expect(screen.getByText('Confidence Building Tips')).toBeInTheDocument();
      });
    });

    it('should display all confidence tips', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      const tipsTab = await screen.findByRole('tab', { name: /confidence tips/i });
      await user.click(tipsTab);

      await waitFor(() => {
        expect(screen.getByText('Practice coding daily on LeetCode')).toBeInTheDocument();
        expect(screen.getByText('Review system design patterns')).toBeInTheDocument();
        expect(screen.getByText('Prepare behavioral stories using STAR method')).toBeInTheDocument();
      });
    });
  });

  describe('Checklist Tab', () => {
    it('should display checklist when tab is clicked', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      const checklistTab = await screen.findByRole('tab', { name: /checklist/i });
      await user.click(checklistTab);

      await waitFor(() => {
        expect(screen.getByText('Pre-Interview Checklist')).toBeInTheDocument();
      });
    });

    it('should display all checklist items', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      const checklistTab = await screen.findByRole('tab', { name: /checklist/i });
      await user.click(checklistTab);

      await waitFor(() => {
        expect(screen.getByText('Research company culture and values')).toBeInTheDocument();
        expect(screen.getByText('Prepare questions for interviewer')).toBeInTheDocument();
        expect(screen.getByText('Review job description')).toBeInTheDocument();
      });
    });

    it('should display checkboxes for checklist items', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      const checklistTab = await screen.findByRole('tab', { name: /checklist/i });
      await user.click(checklistTab);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBe(3);
      });
    });

    it('should toggle checkbox when clicked', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      const checklistTab = await screen.findByRole('tab', { name: /checklist/i });
      await user.click(checklistTab);

      await waitFor(async () => {
        const checkboxes = screen.getAllByRole('checkbox');
        const firstCheckbox = checkboxes[0] as HTMLInputElement;
        
        expect(firstCheckbox.checked).toBe(false);
        
        await user.click(firstCheckbox);
        
        expect(firstCheckbox.checked).toBe(true);
      });
    });
  });

  describe('Target Role Options', () => {
    it('should display all target role options', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompanyCoachingPage />);

      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      await user.click(newSessionButton);

      const roleSelect = screen.getByLabelText(/target role/i);
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
    it('should not crash with session with no predicted questions', () => {
      const noQuestionsSession: CoachingSession = {
        ...mockSession,
        predicted_questions: [],
      };

      const store = createMockStore({ isLoading: false });
      
      // Should render without crashing
      expect(() => {
        renderWithProviders(<CompanyCoachingPage />, store, [noQuestionsSession]);
      }).not.toThrow();
    });

    it('should not crash with session with no STAR examples', () => {
      const noStarSession: CoachingSession = {
        ...mockSession,
        star_examples: [],
      };

      const store = createMockStore({ isLoading: false });
      
      // Should render without crashing
      expect(() => {
        renderWithProviders(<CompanyCoachingPage />, store, [noStarSession]);
      }).not.toThrow();
    });

    it('should not crash with session with no confidence tips', () => {
      const noTipsSession: CoachingSession = {
        ...mockSession,
        confidence_tips: [],
      };

      const store = createMockStore({ isLoading: false });
      
      // Should render without crashing
      expect(() => {
        renderWithProviders(<CompanyCoachingPage />, store, [noTipsSession]);
      }).not.toThrow();
    });

    it('should not crash with session with no checklist items', () => {
      const noChecklistSession: CoachingSession = {
        ...mockSession,
        pre_interview_checklist: [],
      };

      const store = createMockStore({ isLoading: false });
      
      // Should render without crashing
      expect(() => {
        renderWithProviders(<CompanyCoachingPage />, store, [noChecklistSession]);
      }).not.toThrow();
    });

    it('should not crash with very long company name', () => {
      const longNameSession: CoachingSession = {
        ...mockSession,
        company_name: 'Very Long Company Name That Might Overflow The Layout',
      };

      const store = createMockStore({ isLoading: false });
      
      // Should render without crashing
      expect(() => {
        renderWithProviders(<CompanyCoachingPage />, store, [longNameSession]);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form inputs', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompanyCoachingPage />);

      const newSessionButton = screen.getByRole('button', { name: /new session/i });
      await user.click(newSessionButton);

      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/target role/i)).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      renderWithProviders(<CompanyCoachingPage />);

      const button = screen.getByRole('button', { name: /new session/i });
      expect(button).toHaveAccessibleName();
    });

    it('should have accessible tabs', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBe(5);
        tabs.forEach(tab => {
          expect(tab).toHaveAccessibleName();
        });
      });
    });

    it('should have accessible error alert when error exists', async () => {
      // Mock the service to reject with an error
      vi.mocked(companyCoachingService.default.getUserSessions).mockRejectedValue(
        new Error('Error message')
      );

      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [], true);

      // Wait for the error alert to appear
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });

    it('should have accessible checkboxes', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ isLoading: false });
      renderWithProviders(<CompanyCoachingPage />, store, [mockSession]);

      // Wait for the session card to appear
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument();
      });

      const viewButton = await screen.findByRole('button', { name: /view details/i });
      await user.click(viewButton);

      const checklistTab = await screen.findByRole('tab', { name: /checklist/i });
      await user.click(checklistTab);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        checkboxes.forEach(checkbox => {
          expect(checkbox).toBeInTheDocument();
        });
      });
    });
  });
});
