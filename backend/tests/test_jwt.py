"""Unit tests for JWT token generation and validation."""

import pytest
import jwt
from datetime import datetime, timedelta
from app.utils.jwt import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_access_token,
    verify_refresh_token,
    get_token_expiry
)
from app.config import settings


class TestAccessTokenGeneration:
    """Test access token generation."""
    
    def test_create_access_token_returns_string(self):
        """Test that create_access_token returns a string."""
        token = create_access_token(1, "user@example.com")
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_access_token_contains_user_id(self):
        """Test that access token contains user ID in sub claim."""
        token = create_access_token(123, "user@example.com")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        assert payload['sub'] == 123
    
    def test_access_token_contains_email(self):
        """Test that access token contains email."""
        token = create_access_token(1, "test@example.com")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        assert payload['email'] == "test@example.com"
    
    def test_access_token_contains_role(self):
        """Test that access token contains role."""
        token = create_access_token(1, "user@example.com", role="admin")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        assert payload['role'] == "admin"
    
    def test_access_token_default_role(self):
        """Test that access token has default role 'user'."""
        token = create_access_token(1, "user@example.com")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        assert payload['role'] == "user"
    
    def test_access_token_has_type(self):
        """Test that access token has type 'access'."""
        token = create_access_token(1, "user@example.com")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        assert payload['type'] == "access"
    
    def test_access_token_expiry_15_minutes(self):
        """Test that access token expires in 15 minutes."""
        token = create_access_token(1, "user@example.com")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        
        exp_time = datetime.fromtimestamp(payload['exp'])
        iat_time = datetime.fromtimestamp(payload['iat'])
        
        # Should be approximately 15 minutes (allow 1 second tolerance)
        diff = (exp_time - iat_time).total_seconds()
        assert 899 <= diff <= 901  # 15 minutes = 900 seconds
    
    def test_access_token_has_issued_at(self):
        """Test that access token has issued at timestamp."""
        before = datetime.utcnow()
        token = create_access_token(1, "user@example.com")
        after = datetime.utcnow()
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        iat_time = datetime.utcfromtimestamp(payload['iat'])
        
        # Allow 1 second tolerance due to timestamp precision
        assert (before - timedelta(seconds=1)) <= iat_time <= (after + timedelta(seconds=1))


class TestRefreshTokenGeneration:
    """Test refresh token generation."""
    
    def test_create_refresh_token_returns_string(self):
        """Test that create_refresh_token returns a string."""
        token = create_refresh_token(1)
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_refresh_token_contains_user_id(self):
        """Test that refresh token contains user ID in sub claim."""
        token = create_refresh_token(456)
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        assert payload['sub'] == 456
    
    def test_refresh_token_has_type(self):
        """Test that refresh token has type 'refresh'."""
        token = create_refresh_token(1)
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        assert payload['type'] == "refresh"
    
    def test_refresh_token_no_email(self):
        """Test that refresh token does not contain email."""
        token = create_refresh_token(1)
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        assert 'email' not in payload
    
    def test_refresh_token_expiry_7_days(self):
        """Test that refresh token expires in 7 days."""
        token = create_refresh_token(1)
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        
        exp_time = datetime.fromtimestamp(payload['exp'])
        iat_time = datetime.fromtimestamp(payload['iat'])
        
        # Should be approximately 7 days (allow 1 second tolerance)
        diff = (exp_time - iat_time).total_seconds()
        expected = 7 * 24 * 60 * 60  # 604800 seconds
        assert expected - 1 <= diff <= expected + 1


class TestTokenDecoding:
    """Test token decoding functionality."""
    
    def test_decode_valid_access_token(self):
        """Test decoding valid access token."""
        token = create_access_token(1, "user@example.com")
        payload = decode_token(token)
        
        assert payload is not None
        assert payload['sub'] == 1
        assert payload['email'] == "user@example.com"
    
    def test_decode_valid_refresh_token(self):
        """Test decoding valid refresh token."""
        token = create_refresh_token(1)
        payload = decode_token(token)
        
        assert payload is not None
        assert payload['sub'] == 1
        assert payload['type'] == "refresh"
    
    def test_decode_invalid_token(self):
        """Test decoding invalid token raises exception."""
        with pytest.raises(jwt.InvalidTokenError):
            decode_token("invalid.token.here")
    
    def test_decode_expired_token(self):
        """Test decoding expired token raises exception."""
        # Create token that expired 1 hour ago
        now = datetime.utcnow()
        payload = {
            'sub': 1,
            'exp': now - timedelta(hours=1),
            'iat': now - timedelta(hours=2)
        }
        expired_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        
        with pytest.raises(jwt.ExpiredSignatureError):
            decode_token(expired_token)
    
    def test_decode_token_wrong_secret(self):
        """Test decoding token with wrong secret raises exception."""
        # Create token with different secret
        payload = {'sub': 1, 'exp': datetime.utcnow() + timedelta(minutes=15)}
        wrong_token = jwt.encode(payload, "wrong_secret_key", algorithm='HS256')
        
        with pytest.raises(jwt.InvalidTokenError):
            decode_token(wrong_token)


