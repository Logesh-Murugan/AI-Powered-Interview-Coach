/**
 * ProfileEditForm Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfileEditForm from '../ProfileEditForm';

describe('ProfileEditForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    initialName: 'John Doe',
    initialTargetRole: undefined as string | undefined,
    initialExperienceLevel: undefined as string | undefined,
    isLoading: false,
    error: null as string | null,
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render form with all fields', () => {
      render(<ProfileEditForm {...defaultProps} />);
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });
  });
});
