# Video/Audio Recording System Documentation

## Overview

The Video/Audio Recording System is a comprehensive, **100% local and open-source** solution that adds recording capabilities to the AI-powered interview coach. Users can record their answers during interviews, and the system provides automatic transcription and voice analysis using local AI models.

## Key Features

### 🎙️ Recording Capabilities
- **Audio Recording**: High-quality audio capture using browser MediaRecorder API
- **Video Recording**: Optional video recording with audio
- **Real-time Controls**: Start, pause, resume, and stop recording
- **Timer Display**: Visual countdown and progress indicators
- **Format Support**: WebM, MP4, WAV, MP3 formats

### 🤖 AI Processing (100% Local)
- **Speech-to-Text**: Using faster-whisper (local Whisper implementation)
- **Voice Analysis**: Speaking pace, pauses, filler words, volume consistency
- **Confidence Scoring**: Overall delivery confidence assessment
- **No External APIs**: All processing happens on your server

### 💾 Storage & Security
- **Local Storage**: Files stored in organized directory structure
- **User Isolation**: Each user's recordings are stored separately
- **Access Control**: Users can only access their own recordings
- **Automatic Cleanup**: Configurable retention policies

## Architecture

### Backend Components

```
backend/
├── app/
│   ├── models/
│   │   └── answer.py              # Extended with recording fields
│   ├── services/
│   │   └── media_service.py       # Core recording processing
│   ├── utils/
│   │   └── media_storage.py       # Storage management
│   ├── routes/
│   │   └── media.py               # API endpoints
│   └── main.py                    # Updated with media routes
├── alembic/versions/
│   └── 008_add_recording_fields.py # Database migration
└── storage/media/                 # Recording storage
    ├── audio/
    ├── video/
    └── temp/
```

### Frontend Components

```
frontend/src/
├── hooks/
│   └── useMediaRecorder.ts       # Recording hook
├── components/interview/
│   ├── RecordingControls.tsx     # Recording UI
│   └── VoiceAnalysisDisplay.tsx  # Analysis results
├── services/
│   └── recordingService.ts       # API communication
└── pages/interview/
    └── InterviewSessionPage.tsx   # Integrated recording
```

## Installation

### Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL database
- FFmpeg (for audio processing)

### Automatic Setup

Run the setup script to install everything automatically:

```bash
cd Ai_powered_interview_coach
python setup_recording_system.py
```

### Manual Setup

1. **Install System Dependencies**

   **Linux (Ubuntu/Debian):**
   ```bash
   sudo apt update
   sudo apt install -y ffmpeg libsndfile1 portaudio19-dev
   ```

   **macOS:**
   ```bash
   brew install ffmpeg libsndfile portaudio
   ```

   **Windows:**
   - Download FFmpeg from https://ffmpeg.org/download.html
   - Add to PATH environment variable

2. **Install Python Dependencies**

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Run Database Migration**

   ```bash
   cd backend
   alembic upgrade head
   ```

4. **Create Storage Directories**

   ```bash
   mkdir -p backend/storage/media/{audio,video,temp}
   ```

5. **Configure Environment**

   Copy `backend/.env.example` to `backend/.env` and configure:

   ```env
   # Recording System Configuration
   RECORDING_MAX_FILE_SIZE=104857600  # 100MB
   RECORDING_MAX_DURATION=600         # 10 minutes
   WHISPER_MODEL_SIZE=small           # Model size
   WHISPER_DEVICE=auto                # auto, cpu, cuda
   STORAGE_CLEANUP_DAYS=30            # Retention period
   ```

## Usage

### For Users

1. **Start an Interview Session**
   - Navigate to interview page
   - Begin answering a question

2. **Record Your Answer**
   - Click "Start Recording" button
   - Grant microphone (and camera) permissions
   - Speak your answer clearly
   - Click "Stop" when finished

3. **Review Results**
   - View automatic transcription
   - See voice analysis feedback
   - Submit your answer with recording

### For Developers

#### API Endpoints

**Upload Recording**
```http
POST /api/v1/media/upload-recording
Content-Type: multipart/form-data

session_id: 123
question_id: 456
audio_file: <file>
video_file: <file> (optional)
```

**Health Check**
```http
GET /api/v1/media/health
```

**Storage Stats**
```http
GET /api/v1/media/storage/stats
```

**List User Files**
```http
GET /api/v1/media/files?media_type=audio
```

#### Database Schema

The `answers` table is extended with recording fields:

```sql
ALTER TABLE answers ADD COLUMN audio_url VARCHAR(500);
ALTER TABLE answers ADD COLUMN video_url VARCHAR(500);
ALTER TABLE answers ADD COLUMN recording_duration FLOAT;
ALTER TABLE answers ADD COLUMN recording_format VARCHAR(20);
ALTER TABLE answers ADD COLUMN transcription TEXT;
ALTER TABLE answers ADD COLUMN voice_analysis JSON;
```

#### Voice Analysis Schema

```json
{
  "speaking_pace_wpm": 150,
  "total_speaking_time": 45.2,
  "total_duration": 50.0,
  "pause_count": 8,
  "average_pause_duration": 1.2,
  "longest_pause": 3.5,
  "filler_word_count": 3,
  "detected_fillers": ["um", "uh"],
  "volume_consistency": 0.85,
  "confidence_score": 0.78,
  "analysis_metadata": {
    "word_count": 125,
    "speech_ratio": 0.904,
    "sample_rate": 44100,
    "audio_length_seconds": 50.0
  }
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RECORDING_MAX_FILE_SIZE` | 104857600 | Maximum file size (bytes) |
| `RECORDING_MAX_DURATION` | 600 | Maximum recording duration (seconds) |
| `WHISPER_MODEL_SIZE` | small | Whisper model size (tiny/base/small/medium/large) |
| `WHISPER_DEVICE` | auto | Processing device (auto/cpu/cuda) |
| `STORAGE_CLEANUP_DAYS` | 30 | Days to keep recordings |

