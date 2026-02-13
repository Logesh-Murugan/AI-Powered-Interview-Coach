"""User profile routes."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.user import UserProfileResponse, UserProfileUpdateRequest
from app.services.user_service import UserService

router = APIRouter()


@router.get(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="Retrieve the authenticated user's profile information.",
    responses={
        200: {
            "description": "User profile retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "email": "user@example.com",
                        "name": "John Doe",
                        "target_role": "Software Engineer",
                        "experience_level": "Mid",
                        "account_status": "active",
                        "created_at": "2026-02-09T11:30:00",
                        "updated_at": "2026-02-09T11:30:00"
                    }
                }
            }
        },
        401: {
            "description": "Unauthorized - invalid or missing access token",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Not authenticated"
                    }
                }
            }
        },
        404: {
            "description": "User not found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "User not found"
                    }
                }
            }
        }
    }
)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserProfileResponse:
    """
    Get current user profile.
    
    Requires valid access token in Authorization header.
    Returns user profile with all fields except password.
    Profile data is cached for performance.
    """
    # Get user profile
    user = UserService.get_user_profile(db, current_user["user_id"])
    
    # Convert to response model
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        target_role=user.target_role,
        experience_level=user.experience_level.value if user.experience_level else None,
        account_status=user.account_status.value,
        created_at=user.created_at.isoformat() if hasattr(user.created_at, 'isoformat') else str(user.created_at),
        updated_at=user.updated_at.isoformat() if hasattr(user.updated_at, 'isoformat') else str(user.updated_at)
    )


@router.put(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Update current user profile",
    description="Update the authenticated user's profile information.",
    responses={
        200: {
            "description": "User profile updated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "email": "user@example.com",
                        "name": "John Doe Updated",
                        "target_role": "Senior Software Engineer",
                        "experience_level": "Senior",
                        "account_status": "active",
                        "created_at": "2026-02-09T11:30:00",
                        "updated_at": "2026-02-09T12:00:00"
                    }
                }
            }
        },
        400: {
            "description": "Validation error - invalid target_role or experience_level",
            "content": {
                "application/json": {
                    "examples": {
                        "invalid_role": {
                            "value": {
                                "detail": "Invalid target_role. Must be one of: Software Engineer, Product Manager, ..."
                            }
                        },
                        "invalid_experience": {
                            "value": {
                                "detail": "Invalid experience_level. Must be one of: Entry, Mid, Senior, Staff, Principal"
                            }
                        }
                    }
                }
            }
        },
        401: {
            "description": "Unauthorized - invalid or missing access token",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Not authenticated"
                    }
                }
            }
        },
        404: {
            "description": "User not found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "User not found"
                    }
                }
            }
        }
    }
)
async def update_current_user_profile(
    profile_data: UserProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserProfileResponse:
    """
    Update current user profile.
    
    Requires valid access token in Authorization header.
    
    - **name**: User's full name (2-255 characters)
    - **target_role**: Target job role (must be from predefined list)
    - **experience_level**: Experience level (Entry, Mid, Senior, Staff, Principal)
    
    All fields are optional. Only provided fields will be updated.
    Cache is invalidated after update for consistency.
    """
    # Update user profile
    user = UserService.update_user_profile(db, current_user["user_id"], profile_data)
    
    # Convert to response model
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        target_role=user.target_role,
        experience_level=user.experience_level.value if user.experience_level else None,
        account_status=user.account_status.value,
        created_at=user.created_at.isoformat() if hasattr(user.created_at, 'isoformat') else str(user.created_at),
        updated_at=user.updated_at.isoformat() if hasattr(user.updated_at, 'isoformat') else str(user.updated_at)
    )
