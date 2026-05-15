from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

from app.models.interview_session import InterviewMode, RecordingMode

class BaseInterviewModeHandler(ABC):
    """Base class for interview mode logic."""
    
    @abstractmethod
    def validate_answer_submission(
        self, 
        recording_mode: str, 
        input_method: Optional[str], 
        has_audio: bool, 
        has_video: bool
    ) -> None:
        """Validate if the submitted answer meets mode requirements."""
        pass
        
    @abstractmethod
    def get_evaluation_mode(self) -> str:
        """Get the string identifier for evaluation context."""
        pass


class PracticeModeHandler(BaseInterviewModeHandler):
    """Handler for practice mode (flexible)."""
    
    def validate_answer_submission(
        self, 
        recording_mode: str, 
        input_method: Optional[str], 
        has_audio: bool, 
        has_video: bool
    ) -> None:
        # Practice mode is flexible, does not enforce strict media presence
        pass
        
    def get_evaluation_mode(self) -> str:
        return "practice"


class MockModeHandler(BaseInterviewModeHandler):
    """Handler for mock interview mode (strict)."""
    
    def validate_answer_submission(
        self, 
        recording_mode: str, 
        input_method: Optional[str], 
        has_audio: bool, 
        has_video: bool
    ) -> None:
        if recording_mode == RecordingMode.VIDEO_AUDIO:
            if not has_video or not has_audio:
                raise ValueError("Mock interviews in video/audio mode require both video and audio recording.")
        elif recording_mode == RecordingMode.AUDIO_ONLY:
            if not has_audio:
                raise ValueError("Mock interviews in audio-only mode require audio recording.")
        elif recording_mode == RecordingMode.TEXT_ONLY:
            if not input_method or input_method != "text":
                raise ValueError("Mock interviews in text mode require text input.")
        
    def get_evaluation_mode(self) -> str:
        return "mock_interview"


class ModeFactory:
    """Factory to get the appropriate mode handler."""
    
    @staticmethod
    def get_handler(mode: str) -> BaseInterviewModeHandler:
        if mode == InterviewMode.MOCK:
            return MockModeHandler()
        return PracticeModeHandler()
