"""
Media Service for Recording Processing

Handles audio/video recording processing including:
- File validation and storage
- Speech-to-text transcription using faster-whisper
- Voice analysis using librosa
- Local processing only (no external APIs)

Requirements: Recording System Implementation
"""
import os
import json
import logging
import asyncio
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime

import librosa
import soundfile as sf
import numpy as np
from fastapi import UploadFile, HTTPException

# Try faster-whisper first, fallback to openai-whisper
try:
    from faster_whisper import WhisperModel
    WHISPER_TYPE = "faster-whisper"
except ImportError:
    try:
        import whisper
        WHISPER_TYPE = "openai-whisper"
    except ImportError:
        WHISPER_TYPE = None

logger = logging.getLogger(__name__)


class MediaService:
    """Service for processing audio/video recordings"""
    
    # Singleton Whisper model to avoid reloading
    _whisper_model: Optional[Any] = None
    
    # File validation constants
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
    MAX_DURATION = 600  # 10 minutes in seconds
    ALLOWED_AUDIO_FORMATS = {'webm', 'mp4', 'wav', 'mp3', 'm4a'}
    ALLOWED_VIDEO_FORMATS = {'webm', 'mp4', 'mov'}
    
    # Storage paths
    STORAGE_ROOT = Path("storage/media")
    AUDIO_DIR = STORAGE_ROOT / "audio"
    VIDEO_DIR = STORAGE_ROOT / "video"
    TEMP_DIR = STORAGE_ROOT / "temp"
    
    def __init__(self):
        """Initialize media service and create storage directories"""
        self._ensure_storage_directories()
    
    def _ensure_storage_directories(self) -> None:
        """Create storage directories if they don't exist"""
        try:
            self.STORAGE_ROOT.mkdir(parents=True, exist_ok=True)
            self.AUDIO_DIR.mkdir(exist_ok=True)
            self.VIDEO_DIR.mkdir(exist_ok=True)
            self.TEMP_DIR.mkdir(exist_ok=True)
            logger.info("Storage directories initialized")
        except Exception as e:
            logger.error(f"Failed to create storage directories: {e}")
            raise
    
    @classmethod
    def get_whisper_model(cls):
            """Get or initialize Whisper model (singleton pattern)"""
            if cls._whisper_model is None:
                try:
                    logger.info("Loading Whisper model...")

                    if WHISPER_TYPE == "faster-whisper":
                        # Use faster-whisper (preferred)
                        cls._whisper_model = WhisperModel(
                            "small",
                            device="auto",  # Automatically detect GPU/CPU
                            compute_type="auto"
                        )
                        logger.info("Faster-whisper model loaded successfully")

                    elif WHISPER_TYPE == "openai-whisper":
                        # Use openai-whisper as fallback
                        import whisper
                        cls._whisper_model = whisper.load_model("small")
                        logger.info("OpenAI-whisper model loaded successfully")

                    else:
                        raise ImportError("No whisper implementation available")

                except Exception as e:
                    logger.error(f"Failed to load Whisper model: {e}")
                    raise HTTPException(
                        status_code=500,
                        detail="Speech recognition service unavailable"
                    )
            return cls._whisper_model

    
    async def validate_file(self, file: UploadFile, file_type: str) -> None:
        """
        Validate uploaded file format and size
        
        Args:
            file: Uploaded file
            file_type: 'audio' or 'video'
            
        Raises:
            HTTPException: If validation fails
        """
        # Check file size
        file_content = await file.read()
        file_size = len(file_content)
        await file.seek(0)  # Reset file pointer
        
        if file_size > self.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File size ({file_size / 1024 / 1024:.1f}MB) exceeds maximum limit of {self.MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        # Check file format
        if not file.filename:
            raise HTTPException(status_code=400, detail="Filename is required")
        
        file_ext = Path(file.filename).suffix.lower().lstrip('.')
        
        if file_type == 'audio' and file_ext not in self.ALLOWED_AUDIO_FORMATS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid audio format. Allowed: {', '.join(self.ALLOWED_AUDIO_FORMATS)}"
            )
        elif file_type == 'video' and file_ext not in self.ALLOWED_VIDEO_FORMATS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid video format. Allowed: {', '.join(self.ALLOWED_VIDEO_FORMATS)}"
            )
        
        logger.info(f"File validation passed: {file.filename} ({file_size / 1024 / 1024:.1f}MB)")
    
    def generate_filename(self, user_id: int, question_id: int, file_type: str, extension: str) -> str:
        """
        Generate unique filename for recording
        
        Args:
            user_id: User ID
            question_id: Question ID
            file_type: 'audio' or 'video'
            extension: File extension
            
        Returns:
            Unique filename
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        return f"user_{user_id}_question_{question_id}_{file_type}_{timestamp}.{extension}"
    
    async def save_file(self, file: UploadFile, user_id: int, question_id: int, file_type: str) -> Tuple[str, str]:
        """
        Save uploaded file to permanent storage
        
        Args:
            file: Uploaded file
            user_id: User ID
            question_id: Question ID
            file_type: 'audio' or 'video'
            
        Returns:
            Tuple of (file_path, file_url)
        """
        try:
            # Validate file first
            await self.validate_file(file, file_type)
            
            # Generate filename
            file_ext = Path(file.filename).suffix.lower().lstrip('.')
            filename = self.generate_filename(user_id, question_id, file_type, file_ext)
            
            # Determine storage directory
            storage_dir = self.AUDIO_DIR if file_type == 'audio' else self.VIDEO_DIR
            
            # Create user subdirectory
            user_dir = storage_dir / f"user_{user_id}"
            user_dir.mkdir(exist_ok=True)
            
            # Save file
            file_path = user_dir / filename
            file_content = await file.read()
            
            with open(file_path, "wb") as f:
                f.write(file_content)
            
            # Generate URL for serving
            file_url = f"/media/{file_type}/user_{user_id}/{filename}"
            
            logger.info(f"File saved: {file_path} -> {file_url}")
            return str(file_path), file_url
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to save file: {e}")
            raise HTTPException(status_code=500, detail="Failed to save recording")
    
    def extract_audio_from_video(self, video_path: str) -> str:
        """
        Extract audio from video file using ffmpeg
        
        Args:
            video_path: Path to video file
            
        Returns:
            Path to extracted audio file
        """
        try:
            import ffmpeg
            
            # Create temporary audio file
            temp_audio = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
            temp_audio.close()
            
            # Extract audio using ffmpeg
            (
                ffmpeg
                .input(video_path)
                .output(temp_audio.name, acodec='pcm_s16le', ac=1, ar='16000')
                .overwrite_output()
                .run(quiet=True)
            )
            
            logger.info(f"Audio extracted from video: {video_path} -> {temp_audio.name}")
            return temp_audio.name
            
        except Exception as e:
            logger.error(f"Failed to extract audio from video: {e}")
            raise HTTPException(status_code=500, detail="Failed to process video file")
    
    async def transcribe_audio(self, audio_path: str) -> Dict[str, Any]:
        """
        Transcribe audio using Whisper
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Transcription results with text and metadata
        """
        try:
            model = self.get_whisper_model()
            
            # Run transcription in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            
            if WHISPER_TYPE == "faster-whisper":
                # Use faster-whisper
                segments, info = await loop.run_in_executor(
                    None,
                    lambda: model.transcribe(audio_path, beam_size=5)
                )
                
                # Collect segments
                transcription_text = ""
                segments_list = []
                
                for segment in segments:
                    transcription_text += segment.text + " "
                    segments_list.append({
                        "start": segment.start,
                        "end": segment.end,
                        "text": segment.text.strip()
                    })
                
                result = {
                    "text": transcription_text.strip(),
                    "language": info.language,
                    "language_probability": info.language_probability,
                    "duration": info.duration,
                    "segments": segments_list
                }
                
            elif WHISPER_TYPE == "openai-whisper":
                # Use openai-whisper
                result_raw = await loop.run_in_executor(
                    None,
                    lambda: model.transcribe(audio_path)
                )
                
                # Convert to consistent format
                segments_list = []
                if "segments" in result_raw:
                    for segment in result_raw["segments"]:
                        segments_list.append({
                            "start": segment.get("start", 0),
                            "end": segment.get("end", 0),
                            "text": segment.get("text", "").strip()
                        })
                
                result = {
                    "text": result_raw.get("text", "").strip(),
                    "language": result_raw.get("language", "unknown"),
                    "language_probability": 0.9,  # OpenAI whisper doesn't provide this
                    "duration": 0.0,  # Will be calculated elsewhere
                    "segments": segments_list
                }
            
            else:
                raise ImportError("No whisper implementation available")
            
            logger.info(f"Transcription completed: {len(result['text'])} characters")
            return result
            
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            # Return empty result instead of failing completely
            return {
                "text": "",
                "language": "unknown",
                "language_probability": 0.0,
                "duration": 0.0,
                "segments": [],
                "error": str(e)
            }
    
    def analyze_voice(self, audio_path: str, transcription_text: str) -> Dict[str, Any]:
        """
        Analyze voice characteristics using librosa
        
        Args:
            audio_path: Path to audio file
            transcription_text: Transcribed text for word count
            
        Returns:
            Voice analysis results
        """
        try:
            # Load audio file
            y, sr = librosa.load(audio_path, sr=None)
            duration = len(y) / sr
            
            # Calculate speaking pace (words per minute)
            word_count = len(transcription_text.split()) if transcription_text else 0
            speaking_pace_wpm = (word_count / duration * 60) if duration > 0 else 0
            
            # Detect pauses (silence detection)
            # Use RMS energy to detect speech vs silence
            frame_length = 2048
            hop_length = 512
            rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
            
            # Threshold for silence detection (can be tuned)
            silence_threshold = np.percentile(rms, 20)
            speech_frames = rms > silence_threshold
            
            # Convert frames to time
            times = librosa.frames_to_time(np.arange(len(speech_frames)), sr=sr, hop_length=hop_length)
            
            # Find pause segments
            pauses = []
            in_pause = False
            pause_start = 0
            
            for i, is_speech in enumerate(speech_frames):
                if not is_speech and not in_pause:
                    # Start of pause
                    in_pause = True
                    pause_start = times[i]
                elif is_speech and in_pause:
                    # End of pause
                    in_pause = False
                    pause_duration = times[i] - pause_start
                    if pause_duration > 0.5:  # Only count pauses longer than 0.5 seconds
                        pauses.append(pause_duration)
            
            # Calculate speaking time (non-silence time)
            speaking_time = np.sum(speech_frames) * hop_length / sr
            
            # Volume consistency (coefficient of variation of RMS)
            volume_consistency = 1 - (np.std(rms) / np.mean(rms)) if np.mean(rms) > 0 else 0
            volume_consistency = max(0, min(1, volume_consistency))  # Clamp to [0, 1]
            
            # Detect filler words
            filler_words = ['um', 'uh', 'like', 'you know', 'so', 'actually', 'basically']
            detected_fillers = []
            filler_count = 0
            
            if transcription_text:
                text_lower = transcription_text.lower()
                for filler in filler_words:
                    count = text_lower.count(filler)
                    if count > 0:
                        filler_count += count
                        detected_fillers.append(filler)
            
            # Calculate confidence score based on multiple factors
            pace_score = 1.0 if 120 <= speaking_pace_wpm <= 180 else max(0, 1 - abs(speaking_pace_wpm - 150) / 150)
            pause_score = 1.0 if len(pauses) <= 5 else max(0, 1 - (len(pauses) - 5) / 10)
            filler_score = 1.0 if filler_count <= 2 else max(0, 1 - (filler_count - 2) / 10)
            volume_score = volume_consistency
            
            confidence_score = (pace_score + pause_score + filler_score + volume_score) / 4
            
            analysis_result = {
                "speaking_pace_wpm": round(speaking_pace_wpm, 1),
                "total_speaking_time": round(speaking_time, 1),
                "total_duration": round(duration, 1),
                "pause_count": len(pauses),
                "average_pause_duration": round(np.mean(pauses), 2) if pauses else 0,
                "longest_pause": round(max(pauses), 2) if pauses else 0,
                "filler_word_count": filler_count,
                "detected_fillers": detected_fillers,
                "volume_consistency": round(volume_consistency, 3),
                "confidence_score": round(confidence_score, 3),
                "analysis_metadata": {
                    "word_count": word_count,
                    "speech_ratio": round(speaking_time / duration, 3) if duration > 0 else 0,
                    "sample_rate": sr,
                    "audio_length_seconds": duration
                }
            }
            
            logger.info(f"Voice analysis completed: pace={speaking_pace_wpm:.1f} wpm, confidence={confidence_score:.3f}")
            return analysis_result
            
        except Exception as e:
            logger.error(f"Voice analysis failed: {e}")
            # Return basic analysis instead of failing completely
            return {
                "speaking_pace_wpm": 0,
                "total_speaking_time": 0,
                "total_duration": 0,
                "pause_count": 0,
                "average_pause_duration": 0,
                "longest_pause": 0,
                "filler_word_count": 0,
                "detected_fillers": [],
                "volume_consistency": 0,
                "confidence_score": 0,
                "analysis_metadata": {"error": str(e)}
            }
    
    async def process_recording(
        self,
        audio_file: UploadFile,
        user_id: int,
        question_id: int,
        video_file: Optional[UploadFile] = None
    ) -> Dict[str, Any]:
        """
        Complete recording processing pipeline
        
        Args:
            audio_file: Audio recording file
            user_id: User ID
            question_id: Question ID
            video_file: Optional video recording file
            
        Returns:
            Complete processing results
        """
        temp_files = []  # Track temporary files for cleanup
        
        try:
            logger.info(f"Processing recording for user {user_id}, question {question_id}")
            
            # Save audio file
            audio_path, audio_url = await self.save_file(audio_file, user_id, question_id, 'audio')
            
            # Save video file if provided
            video_path = None
            video_url = None
            if video_file:
                video_path, video_url = await self.save_file(video_file, user_id, question_id, 'video')
            
            # Determine audio file for processing
            processing_audio_path = audio_path
            
            # If we have video but no separate audio, extract audio from video
            if video_file and not audio_file.filename:
                processing_audio_path = self.extract_audio_from_video(video_path)
                temp_files.append(processing_audio_path)
            
            # Get recording duration
            try:
                y, sr = librosa.load(processing_audio_path, sr=None)
                duration = len(y) / sr
            except Exception as e:
                logger.warning(f"Could not determine recording duration: {e}")
                duration = 0
            
            # Validate duration
            if duration > self.MAX_DURATION:
                raise HTTPException(
                    status_code=400,
                    detail=f"Recording duration ({duration:.1f}s) exceeds maximum limit of {self.MAX_DURATION}s"
                )
            
            # Transcribe audio
            transcription_result = await self.transcribe_audio(processing_audio_path)
            
            # Analyze voice characteristics
            voice_analysis = self.analyze_voice(processing_audio_path, transcription_result.get('text', ''))
            
            # Determine recording format
            recording_format = Path(audio_file.filename).suffix.lower().lstrip('.') if audio_file.filename else 'unknown'
            
            result = {
                "audio_url": audio_url,
                "video_url": video_url,
                "recording_duration": duration,
                "recording_format": recording_format,
                "transcription": transcription_result.get('text', ''),
                "voice_analysis": voice_analysis,
                "processing_metadata": {
                    "transcription_info": {
                        "language": transcription_result.get('language', 'unknown'),
                        "language_probability": transcription_result.get('language_probability', 0),
                        "segments_count": len(transcription_result.get('segments', []))
                    },
                    "processed_at": datetime.utcnow().isoformat(),
                    "whisper_model": "small",
                    "processing_duration": duration
                }
            }
            
            logger.info(f"Recording processing completed successfully for user {user_id}, question {question_id}")
            return result
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Recording processing failed: {e}")
            raise HTTPException(status_code=500, detail="Recording processing failed")
        
        finally:
            # Clean up temporary files
            for temp_file in temp_files:
                try:
                    if os.path.exists(temp_file):
                        os.unlink(temp_file)
                        logger.debug(f"Cleaned up temporary file: {temp_file}")
                except Exception as e:
                    logger.warning(f"Failed to clean up temporary file {temp_file}: {e}")
    
    def health_check(self) -> Dict[str, Any]:
        """
        Check media service health status
        
        Returns:
            Health status information
        """
        try:
            # Check storage directories
            storage_accessible = all([
                self.STORAGE_ROOT.exists(),
                self.AUDIO_DIR.exists(),
                self.VIDEO_DIR.exists(),
                self.TEMP_DIR.exists()
            ])
            
            # Check if Whisper model can be loaded
            whisper_loaded = False
            try:
                self.get_whisper_model()
                whisper_loaded = True
            except Exception as e:
                logger.warning(f"Whisper model check failed: {e}")
            
            # Check ffmpeg availability
            ffmpeg_available = False
            try:
                import ffmpeg
                ffmpeg_available = True
            except ImportError:
                logger.warning("FFmpeg not available")
            
            return {
                "status": "healthy" if (storage_accessible and whisper_loaded) else "degraded",
                "whisper_loaded": whisper_loaded,
                "storage_accessible": storage_accessible,
                "ffmpeg_available": ffmpeg_available,
                "processing_ready": whisper_loaded and storage_accessible,
                "storage_paths": {
                    "root": str(self.STORAGE_ROOT),
                    "audio": str(self.AUDIO_DIR),
                    "video": str(self.VIDEO_DIR),
                    "temp": str(self.TEMP_DIR)
                }
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "whisper_loaded": False,
                "storage_accessible": False,
                "ffmpeg_available": False,
                "processing_ready": False
            }