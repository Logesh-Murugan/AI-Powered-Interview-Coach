"""User service for profile management."""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User, ExperienceLevel as ModelExperienceLevel
from app.schemas.user import UserProfileUpdateRequest
from app.services.cache_service import CacheService

# Create a singleton instance of CacheService
_cache_service = CacheService()

_EXPERIENCE_LEVEL_WRITE_MAP = {
    "Entry": ModelExperienceLevel.ENTRY,
    "Mid": ModelExperienceLevel.MID,
    "Senior": ModelExperienceLevel.SENIOR,
    "Staff": ModelExperienceLevel.LEAD,
    "Principal": ModelExperienceLevel.PRINCIPAL,
}


def normalize_experience_level_for_response(experience_level):
    """Return the public API experience-level value."""
    if experience_level is None:
        return None

    raw_value = getattr(experience_level, "value", experience_level)
    if raw_value == ModelExperienceLevel.LEAD.value:
        return "staff"

    return str(raw_value)


class UserService:
    """Service class for user profile operations."""
    
    @staticmethod
    def get_user_profile(db: Session, user_id: int) -> User:
        """
        Get user profile by ID with caching.
        
        Args:
            db: Database session
            user_id: User's ID
            
        Returns:
            User object
            
        Raises:
            HTTPException: 404 if user not found
        """
        # Try to get from cache first
        cache_key = f"user:profile:{user_id}"
        cached_user = _cache_service.get(cache_key)
        
        if cached_user:
            # Return from cache (would need to reconstruct User object)
            # For simplicity, we'll just query database
            pass
        
        # Get from database
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Cache the user profile (cache for 1 hour)
        # Note: In production, you'd serialize the user object properly
        try:
            _cache_service.set(cache_key, {"id": user.id, "email": user.email}, ttl=3600)
        except Exception:
            pass  # Cache failures should not break profile retrieval
        
        return user
    
    @staticmethod
    def update_user_profile(
        db: Session,
        user_id: int,
        profile_data: UserProfileUpdateRequest
    ) -> User:
        """
        Update user profile.
        
        Args:
            db: Database session
            user_id: User's ID
            profile_data: Profile update data
            
        Returns:
            Updated user object
            
        Raises:
            HTTPException: 404 if user not found
        """
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update fields if provided
        if profile_data.name is not None:
            user.name = profile_data.name
        
        if profile_data.target_role is not None:
            user.target_role = profile_data.target_role
        
        if profile_data.experience_level is not None:
            user.experience_level = _EXPERIENCE_LEVEL_WRITE_MAP[profile_data.experience_level.value]
        
        # Save to database
        try:
            db.commit()
            db.refresh(user)
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update profile: {str(e)}"
            )
        
        # Invalidate cache
        cache_key = f"user:profile:{user_id}"
        _cache_service.delete(cache_key)
        
        # Also invalidate user preferences cache
        preferences_key = f"user:preferences:{user_id}"
        _cache_service.delete(preferences_key)
        
        return user
