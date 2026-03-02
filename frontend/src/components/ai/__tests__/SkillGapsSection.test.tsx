/**
 * Component Tests for SkillGapsSection
 * Tests rendering, sorting, and data display
 * 
 * Requirements: INT-1.7
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SkillGapsSection from '../SkillGapsSection';
import type { SkillGaps } from '../../../services/resumeAnalysisService';

describe('SkillGapsSection', () => {
  const mockSkillGaps: SkillGaps = {
    target_role: 'Software Engineer',
    required_missing: ['Kubernetes', 'Docker'],
    preferred_missing: ['AWS', 'Terraform'],
    match_percentage: 75,
    recommendation: 'Focus on containerization and cloud technologies',
  };

  describe('Rendering', () => {
    it('should display section title with target role', () => {
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      expect(screen.getByText(/skill gaps for software engineer/i)).toBeInTheDocument();
    });

    it('should display match percentage in description', () => {
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      expect(screen.getByText(/improve your match from 75% to 100%/i)).toBeInTheDocument();
    });

    it('should display all required missing skills', () => {
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      expect(screen.getByText('Kubernetes')).toBeInTheDocument();
      expect(screen.getByText('Docker')).toBeInTheDocument();
    });

    it('should display all preferred missing skills', () => {
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      expect(screen.getByText('AWS')).toBeInTheDocument();
      expect(screen.getByText('Terraform')).toBeInTheDocument();
    });

    it('should display recommendation when provided', () => {
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      expect(
        screen.getByText(/focus on containerization and cloud technologies/i)
      ).toBeInTheDocument();
    });

    it('should display table headers', () => {
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      expect(screen.getByText('Skill')).toBeInTheDocument();
      expect(screen.getByText('Importance')).toBeInTheDocument();
      expect(screen.getByText('Current Level')).toBeInTheDocument();
      expect(screen.getByText('Target Level')).toBeInTheDocument();
    });
  });

  describe('Skill Gap Rows', () => {
    it('should display correct importance badges for required skills', () => {
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      const requiredBadges = screen.getAllByText('REQUIRED');
      expect(requiredBadges).toHaveLength(2); // Kubernetes and Docker
    });

    it('should display correct importance badges for preferred skills', () => {
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      const preferredBadges = screen.getAllByText('PREFERRED');
      expect(preferredBadges).toHaveLength(2); // AWS and Terraform
    });

    it('should display "None" as current level for all skills', () => {
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      const noneLevels = screen.getAllByText('None');
      expect(noneLevels.length).toBeGreaterThan(0);
    });

    it('should display "Proficient" as target level for required skills', () => {
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      const proficientLevels = screen.getAllByText('Proficient');
      expect(proficientLevels).toHaveLength(2);
    });

    it('should display "Familiar" as target level for preferred skills', () => {
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      const familiarLevels = screen.getAllByText('Familiar');
      expect(familiarLevels).toHaveLength(2);
    });
  });

  describe('Sorting', () => {
    it('should display sort button in importance column', () => {
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      const sortButton = screen.getByRole('button', { name: /importance/i });
      expect(sortButton).toBeInTheDocument();
    });

    it('should sort by importance in descending order by default', () => {
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      const rows = screen.getAllByRole('row');
      // Skip header row
      const dataRows = rows.slice(1);

      // First two rows should be required (Kubernetes, Docker)
      expect(within(dataRows[0]).getByText('Kubernetes')).toBeInTheDocument();
      expect(within(dataRows[1]).getByText('Docker')).toBeInTheDocument();
      
      // Last two rows should be preferred (AWS, Terraform)
      expect(within(dataRows[2]).getByText('AWS')).toBeInTheDocument();
      expect(within(dataRows[3]).getByText('Terraform')).toBeInTheDocument();
    });

    it('should toggle sort order when sort button is clicked', async () => {
      const user = userEvent.setup();
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      const sortButton = screen.getByRole('button', { name: /importance/i });
      await user.click(sortButton);

      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1);

      // After clicking, order should be ascending (preferred first)
      expect(within(dataRows[0]).getByText('AWS')).toBeInTheDocument();
      expect(within(dataRows[1]).getByText('Terraform')).toBeInTheDocument();
    });

    it('should toggle back to descending order on second click', async () => {
      const user = userEvent.setup();
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      const sortButton = screen.getByRole('button', { name: /importance/i });
      
      // Click twice
      await user.click(sortButton);
      await user.click(sortButton);

      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1);

      // Should be back to descending (required first)
      expect(within(dataRows[0]).getByText('Kubernetes')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display success message when no skill gaps exist', () => {
      const noGaps: SkillGaps = {
        target_role: 'Software Engineer',
        required_missing: [],
        preferred_missing: [],
        match_percentage: 100,
      };

      render(<SkillGapsSection skillGaps={noGaps} />);

      expect(screen.getByText(/no skill gaps identified/i)).toBeInTheDocument();
      expect(screen.getByText(/100% match/i)).toBeInTheDocument();
    });

    it('should display target role in empty state message', () => {
      const noGaps: SkillGaps = {
        target_role: 'Data Scientist',
        required_missing: [],
        preferred_missing: [],
        match_percentage: 100,
      };

      render(<SkillGapsSection skillGaps={noGaps} />);

      expect(screen.getByText(/data scientist/i)).toBeInTheDocument();
    });

    it('should not display table when no skill gaps exist', () => {
      const noGaps: SkillGaps = {
        target_role: 'Software Engineer',
        required_missing: [],
        preferred_missing: [],
        match_percentage: 100,
      };

      render(<SkillGapsSection skillGaps={noGaps} />);

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should not display recommendation section when no gaps', () => {
      const noGaps: SkillGaps = {
        target_role: 'Software Engineer',
        required_missing: [],
        preferred_missing: [],
        match_percentage: 100,
        recommendation: 'This should not appear',
      };

      render(<SkillGapsSection skillGaps={noGaps} />);

      expect(screen.queryByText('This should not appear')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle only required skills', () => {
      const onlyRequired: SkillGaps = {
        target_role: 'Backend Engineer',
        required_missing: ['Redis', 'RabbitMQ'],
        preferred_missing: [],
        match_percentage: 80,
      };

      render(<SkillGapsSection skillGaps={onlyRequired} />);

      expect(screen.getByText('Redis')).toBeInTheDocument();
      expect(screen.getByText('RabbitMQ')).toBeInTheDocument();
      expect(screen.getAllByText('REQUIRED')).toHaveLength(2);
      expect(screen.queryByText('PREFERRED')).not.toBeInTheDocument();
    });

    it('should handle only preferred skills', () => {
      const onlyPreferred: SkillGaps = {
        target_role: 'Frontend Engineer',
        required_missing: [],
        preferred_missing: ['Vue.js', 'Svelte'],
        match_percentage: 90,
      };

      render(<SkillGapsSection skillGaps={onlyPreferred} />);

      expect(screen.getByText('Vue.js')).toBeInTheDocument();
      expect(screen.getByText('Svelte')).toBeInTheDocument();
      expect(screen.getAllByText('PREFERRED')).toHaveLength(2);
      expect(screen.queryByText('REQUIRED')).not.toBeInTheDocument();
    });

    it('should handle single skill gap', () => {
      const singleGap: SkillGaps = {
        target_role: 'DevOps Engineer',
        required_missing: ['Kubernetes'],
        preferred_missing: [],
        match_percentage: 95,
      };

      render(<SkillGapsSection skillGaps={singleGap} />);

      expect(screen.getByText('Kubernetes')).toBeInTheDocument();
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(2); // Header + 1 data row
    });

    it('should handle many skill gaps', () => {
      const manyGaps: SkillGaps = {
        target_role: 'Full Stack Engineer',
        required_missing: Array(10).fill('Skill').map((s, i) => `${s}${i}`),
        preferred_missing: Array(10).fill('Tool').map((t, i) => `${t}${i}`),
        match_percentage: 50,
      };

      render(<SkillGapsSection skillGaps={manyGaps} />);

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(21); // Header + 20 data rows
    });

    it('should handle skills with special characters', () => {
      const specialChars: SkillGaps = {
        target_role: 'Software Engineer',
        required_missing: ['C++', 'C#', '.NET'],
        preferred_missing: ['Node.js', 'Vue.js'],
        match_percentage: 70,
      };

      render(<SkillGapsSection skillGaps={specialChars} />);

      expect(screen.getByText('C++')).toBeInTheDocument();
      expect(screen.getByText('C#')).toBeInTheDocument();
      expect(screen.getByText('.NET')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
      expect(screen.getByText('Vue.js')).toBeInTheDocument();
    });

    it('should handle undefined recommendation', () => {
      const noRecommendation: SkillGaps = {
        target_role: 'Software Engineer',
        required_missing: ['Kubernetes'],
        preferred_missing: [],
        match_percentage: 85,
      };

      render(<SkillGapsSection skillGaps={noRecommendation} />);

      expect(screen.queryByText(/recommendation/i)).not.toBeInTheDocument();
    });

    it('should handle empty string recommendation', () => {
      const emptyRecommendation: SkillGaps = {
        target_role: 'Software Engineer',
        required_missing: ['Kubernetes'],
        preferred_missing: [],
        match_percentage: 85,
        recommendation: '',
      };

      render(<SkillGapsSection skillGaps={emptyRecommendation} />);

      expect(screen.queryByText(/recommendation/i)).not.toBeInTheDocument();
    });

    it('should handle 0% match percentage', () => {
      const zeroMatch: SkillGaps = {
        target_role: 'Software Engineer',
        required_missing: ['Everything'],
        preferred_missing: [],
        match_percentage: 0,
      };

      render(<SkillGapsSection skillGaps={zeroMatch} />);

      expect(screen.getByText(/improve your match from 0% to 100%/i)).toBeInTheDocument();
    });

    it('should handle 100% match with gaps (edge case)', () => {
      const fullMatchWithGaps: SkillGaps = {
        target_role: 'Software Engineer',
        required_missing: ['SpecialSkill'],
        preferred_missing: [],
        match_percentage: 100,
      };

      render(<SkillGapsSection skillGaps={fullMatchWithGaps} />);

      // Should still show the table since there are gaps
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      // Check for the skill in table body (not header)
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1); // Skip header row
      expect(dataRows.length).toBeGreaterThan(0);
      expect(dataRows[0]).toHaveTextContent('SpecialSkill');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible table structure', () => {
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(4);
    });

    it('should have accessible sort button', () => {
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      const sortButton = screen.getByRole('button', { name: /importance/i });
      expect(sortButton).toHaveAccessibleName();
    });

    it('should have accessible success alert in empty state', () => {
      const noGaps: SkillGaps = {
        target_role: 'Software Engineer',
        required_missing: [],
        preferred_missing: [],
        match_percentage: 100,
      };

      render(<SkillGapsSection skillGaps={noGaps} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have accessible info alert for recommendation', () => {
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      const alerts = screen.getAllByRole('alert');
      const infoAlert = alerts.find(alert => 
        alert.textContent?.includes('Recommendation')
      );
      expect(infoAlert).toBeInTheDocument();
    });
  });

  describe('Visual Indicators', () => {
    it('should use error color for required skills', () => {
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      const requiredBadges = screen.getAllByText('REQUIRED');
      requiredBadges.forEach(badge => {
        expect(badge.closest('.MuiChip-root')).toHaveClass('MuiChip-colorError');
      });
    });

    it('should use warning color for preferred skills', () => {
      render(<SkillGapsSection skillGaps={mockSkillGaps} />);

      const preferredBadges = screen.getAllByText('PREFERRED');
      preferredBadges.forEach(badge => {
        expect(badge.closest('.MuiChip-root')).toHaveClass('MuiChip-colorWarning');
      });
    });
  });
});
