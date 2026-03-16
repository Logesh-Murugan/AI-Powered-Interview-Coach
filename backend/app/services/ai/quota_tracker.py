"""
Quota Tracker for AI Provider Usage Management

This module implements quota tracking and enforcement for AI providers.
It monitors daily usage, calculates remaining quota, and triggers alerts.

Requirements: 26.1-26.11
"""
from datetime import date, datetime
from typing import Dict, Optional
from sqlalchemy.orm import Session
import logging

from app.models.ai_provider_usage import AIProviderUsage

logger = logging.getLogger(__name__)


# Provider quota limits (requests per day)
PROVIDER_QUOTAS = {
    # Legacy entries retained for backward compatibility
    'groq_1': 14400,
    'groq_2': 14400,
    'groq_3': 14400,
    'huggingface_1': 30000,
    'huggingface_2': 30000,
    'gemini_1': 1500,
    'gemini_2': 1500,
    'gemini_3': 1500,

    # Active HuggingFace providers (treat as high/unlimited for our use)
    'hf_primary': 1000000,
    'hf_secondary': 1000000,
    'hf_tertiary': 1000000,
}


class QuotaTracker:
    """Track and enforce API quota limits for AI providers."""

    def __init__(self, db: Session):
        self.db = db
        self.alert_thresholds = {
            'warning': 0.80,
            'critical': 0.90,
            'disabled': 1.00
        }

    def record_usage(self, provider_name: str, character_count: int, request_count: int = 1) -> None:
        if character_count < 0:
            raise ValueError(f"character_count must be non-negative, got {character_count}")
        if request_count < 0:
            raise ValueError(f"request_count must be non-negative, got {request_count}")

        today = date.today()
        try:
            usage = self.db.query(AIProviderUsage).filter(
                AIProviderUsage.provider_name == provider_name,
                AIProviderUsage.date == today
            ).first()
            if usage:
                usage.request_count += request_count
                usage.character_count += character_count
                usage.updated_at = datetime.utcnow()
            else:
                usage = AIProviderUsage(
                    provider_name=provider_name,
                    date=today,
                    request_count=request_count,
                    character_count=character_count
                )
                self.db.add(usage)
            self.db.commit()
            logger.info(f"Recorded usage for {provider_name}: {character_count} chars")
            self._check_and_alert(provider_name, usage)
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to record usage for {provider_name}: {e}")
            raise

    def get_remaining_percentage(self, provider_name: str) -> float:
        today = date.today()
        quota_limit = PROVIDER_QUOTAS.get(provider_name)
        if not quota_limit:
            logger.warning(f"No quota limit defined for {provider_name}")
            return 1.0
        usage = self.db.query(AIProviderUsage).filter(
            AIProviderUsage.provider_name == provider_name,
            AIProviderUsage.date == today
        ).first()
        if not usage:
            return 1.0
        used_percentage = usage.character_count / quota_limit
        return max(0.0, 1.0 - used_percentage)

    def get_usage_stats(self, provider_name: str) -> Dict:
        today = date.today()
        quota_limit = PROVIDER_QUOTAS.get(provider_name, 0)
        usage = self.db.query(AIProviderUsage).filter(
            AIProviderUsage.provider_name == provider_name,
            AIProviderUsage.date == today
        ).first()
        if not usage:
            return {
                'provider_name': provider_name,
                'date': today,
                'request_count': 0,
                'character_count': 0,
                'quota_limit': quota_limit,
                'remaining_percentage': 1.0,
                'status': 'available'
            }
        remaining_pct = self.get_remaining_percentage(provider_name)
        if remaining_pct <= 0:
            status = 'disabled'
        elif remaining_pct <= 0.10:
            status = 'critical'
        elif remaining_pct <= 0.20:
            status = 'warning'
        else:
            status = 'available'
        return {
            'provider_name': provider_name,
            'date': today,
            'request_count': usage.request_count,
            'character_count': usage.character_count,
            'quota_limit': quota_limit,
            'remaining_percentage': remaining_pct,
            'status': status
        }

    def is_provider_available(self, provider_name: str) -> bool:
        return self.get_remaining_percentage(provider_name) > 0.0

    def _check_and_alert(self, provider_name: str, usage: AIProviderUsage) -> None:
        remaining_pct = self.get_remaining_percentage(provider_name)
        if remaining_pct <= 0.0:
            logger.error(f"?? QUOTA EXCEEDED: {provider_name} has reached 100% usage. Provider disabled until tomorrow.")
        elif remaining_pct <= 0.10:
            logger.warning(f"??  CRITICAL: {provider_name} has reached 90% quota usage. Only {remaining_pct:.1%} remaining.")
        elif remaining_pct <= 0.20:
            logger.warning(f"??  WARNING: {provider_name} has reached 80% quota usage. {remaining_pct:.1%} remaining.")

    def get_all_provider_stats(self) -> Dict[str, Dict]:
        return {name: self.get_usage_stats(name) for name in PROVIDER_QUOTAS.keys()}

    def reset_daily_usage(self, provider_name: Optional[str] = None) -> None:
        today = date.today()
        if provider_name:
            self.db.query(AIProviderUsage).filter(
                AIProviderUsage.provider_name == provider_name,
                AIProviderUsage.date == today
            ).delete()
        else:
            self.db.query(AIProviderUsage).filter(
                AIProviderUsage.date == today
            ).delete()
        self.db.commit()
        logger.info(f"Reset daily usage for {provider_name or 'all providers'}")
