"""
Performance monitoring for API endpoints

Tracks response times and provides metrics for analysis.
"""
import time
import logging
from typing import Dict, Any, Optional
from functools import wraps

logger = logging.getLogger(__name__)


class PerformanceTracker:
    """Track API endpoint performance"""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.metrics: Dict[str, Dict[str, Any]] = {}
        self._initialized = True

    def track_endpoint(self, endpoint: str, duration_ms: float):
        """Track endpoint response time"""
        if endpoint not in self.metrics:
            self.metrics[endpoint] = {
                "count": 0,
                "total_ms": 0,
                "min_ms": float('inf'),
                "max_ms": 0,
                "p95_samples": []
            }

        m = self.metrics[endpoint]
        m["count"] += 1
        m["total_ms"] += duration_ms
        m["min_ms"] = min(m["min_ms"], duration_ms)
        m["max_ms"] = max(m["max_ms"], duration_ms)

        # Keep last 100 samples for p95 calculation
        m["p95_samples"].append(duration_ms)
        if len(m["p95_samples"]) > 100:
            m["p95_samples"] = m["p95_samples"][-100:]

        # Alert on slow endpoints
        if duration_ms > 5000:  # 5 seconds
            logger.warning(
                f"Slow endpoint: {endpoint} took {duration_ms:.0f}ms"
            )

    def get_metrics(self) -> Dict[str, Any]:
        """Get performance metrics"""
        result = {}
        for endpoint, m in self.metrics.items():
            avg_ms = m["total_ms"] / m["count"] if m["count"] > 0 else 0

            # Calculate p95
            samples = sorted(m["p95_samples"])
            p95_idx = int(len(samples) * 0.95)
            p95_ms = samples[p95_idx] if samples else 0

            result[endpoint] = {
                "count": m["count"],
                "avg_ms": round(avg_ms, 2),
                "min_ms": round(m["min_ms"], 2),
                "max_ms": round(m["max_ms"], 2),
                "p95_ms": round(p95_ms, 2)
            }

        return result

    def reset(self):
        """Reset all metrics"""
        self.metrics.clear()


# Global instance
perf_tracker = PerformanceTracker()
