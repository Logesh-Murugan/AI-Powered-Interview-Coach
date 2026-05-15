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

try:
    import librosa
    import soundfile as sf
    import numpy as np
    AUDIO_LIBS_AVAILABLE = True
except ImportError:
    librosa = None
    sf = None
    np = None
    AUDIO_LIBS_AVAILABLE = False
    import logging as _log
    _log.getLogger(__name__).warning(
        "librosa/soundfile/numpy not installed - audio analysis features disabled. "
        "Install with: pip install librosa soundfile numpy"
    )

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
                            device="cpu",  # Force CPU to avoid CUDA DLL missing errors on Windows
                            compute_type="int8" # Recommended for CPU inference
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
    
    async def analyze_video(self, video_path: str, duration: float) -> Dict[str, Any]:
        """
        Analyze video characteristics
        
        Args:
            video_path: Path to video file
            duration: Video duration in seconds
            
        Returns:
            Video analysis results including frame analysis
        """
        try:
            import cv2
            
            logger.info(f"Analyzing video: {video_path}")
            
            # Open video file
            cap = cv2.VideoCapture(video_path)
            
            if not cap.isOpened():
                raise Exception("Failed to open video file")
            
            # Get video properties
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            # Sample frames for analysis (every 2 seconds)
            sample_interval = int(fps * 2) if fps > 0 else 30
            frames_analyzed = 0
            brightness_values = []
            motion_values = []
            prev_frame = None
            
            # Analyze sampled frames
            frame_idx = 0
            while cap.isOpened() and frames_analyzed < 30:  # Limit to 30 samples
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_idx % sample_interval == 0:
                    # Convert to grayscale for analysis
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    
                    # Calculate brightness (mean pixel value)
                    brightness = np.mean(gray)
                    brightness_values.append(brightness)
                    
                    # Calculate motion (frame difference)
                    if prev_frame is not None:
                        frame_diff = cv2.absdiff(gray, prev_frame)
                        motion = np.mean(frame_diff)
                        motion_values.append(motion)
                    
                    prev_frame = gray
                    frames_analyzed += 1
                
                frame_idx += 1
            
            cap.release()
            
            # Calculate statistics
            avg_brightness = np.mean(brightness_values) if brightness_values else 0
            brightness_consistency = 1 - (np.std(brightness_values) / np.mean(brightness_values)) if brightness_values and np.mean(brightness_values) > 0 else 0
            brightness_consistency = max(0, min(1, brightness_consistency))
            
            avg_motion = np.mean(motion_values) if motion_values else 0
            
            # Determine lighting quality
            if avg_brightness < 50:
                lighting_quality = "poor"
                lighting_feedback = "Video is too dark. Improve lighting for better visibility."
            elif avg_brightness < 100:
                lighting_quality = "fair"
                lighting_feedback = "Lighting could be improved for better video quality."
            elif avg_brightness < 180:
                lighting_quality = "good"
                lighting_feedback = "Good lighting quality."
            else:
                lighting_quality = "excellent"
                lighting_feedback = "Excellent lighting quality."
            
            # Determine stability
            if avg_motion < 5:
                stability = "excellent"
                stability_feedback = "Very stable video - excellent camera positioning."
            elif avg_motion < 15:
                stability = "good"
                stability_feedback = "Good video stability."
            elif avg_motion < 30:
                stability = "fair"
                stability_feedback = "Some camera movement detected. Try to keep camera more stable."
            else:
                stability = "poor"
                stability_feedback = "Significant camera movement. Use a tripod or stable surface."
            
            # Calculate overall video quality score
            brightness_score = min(1.0, avg_brightness / 150)  # Optimal around 150
            stability_score = max(0, 1 - (avg_motion / 50))  # Lower motion is better
            consistency_score = brightness_consistency
            
            quality_score = (brightness_score + stability_score + consistency_score) / 3
            
            analysis_result = {
                "video_properties": {
                    "width": width,
                    "height": height,
                    "fps": round(fps, 2),
                    "frame_count": frame_count,
                    "duration": round(duration, 2),
                    "resolution": f"{width}x{height}"
                },
                "lighting": {
                    "average_brightness": round(avg_brightness, 2),
                    "brightness_consistency": round(brightness_consistency, 3),
                    "quality": lighting_quality,
                    "feedback": lighting_feedback
                },
                "stability": {
                    "average_motion": round(avg_motion, 2),
                    "quality": stability,
                    "feedback": stability_feedback
                },
                "overall_quality": {
                    "score": round(quality_score, 3),
                    "rating": "excellent" if quality_score >= 0.8 else "good" if quality_score >= 0.6 else "fair" if quality_score >= 0.4 else "poor"
                },
                "analysis_metadata": {
                    "frames_analyzed": frames_analyzed,
                    "sample_interval_frames": sample_interval,
                    "analysis_method": "opencv_frame_analysis"
                }
            }
            
            logger.info(f"Video analysis completed: quality={quality_score:.3f}, lighting={lighting_quality}, stability={stability}")
            return analysis_result
            
        except ImportError:
            logger.warning("OpenCV not available - video analysis skipped")
            return {
                "error": "Video analysis requires opencv-python package",
                "video_properties": {
                    "duration": round(duration, 2)
                },
                "analysis_metadata": {
                    "analysis_available": False,
                    "reason": "opencv-python not installed"
                }
            }
        except Exception as e:
            logger.error(f"Video analysis failed: {e}")
            return {
                "error": str(e),
                "video_properties": {
                    "duration": round(duration, 2)
                },
                "analysis_metadata": {
                    "analysis_available": False,
                    "reason": str(e)
                }
            }
    
    async def process_recording(
        self,
        audio_file: Optional[UploadFile],
        user_id: int,
        question_id: int,
        video_file: Optional[UploadFile] = None
    ) -> Dict[str, Any]:
        """
        Complete recording processing pipeline with video support
        
        Args:
            audio_file: Audio recording file (optional if video provided)
            user_id: User ID
            question_id: Question ID
            video_file: Optional video recording file
            
        Returns:
            Complete processing results including video analysis
        """
        temp_files = []  # Track temporary files for cleanup
        
        try:
            logger.info(f"Processing recording for user {user_id}, question {question_id}")
            
            # Validate that at least one file is provided
            if not audio_file and not video_file:
                raise HTTPException(
                    status_code=400,
                    detail="At least one recording file (audio or video) must be provided"
                )
            
            audio_path = None
            audio_url = None
            video_path = None
            video_url = None
            
            # Save audio file if provided
            if audio_file and audio_file.filename:
                audio_path, audio_url = await self.save_file(audio_file, user_id, question_id, 'audio')
                logger.info(f"Audio file saved: {audio_url}")
            
            # Save video file if provided
            if video_file and video_file.filename:
                video_path, video_url = await self.save_file(video_file, user_id, question_id, 'video')
                logger.info(f"Video file saved: {video_url}")
            
            # Determine audio file for processing
            processing_audio_path = audio_path
            video_audio_extracted = False
            
            # If we have video, extract audio from it for analysis
            if video_path:
                try:
                    video_audio_path = self.extract_audio_from_video(video_path)
                    temp_files.append(video_audio_path)
                    video_audio_extracted = True
                    logger.info(f"Audio extracted from video: {video_audio_path}")
                    
                    # Use video audio if no separate audio file provided
                    if not processing_audio_path:
                        processing_audio_path = video_audio_path
                        logger.info("Using video audio for transcription")
                    else:
                        # We have both - use the dedicated audio file for better quality
                        logger.info("Using dedicated audio file for transcription")
                        
                except Exception as e:
                    logger.warning(f"Failed to extract audio from video: {e}")
                    # Continue without video audio extraction
                    if not processing_audio_path:
                        raise HTTPException(
                            status_code=400,
                            detail="Failed to extract audio from video. Please provide a separate audio file."
                        )
            
            if not processing_audio_path:
                raise HTTPException(
                    status_code=400,
                    detail="No audio available for processing"
                )
            
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
            logger.info("Starting transcription...")
            transcription_result = await self.transcribe_audio(processing_audio_path)
            logger.info(f"Transcription completed: {len(transcription_result.get('text', ''))} characters")
            
            # Analyze voice characteristics
            logger.info("Starting voice analysis...")
            voice_analysis = self.analyze_voice(processing_audio_path, transcription_result.get('text', ''))
            logger.info("Voice analysis completed")
            
            # Analyze video if provided
            video_analysis = None
            if video_path:
                try:
                    logger.info("Starting video analysis...")
                    video_analysis = await self.analyze_video(video_path, duration)
                    logger.info("Video analysis completed")
                except Exception as e:
                    logger.warning(f"Video analysis failed: {e}")
                    # Continue without video analysis
            
            # Determine recording format
            if audio_file and audio_file.filename:
                recording_format = Path(audio_file.filename).suffix.lower().lstrip('.')
            elif video_file and video_file.filename:
                recording_format = Path(video_file.filename).suffix.lower().lstrip('.')
            else:
                recording_format = 'unknown'
            
            result = {
                "audio_url": audio_url,
                "video_url": video_url,
                "recording_duration": duration,
                "recording_format": recording_format,
                "transcription": transcription_result.get('text', ''),
                "voice_analysis": voice_analysis,
                "video_analysis": video_analysis,
                "processing_metadata": {
                    "transcription_info": {
                        "language": transcription_result.get('language', 'unknown'),
                        "language_probability": transcription_result.get('language_probability', 0),
                        "segments_count": len(transcription_result.get('segments', []))
                    },
                    "processed_at": datetime.utcnow().isoformat(),
                    "whisper_model": "small",
                    "processing_duration": duration,
                    "video_audio_extracted": video_audio_extracted,
                    "has_video_analysis": video_analysis is not None
                }
            }
            
            logger.info(f"Recording processing completed successfully for user {user_id}, question {question_id}")
            return result
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Recording processing failed: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Recording processing failed: {str(e)}")
        
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