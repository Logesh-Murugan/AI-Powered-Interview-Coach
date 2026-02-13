"""
Cache key builder for consistent key patterns across the application.
Implements multi-layer caching strategy with different TTLs.
"""
from datetime import timedelta
from typing import Optional


class CacheKeyBuilder:
    """
    Builds consistent cache keys with prefixes and namespaces.
    """
    
    # Cache key prefixes
    PREFIX_USER = "user"
    PREFIX_QUESTION = "question"
    PREFIX_INTERVIEW = "interview"
    PREFIX_RESUME = "resume"
    PREFIX_ANALYTICS = "analytics"
    PREFIX_AI_RESPONSE = "ai_response"
    
    @staticmethod
    def user_profile(user_id: int) -> str:
        """Cache key for user profile data"""
        return f"{CacheKeyBuilder.PREFIX_USER}:profile:{user_id}"
    
    @staticmethod
    def user_preferences(user_id: int) -> str:
        """Cache key for user preferences"""
        return f"{CacheKeyBuilder.PREFIX_USER}:preferences:{user_id}"
    
    @staticmethod
    def question_set(role: str, difficulty: str, category: str) -> str:
        """Cache key for question sets"""
        return f"{CacheKeyBuilder.PREFIX_QUESTION}:set:{role}:{difficulty}:{category}"
    
    @staticmethod
    def interview_session(session_id: int) -> str:
        """Cache key for interview session data"""
        return f"{CacheKeyBuilder.PREFIX_INTERVIEW}:session:{session_id}"
    
    @staticmethod
    def resume_analysis(resume_id: int) -> str:
        """Cache key for resume analysis results"""
        return f"{CacheKeyBuilder.PREFIX_RESUME}:analysis:{resume_id}"
    
    @staticmethod
    def analytics_summary(user_id: int, period: str) -> str:
        """Cache key for analytics summary"""
        return f"{CacheKeyBuilder.PREFIX_ANALYTICS}:summary:{user_id}:{period}"
    
    @staticmethod
    def ai_response(prompt_hash: str) -> str:
        """Cache key for AI responses"""
        return f"{CacheKeyBuilder.PREFIX_AI_RESPONSE}:{prompt_hash}"


class CacheTTL:
    """
    TTL values for different cache layers.
    
    L1: Hot data (1-5 minutes) - Frequently accessed, changes often
    L2: Warm data (15-60 minutes) - Moderately accessed, stable
    L3: Cold data (1-24 hours) - Infrequently accessed, very stable
    L4: Frozen data (7-30 days) - Rarely changes, expensive to compute
    """
    
    # L1 Cache: Hot data (1-5 minutes)
    L1_USER_SESSION = timedelta(minutes=5)
    L1_INTERVIEW_STATE = timedelta(minutes=3)
    
    # L2 Cache: Warm data (15-60 minutes)
    L2_USER_PROFILE = timedelta(minutes=30)
    L2_USER_PREFERENCES = timedelta(minutes=60)
    L2_QUESTION_SET = timedelta(minutes=15)
    
    # L3 Cache: Cold data (1-24 hours)
    L3_RESUME_ANALYSIS = timedelta(hours=24)
    L3_ANALYTICS_SUMMARY = timedelta(hours=6)
    L3_INTERVIEW_HISTORY = timedelta(hours=12)
    
    # L4 Cache: Frozen data (7-30 days)
    L4_AI_RESPONSE = timedelta(days=30)
    L4_QUESTION_BANK = timedelta(days=7)
    L4_SKILL_TAXONOMY = timedelta(days=30)
