/**
 * Component Tests for ImprovementRoadmap
 * Tests rendering, milestone display, and timeline visualization
 * 
 * Requirements: INT-1.7
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import ImprovementRoadmap from '../ImprovementRoadmap';
import type { ImprovementRoadmap as RoadmapType } from '../../../services/resumeAnalysisService';

describe('ImprovementRoadmap', () => {
  const mockRoadmap: RoadmapType = {
    timeline_weeks: 12,
    hours_per_week: 10,
    total_hours: 120,
    milestones: [
      {
        milestone_number: 1,
        weeks: '1-4',
        skills_to_learn: ['Kubernetes basics', 'Docker fundamentals'],
        estimated_hours: 40,
        activities: [
          'Complete Kubernetes course',
          'Build sample containerized app',
          'Practice with minikube',
        ],
      },
      {
        milestone_number: 2,
        weeks: '5-8',
        skills_to_learn: ['AWS EC2', 'AWS S3'],
        estimated_hours: 40,
        activities: [
          'AWS certification prep',
          'Deploy application to AWS',
        ],
      },
      {
        milestone_number: 3,
        weeks: '9-12',
        skills_to_learn: ['Terraform', 'CI/CD'],
        estimated_hours: 40,
        activities: [
          'Infrastructure as Code project',
          'Set up CI/CD pipeline',
        ],
      },
    ],
    success_tips: [
      'Practice daily for consistency',
      'Build real projects',
      'Join developer communities',
    ],
  };

  describe('Rendering', () => {
    it('should display roadmap title', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      expect(screen.getByText('Improvement Roadmap')).toBeInTheDocument();
    });

    it('should display timeline weeks', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      expect(screen.getByText('12 weeks')).toBeInTheDocument();
    });

    it('should display hours per week', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      expect(screen.getByText('10 hrs/week')).toBeInTheDocument();
    });

    it('should display total hours', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      expect(screen.getByText('120 total hours')).toBeInTheDocument();
    });

    it('should display all milestones', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      expect(screen.getByText('Milestone 1')).toBeInTheDocument();
      expect(screen.getByText('Milestone 2')).toBeInTheDocument();
      expect(screen.getByText('Milestone 3')).toBeInTheDocument();
    });
  });

  describe('Milestone Display', () => {
    it('should display milestone weeks', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      expect(screen.getByText('1-4')).toBeInTheDocument();
      expect(screen.getByText('5-8')).toBeInTheDocument();
      expect(screen.getByText('9-12')).toBeInTheDocument();
    });

    it('should display milestone estimated hours', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      const hours = screen.getAllByText(/40h/);
      expect(hours).toHaveLength(3);
    });

    it('should display skills to learn for each milestone', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      expect(screen.getByText('Kubernetes basics')).toBeInTheDocument();
      expect(screen.getByText('Docker fundamentals')).toBeInTheDocument();
      expect(screen.getByText('AWS EC2')).toBeInTheDocument();
      expect(screen.getByText('AWS S3')).toBeInTheDocument();
      expect(screen.getByText('Terraform')).toBeInTheDocument();
      expect(screen.getByText('CI/CD')).toBeInTheDocument();
    });

    it('should display activities for each milestone', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      expect(screen.getByText('Complete Kubernetes course')).toBeInTheDocument();
      expect(screen.getByText('Build sample containerized app')).toBeInTheDocument();
      expect(screen.getByText('AWS certification prep')).toBeInTheDocument();
      expect(screen.getByText('Infrastructure as Code project')).toBeInTheDocument();
    });

    it('should display "Skills to Learn" label for each milestone', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      const labels = screen.getAllByText('Skills to Learn:');
      expect(labels).toHaveLength(3);
    });

    it('should display "Activities" label for each milestone', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      const labels = screen.getAllByText('Activities:');
      expect(labels).toHaveLength(3);
    });

    it('should display progress indicator for each milestone', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      const progressLabels = screen.getAllByText('Progress');
      expect(progressLabels).toHaveLength(3);
    });

    it('should display 0% progress for all milestones', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      const percentages = screen.getAllByText('0%');
      expect(percentages.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Success Tips', () => {
    it('should display success tips section', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      expect(screen.getByText('Success Tips:')).toBeInTheDocument();
    });

    it('should display all success tips', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      expect(screen.getByText('Practice daily for consistency')).toBeInTheDocument();
      expect(screen.getByText('Build real projects')).toBeInTheDocument();
      expect(screen.getByText('Join developer communities')).toBeInTheDocument();
    });

    it('should not display success tips section when empty', () => {
      const roadmapWithoutTips: RoadmapType = {
        ...mockRoadmap,
        success_tips: [],
      };

      render(<ImprovementRoadmap roadmap={roadmapWithoutTips} />);

      expect(screen.queryByText('Success Tips:')).not.toBeInTheDocument();
    });

    it('should not display success tips section when undefined', () => {
      const roadmapWithoutTips: RoadmapType = {
        ...mockRoadmap,
        success_tips: undefined as any,
      };

      render(<ImprovementRoadmap roadmap={roadmapWithoutTips} />);

      expect(screen.queryByText('Success Tips:')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display info message when no milestones exist', () => {
      const emptyRoadmap: RoadmapType = {
        timeline_weeks: 0,
        milestones: [],
        success_tips: [],
      };

      render(<ImprovementRoadmap roadmap={emptyRoadmap} />);

      expect(screen.getByText(/no improvement roadmap available/i)).toBeInTheDocument();
      expect(screen.getByText(/skills already match the target role well/i)).toBeInTheDocument();
    });

    it('should not display timeline when no milestones', () => {
      const emptyRoadmap: RoadmapType = {
        timeline_weeks: 0,
        milestones: [],
        success_tips: [],
      };

      render(<ImprovementRoadmap roadmap={emptyRoadmap} />);

      expect(screen.queryByText('Milestone 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Skills to Learn:')).not.toBeInTheDocument();
    });

    it('should not display metadata chips when no milestones', () => {
      const emptyRoadmap: RoadmapType = {
        timeline_weeks: 0,
        milestones: [],
        success_tips: [],
      };

      render(<ImprovementRoadmap roadmap={emptyRoadmap} />);

      expect(screen.queryByText(/weeks/)).not.toBeInTheDocument();
      expect(screen.queryByText(/hrs\/week/)).not.toBeInTheDocument();
    });

    it('should handle undefined milestones array', () => {
      const undefinedMilestones: RoadmapType = {
        timeline_weeks: 12,
        milestones: undefined as any,
        success_tips: [],
      };

      render(<ImprovementRoadmap roadmap={undefinedMilestones} />);

      expect(screen.getByText(/no improvement roadmap available/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single milestone', () => {
      const singleMilestone: RoadmapType = {
        timeline_weeks: 4,
        hours_per_week: 10,
        total_hours: 40,
        milestones: [mockRoadmap.milestones[0]],
        success_tips: [],
      };

      render(<ImprovementRoadmap roadmap={singleMilestone} />);

      expect(screen.getByText('Milestone 1')).toBeInTheDocument();
      expect(screen.queryByText('Milestone 2')).not.toBeInTheDocument();
    });

    it('should handle milestone without activities', () => {
      const noActivities: RoadmapType = {
        timeline_weeks: 4,
        milestones: [
          {
            milestone_number: 1,
            weeks: '1-4',
            skills_to_learn: ['Skill 1'],
            estimated_hours: 40,
            activities: [],
          },
        ],
        success_tips: [],
      };

      render(<ImprovementRoadmap roadmap={noActivities} />);

      expect(screen.queryByText('Activities:')).not.toBeInTheDocument();
    });

    it('should handle milestone with undefined activities', () => {
      const undefinedActivities: RoadmapType = {
        timeline_weeks: 4,
        milestones: [
          {
            milestone_number: 1,
            weeks: '1-4',
            skills_to_learn: ['Skill 1'],
            estimated_hours: 40,
            activities: undefined as any,
          },
        ],
        success_tips: [],
      };

      render(<ImprovementRoadmap roadmap={undefinedActivities} />);

      expect(screen.queryByText('Activities:')).not.toBeInTheDocument();
    });

    it('should handle milestone with many skills', () => {
      const manySkills: RoadmapType = {
        timeline_weeks: 4,
        milestones: [
          {
            milestone_number: 1,
            weeks: '1-4',
            skills_to_learn: Array(10).fill('Skill').map((s, i) => `${s} ${i + 1}`),
            estimated_hours: 40,
            activities: [],
          },
        ],
        success_tips: [],
      };

      render(<ImprovementRoadmap roadmap={manySkills} />);

      for (let i = 1; i <= 10; i++) {
        expect(screen.getByText(`Skill ${i}`)).toBeInTheDocument();
      }
    });

    it('should handle milestone with many activities', () => {
      const manyActivities: RoadmapType = {
        timeline_weeks: 4,
        milestones: [
          {
            milestone_number: 1,
            weeks: '1-4',
            skills_to_learn: ['Skill 1'],
            estimated_hours: 40,
            activities: Array(5).fill('Activity').map((a, i) => `${a} ${i + 1}`),
          },
        ],
        success_tips: [],
      };

      render(<ImprovementRoadmap roadmap={manyActivities} />);

      for (let i = 1; i <= 5; i++) {
        expect(screen.getByText(`Activity ${i}`)).toBeInTheDocument();
      }
    });

    it('should handle roadmap without hours_per_week', () => {
      const noHoursPerWeek: RoadmapType = {
        timeline_weeks: 12,
        milestones: [mockRoadmap.milestones[0]],
        success_tips: [],
      };

      render(<ImprovementRoadmap roadmap={noHoursPerWeek} />);

      expect(screen.queryByText(/hrs\/week/)).not.toBeInTheDocument();
    });

    it('should handle roadmap without total_hours', () => {
      const noTotalHours: RoadmapType = {
        timeline_weeks: 12,
        hours_per_week: 10,
        milestones: [mockRoadmap.milestones[0]],
        success_tips: [],
      };

      render(<ImprovementRoadmap roadmap={noTotalHours} />);

      expect(screen.queryByText(/total hours/)).not.toBeInTheDocument();
    });

    it('should handle very long timeline', () => {
      const longTimeline: RoadmapType = {
        timeline_weeks: 52,
        hours_per_week: 20,
        total_hours: 1040,
        milestones: [mockRoadmap.milestones[0]],
        success_tips: [],
      };

      render(<ImprovementRoadmap roadmap={longTimeline} />);

      expect(screen.getByText('52 weeks')).toBeInTheDocument();
      expect(screen.getByText('1040 total hours')).toBeInTheDocument();
    });

    it('should handle single success tip', () => {
      const singleTip: RoadmapType = {
        ...mockRoadmap,
        success_tips: ['Single tip'],
      };

      render(<ImprovementRoadmap roadmap={singleTip} />);

      expect(screen.getByText('Single tip')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible info alert in empty state', () => {
      const emptyRoadmap: RoadmapType = {
        timeline_weeks: 0,
        milestones: [],
        success_tips: [],
      };

      render(<ImprovementRoadmap roadmap={emptyRoadmap} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have accessible success alert for tips', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      const alerts = screen.getAllByRole('alert');
      const successAlert = alerts.find(alert => 
        alert.textContent?.includes('Success Tips')
      );
      expect(successAlert).toBeInTheDocument();
    });

    it('should have accessible progress bars', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(3);
    });
  });

  describe('Timeline Structure', () => {
    it('should display milestones in timeline format', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      // Timeline component should be present
      const milestones = screen.getAllByText(/Milestone \d/);
      expect(milestones).toHaveLength(3);
    });

    it('should display milestones in correct order', () => {
      render(<ImprovementRoadmap roadmap={mockRoadmap} />);

      const milestones = screen.getAllByText(/Milestone \d/);
      expect(milestones[0]).toHaveTextContent('Milestone 1');
      expect(milestones[1]).toHaveTextContent('Milestone 2');
      expect(milestones[2]).toHaveTextContent('Milestone 3');
    });
  });
});