class TestTokenVerification:
    """Test token verification functions."""
    
    def test_verify_valid_access_token(self):
        """Test verifying valid access token."""
        token = create_access_token(1, "user@example.com")
        payload = verify_access_token(token)
        
        assert payload is not None
        assert payload['sub'] == 1
        assert payload['type'] == "access"
    
    def test_verify_refresh_token_as_access_fails(self):
        """Test that refresh token fails access token verification."""
        token = create_refresh_token(1)
        payload = verify_access_token(token)
        
        assert payload is None
    
    def test_verify_valid_refresh_token(self):
        """Test verifying valid refresh token."""
        token = create_refresh_token(1)
        payload = verify_refresh_token(token)
        
        assert payload is not None
        assert payload['sub'] == 1
        assert payload['type'] == "refresh"
    
    def test_verify_access_token_as_refresh_fails(self):
        """Test that access token fails refresh token verification."""
        token = create_access_token(1, "user@example.com")
        payload = verify_refresh_token(token)
        
        assert payload is None
    
    def test_verify_expired_access_token(self):
        """Test that expired access token returns None."""
        # Create expired token
        now = datetime.utcnow()
        payload = {
            'sub': 1,
            'type': 'access',
            'exp': now - timedelta(hours=1),
            'iat': now - timedelta(hours=2)
        }
        expired_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        
        result = verify_access_token(expired_token)
        assert result is None
    
    def test_verify_invalid_token(self):
        """Test that invalid token returns None."""
        result = verify_access_token("invalid.token.here")
        assert result is None


class TestTokenExpiry:
    """Test token expiry functionality."""
    
    def test_get_expiry_from_access_token(self):
        """Test getting expiry from access token."""
        before = datetime.utcnow()
        token = create_access_token(1, "user@example.com")
        after = datetime.utcnow()
        
        expiry = get_token_expiry(token)
        
        assert expiry is not None
        # Expiry should be ~15 minutes from now
        expected_min = before + timedelta(minutes=14, seconds=59)
        expected_max = after + timedelta(minutes=15, seconds=1)
        assert expected_min <= expiry <= expected_max
    
    def test_get_expiry_from_refresh_token(self):
        """Test getting expiry from refresh token."""
        before = datetime.utcnow()
        token = create_refresh_token(1)
        after = datetime.utcnow()
        
        expiry = get_token_expiry(token)
        
        assert expiry is not None
        # Expiry should be ~7 days from now
        expected_min = before + timedelta(days=6, hours=23, minutes=59)
        expected_max = after + timedelta(days=7, seconds=1)
        assert expected_min <= expiry <= expected_max
    
    def test_get_expiry_from_invalid_token(self):
        """Test getting expiry from invalid token returns None."""
        expiry = get_token_expiry("invalid.token.here")
        assert expiry is None
    
    def test_get_expiry_from_expired_token(self):
        """Test getting expiry from expired token returns None."""
        now = datetime.utcnow()
        payload = {
            'sub': 1,
            'exp': now - timedelta(hours=1),
            'iat': now - timedelta(hours=2)
        }
        expired_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        
        expiry = get_token_expiry(expired_token)
        assert expiry is None


class TestTokenIntegration:
    """Integration tests for token workflows."""
    
    def test_complete_access_token_workflow(self):
        """Test complete access token workflow."""
        user_id = 123
        email = "test@example.com"
        
        # Create token
        token = create_access_token(user_id, email)
        
        # Verify token
        payload = verify_access_token(token)
        assert payload is not None
        assert payload['sub'] == user_id
        assert payload['email'] == email
        
        # Get expiry
        expiry = get_token_expiry(token)
        assert expiry is not None
        assert expiry > datetime.utcnow()
    
    def test_complete_refresh_token_workflow(self):
        """Test complete refresh token workflow."""
        user_id = 456
        
        # Create token
        token = create_refresh_token(user_id)
        
        # Verify token
        payload = verify_refresh_token(token)
        assert payload is not None
        assert payload['sub'] == user_id
        
        # Get expiry
        expiry = get_token_expiry(token)
        assert expiry is not None
        assert expiry > datetime.utcnow()
    
    def test_token_type_separation(self):
        """Test that access and refresh tokens are properly separated."""
        user_id = 789
        
        # Create both types
        access_token = create_access_token(user_id, "user@example.com")
        refresh_token = create_refresh_token(user_id)
        
        # Access token should only verify as access
        assert verify_access_token(access_token) is not None
        assert verify_refresh_token(access_token) is None
        
        # Refresh token should only verify as refresh
        assert verify_refresh_token(refresh_token) is not None
        assert verify_access_token(refresh_token) is None
