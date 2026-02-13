"""Unit tests for password hashing and validation utilities."""

import pytest
from app.utils.password import hash_password, verify_password, validate_password_strength


class TestPasswordHashing:
    """Test password hashing functionality."""
    
    def test_hash_password_returns_string(self):
        """Test that hash_password returns a string."""
        password = "MySecurePass123!"
        hashed = hash_password(password)
        assert isinstance(hashed, str)
        assert len(hashed) > 0
    
    def test_hash_password_different_each_time(self):
        """Test that hashing same password produces different hashes (due to salt)."""
        password = "MySecurePass123!"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        assert hash1 != hash2
    
    def test_hash_password_starts_with_bcrypt_prefix(self):
        """Test that hashed password starts with bcrypt prefix."""
        password = "MySecurePass123!"
        hashed = hash_password(password)
        assert hashed.startswith("$2b$")
    
    def test_hash_password_contains_cost_factor_12(self):
        """Test that hashed password uses cost factor 12."""
        password = "MySecurePass123!"
        hashed = hash_password(password)
        # Format: $2b$12$...
        cost_factor = hashed.split("$")[2]
        assert cost_factor == "12"


class TestPasswordVerification:
    """Test password verification functionality."""
    
    def test_verify_password_correct_password(self):
        """Test that correct password verifies successfully."""
        password = "MySecurePass123!"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True
    
    def test_verify_password_incorrect_password(self):
        """Test that incorrect password fails verification."""
        password = "MySecurePass123!"
        hashed = hash_password(password)
        assert verify_password("WrongPassword123!", hashed) is False
    
    def test_verify_password_case_sensitive(self):
        """Test that password verification is case-sensitive."""
        password = "MySecurePass123!"
        hashed = hash_password(password)
        assert verify_password("mysecurepass123!", hashed) is False
    
    def test_verify_password_empty_password(self):
        """Test that empty password fails verification."""
        password = "MySecurePass123!"
        hashed = hash_password(password)
        assert verify_password("", hashed) is False
    
    def test_verify_password_with_special_characters(self):
        """Test password verification with special characters."""
        password = "P@ssw0rd!#$%"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True


class TestPasswordStrengthValidation:
    """Test password strength validation functionality."""
    
    def test_validate_password_too_short(self):
        """Test that password shorter than 8 characters fails."""
        is_valid, error = validate_password_strength("Short1!")
        assert is_valid is False
        assert "at least 8 characters" in error
    
    def test_validate_password_no_uppercase(self):
        """Test that password without uppercase letter fails."""
        is_valid, error = validate_password_strength("lowercase123!")
        assert is_valid is False
        assert "uppercase letter" in error
    
    def test_validate_password_no_lowercase(self):
        """Test that password without lowercase letter fails."""
        is_valid, error = validate_password_strength("UPPERCASE123!")
        assert is_valid is False
        assert "lowercase letter" in error
    
    def test_validate_password_no_number(self):
        """Test that password without number fails."""
        is_valid, error = validate_password_strength("NoNumbers!")
        assert is_valid is False
        assert "number" in error
    
    def test_validate_password_no_special_character(self):
        """Test that password without special character fails."""
        is_valid, error = validate_password_strength("NoSpecial123")
        assert is_valid is False
        assert "special character" in error
    
    def test_validate_password_valid_password(self):
        """Test that valid password passes all checks."""
        is_valid, error = validate_password_strength("MySecurePass123!")
        assert is_valid is True
        assert error == ""
    
    def test_validate_password_minimum_length(self):
        """Test that password with exactly 8 characters passes length check."""
        is_valid, error = validate_password_strength("Pass123!")
        assert is_valid is True
        assert error == ""
    
    def test_validate_password_various_special_characters(self):
        """Test that various special characters are accepted."""
        special_chars = "!@#$%^&*(),.?\":{}|<>"
        for char in special_chars:
            password = f"Password123{char}"
            is_valid, error = validate_password_strength(password)
            assert is_valid is True, f"Failed for special character: {char}"
    
    def test_validate_password_long_password(self):
        """Test that long passwords are accepted."""
        password = "MyVeryLongSecurePassword123!WithManyCharacters"
        is_valid, error = validate_password_strength(password)
        assert is_valid is True
        assert error == ""
    
    def test_validate_password_multiple_requirements_missing(self):
        """Test that first missing requirement is reported."""
        # Missing uppercase, number, and special char
        is_valid, error = validate_password_strength("lowercase")
        assert is_valid is False
        # Should report the first check that fails
        assert "uppercase letter" in error


class TestPasswordIntegration:
    """Integration tests for password utilities."""
    
    def test_hash_and_verify_workflow(self):
        """Test complete hash and verify workflow."""
        original_password = "UserPassword123!"
        
        # Hash the password
        hashed = hash_password(original_password)
        
        # Verify correct password
        assert verify_password(original_password, hashed) is True
        
        # Verify incorrect password
        assert verify_password("WrongPassword123!", hashed) is False
    
    def test_validate_then_hash_workflow(self):
        """Test validation before hashing workflow."""
        password = "SecurePass123!"
        
        # Validate password strength
        is_valid, error = validate_password_strength(password)
        assert is_valid is True
        
        # Hash if valid
        if is_valid:
            hashed = hash_password(password)
            assert verify_password(password, hashed) is True
    
    def test_reject_weak_password_workflow(self):
        """Test that weak passwords are rejected before hashing."""
        weak_password = "weak"
        
        # Validate password strength
        is_valid, error = validate_password_strength(weak_password)
        assert is_valid is False
        assert len(error) > 0
        
        # Should not hash weak password in production
        # But we can still hash it technically
        hashed = hash_password(weak_password)
        assert verify_password(weak_password, hashed) is True
