"""
Tests for performance comparison feature.

Requirements: 21.1-21.8
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.services.analytics_service import AnalyticsService
from app.services.cache_service import CacheService
from app.models.user import User
from app.models.interview_session import InterviewSession
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.models.session_question import SessionQuestion
from app.models.question import Question


class TestPerformanceComparison:
    """Unit tests for performance comparison service methods."""
    
    def test_calculate_percentile(self, db: Session):
        """Test percentile calculation."""
        cache_service = CacheService()
        analytics_service = AnalyticsService(db, cache_service)
        
        # Test with sample scores
        cohort_scores = [60.0, 65.0, 70.0, 75.0, 80.0, 85.0, 90.0, 95.0, 100.0]
        
        # User with score 80 should be at 44.44th percentile (4 out of 9 below)
        percentile = analytics_service._calculate_percentile(80.0, cohort_scores)
        assert 40 <= percentile <= 50
        
        # User with score 100 should be at 88.89th percentile (8 out of 9 below)
        percentile = analytics_service._calculate_percentile(100.0, cohort_scores)
        assert percentile >= 85
        
        # User with score 60 should be at 0th percentile (0 out of 9 below)
        percentile = analytics_service._calculate_percentile(60.0, cohort_scores)
        assert percentile == 0.0
    
    def test_get_cohort_stats(self, db: Session):
        """Test cohort statistics calculation."""
        cache_service = CacheService()
        analytics_service = AnalyticsService(db, cache_service)
        
        # Sample cohort data
        cohort = [
            (1, 60.0), (2, 65.0), (3, 70.0), (4, 75.0), (5, 80.0),
            (6, 85.0), (7, 90.0), (8, 95.0), (9, 100.0)
        ]
        
        stats = analytics_service._get_cohort_stats("Software Engineer", cohort)
        
        assert stats.target_role == "Software Engineer"
        assert stats.total_users == 9
        assert 75 <= stats.cohort_average_score <= 85  # Average should be around 80
        assert stats.cohort_median_score == 80.0  # Median of 9 values
        assert stats.score_distribution["0-60"] == 0
        assert stats.score_distribution["60-70"] == 2  # 60, 65
        assert stats.score_distribution["70-80"] == 2  # 70, 75
        assert stats.score_distribution["80-90"] == 2  # 80, 85
        assert stats.score_distribution["90-100"] == 3  # 90, 95, 100
    
    def test_determine_performance_level(self, db: Session):
        """Test performance level determination."""
        cache_service = CacheService()
        analytics_service = AnalyticsService(db, cache_service)
        
        assert analytics_service._determine_performance_level(95.0) == "expert"
        assert analytics_service._determine_performance_level(85.0) == "advanced"
        assert analytics_service._determine_performance_level(55.0) == "intermediate"
        assert analytics_service._determine_performance_level(25.0) == "beginner"
    
    def test_generate_rank_description(self, db: Session):
        """Test rank description generation."""
        cache_service = CacheService()
        analytics_service = AnalyticsService(db, cache_service)
        
        desc = analytics_service._generate_rank_description(95.0, "Software Engineer", 100)
        assert "top 10%" in desc.lower()
        
        desc = analytics_service._generate_rank_description(80.0, "Software Engineer", 100)
        assert "80%" in desc
        
        desc = analytics_service._generate_rank_description(20.0, "Software Engineer", 100)
        assert "keep practicing" in desc.lower()

