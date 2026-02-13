"""Authentication service for user registration and login."""

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status, Request
from datetime import datetime, timedelta
import hashlib

from app.models.user import User, AccountStatus
from app.models.refresh_token import RefreshToken
from app.schemas.auth import UserRegisterRequest, UserResponse
from app.utils.password import hash_password, verify_password
from app.utils.jwt import create_access_token, create_refresh_token


class AuthService:
    """Service class for authentication operations."""
    
    @staticmethod
    def register_user(db: Session, user_data: UserRegisterRequest) -> User:
        """
        Register a new user.
        
        Args:
            db: Database session
            user_data: User registration data
            
        Returns:
            Created user object
            
        Raises:
            HTTPException: 409 if email already exists
            HTTPException: 500 if database error occurs
        """
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        
        # Hash password
        password_hash = hash_password(user_data.password)
        
        # Create user
        new_user = User(
            email=user_data.email,
            password_hash=password_hash,
            name=user_data.name,
            target_role=user_data.target_role,
            account_status=AccountStatus.PENDING_VERIFICATION
        )
        
        try:
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            return new_user
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user: {str(e)}"
            )
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User:
        """
        Authenticate user with email and password.
        
        Args:
            db: Database session
            email: User's email
            password: User's password
            
        Returns:
            User object if authentication successful
            
        Raises:
            HTTPException: 401 if credentials are invalid
            HTTPException: 423 if account is locked
        """
        # Get user by email
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Check if account is locked
        if user.account_status == AccountStatus.LOCKED:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Account is locked due to multiple failed login attempts"
            )
        
        # Verify password
        if not verify_password(password, user.password_hash):
            # Increment failed login attempts
            failed_attempts = int(user.failed_login_attempts or "0")
            failed_attempts += 1
            user.failed_login_attempts = str(failed_attempts)
            
            # Lock account after 5 failed attempts
            if failed_attempts >= 5:
                user.account_status = AccountStatus.LOCKED
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail="Account locked due to multiple failed login attempts"
                )
            
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Reset failed login attempts on successful login
        user.failed_login_attempts = "0"
        user.last_login_at = datetime.utcnow().isoformat()
        db.commit()
        
        return user
    
    @staticmethod
    def generate_tokens(db: Session, user: User, request: Request = None) -> dict:
        """
        Generate access and refresh tokens for user and store refresh token in database.
        
        Args:
            db: Database session
            user: User object
            request: Optional FastAPI request object for device info
            
        Returns:
            Dictionary with access_token and refresh_token
        """
        # Generate tokens
        access_token = create_access_token(
            user_id=user.id,
            email=user.email,
            role="user"
        )
        refresh_token = create_refresh_token(user_id=user.id)
        
        # Hash refresh token for storage
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        
        # Extract device information from request
        device_fingerprint = None
        user_agent = None
        ip_address = None
        
        if request:
            user_agent = request.headers.get("user-agent")
            ip_address = request.client.host if request.client else None
            # Simple device fingerprint (can be enhanced)
            device_fingerprint = hashlib.md5(
                f"{user_agent}{ip_address}".encode()
            ).hexdigest()[:32] if user_agent else None
        
        # Calculate expiry (7 days from now)
        expires_at = (datetime.utcnow() + timedelta(days=7)).isoformat()
        
        # Store refresh token in database
        refresh_token_record = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            device_fingerprint=device_fingerprint,
            user_agent=user_agent,
            ip_address=ip_address,
            expires_at=expires_at,
            is_revoked=False
        )
        
        try:
            db.add(refresh_token_record)
            db.commit()
        except Exception as e:
            db.rollback()
            # Log error but don't fail the login
            print(f"Failed to store refresh token: {e}")
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> User:
        """
        Get user by ID.
        
        Args:
            db: Database session
            user_id: User's ID
            
        Returns:
            User object
            
        Raises:
            HTTPException: 404 if user not found
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User:
        """
        Get user by email.
        
        Args:
            db: Database session
            email: User's email
            
        Returns:
            User object or None if not found
        """
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> dict:
        """
        Generate new access token using refresh token.
        
        Args:
            db: Database session
            refresh_token: JWT refresh token
            
        Returns:
            Dictionary with new access_token
            
        Raises:
            HTTPException: 401 if token is invalid, expired, or revoked
        """
        from app.utils.jwt import verify_refresh_token
        
        # Verify refresh token
        payload = verify_refresh_token(refresh_token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        
        # Get user_id from token
        user_id = payload.get('sub')
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Hash the refresh token to check database
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        
        # Check if token exists and is not revoked
        token_record = db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.user_id == user_id
        ).first()
        
        if not token_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not found"
            )
        
        if token_record.is_revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked"
            )
        
        # Check if token is expired
        from datetime import datetime
        expires_at = datetime.fromisoformat(token_record.expires_at)
        if datetime.utcnow() > expires_at:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired"
            )
        
        # Get user
        user = AuthService.get_user_by_id(db, user_id)
        
        # Generate new access token
        access_token = create_access_token(
            user_id=user.id,
            email=user.email,
            role="user"
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    
    @staticmethod
    def logout(db: Session, refresh_token: str) -> dict:
        """
        Logout user by invalidating current refresh token.
        
        Args:
            db: Database session
            refresh_token: JWT refresh token to invalidate
            
        Returns:
            Dictionary with success message
            
        Raises:
            HTTPException: 401 if token is invalid
        """
        # Hash the refresh token
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        
        # Find token in database
        token_record = db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash
        ).first()
        
        if not token_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Mark token as revoked
        token_record.is_revoked = True
        db.commit()
        
        return {
            "message": "Logged out successfully"
        }
    
    @staticmethod
    def logout_all_devices(db: Session, user_id: int) -> dict:
        """
        Logout user from all devices by invalidating all refresh tokens.
        
        Args:
            db: Database session
            user_id: User's ID
            
        Returns:
            Dictionary with success message and count of revoked tokens
        """
        # Find all active tokens for user
        token_records = db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked == False
        ).all()
        
        # Mark all tokens as revoked
        revoked_count = 0
        for token_record in token_records:
            token_record.is_revoked = True
            revoked_count += 1
        
        db.commit()
        
        return {
            "message": "Logged out from all devices successfully",
            "revoked_sessions": revoked_count
        }

    
    @staticmethod
    def request_password_reset(db: Session, email: str) -> dict:
        """
        Request password reset by generating a reset token.
        
        Args:
            db: Database session
            email: User's email
            
        Returns:
            Dictionary with success message
            
        Note:
            Always returns success to prevent email enumeration
        """
        from app.models.password_reset_token import PasswordResetToken
        from datetime import datetime, timedelta
        import secrets
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Return success anyway to prevent email enumeration
            return {
                "message": "If the email exists, a password reset link has been sent"
            }
        
        # Generate secure random token
        reset_token = secrets.token_urlsafe(32)
        
        # Hash token for storage
        token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
        
        # Calculate expiry (1 hour from now)
        expires_at = (datetime.utcnow() + timedelta(hours=1)).isoformat()
        
        # Create password reset token record
        reset_token_record = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            is_used=False,
            expires_at=expires_at
        )
        
        try:
            db.add(reset_token_record)
            db.commit()
        except Exception as e:
            db.rollback()
            # Log error but don't expose it to user
            print(f"Failed to create password reset token: {e}")
            return {
                "message": "If the email exists, a password reset link has been sent"
            }
        
        # TODO: Send email with reset token
        # For now, we'll just log it (in production, send via email service)
        print(f"Password reset token for {email}: {reset_token}")
        print(f"Reset link: http://localhost:3000/reset-password?token={reset_token}")
        
        return {
            "message": "If the email exists, a password reset link has been sent"
        }
    
    @staticmethod
    def reset_password(db: Session, token: str, new_password: str) -> dict:
        """
        Reset user password using reset token.
        
        Args:
            db: Database session
            token: Password reset token
            new_password: New password (already validated)
            
        Returns:
            Dictionary with success message
            
        Raises:
            HTTPException: 400 if token is invalid, expired, or already used
        """
        from app.models.password_reset_token import PasswordResetToken
        from datetime import datetime
        
        # Hash the token to check database
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        # Find token in database
        token_record = db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == token_hash
        ).first()
        
        if not token_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset link"
            )
        
        # Check if token is already used
        if token_record.is_used:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset link"
            )
        
        # Check if token is expired
        expires_at = datetime.fromisoformat(token_record.expires_at)
        if datetime.utcnow() > expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset link"
            )
        
        # Get user
        user = db.query(User).filter(User.id == token_record.user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Hash new password
        new_password_hash = hash_password(new_password)
        
        # Update user password
        user.password_hash = new_password_hash
        
        # Mark token as used
        token_record.is_used = True
        
        # Invalidate all refresh tokens for security
        from app.models.refresh_token import RefreshToken
        refresh_tokens = db.query(RefreshToken).filter(
            RefreshToken.user_id == user.id,
            RefreshToken.is_revoked == False
        ).all()
        
        for refresh_token in refresh_tokens:
            refresh_token.is_revoked = True
        
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to reset password: {str(e)}"
            )
        
        return {
            "message": "Password reset successfully"
        }
