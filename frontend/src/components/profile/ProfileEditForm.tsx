/**
 * Profile Edit Form Component
 * Editable form for user profile information
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import { VALID_ROLES, VALID_EXPERIENCE_LEVELS } from '../../services/userService';

interface ProfileEditFormProps {
  initialName: string;
  initialTargetRole?: string;
  initialExperienceLevel?: string;
  isLoading: boolean;
  error: string | null;
  onSubmit: (data: { name: string; target_role?: string; experience_level?: string }) => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  target_role?: string;
  experience_level?: string;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  initialName,
  initialTargetRole,
  initialExperienceLevel,
  isLoading,
  error,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(initialName);
  const [targetRole, setTargetRole] = useState(initialTargetRole || '');
  const [experienceLevel, setExperienceLevel] = useState(initialExperienceLevel || '');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setName(initialName);
    setTargetRole(initialTargetRole || '');
    setExperienceLevel(initialExperienceLevel || '');
  }, [initialName, initialTargetRole, initialExperienceLevel]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation: 2-255 characters
    if (!name || name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (name.length > 255) {
      newErrors.name = 'Name must not exceed 255 characters';
    } else if (name.trim().length === 0) {
      newErrors.name = 'Name cannot be empty or whitespace only';
    }

    // Target role validation (optional, but if provided must be valid)
    if (targetRole && !VALID_ROLES.includes(targetRole as any)) {
      newErrors.target_role = 'Please select a valid role';
    }

    // Experience level validation (optional, but if provided must be valid)
    if (experienceLevel && !VALID_EXPERIENCE_LEVELS.includes(experienceLevel as any)) {
      newErrors.experience_level = 'Please select a valid experience level';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const data: { name: string; target_role?: string; experience_level?: string } = {
      name: name.trim(),
    };

    if (targetRole) {
      data.target_role = targetRole;
    }

    if (experienceLevel) {
      data.experience_level = experienceLevel;
    }

    onSubmit(data);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={!!errors.name}
        helperText={errors.name}
        disabled={isLoading}
        sx={{ mb: 2 }}
        required
      />

      <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.target_role}>
        <InputLabel id="target-role-label">Target Role</InputLabel>
        <Select
          labelId="target-role-label"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          label="Target Role"
          disabled={isLoading}
          data-testid="target-role-select"
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {VALID_ROLES.map((role) => (
            <MenuItem key={role} value={role}>
              {role}
            </MenuItem>
          ))}
        </Select>
        {errors.target_role && <FormHelperText>{errors.target_role}</FormHelperText>}
      </FormControl>

      <FormControl fullWidth sx={{ mb: 3 }} error={!!errors.experience_level}>
        <InputLabel id="experience-level-label">Experience Level</InputLabel>
        <Select
          labelId="experience-level-label"
          value={experienceLevel}
          onChange={(e) => setExperienceLevel(e.target.value)}
          label="Experience Level"
          disabled={isLoading}
          data-testid="experience-level-select"
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {VALID_EXPERIENCE_LEVELS.map((level) => (
            <MenuItem key={level} value={level}>
              {level}
            </MenuItem>
          ))}
        </Select>
        {errors.experience_level && <FormHelperText>{errors.experience_level}</FormHelperText>}
      </FormControl>

      {error && (
        <Box sx={{ mb: 2, color: 'error.main', fontSize: '0.875rem' }}>
          {error}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default ProfileEditForm;
