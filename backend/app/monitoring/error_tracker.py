"""
Error tracking and monitoring

Provides centralized error tracking for monitoring and alerting.
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from collections import defaultdict

logger = logging.getLogger(__name__)


class ErrorTracker:
    """Track errors for monitoring and alerting"""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.error_counts: Dict[str, int] = defaultdict(int)
        self.error_details: list = []
        self.max_details = 100
        self._initialized = True

    def track_error(
        self,
        error_type: str,
        error_message: str,
        context: Optional[Dict[str, Any]] = None
    ):
        """Track an error occurrence"""
        self.error_counts[error_type] += 1

        error_detail = {
            "type": error_type,
            "message": error_message,
            "context": context or {},
            "timestamp": datetime.utcnow().isoformat()
        }

        self.error_details.append(error_detail)

        # Keep only recent errors
        if len(self.error_details) > self.max_details:
            self.error_details = self.error_details[-self.max_details:]

        # Log critical errors
        if self.error_counts[error_type] > 10:
            logger.error(
                f"High error rate detected: {error_type} "
                f"occurred {self.error_counts[error_type]} times"
            )

    def get_metrics(self) -> Dict[str, Any]:
        """Get error metrics"""
        return {
            "error_counts": dict(self.error_counts),
            "recent_errors": self.error_details[-10:],
            "total_errors": sum(self.error_counts.values())
        }

    def reset(self):
        """Reset error tracking"""
        self.error_counts.clear()
        self.error_details.clear()


# Global instance
error_tracker = ErrorTracker()
