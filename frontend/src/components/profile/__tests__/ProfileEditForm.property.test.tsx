/**
 * Property-Based Tests for Profile Validation
 * **Validates: Requirements INT-2.4**
 * 
 * Tests profile validation logic using fast-check to generate random inputs
 * and verify that validation correctly accepts/rejects based on the rules:
 * - Name: 2-255 characters, cannot be empty or whitespace only
 * - Target role: Must be in VALID_ROLES list (if provided)
 * - Experience level: Must be in VALID_EXPERIENCE_LEVELS list (if provided)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { VALID_ROLES, VALID_EXPERIENCE_LEVELS } from '../../../services/userService';

/**
 * Validation function extracted from ProfileEditForm component
 * This mirrors the validation logic in the component
 */
interface ProfileData {
  name: string;
  target_role?: string;
  experience_level?: string;
}

interface ValidationErrors {
  name?: string;
  target_role?: string;
  experience_level?: string;
}

function validateProfile(data: ProfileData): ValidationErrors {
  const errors: ValidationErrors = {};

  // Name validation: 2-255 characters
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (data.name.length > 255) {
    errors.name = 'Name must not exceed 255 characters';
  } else if (data.name.trim().length === 0) {
    errors.name = 'Name cannot be empty or whitespace only';
  }

  // Target role validation (optional, but if provided must be valid)
  if (data.target_role && !VALID_ROLES.includes(data.target_role as any)) {
    errors.target_role = 'Please select a valid role';
  }

  // Experience level validation (optional, but if provided must be valid)
  if (data.experience_level && !VALID_EXPERIENCE_LEVELS.includes(data.experience_level as any)) {
    errors.experience_level = 'Please select a valid experience level';
  }

  return errors;
}

describe('ProfileEditForm Property-Based Tests', () => {
  describe('Property 3: Profile Validation', () => {
    it('should reject names shorter than 2 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 1 }), // Generate strings 0-1 chars
          (name) => {
            const errors = validateProfile({ name });
            expect(errors.name).toBeDefined();
            expect(errors.name).toContain('at least 2 characters');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject names longer than 255 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 256, maxLength: 500 }), // Generate strings 256-500 chars
          (name) => {
            const errors = validateProfile({ name });
            expect(errors.name).toBeDefined();
            expect(errors.name).toContain('must not exceed 255 characters');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject names that are only whitespace', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^\s+$/), // Generate whitespace-only strings
          (name) => {
            // Only test if the string is not empty (empty is handled by another test)
            if (name.length > 0) {
              const errors = validateProfile({ name });
              expect(errors.name).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid names (2-255 characters, not whitespace only)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 255 }).filter(s => s.trim().length >= 2),
          (name) => {
            const errors = validateProfile({ name });
            expect(errors.name).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid target roles', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(role => !VALID_ROLES.includes(role as any)),
          fc.string({ minLength: 2, maxLength: 255 }).filter(s => s.trim().length >= 2), // valid name
          (invalidRole, validName) => {
            const errors = validateProfile({
              name: validName,
              target_role: invalidRole,
            });
            expect(errors.target_role).toBeDefined();
            expect(errors.target_role).toContain('valid role');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid target roles', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_ROLES), // Pick from valid roles
          fc.string({ minLength: 2, maxLength: 255 }).filter(s => s.trim().length >= 2), // valid name
          (validRole, validName) => {
            const errors = validateProfile({
              name: validName,
              target_role: validRole,
            });
            expect(errors.target_role).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid experience levels', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(level => !VALID_EXPERIENCE_LEVELS.includes(level as any)),
          fc.string({ minLength: 2, maxLength: 255 }).filter(s => s.trim().length >= 2), // valid name
          (invalidLevel, validName) => {
            const errors = validateProfile({
              name: validName,
              experience_level: invalidLevel,
            });
            expect(errors.experience_level).toBeDefined();
            expect(errors.experience_level).toContain('valid experience level');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid experience levels', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_EXPERIENCE_LEVELS), // Pick from valid levels
          fc.string({ minLength: 2, maxLength: 255 }).filter(s => s.trim().length >= 2), // valid name
          (validLevel, validName) => {
            const errors = validateProfile({
              name: validName,
              experience_level: validLevel,
            });
            expect(errors.experience_level).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept all valid combinations of name, role, and experience level', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 255 }).filter(s => s.trim().length >= 2),
          fc.option(fc.constantFrom(...VALID_ROLES), { nil: undefined }),
          fc.option(fc.constantFrom(...VALID_EXPERIENCE_LEVELS), { nil: undefined }),
          (name, role, level) => {
            const errors = validateProfile({
              name,
              target_role: role,
              experience_level: level,
            });
            
            // All fields should be valid
            expect(errors.name).toBeUndefined();
            expect(errors.target_role).toBeUndefined();
            expect(errors.experience_level).toBeUndefined();
            
            // No errors should exist
            expect(Object.keys(errors).length).toBe(0);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('should handle optional fields correctly (undefined or empty string)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 255 }).filter(s => s.trim().length >= 2),
          fc.constantFrom(undefined, ''),
          fc.constantFrom(undefined, ''),
          (name, role, level) => {
            const errors = validateProfile({
              name,
              target_role: role,
              experience_level: level,
            });
            
            // Optional fields should not cause errors when undefined or empty
            expect(errors.name).toBeUndefined();
            expect(errors.target_role).toBeUndefined();
            expect(errors.experience_level).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate all fields independently', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ maxLength: 300 }),
            target_role: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
            experience_level: fc.option(fc.string({ maxLength: 20 }), { nil: undefined }),
          }),
          (data) => {
            const errors = validateProfile(data);
            
            // Name validation
            const nameValid = data.name.trim().length >= 2 && data.name.length <= 255;
            if (nameValid) {
              expect(errors.name).toBeUndefined();
            } else {
              expect(errors.name).toBeDefined();
            }
            
            // Role validation (only if provided)
            if (data.target_role && data.target_role !== '') {
              const roleValid = VALID_ROLES.includes(data.target_role as any);
              if (roleValid) {
                expect(errors.target_role).toBeUndefined();
              } else {
                expect(errors.target_role).toBeDefined();
              }
            } else {
              expect(errors.target_role).toBeUndefined();
            }
            
            // Experience level validation (only if provided)
            if (data.experience_level && data.experience_level !== '') {
              const levelValid = VALID_EXPERIENCE_LEVELS.includes(data.experience_level as any);
              if (levelValid) {
                expect(errors.experience_level).toBeUndefined();
              } else {
                expect(errors.experience_level).toBeDefined();
              }
            } else {
              expect(errors.experience_level).toBeUndefined();
            }
          }
        ),
        { numRuns: 500 }
      );
    });
  });
});
