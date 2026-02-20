"""
Pydantic schemas for leaderboard endpoints.
Requirements: 24.1-24.10
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class LeaderboardEntryResponse(BaseModel):
    """Response schema for a single leaderboard entry."""
    
    rank: int = Field(..., description="User's rank on leaderboard")
    anonymous_username: str = Field(..., description="Anonymized username (User_XXXX)")
    average_score: float = Field(..., description="Average score across all interviews")
    total_interviews: int = Field(..., description="Total number of completed interviews")
    calculated_at: str = Field(..., description="When leaderboard was calculated (ISO format)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "rank": 1,
                "anonymous_username": "User_1234",
                "average_score": 92.5,
                "total_interviews": 15,
                "calculated_at": "2026-02-15T00:00:00"
            }
        }


class LeaderboardResponse(BaseModel):
    """Response schema for leaderboard endpoint."""
    
    period: str = Field(..., description="Leaderboard period (weekly or all_time)")
    entries: List[LeaderboardEntryResponse] = Field(..., description="List of leaderboard entries")
    total_entries: int = Field(..., description="Total number of entries")
    last_updated: str = Field(..., description="When leaderboard was last updated")
    
    class Config:
        json_schema_extra = {
            "example": {
                "period": "weekly",
                "entries": [
                    {
                        "rank": 1,
                        "anonymous_username": "User_1234",
                        "average_score": 92.5,
                        "total_interviews": 15,
                        "calculated_at": "2026-02-15T00:00:00"
                    }
                ],
                "total_entries": 10,
                "last_updated": "2026-02-15T00:00:00"
            }
        }


class LeaderboardPreferenceUpdate(BaseModel):
    """Request schema for updating leaderboard preference."""
    
    opt_out: bool = Field(..., description="True to opt out of leaderboard, False to opt in")
    
    class Config:
        json_schema_extra = {
            "example": {
                "opt_out": False
            }
        }


class LeaderboardPreferenceResponse(BaseModel):
    """Response schema for leaderboard preference."""
    
    user_id: int = Field(..., description="User ID")
    leaderboard_opt_out: bool = Field(..., description="Whether user has opted out of leaderboard")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 123,
                "leaderboard_opt_out": False
            }
        }
