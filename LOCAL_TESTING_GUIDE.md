# Local Testing Guide - Video/Audio Recording System

## 🎯 Complete Step-by-Step Testing Instructions

This guide will help you test the recording system on your local machine from start to finish.

## Prerequisites Check

### 1. System Requirements
- **Python 3.8+** ✅
- **Node.js 16+** ✅  
- **PostgreSQL** running ✅
- **Redis** running ✅
- **Chrome/Firefox/Safari** browser ✅

### 2. Install FFmpeg (Required for Audio Processing)

**Windows:**
```powershell
# Using Chocolatey (recommended)
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
# Add to PATH environment variable
```

**macOS:**
```bash
# Using Homebrew
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg libsndfile1 portaudio19-dev
```

## Step 1: Automated Setup (Recommended)

Run the automated setup script:

```bash
cd Ai_powered_interview_coach
python setup_recording_system.py
```

This will:
- Install Python dependencies
- Run database migration
- Create storage directories
- Verify installation

## Step 2: Manual Setup (If Automated Fails)

### 2.1 Install Python Dependencies
```bash
cd Ai_powered_interview_coach/backend
pip install -r requirements.txt
```

### 2.2 Run Database Migration
```bash
cd Ai_powered_interview_coach/backend
python -m alembic upgrade head
```

### 2.3 Create Storage Directories
```bash
mkdir -p Ai_powered_interview_coach/backend/storage/media/audio
mkdir -p Ai_powered_interview_coach/backend/storage/media/video
mkdir -p Ai_powered_interview_coach/backend/storage/media/temp
```

### 2.4 Update Environment Variables
Add to your `.env` file:
```env
# Recording System Configuration
RECORDING_MAX_FILE_SIZE=104857600  # 100MB
RECORDING_MAX_DURATION=600         # 10 minutes
WHISPER_MODEL_SIZE=small           # Model size
WHISPER_DEVICE=auto                # auto, cpu, cuda
```

## Step 3: Verify Installation

Run the test suite:
```bash
cd Ai_powered_interview_coach
python test_recording_system.py
```

Expected output:
```
🎯 Video/Audio Recording System Test Suite
==================================================
✅ PASS Dependencies
✅ PASS FFmpeg
✅ PASS Database Migration
✅ PASS Media Service Init
✅ PASS Storage Manager
✅ PASS File Validation
✅ PASS API Routes
✅ PASS Health Check
✅ PASS Whisper Model

📊 Test Results Summary
==================================================
Overall: 9/9 tests passed
🎉 All tests passed! Recording system is ready.
```

## Step 4: Start the Application

### 4.1 Start Backend
```bash
cd Ai_powered_interview_coach/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4.2 Start Frontend
```bash
cd Ai_powered_interview_coach/frontend
npm install  # if not done already
npm start
```

## Step 5: Test Recording System

### 5.1 Access the Application
1. Open browser: `http://localhost:3000`
2. Login to your account
3. Navigate to "Start Interview"

### 5.2 Create Interview Session
1. Select role (e.g., "Software Engineer")
2. Choose difficulty (e.g., "Medium")
3. Set question count (e.g., 3)
4. Click "Start Interview"

### 5.3 Test Recording Feature

**Step A: Navigate to Question**
- You should see the interview question page
- Below the text area, you'll see "Record Your Answer" section

**Step B: Grant Permissions**
1. Click "Start Recording"
2. Browser will ask for microphone permission
3. Click "Allow" when prompted
4. Optional: Enable video toggle for video recording

**Step C: Record Your Answer**
1. Speak clearly into microphone
2. Watch the timer count up
3. See the recording status indicator
4. Click "Stop" when finished

**Step D: Upload and Process**
1. Recording will automatically upload
2. You'll see "Uploading recording..." message
3. Wait for processing (may take 10-30 seconds)
4. You should see "Recording uploaded successfully!"

**Step E: View Results**
1. Check for transcription text
2. Look for voice analysis metrics
3. Submit your answer normally

## Step 6: Verify Backend Processing

### 6.1 Check Health Endpoint
```bash
curl http://localhost:8000/api/v1/media/health
```

Expected response:
```json
{
  "status": "healthy",
  "whisper_loaded": true,
  "storage_accessible": true,
  "ffmpeg_available": true,
  "processing_ready": true
}
```

### 6.2 Check Storage Stats
```bash
curl http://localhost:8000/api/v1/media/storage/stats
```

