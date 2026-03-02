/**
 * ResumeListPage Tests
 * Tests for search and filter functionality
 * Requirements: NEW-3.3, NEW-3.4, NEW-3.5, NEW-3.6, NEW-3.7, NEW-3.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ResumeListPage from '../ResumeListPage';
import * as resumeService from '../../../services/resumeService';

// Mock the resume service
vi.mock('../../../services/resumeService');

const mockResumes = [
  {
    id: 1,
    filename: 'john_doe_resume.pdf',
    file_size: 102400,
    status: 'completed',
    seniority_level: 'Senior',
    total_experience_months: 60,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    skills: {
      technical_skills: ['Python', 'JavaScript', 'React'],
      soft_skills: ['Leadership', 'Communication'],
    },
  },
  {
    id: 2,
    filename: 'jane_smith_cv.pdf',
    file_size: 204800,
    status: 'completed',
    seniority_level: 'Mid',
    total_experience_months: 36,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    skills: {
      technical_skills: ['Java', 'Spring Boot', 'Docker'],
      soft_skills: ['Teamwork'],
    },
  },
  {
    id: 3,
    filename: 'developer_resume.pdf',
    file_size: 153600,
    status: 'completed',
    seniority_level: 'Entry',
    total_experience_months: 12,
    created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(), // 50 days ago
    skills: {
      technical_skills: ['TypeScript', 'Node.js', 'MongoDB'],
      soft_skills: ['Problem Solving'],
    },
  },
  {
    id: 4,
    filename: 'senior_engineer.pdf',
    file_size: 256000,
    status: 'completed',
    seniority_level: 'Staff',
    total_experience_months: 120,
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(), // 120 days ago
    skills: {
      technical_skills: ['Kubernetes', 'AWS', 'Terraform'],
      soft_skills: ['Mentoring'],
    },
  },
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <ResumeListPage />
    </BrowserRouter>
  );
};

describe('ResumeListPage - Search and Filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resumeService.resumeService.getResumes).mockResolvedValue({
      resumes: mockResumes,
      total: mockResumes.length,
    });
  });

  describe('Search Input Filtering', () => {
    it('should filter resumes by filename', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., resume.pdf or Python/i);
      await user.type(searchInput, 'jane');

      await waitFor(() => {
        expect(screen.getByText('jane_smith_cv.pdf')).toBeInTheDocument();
        expect(screen.queryByText('john_doe_resume.pdf')).not.toBeInTheDocument();
      });
    });

    it('should filter resumes by skills', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., resume.pdf or Python/i);
      await user.type(searchInput, 'Python');

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
        expect(screen.queryByText('jane_smith_cv.pdf')).not.toBeInTheDocument();
      });
    });

    it('should be case-insensitive when searching', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., resume.pdf or Python/i);
      await user.type(searchInput, 'python');

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
      });
    });

    it('should show all resumes when search is cleared', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., resume.pdf or Python/i);
      await user.type(searchInput, 'Python');

      await waitFor(() => {
        expect(screen.queryByText('jane_smith_cv.pdf')).not.toBeInTheDocument();
      });

      await user.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
        expect(screen.getByText('jane_smith_cv.pdf')).toBeInTheDocument();
      });
    });

    it('should search in both filename and skills', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., resume.pdf or Python/i);
      await user.type(searchInput, 'developer');

      await waitFor(() => {
        expect(screen.getByText('developer_resume.pdf')).toBeInTheDocument();
      });
    });
  });

  describe('Upload Date Filter', () => {
    it('should filter by last 7 days', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
      });

      const dateSelect = screen.getByLabelText(/Upload Date/i);
      await user.click(dateSelect);
      
      const last7DaysOption = await screen.findByRole('option', { name: 'Last 7 Days' });
      await user.click(last7DaysOption);

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
        expect(screen.queryByText('jane_smith_cv.pdf')).not.toBeInTheDocument();
        expect(screen.queryByText('senior_engineer.pdf')).not.toBeInTheDocument();
      });
    });

    it('should filter by last 30 days', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
      });

      const dateSelect = screen.getByLabelText(/Upload Date/i);
      await user.click(dateSelect);
      
      const last30DaysOption = await screen.findByRole('option', { name: 'Last 30 Days' });
      await user.click(last30DaysOption);

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
        expect(screen.getByText('jane_smith_cv.pdf')).toBeInTheDocument();
        expect(screen.queryByText('senior_engineer.pdf')).not.toBeInTheDocument();
      });
    });

    it('should show all resumes when "All Time" is selected', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
      });

      const dateSelect = screen.getByLabelText(/Upload Date/i);
      await user.click(dateSelect);
      
      const last7DaysOption = await screen.findByRole('option', { name: 'Last 7 Days' });
      await user.click(last7DaysOption);

      await waitFor(() => {
        expect(screen.queryByText('jane_smith_cv.pdf')).not.toBeInTheDocument();
      });

      await user.click(dateSelect);
      const allTimeOption = await screen.findByRole('option', { name: 'All Time' });
      await user.click(allTimeOption);

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
        expect(screen.getByText('jane_smith_cv.pdf')).toBeInTheDocument();
      });
    });
  });

  describe('No Results Found State', () => {
    it('should display EmptyState when filters return no results', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., resume.pdf or Python/i);
      await user.type(searchInput, 'NonexistentSkill');

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Clear Filters/i })).toBeInTheDocument();
      });
    });

    it('should clear filters when Clear Filters button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., resume.pdf or Python/i);
      await user.type(searchInput, 'NonexistentSkill');

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /Clear Filters/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
        expect(screen.getByText('jane_smith_cv.pdf')).toBeInTheDocument();
      });
    });

    it('should show upload prompt when no resumes exist', async () => {
      vi.mocked(resumeService.resumeService.getResumes).mockResolvedValue({
        resumes: [],
        total: 0,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No resumes uploaded yet')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Upload Your First Resume/i })).toBeInTheDocument();
      });
    });
  });

  describe('URL Query Parameter Persistence', () => {
    it('should persist search filter in URL', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., resume.pdf or Python/i);
      await user.type(searchInput, 'Python');

      await waitFor(() => {
        expect(window.location.search).toContain('search=Python');
      });
    });

    it('should persist upload date filter in URL', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
      });

      const dateSelect = screen.getByLabelText(/Upload Date/i);
      await user.click(dateSelect);
      
      const last7DaysOption = await screen.findByRole('option', { name: 'Last 7 Days' });
      await user.click(last7DaysOption);

      await waitFor(() => {
        expect(window.location.search).toContain('uploadDate=7days');
      });
    });

    it('should persist multiple filters in URL', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., resume.pdf or Python/i);
      await user.type(searchInput, 'resume');

      const dateSelect = screen.getByLabelText(/Upload Date/i);
      await user.click(dateSelect);
      const last30DaysOption = await screen.findByRole('option', { name: 'Last 30 Days' });
      await user.click(last30DaysOption);

      await waitFor(() => {
        expect(window.location.search).toContain('search=resume');
        expect(window.location.search).toContain('uploadDate=30days');
      });
    });
  });

  describe('Real-time Filtering', () => {
    it('should filter results in real-time as user types', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., resume.pdf or Python/i);
      
      await user.type(searchInput, 'j');
      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
        expect(screen.getByText('jane_smith_cv.pdf')).toBeInTheDocument();
      });

      await user.type(searchInput, 'o');
      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
        expect(screen.queryByText('jane_smith_cv.pdf')).not.toBeInTheDocument();
      });
    });
  });

  describe('Combined Filters', () => {
    it('should apply both search and date filter together', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/e.g., resume.pdf or Python/i);
      await user.type(searchInput, 'resume');

      const dateSelect = screen.getByLabelText(/Upload Date/i);
      await user.click(dateSelect);
      const last7DaysOption = await screen.findByRole('option', { name: 'Last 7 Days' });
      await user.click(last7DaysOption);

      await waitFor(() => {
        expect(screen.getByText('john_doe_resume.pdf')).toBeInTheDocument();
        expect(screen.queryByText('jane_smith_cv.pdf')).not.toBeInTheDocument();
        expect(screen.queryByText('developer_resume.pdf')).not.toBeInTheDocument();
      });
    });
  });
});
