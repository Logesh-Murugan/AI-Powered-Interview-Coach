# Video/Audio Recording System Implementation Plan

## Overview
This document outlines the complete implementation plan for adding video/audio recording capabilities to the AI-powered interview coach system. The implementation will be **100% local and open-source**, integrating seamlessly with the existing architecture.

## Current System Analysis

### Existing Architecture
- **Backend**: FastAPI with SQLAlchemy ORM, PostgreSQL database, Redis caching
- **Frontend**: React/TypeScript with Material-UI components
- **Interview Flow**: Session creation → Question display → Answer submission → AI evaluation
- **File Storage**: Local storage pattern in `uploads/` directory with UUID-prefixed filenames
- **Database**: Alembic migrations, soft deletes, proper indexing and relationships

### Key Integration Points
- **Answer Model**: Currently stores `answer_text`, `time_taken`, `submitted_at`
- **File Upload Pattern**: Existing `file_upload.py` utility for resume uploads
- **API Structure**: RESTful endpoints under `/interviews` namespace
- **Frontend Components**: `InterviewSessionPage.tsx` handles question display and answer submission

## Implementation Plan

### STEP 1: Database Schema Extension

#### 1.1 Add Recording Fields to Answer Model
**File**: `Ai_powered_interview_coach/backend/app/models/answer.py`

Add new columns to support recording data:
```python
# Recording fields
audio_url = Column(String(500), nullable=True)
video_url = Column(String(500), nullable=True) 
recording_duration = Column(Float, nullable=True)  # Duration in seconds
recording_format = Column(String(20), nullable=True)  # webm, mp4, etc.
transcription = Column(Text, nullable=True)
voice_analysis = Column(JSON, nullable=True)  # Speaking pace, filler words, etc.
```

#### 1.2 Create Database Migration
**File**: `Ai_powered_interview_coach/backend/alembic/versions/008_add_recording_fields.py`

Generate Alembic migration to add recording fields to existing `answers` table:
- Add columns with NULL defaults for backward compatibility
- Ensure existing functionality continues working
- Add indexes for recording_url fields for efficient queries

### STEP 2: Backend Recording Service

#### 2.1 Media Processing Service
**File**: `Ai_powered_interview_coach/backend/app/services/media_service.py`

Create comprehensive media processing service:
```python
class MediaService:
    def __init__(self):
        self.whisper_model = None  # Lazy load
        
    async def process_recording(self, audio_file, video_file=None, user_id: int, question_id: int):
        # 1. Validate files (format, size, duration)
        # 2. Save to permanent storage
        # 3. Extract audio from video if needed
        # 4. Run Whisper transcription
        # 5. Perform voice analysis with librosa
        # 6. Return structured results
```

**Key Features**:
- **Singleton Whisper Model**: Load once, reuse for all transcriptions
- **CPU/GPU Detection**: Automatically use GPU if available, fallback to CPU
- **File Validation**: Check format (webm), size (100MB max), duration limits
- **Error Handling**: Graceful degradation if transcription fails
- **Memory Management**: Clean temporary files, prevent memory leaks

#### 2.2 Storage Management
**File**: `Ai_powered_interview_coach/backend/app/utils/media_storage.py`

Extend existing file storage pattern:
```python
# Directory structure
storage/
├── media/
│   ├── audio/          # Audio recordings
│   ├── video/          # Video recordings  
│   └── temp/           # Temporary processing files
```

**Security Features**:
- User-specific subdirectories
- Filename format: `user_{user_id}_question_{question_id}_{timestamp}.webm`
- Path traversal prevention
- File access authorization

### STEP 3: API Endpoints

#### 3.1 Recording Upload Endpoint
**File**: `Ai_powered_interview_coach/backend/app/routes/media.py`

```python
@router.post("/upload-recording")
async def upload_recording(
    audio_file: UploadFile,
    video_file: Optional[UploadFile] = None,
    question_id: int = Form(...),
    session_id: int = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Validate session ownership
    # 2. Process recording files
    # 3. Update answer record with recording data
    # 4. Return transcription and analysis results
```

#### 3.2 Media Serving Endpoint
**File**: `Ai_powered_interview_coach/backend/app/main.py`

Mount static file serving for recordings:
```python
app.mount("/media", StaticFiles(directory="storage/media"), name="media")
```

**Authorization**: Middleware to ensure users can only access their own recordings.

#### 3.3 Health Check Endpoint
**File**: `Ai_powered_interview_coach/backend/app/routes/media.py`

```python
@router.get("/health")
async def media_health_check():
    return {
        "whisper_loaded": whisper_model is not None,
        "storage_accessible": check_storage_directories(),
        "processing_ready": True
    }
```

### STEP 4: Frontend Recording Component

#### 4.1 Recording Hook
**File**: `Ai_powered_interview_coach/frontend/src/hooks/useMediaRecorder.ts`

Custom React hook for recording functionality:
```typescript
export const useMediaRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    
    const startRecording = async (includeVideo: boolean = false) => {
        // Request permissions
        // Initialize MediaRecorder
        // Start recording timer
    };
    
    const stopRecording = async (): Promise<Blob[]> => {
        // Stop recording
        // Return audio/video blobs
    };
};
```

#### 4.2 Recording UI Component
**File**: `Ai_powered_interview_coach/frontend/src/components/interview/RecordingControls.tsx`

Recording interface component:
```typescript
interface RecordingControlsProps {
    onRecordingComplete: (audioBlob: Blob, videoBlob?: Blob) => void;
    disabled?: boolean;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
    onRecordingComplete,
    disabled = false
}) => {
    // Recording button with visual feedback
    // Timer display
    // Permission status
    // Error handling UI
};
```