### 6.3 Check Database
Connect to your PostgreSQL database and verify:
```sql
SELECT audio_url, video_url, transcription, voice_analysis 
FROM answers 
WHERE audio_url IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;
```

## Step 7: Test Different Scenarios

### 7.1 Audio Only Recording
- Disable video toggle
- Record audio only
- Verify transcription works

### 7.2 Audio + Video Recording
- Enable video toggle
- Grant camera permission
- Record with both audio and video
- Check both files are saved

### 7.3 Error Handling
- Try recording without microphone permission
- Test with very short recording (< 1 second)
- Test with long recording (> 5 minutes)

## Troubleshooting Common Issues

### Issue 1: "Recording not supported"
**Solution:**
- Use Chrome, Firefox, or Safari
- Ensure you're on HTTPS or localhost
- Check browser permissions

### Issue 2: "Permission denied for microphone"
**Solution:**
- Click the microphone icon in browser address bar
- Allow microphone access
- Refresh the page and try again

### Issue 3: "Whisper model loading failed"
**Solution:**
```bash
# Check available disk space (models are large)
df -h

# Verify internet connection for initial download
ping google.com

# Check Python dependencies
pip list | grep -E "(whisper|librosa|soundfile)"
```

### Issue 4: "FFmpeg not found"
**Solution:**
```bash
# Test FFmpeg installation
ffmpeg -version

# If not found, install FFmpeg (see prerequisites)
# Add to PATH if needed
```

### Issue 5: "Upload timeout"
**Solution:**
- Check file size (must be under 100MB)
- Try shorter recordings
- Check network connection
- Increase timeout in frontend service

### Issue 6: Database Migration Fails
**Solution:**
```bash
# Check current migration status
cd backend
python -m alembic current

# If behind, run upgrade
python -m alembic upgrade head

# If issues, check database connection
python -c "from app.database import engine; print('DB OK')"
```

## Expected File Structure After Testing

```
Ai_powered_interview_coach/backend/storage/media/
├── audio/
│   └── user_1/
│       └── user_1_question_123_audio_20260315_143000.webm
├── video/
│   └── user_1/
│       └── user_1_question_123_video_20260315_143000.webm
└── temp/
    └── (temporary processing files)
```

## Performance Expectations

### Processing Times
- **Small model (244MB)**: ~0.3x real-time transcription
- **Voice analysis**: < 2 seconds for typical answer
- **Upload**: Depends on file size and connection
- **Total processing**: 10-30 seconds for 1-2 minute recording

### Resource Usage
- **Memory**: ~500MB for Whisper model
- **Storage**: ~10-50MB per recorded answer
- **CPU**: Moderate during processing, minimal at rest

## Success Criteria Checklist

After testing, you should be able to:

- ✅ Record audio during interview
- ✅ See real-time recording controls and timer
- ✅ Upload recording successfully
- ✅ View automatic transcription
- ✅ See voice analysis metrics (pace, pauses, confidence)
- ✅ Submit answer with recording attached
- ✅ Navigate between questions (recording state resets)
- ✅ Handle permission errors gracefully
- ✅ Process recordings locally (no external APIs)

## Advanced Testing

### Test API Directly
```bash
# Create a test audio file
echo "test audio content" > test_audio.txt

# Upload via API (replace session_id and question_id)
curl -X POST http://localhost:8000/api/v1/media/upload-recording \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "session_id=1" \
  -F "question_id=1" \
  -F "audio_file=@test_audio.txt"
```

### Monitor Logs
```bash
# Backend logs
tail -f backend/logs/app.log | grep -i "media\|recording\|whisper"

# Or check console output from uvicorn
```

### Performance Testing
```bash
# Test with multiple concurrent uploads
# Test with large files (near 100MB limit)
# Test with very long recordings (near 10 minute limit)
```

## Getting Help

If you encounter issues:

1. **Run diagnostics**: `python test_recording_system.py`
2. **Check health**: Visit `http://localhost:8000/api/v1/media/health`
3. **Review logs**: Check backend console output
4. **Verify setup**: Ensure all prerequisites are installed
5. **Test step-by-step**: Follow this guide exactly

## Next Steps After Successful Testing

1. **Production deployment**: Configure for your production environment
2. **Performance tuning**: Adjust Whisper model size based on needs
3. **Storage management**: Set up automated cleanup policies
4. **Monitoring**: Implement logging and alerting
5. **User training**: Document the recording feature for end users

---

**Note**: This recording system is completely local and private. No data is sent to external services, ensuring full privacy and control over your interview recordings and analysis.