### Whisper Models

| Model | Size | Speed | Accuracy | Use Case |
|-------|------|-------|----------|----------|
| tiny | 39 MB | Fastest | Basic | Testing |
| base | 74 MB | Fast | Good | Development |
| small | 244 MB | Medium | Better | Production |
| medium | 769 MB | Slow | High | High accuracy needed |
| large | 1550 MB | Slowest | Highest | Maximum accuracy |

### Storage Structure

```
storage/media/
├── audio/
│   └── user_123/
│       └── user_123_question_456_audio_20260315_143000.webm
├── video/
│   └── user_123/
│       └── user_123_question_456_video_20260315_143000.webm
└── temp/
    └── (temporary processing files)
```

## Performance Optimization

### Server-Side

1. **Model Caching**: Whisper model loaded once and reused
2. **Background Processing**: Long transcriptions run in background
3. **File Compression**: Automatic compression for storage efficiency
4. **Cleanup Jobs**: Scheduled cleanup of old recordings

### Client-Side

1. **Lazy Loading**: Recording components loaded on demand
2. **Progressive Upload**: Upload starts immediately after recording
3. **Error Recovery**: Automatic retry with exponential backoff
4. **Offline Support**: Recordings cached until upload possible

## Security

### File Security

- **Path Validation**: Prevents directory traversal attacks
- **User Isolation**: Users can only access their own files
- **File Type Validation**: Only allowed formats accepted
- **Size Limits**: Prevents abuse with large files

### Privacy Protection

- **Local Processing**: No data sent to external services
- **User Control**: Users can delete their recordings
- **Access Logs**: Track file access for security
- **Encryption**: Optional encryption for stored files

## Troubleshooting

### Common Issues

**1. "Recording not supported in this browser"**
- Use Chrome, Firefox, or Safari
- Ensure HTTPS connection (required for MediaRecorder)
- Check browser permissions

**2. "Permission denied for microphone"**
- Grant microphone permission in browser
- Check system audio settings
- Restart browser if needed

**3. "Whisper model loading failed"**
- Check available disk space (models are large)
- Verify internet connection for initial download
- Check Python dependencies installation

**4. "FFmpeg not found"**
- Install FFmpeg system package
- Add FFmpeg to PATH environment variable
- Restart application after installation

**5. "Upload timeout"**
- Check file size (must be under limit)
- Verify network connection
- Try shorter recordings

### Debug Commands

**Test System Health**
```bash
python test_recording_system.py
```

**Check Storage**
```bash
curl http://localhost:8000/api/v1/media/storage/stats
```

**Verify Dependencies**
```bash
pip list | grep -E "(whisper|librosa|soundfile|ffmpeg)"
```

### Log Analysis

Check application logs for recording-related errors:

```bash
# Backend logs
tail -f backend/logs/app.log | grep -i "media\|recording\|whisper"

# System logs (Linux)
journalctl -u your-app-service | grep -i recording
```

## Performance Monitoring

### Key Metrics

- **Processing Time**: Transcription duration vs audio length
- **Storage Usage**: Total space used by recordings
- **Error Rate**: Failed uploads/processing attempts
- **User Adoption**: Percentage of answers with recordings

### Monitoring Endpoints

```http
GET /api/v1/media/health          # Service health
GET /api/v1/media/storage/stats   # Storage usage
GET /health                       # Overall system health
```

## Maintenance

### Regular Tasks

1. **Storage Cleanup**
   ```bash
   # Manual cleanup of old files
   curl -X POST http://localhost:8000/api/v1/media/cleanup?days_old=30
   ```

2. **Model Updates**
   - Monitor faster-whisper releases
   - Test new models in staging
   - Update model size in configuration

3. **Performance Monitoring**
   - Monitor storage usage growth
   - Check processing times
   - Review error logs

### Backup Strategy

1. **Database**: Include recording metadata in regular backups
2. **Files**: Backup storage/media directory regularly
3. **Configuration**: Version control environment settings

## Development

### Adding New Features

1. **New Analysis Metrics**
   - Extend `VoiceAnalysis` interface
   - Update `analyze_voice()` method
   - Add UI components for display

2. **Additional File Formats**
   - Update `ALLOWED_FORMATS` constants
   - Add format-specific processing
   - Test browser compatibility

3. **Enhanced UI**
   - Create new React components
   - Add to existing interview flow
   - Maintain accessibility standards

### Testing

**Unit Tests**
```bash
cd backend
python -m pytest tests/test_media_service.py
```

**Integration Tests**
```bash
python test_recording_system.py
```

**Frontend Tests**
```bash
cd frontend
npm test -- --testPathPattern=recording
```

## Support

### Getting Help

1. **Documentation**: Check this file and implementation plan
2. **Test Script**: Run `python test_recording_system.py`
3. **Health Check**: Visit `/api/v1/media/health`
4. **Logs**: Check application and system logs

### Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Ensure 100% local operation (no external APIs)

## License

This recording system is part of the AI-powered interview coach project and follows the same license terms. All components are open-source and designed for local deployment.

---

**Note**: This system is designed to be completely self-contained and does not require any external services or APIs. All processing happens locally on your server, ensuring privacy and data control.