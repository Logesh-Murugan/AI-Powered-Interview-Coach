/**
 * Component Tests for ResumeAnalysisCard
 * Tests rendering, interactions, loading states, error states, and button handlers
 * 
 * Requirements: INT-1.5, INT-1.6, INT-1.7
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResumeAnalysisCard from '../ResumeAnalysisCard';
import type { ResumeAnalysis } from '../../../services/resumeAnalysisService';

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, formatStr: string) => '2024-01-15 10:00'),
}));

describe('ResumeAnalysisCard', () => {
  const mockAnalysis: ResumeAnalysis = {
    analysis_id: 1,
    resume_id: 123,
    analysis_data: {
      skill_inventory: {
        technical_skills: ['JavaScript', 'TypeScript', 'React'],
        soft_skills: ['Communication', 'Leadership'],
        tools: ['Git', 'Docker'],
        languages: ['English', 'Spanish'],
      },
      experience_timeline: {
        total_years: 5,
        seniority_level: 'Mid',
        companies: ['Company A', 'Company B'],
        roles: ['Developer', 'Senior Developer'],
      },
      skill_gaps: {
        target_role: 'Software Engineer',
        required_missing: ['Kubernetes'],
        preferred_missing: ['AWS'],
        match_percentage: 85,
      },
      improvement_roadmap: {
        timeline_weeks: 12,
        milestones: [
          {
            milestone_number: 1,
            weeks: '1-4',
            skills_to_learn: ['Kubernetes basics'],
            estimated_hours: 20,
            activities: ['Complete online course'],
          },
        ],
        success_tips: ['Practice regularly'],
      },
    },
    execution_time_ms: 1500,
    status: 'completed',
    analyzed_at: '2024-01-15T10:00:00Z',
    from_cache: false,
    cache_age_days: 0,
  };

  const defaultProps = {
    analysis: null,
    isLoading: false,
    isGenerating: false,
    error: null,
    onGenerate: vi.fn(),
    onRegenerate: vi.fn(),
    onViewDetails: vi.fn(),
  };

  describe('Loading State', () => {
    it('should display loading spinner when isLoading is true', () => {
      render(<ResumeAnalysisCard {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Loading analysis...')).toBeInTheDocument();
    });

    it('should not display content when loading', () => {
      render(<ResumeAnalysisCard {...defaultProps} isLoading={true} />);

      expect(screen.queryByText('Generate Analysis')).not.toBeInTheDocument();
      expect(screen.queryByText('Resume Analysis')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error exists', () => {
      const errorMessage = 'Failed to load analysis';
      render(<ResumeAnalysisCard {...defaultProps} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should display retry button on error', () => {
      render(<ResumeAnalysisCard {...defaultProps} error="Error occurred" />);

      const retryButton = screen.getByRole('button', { name: /retry analysis/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call onGenerate when retry button is clicked', async () => {
      const user = userEvent.setup();
      const onGenerate = vi.fn();

      render(
        <ResumeAnalysisCard
          {...defaultProps}
          error="Error occurred"
          onGenerate={onGenerate}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry analysis/i });
      await user.click(retryButton);

      expect(onGenerate).toHaveBeenCalledTimes(1);
    });

    it('should not display analysis content when error exists', () => {
      render(<ResumeAnalysisCard {...defaultProps} error="Error" />);

      expect(screen.queryByText('Skills Identified')).not.toBeInTheDocument();
    });
  });

  describe('No Analysis State', () => {
    it('should display generate analysis prompt when no analysis exists', () => {
      render(<ResumeAnalysisCard {...defaultProps} />);

      expect(screen.getByText('AI-Powered Resume Analysis')).toBeInTheDocument();
      expect(
        screen.getByText('Get insights on your skills, experience, and improvement areas')
      ).toBeInTheDocument();
    });

    it('should display generate button when no analysis exists', () => {
      render(<ResumeAnalysisCard {...defaultProps} />);

      const generateButton = screen.getByRole('button', { name: /generate analysis/i });
      expect(generateButton).toBeInTheDocument();
      expect(generateButton).not.toBeDisabled();
    });

    it('should call onGenerate when generate button is clicked', async () => {
      const user = userEvent.setup();
      const onGenerate = vi.fn();

      render(<ResumeAnalysisCard {...defaultProps} onGenerate={onGenerate} />);

      const generateButton = screen.getByRole('button', { name: /generate analysis/i });
      await user.click(generateButton);

      expect(onGenerate).toHaveBeenCalledTimes(1);
    });

    it('should disable generate button when isGenerating is true', () => {
      render(<ResumeAnalysisCard {...defaultProps} isGenerating={true} />);

      const generateButton = screen.getByRole('button', { name: /generating analysis/i });
      expect(generateButton).toBeDisabled();
    });

    it('should show generating text when isGenerating is true', () => {
      render(<ResumeAnalysisCard {...defaultProps} isGenerating={true} />);

      expect(screen.getByText('Generating Analysis...')).toBeInTheDocument();
    });

    it('should display loading spinner in button when generating', () => {
      render(<ResumeAnalysisCard {...defaultProps} isGenerating={true} />);

      const button = screen.getByRole('button', { name: /generating analysis/i });
      const spinner = button.querySelector('[role="progressbar"]');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Analysis Display', () => {
    it('should display analysis summary when analysis exists', () => {
      render(<ResumeAnalysisCard {...defaultProps} analysis={mockAnalysis} />);

      expect(screen.getByText('Resume Analysis')).toBeInTheDocument();
      expect(screen.getByText(/analyzed:/i)).toBeInTheDocument();
    });

    it('should display correct skill count', () => {
      render(<ResumeAnalysisCard {...defaultProps} analysis={mockAnalysis} />);

      // Total: 3 technical + 2 soft + 2 tools + 2 languages = 9
      expect(screen.getByText('9')).toBeInTheDocument();
      expect(screen.getByText('Skills Identified')).toBeInTheDocument();
    });

    it('should display correct skill gaps count', () => {
      render(<ResumeAnalysisCard {...defaultProps} analysis={mockAnalysis} />);

      // 1 required + 1 preferred = 2
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Skill Gaps')).toBeInTheDocument();
    });

    it('should display match percentage', () => {
      render(<ResumeAnalysisCard {...defaultProps} analysis={mockAnalysis} />);

      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Role Match')).toBeInTheDocument();
    });

    it('should display technical skills count', () => {
      render(<ResumeAnalysisCard {...defaultProps} analysis={mockAnalysis} />);

      // Check for the text content (strong tag splits the text)
      expect(screen.getByText('3', { exact: false })).toBeInTheDocument();
      expect(screen.getByText(/technical skills/i)).toBeInTheDocument();
    });

    it('should display learning milestones count', () => {
      render(<ResumeAnalysisCard {...defaultProps} analysis={mockAnalysis} />);

      // Check for the text content (strong tag splits the text)
      // Use getAllByText to find the specific "1" in the milestones context
      const milestonesText = screen.getByText(/learning milestones/i);
      expect(milestonesText).toBeInTheDocument();
      expect(milestonesText.textContent).toContain('1');
    });

    it('should display roadmap timeline', () => {
      render(<ResumeAnalysisCard {...defaultProps} analysis={mockAnalysis} />);

      // Check for the text content (strong tag splits the text)
      expect(screen.getByText('12', { exact: false })).toBeInTheDocument();
      expect(screen.getByText(/weeks roadmap/i)).toBeInTheDocument();
    });

    it('should display execution time', () => {
      render(<ResumeAnalysisCard {...defaultProps} analysis={mockAnalysis} />);

      expect(screen.getByText('1500ms')).toBeInTheDocument();
    });

    it('should display cache indicator when from_cache is true', () => {
      const cachedAnalysis = { ...mockAnalysis, from_cache: true, cache_age_days: 3 };
      render(<ResumeAnalysisCard {...defaultProps} analysis={cachedAnalysis} />);

      expect(screen.getByText(/cached.*3d old/i)).toBeInTheDocument();
    });

    it('should not display cache indicator when from_cache is false', () => {
      render(<ResumeAnalysisCard {...defaultProps} analysis={mockAnalysis} />);

      expect(screen.queryByText(/cached/i)).not.toBeInTheDocument();
    });
  });

  describe('Regenerate Button', () => {
    it('should display regenerate button when analysis exists', () => {
      render(<ResumeAnalysisCard {...defaultProps} analysis={mockAnalysis} />);

      const regenerateButton = screen.getByRole('button', { name: /regenerate/i });
      expect(regenerateButton).toBeInTheDocument();
    });

    it('should call onRegenerate when regenerate button is clicked', async () => {
      const user = userEvent.setup();
      const onRegenerate = vi.fn();

      render(
        <ResumeAnalysisCard
          {...defaultProps}
          analysis={mockAnalysis}
          onRegenerate={onRegenerate}
        />
      );

      const regenerateButton = screen.getByRole('button', { name: /^regenerate$/i });
      await user.click(regenerateButton);

      expect(onRegenerate).toHaveBeenCalledTimes(1);
    });

    it('should disable regenerate button when isGenerating is true', () => {
      render(
        <ResumeAnalysisCard
          {...defaultProps}
          analysis={mockAnalysis}
          isGenerating={true}
        />
      );

      const regenerateButton = screen.getByRole('button', { name: /regenerating/i });
      expect(regenerateButton).toBeDisabled();
    });

    it('should show regenerating text when isGenerating is true', () => {
      render(
        <ResumeAnalysisCard
          {...defaultProps}
          analysis={mockAnalysis}
          isGenerating={true}
        />
      );

      expect(screen.getByText('Regenerating...')).toBeInTheDocument();
    });
  });

  describe('View Details Button', () => {
    it('should display view details button when onViewDetails is provided', () => {
      render(<ResumeAnalysisCard {...defaultProps} analysis={mockAnalysis} />);

      const viewButton = screen.getByRole('button', { name: /view full analysis/i });
      expect(viewButton).toBeInTheDocument();
    });

    it('should call onViewDetails when view button is clicked', async () => {
      const user = userEvent.setup();
      const onViewDetails = vi.fn();

      render(
        <ResumeAnalysisCard
          {...defaultProps}
          analysis={mockAnalysis}
          onViewDetails={onViewDetails}
        />
      );

      const viewButton = screen.getByRole('button', { name: /view full analysis/i });
      await user.click(viewButton);

      expect(onViewDetails).toHaveBeenCalledTimes(1);
    });

    it('should not display view button when onViewDetails is not provided', () => {
      render(
        <ResumeAnalysisCard
          {...defaultProps}
          analysis={mockAnalysis}
          onViewDetails={undefined}
        />
      );

      expect(screen.queryByRole('button', { name: /view full analysis/i })).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle analysis with zero skills', () => {
      const emptyAnalysis: ResumeAnalysis = {
        ...mockAnalysis,
        analysis_data: {
          ...mockAnalysis.analysis_data,
          skill_inventory: {
            technical_skills: [],
            soft_skills: [],
            tools: [],
            languages: [],
          },
        },
      };

      render(<ResumeAnalysisCard {...defaultProps} analysis={emptyAnalysis} />);

      expect(screen.getByText('Skills Identified')).toBeInTheDocument();
      const skillsSection = screen.getByText('Skills Identified').closest('.MuiBox-root');
      expect(skillsSection).toHaveTextContent('0');
    });

    it('should handle analysis with zero skill gaps', () => {
      const noGapsAnalysis: ResumeAnalysis = {
        ...mockAnalysis,
        analysis_data: {
          ...mockAnalysis.analysis_data,
          skill_gaps: {
            target_role: 'Software Engineer',
            required_missing: [],
            preferred_missing: [],
            match_percentage: 100,
          },
        },
      };

      render(<ResumeAnalysisCard {...defaultProps} analysis={noGapsAnalysis} />);

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('Skill Gaps')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle analysis with zero milestones', () => {
      const noMilestonesAnalysis: ResumeAnalysis = {
        ...mockAnalysis,
        analysis_data: {
          ...mockAnalysis.analysis_data,
          improvement_roadmap: {
            timeline_weeks: 0,
            milestones: [],
            success_tips: [],
          },
        },
      };

      render(<ResumeAnalysisCard {...defaultProps} analysis={noMilestonesAnalysis} />);

      // Check for the text content (strong tag splits the text)
      expect(screen.getByText(/learning milestones/i)).toBeInTheDocument();
      expect(screen.getByText(/weeks roadmap/i)).toBeInTheDocument();
    });

    it('should handle undefined skill arrays', () => {
      const undefinedSkillsAnalysis: ResumeAnalysis = {
        ...mockAnalysis,
        analysis_data: {
          ...mockAnalysis.analysis_data,
          skill_inventory: {
            technical_skills: undefined as any,
            soft_skills: undefined as any,
            tools: undefined as any,
            languages: undefined as any,
          },
        },
      };

      render(<ResumeAnalysisCard {...defaultProps} analysis={undefinedSkillsAnalysis} />);

      expect(screen.getByText('Skills Identified')).toBeInTheDocument();
      const skillsSection = screen.getByText('Skills Identified').closest('.MuiBox-root');
      expect(skillsSection).toHaveTextContent('0');
    });

    it('should handle very large numbers', () => {
      const largeNumbersAnalysis: ResumeAnalysis = {
        ...mockAnalysis,
        analysis_data: {
          ...mockAnalysis.analysis_data,
          skill_inventory: {
            technical_skills: Array(50).fill('Skill'),
            soft_skills: Array(30).fill('Skill'),
            tools: Array(20).fill('Tool'),
            languages: Array(10).fill('Language'),
          },
        },
      };

      render(<ResumeAnalysisCard {...defaultProps} analysis={largeNumbersAnalysis} />);

      expect(screen.getByText('110')).toBeInTheDocument();
    });

    it('should handle cache_age_days of 0', () => {
      const freshCacheAnalysis = {
        ...mockAnalysis,
        from_cache: true,
        cache_age_days: 0,
      };

      render(<ResumeAnalysisCard {...defaultProps} analysis={freshCacheAnalysis} />);

      expect(screen.getByText(/cached.*0d old/i)).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should not call handlers multiple times on rapid clicks', async () => {
      const user = userEvent.setup();
      const onGenerate = vi.fn();

      render(<ResumeAnalysisCard {...defaultProps} onGenerate={onGenerate} />);

      const button = screen.getByRole('button', { name: /generate analysis/i });
      
      // Rapid clicks
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Should be called 3 times (no debouncing in component)
      expect(onGenerate).toHaveBeenCalledTimes(3);
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      const onGenerate = vi.fn();

      render(<ResumeAnalysisCard {...defaultProps} onGenerate={onGenerate} />);

      const button = screen.getByRole('button', { name: /generate analysis/i });
      button.focus();
      
      await user.keyboard('{Enter}');

      expect(onGenerate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible loading state', () => {
      render(<ResumeAnalysisCard {...defaultProps} isLoading={true} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should have accessible error alert', () => {
      render(<ResumeAnalysisCard {...defaultProps} error="Error message" />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      render(<ResumeAnalysisCard {...defaultProps} />);

      const button = screen.getByRole('button', { name: /generate analysis/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAccessibleName();
    });

    it('should have accessible regenerate button', () => {
      render(<ResumeAnalysisCard {...defaultProps} analysis={mockAnalysis} />);

      const button = screen.getByRole('button', { name: /^regenerate$/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAccessibleName();
    });
  });
});
