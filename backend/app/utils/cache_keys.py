"""
Cache key builder for consistent key patterns across the application.
Implements multi-layer caching strategy with different TTLs.

Requirements: 25.1-25.5
"""
from datetime import timedelta
from typing import Optional, List
import hashlib
import json


class CacheKeyBuilder:
    """
    Builds consistent cache keys with prefixes and namespaces.
    
    Requirements: 25.2-25.5
    """
    
    # Cache key prefixes
    PREFIX_USER = "user"
    PREFIX_QUESTION = "questions"
    PREFIX_EVAL = "eval"
    PREFIX_SESSION = "session"
    PREFIX_INTERVIEW = "interview"
    PREFIX_RESUME = "resume"
    PREFIX_ANALYTICS = "analytics"
    PREFIX_AI_RESPONSE = "ai_response"
    PREFIX_LEADERBOARD = "leaderboard"
    
    @staticmethod
    def _generate_hash(data: str) -> str:
        """Generate MD5 hash for cache key."""
        return hashlib.md5(data.encode()).hexdigest()[:8]
    
    @staticmethod
    def _normalize_answer(answer_text: str) -> str:
        """
        Normalize answer text for consistent hashing.
        
        Requirement: 25.3
        - Lowercase
        - Trim whitespace
        - Remove extra spaces
        """
        return ' '.join(answer_text.lower().strip().split())
    
    @staticmethod
    def questions(role: str, difficulty: str, count: int, categories: List[str]) -> str:
        """
        Cache key for questions.
        
        Requirement: 25.2
        Pattern: questions:{role}:{difficulty}:{count}:{hash}
        where hash is MD5 of sorted categories
        
        Args:
            role: Target role (e.g., "Software Engineer")
            difficulty: Question difficulty (easy/medium/hard)
            count: Number of questions
            categories: List of question categories
            
        Returns:
            Cache key string
        """
        # Sort categories for consistent hashing
        sorted_categories = sorted(categories)
        categories_str = json.dumps(sorted_categories)
        hash_value = CacheKeyBuilder._generate_hash(categories_str)
        
        return f"{CacheKeyBuilder.PREFIX_QUESTION}:{role}:{difficulty}:{count}:{hash_value}"
    
    @staticmethod
    def evaluation(answer_text: str) -> str:
        """
        Cache key for evaluations.
        
        Requirement: 25.3
        Pattern: eval:{answer_hash}
        where answer_hash is MD5 of normalized answer text
        
        Args:
            answer_text: The answer text to evaluate
            
        Returns:
            Cache key string
        """
        normalized = CacheKeyBuilder._normalize_answer(answer_text)
        answer_hash = CacheKeyBuilder._generate_hash(normalized)
        
        return f"{CacheKeyBuilder.PREFIX_EVAL}:{answer_hash}"
    
    @staticmethod
    def session(session_id: int) -> str:
        """
        Cache key for sessions.
        
        Requirement: 25.4
        Pattern: session:{session_id}
        Stores full session data as JSON
        
        Args:
            session_id: Interview session ID
            
        Returns:
            Cache key string
        """
        return f"{CacheKeyBuilder.PREFIX_SESSION}:{session_id}"
    
    @staticmethod
    def user_preferences(user_id: int) -> str:
        """
        Cache key for user preferences.
        
        Requirement: 25.5
        Pattern: user:{user_id}:prefs
        Stores profile and settings
        
        Args:
            user_id: User ID
            
        Returns:
            Cache key string
        """
        return f"{CacheKeyBuilder.PREFIX_USER}:{user_id}:prefs"
    
    @staticmethod
    def user_profile(user_id: int) -> str:
        """Cache key for user profile data"""
        return f"{CacheKeyBuilder.PREFIX_USER}:profile:{user_id}"
    
    @staticmethod
    def question_set(role: str, difficulty: str, category: str) -> str:
        """Cache key for question sets (legacy)"""
        return f"{CacheKeyBuilder.PREFIX_QUESTION}:set:{role}:{difficulty}:{category}"
    
    @staticmethod
    def interview_session(session_id: int) -> str:
        """Cache key for interview session data (legacy)"""
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
    
    @staticmethod
    def leaderboard(period: str) -> str:
        """Cache key for leaderboard data"""
        return f"{CacheKeyBuilder.PREFIX_LEADERBOARD}:{period}"


class CacheTTL:
    """
    TTL values for different cache layers.
    
    Requirement: 25.1
    L1: Questions (30 days)
    L2: Evaluations (7 days)
    L3: Sessions (2 hours)
    L4: User Preferences (24 hours)
    """
    
    # L1 Cache: Questions (Req 25.1)
    L1_QUESTIONS = timedelta(days=30)
    
    # L2 Cache: Evaluations (Req 25.1)
    L2_EVALUATIONS = timedelta(days=7)
    
    # L3 Cache: Sessions (Req 25.1)
    L3_SESSIONS = timedelta(hours=2)
    
    # L4 Cache: User Preferences (Req 25.1)
    L4_USER_PREFERENCES = timedelta(hours=24)
    
    # Legacy TTLs (kept for backward compatibility)
    L1_USER_SESSION = timedelta(minutes=5)
    L1_INTERVIEW_STATE = timedelta(minutes=3)
    L2_USER_PROFILE = timedelta(minutes=30)
    L2_QUESTION_SET = timedelta(minutes=15)
    L3_RESUME_ANALYSIS = timedelta(hours=24)
    L3_ANALYTICS_SUMMARY = timedelta(hours=6)
    L3_INTERVIEW_HISTORY = timedelta(hours=12)
    L3_LEADERBOARD = timedelta(hours=24)
    L4_AI_RESPONSE = timedelta(days=30)
    L4_QUESTION_BANK = timedelta(days=7)
    L4_SKILL_TAXONOMY = timedelta(days=30)


# Alias for convenience
CacheKeys = CacheKeyBuilder