#### 4.3 Integration with Interview Page
**File**: `Ai_powered_interview_coach/frontend/src/pages/interview/InterviewSessionPage.tsx`

Integrate recording into existing interview flow:
- Add recording controls below answer textarea
- Upload recording when answer is submitted
- Display transcription results
- Show voice analysis feedback

### STEP 5: Dependencies and Requirements

#### 5.1 Backend Dependencies
**File**: `Ai_powered_interview_coach/backend/requirements.txt`

Add new dependencies:
```
# Audio/Video Processing
faster-whisper==0.10.0
librosa==0.10.1
soundfile==0.12.1
ffmpeg-python==0.2.0

# File format support
python-magic==0.4.27
```

#### 5.2 System Requirements
- **FFmpeg**: Required for audio/video processing
- **CUDA** (optional): For GPU-accelerated Whisper transcription
- **Storage**: Adequate disk space for recording files

### STEP 6: Voice Analysis Features

#### 6.1 Analysis Metrics
Using librosa for voice analysis:
- **Speaking Pace**: Words per minute calculation
- **Pause Analysis**: Silence detection and timing
- **Filler Words**: Detection of "um", "uh", "like", etc.
- **Volume Consistency**: Audio level analysis
- **Confidence Indicators**: Voice stability metrics

#### 6.2 Analysis Results Schema
```python
voice_analysis = {
    "speaking_pace_wpm": 150,
    "total_speaking_time": 45.2,
    "pause_count": 8,
    "average_pause_duration": 1.2,
    "filler_word_count": 3,
    "filler_words": ["um", "uh"],
    "volume_consistency": 0.85,
    "confidence_score": 0.78
}
```

### STEP 7: Error Handling and Resilience

#### 7.1 Graceful Degradation
- **Transcription Failure**: Continue with text-only answer
- **Recording Upload Failure**: Retry mechanism with exponential backoff
- **Processing Timeout**: Background processing for long recordings
- **Storage Issues**: Fallback to temporary storage with cleanup

#### 7.2 User Experience
- **Permission Handling**: Clear messaging for microphone/camera access
- **Progress Indicators**: Upload progress and processing status
- **Fallback Options**: Always allow text-only answers
- **Error Recovery**: Retry options and clear error messages

### STEP 8: Performance Optimization

#### 8.1 Processing Efficiency
- **Lazy Loading**: Load Whisper model only when needed
- **Background Tasks**: Use Celery for long-running transcription
- **File Compression**: Optimize recording file sizes
- **Caching**: Cache transcription results

#### 8.2 Storage Management
- **File Cleanup**: Automatic cleanup of old recordings
- **Compression**: Compress older recordings to save space
- **Monitoring**: Track storage usage and performance

### STEP 9: Security Considerations

#### 9.1 File Security
- **Upload Validation**: Strict file type and size validation
- **Path Security**: Prevent directory traversal attacks
- **Access Control**: User-specific file access only
- **Sanitization**: Clean filenames and metadata

#### 9.2 Privacy Protection
- **Local Processing**: All transcription and analysis done locally
- **Data Retention**: Clear policies for recording storage
- **User Control**: Options to delete recordings
- **Encryption**: Consider encrypting stored recordings

### STEP 10: Testing Strategy

#### 10.1 Unit Tests
- Media service functionality
- File upload and validation
- Transcription accuracy
- Voice analysis metrics

#### 10.2 Integration Tests
- End-to-end recording workflow
- API endpoint functionality
- Frontend recording components
- Error handling scenarios

#### 10.3 Performance Tests
- Large file handling
- Concurrent recording processing
- Storage capacity limits
- Memory usage monitoring

### STEP 11: Deployment Considerations

#### 11.1 System Setup
- FFmpeg installation instructions
- Whisper model download and setup
- Storage directory configuration
- Permission requirements

#### 11.2 Configuration
- Environment variables for storage paths
- Recording quality settings
- Processing timeout configurations
- Cleanup job scheduling

### STEP 12: Documentation and User Guide

#### 12.1 Technical Documentation
- API endpoint documentation
- Database schema changes
- Configuration options
- Troubleshooting guide

#### 12.2 User Documentation
- Recording feature overview
- Browser compatibility requirements
- Permission setup instructions
- Best practices for recording

## Implementation Timeline

1. **Phase 1** (Database & Backend Core): Steps 1-3 (Database, Media Service, API)
2. **Phase 2** (Frontend Integration): Steps 4-5 (Recording UI, Dependencies)
3. **Phase 3** (Analysis & Polish): Steps 6-8 (Voice Analysis, Error Handling, Performance)
4. **Phase 4** (Security & Testing): Steps 9-10 (Security, Testing)
5. **Phase 5** (Deployment & Docs): Steps 11-12 (Deployment, Documentation)

## Success Criteria

- ✅ Users can record audio/video during interviews
- ✅ Recordings are transcribed locally using Whisper
- ✅ Voice analysis provides meaningful feedback
- ✅ System remains 100% local and open-source
- ✅ Existing functionality is not broken
- ✅ Performance is acceptable for typical use cases
- ✅ Error handling provides good user experience

## Risk Mitigation

- **Compatibility Issues**: Extensive browser testing
- **Performance Problems**: Background processing and optimization
- **Storage Limitations**: Monitoring and cleanup strategies
- **User Adoption**: Clear documentation and gradual rollout
- **Technical Complexity**: Modular implementation with fallbacks

This implementation plan ensures a robust, secure, and user-friendly recording system that integrates seamlessly with the existing interview coach architecture while maintaining the requirement for 100% local, open-source operation.