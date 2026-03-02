/**
 * SessionHistoryPage Tests
 * Tests for search and filter functionality
 * Requirements: NEW-3.1, NEW-3.2, NEW-3.5, NEW-3.6, NEW-3.7, NEW-3.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SessionHistoryPage from '../SessionHistoryPage';
import * as interviewService from '../../../services/interviewService';

// Mock the interview service
vi.mock('../../../services/interviewService');

const mockSessions = [
  {
    id: 1,
    role: 'Software Engineer',
    difficulty: 'Medium',
    status: 'completed',
    question_count: 5,
    start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    end_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    overall_session_score: 85.5,
  },
  {
    id: 2,
    role: 'Frontend Developer',
    difficulty: 'Hard',
    status: 'completed',
    question_count: 7,
    start_time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    end_time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    overall_session_score: 72.3,
  },
  {
    id: 3,
    role: 'Backend Engineer',
    difficulty: 'Easy',
    status: 'in_progress',
    question_count: 3,
    start_time: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days ago
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    overall_session_score: 55.0,
  },
  {
    id: 4,
    role: 'Data Scientist',
    difficulty: 'Expert',
    status: 'completed',
    question_count: 10,
    start_time: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days ago
    end_time: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
    created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    overall_session_score: 92.0,
  },
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <SessionHistoryPage />
    </BrowserRouter>
  );
};

describe('SessionHistoryPage - Search and Filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(interviewService.getInterviewSessions).mockResolvedValue(mockSessions);
  });

  describe('Search Input Filtering', () => {
    it('should filter sessions by role name', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., Software Engineer/i);
      await user.type(searchInput, 'Frontend');

      await waitFor(() => {
        expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
        expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
        expect(screen.queryByText('Backend Engineer')).not.toBeInTheDocument();
      });
    });

    it('should be case-insensitive when searching', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., Software Engineer/i);
      await user.type(searchInput, 'software');

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });
    });

    it('should show all sessions when search is cleared', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., Software Engineer/i);
      await user.type(searchInput, 'Frontend');

      await waitFor(() => {
        expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
      });

      await user.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      });
    });
  });

  describe('Filter Dropdown Functionality', () => {
    it('should filter by difficulty level', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      const difficultySelect = screen.getByLabelText(/Difficulty/i);
      await user.click(difficultySelect);
      
      const hardOption = await screen.findByRole('option', { name: 'Hard' });
      await user.click(hardOption);

      await waitFor(() => {
        expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
        expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
      });
    });

    it('should filter by status', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText(/Status/i);
      await user.click(statusSelect);
      
      const completedOption = await screen.findByRole('option', { name: 'Completed' });
      await user.click(completedOption);

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
        expect(screen.queryByText('Backend Engineer')).not.toBeInTheDocument();
      });
    });

    it('should filter by date range - last 7 days', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      const dateRangeSelect = screen.getByLabelText(/Date Range/i);
      await user.click(dateRangeSelect);
      
      const last7DaysOption = await screen.findByRole('option', { name: 'Last 7 Days' });
      await user.click(last7DaysOption);

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.queryByText('Frontend Developer')).not.toBeInTheDocument();
        expect(screen.queryByText('Data Scientist')).not.toBeInTheDocument();
      });
    });

    it('should filter by score range', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      const scoreRangeSelect = screen.getByLabelText(/Score Range/i);
      await user.click(scoreRangeSelect);
      
      const excellentOption = await screen.findByRole('option', { name: /85-100/ });
      await user.click(excellentOption);

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('Data Scientist')).toBeInTheDocument();
        expect(screen.queryByText('Frontend Developer')).not.toBeInTheDocument();
      });
    });
  });

  describe('No Results Found State', () => {
    it('should display EmptyState when filters return no results', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., Software Engineer/i);
      await user.type(searchInput, 'NonexistentRole');

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Clear Filters/i })).toBeInTheDocument();
      });
    });

    it('should clear filters when Clear Filters button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., Software Engineer/i);
      await user.type(searchInput, 'NonexistentRole');

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /Clear Filters/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      });
    });
  });

  describe('URL Query Parameter Persistence', () => {
    it('should persist search filter in URL', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., Software Engineer/i);
      await user.type(searchInput, 'Frontend');

      await waitFor(() => {
        expect(window.location.search).toContain('role=Frontend');
      });
    });

    it('should persist difficulty filter in URL', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      const difficultySelect = screen.getByLabelText(/Difficulty/i);
      await user.click(difficultySelect);
      
      const hardOption = await screen.findByRole('option', { name: 'Hard' });
      await user.click(hardOption);

      await waitFor(() => {
        expect(window.location.search).toContain('difficulty=Hard');
      });
    });

    it('should persist multiple filters in URL', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., Software Engineer/i);
      await user.type(searchInput, 'Engineer');

      const statusSelect = screen.getByLabelText(/Status/i);
      await user.click(statusSelect);
      const completedOption = await screen.findByRole('option', { name: 'Completed' });
      await user.click(completedOption);

      await waitFor(() => {
        expect(window.location.search).toContain('role=Engineer');
        expect(window.location.search).toContain('status=completed');
      });
    });
  });

  describe('Real-time Filtering', () => {
    it('should filter results in real-time as user types', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., Software Engineer/i);
      
      await user.type(searchInput, 'F');
      await waitFor(() => {
        expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      });

      await user.type(searchInput, 'r');
      await waitFor(() => {
        expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      });

      await user.type(searchInput, 'o');
      await waitFor(() => {
        expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
        expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
      });
    });
  });

  describe('Score Display', () => {
    it('should display session scores in the table', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('85.5')).toBeInTheDocument();
        expect(screen.getByText('72.3')).toBeInTheDocument();
        expect(screen.getByText('92.0')).toBeInTheDocument();
      });
    });

    it('should display N/A for sessions without scores', async () => {
      const sessionsWithoutScores = [
        {
          ...mockSessions[0],
          overall_session_score: undefined,
        },
      ];
      
      vi.mocked(interviewService.getInterviewSessions).mockResolvedValue(sessionsWithoutScores);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('N/A')).toBeInTheDocument();
      });
    });
  });
});
