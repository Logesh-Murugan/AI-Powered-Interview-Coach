"""
AI Service Singleton - Prevents reinitialization on every request.
Initializes AI orchestrator once at application startup.
"""
import logging
from typing import Optional
from app.services.ai.orchestrator import AIOrchestrator

logger = logging.getLogger(__name__)


class AISingleton:
    """Singleton pattern for AI orchestrator to prevent reinitialization."""
    
    _instance: Optional['AISingleton'] = None
    _orchestrator: Optional[AIOrchestrator] = None
    _initialized: bool = False
    
    def __new__(cls) -> 'AISingleton':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def initialize(self) -> None:
        """Initialize the AI orchestrator once."""
        if not self._initialized:
            logger.info("🚀 Initializing AI Orchestrator (singleton)")
            self._orchestrator = AIOrchestrator()
            self._initialized = True
            logger.info("✅ AI Orchestrator initialized successfully")
        else:
            logger.debug("AI Orchestrator already initialized, skipping")
    
    @property
    def orchestrator(self) -> AIOrchestrator:
        """Get the AI orchestrator instance."""
        if not self._initialized or self._orchestrator is None:
            self.initialize()
        return self._orchestrator
    
    def is_initialized(self) -> bool:
        """Check if the AI system is initialized."""
        return self._initialized and self._orchestrator is not None


# Global singleton instance
ai_singleton = AISingleton()


def get_ai_orchestrator() -> AIOrchestrator:
    """
    Dependency injection function for FastAPI.
    Returns the singleton AI orchestrator instance.
    """
    return ai_singleton.orchestrator


def initialize_ai_system() -> None:
    """
    Initialize the AI system at application startup.
    Call this from main.py or app startup event.
    """
    ai_singleton.initialize()