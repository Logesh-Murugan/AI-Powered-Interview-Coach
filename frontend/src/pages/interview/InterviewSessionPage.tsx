/**
 * Premium Interview Session Page
 * High-end AI "Mission Control" simulation interface
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
  useTheme,
  IconButton,
  Grid,
} from '@mui/material';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { Send, Timer, NavigateNext, NavigateBefore, Save, Edit, Mic, Psychology, DragIndicator, GpsFixed, Fullscreen, FullscreenExit, Videocam, VideocamOff } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '../../services/api.service';
import { RecordingControls } from '../../components/interview/RecordingControls';
import { VideoPreview } from '../../components/interview/VideoPreview';
import recordingService from '../../services/recordingService';
import { useMediaRecorder } from '../../hooks/useMediaRecorder';
import logger from '../../utils/logger';
import type { RecordingResult } from '../../types/recording';
import { GlassCard, GradientButton } from '../../components/common/PremiumComponents';

const MotionBox = motion.create(Box);

interface Question {
  id: number;
  question_text: string;
  category: string;
  difficulty: string;
  time_limit_seconds: number;
  question_number: number;
}

interface SessionInfo {
  question_count: number;
  role: string;
  difficulty: string;
  interview_mode: string;
  recording_mode: string;
  timer_enabled: boolean;
}

function InterviewSessionPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [answer, setAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [recordingUploaded, setRecordingUploaded] = useState(false);
  const [answerMode, setAnswerMode] = useState<'text' | 'speech'>('text');

  const {
    stream,
    isRecording,
    recordingTime,
    permissionError,
    recordingError,
    hasPermission,
    isSupported,
    formattedTime,
    requestPermissions,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    isPaused
  } = useMediaRecorder();
  
  const autoSaveTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const initialQuestionNumber = (location.state as { questionNumber?: number } | null)?.questionNumber ?? 1;

  const loadSessionInfo = useCallback(async () => {
    if (!sessionId) return;
    try {
      const response = await apiService.get(`/interviews/${sessionId}`);
      const data = response.data as SessionInfo;
      setSessionInfo(data);
      if (data.interview_mode === 'mock') {
         setAnswerMode('speech');
      }
    } catch (err) {
      console.error('Info load fail:', err);
    }
  }, [sessionId]);

  const loadQuestion = useCallback(async (questionNumber: number) => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    setHasSubmitted(false);
    setRecordingResult(null);
    setRecordingUploaded(false);
    try {
      const response = await apiService.get(`/interviews/${sessionId}/questions/${questionNumber}`);
      const questionData = response.data as Question;
      setQuestion(questionData);
      setTimeRemaining(questionData.time_limit_seconds);
      
      if (hasSavedDraft) {
        try {
          const draftResponse = await apiService.get(`/interviews/${sessionId}/drafts/${questionData.id}`);
          const draftData = draftResponse.data as { draft_text: string };
          setAnswer(draftData.draft_text || '');
          setDraft(draftData.draft_text || '');
        } catch {
          setAnswer('');
          setDraft('');
        }
      } else {
        setAnswer('');
        setDraft('');
      }
    } catch (err: any) {
      setError(err.message || 'Transmission error.');
    } finally {
      setLoading(false);
    }
  }, [sessionId, hasSavedDraft]);

  const saveDraft = useCallback(async (text: string) => {
    if (!sessionId || !question || text === draft) return;
    setSaving(true);
    try {
      await apiService.post(`/interviews/${sessionId}/drafts?question_id=${question.id}`, { draft_text: text });
      setDraft(text);
      setHasSavedDraft(true);
      setSaving(false);
    } catch (err) {
      setSaving(false);
    }
  }, [sessionId, question, draft]);

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setAnswer(text);
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => saveDraft(text), 30000);
  };

  const handleNavigateQuestion = async (direction: 'prev' | 'next') => {
    if (!question || !sessionInfo) return;
    if (answer && answer !== draft) await saveDraft(answer);
    
    let newQuestionNumber = question.question_number;
    if (direction === 'next') {
      if (question.question_number >= sessionInfo.question_count) return;
      newQuestionNumber = question.question_number + 1;
    } else {
      if (question.question_number <= 1) return;
      newQuestionNumber = question.question_number - 1;
    }
    
    loadQuestion(newQuestionNumber);
  };

  const handleRecordingComplete = useCallback((result: RecordingResult) => {
    setRecordingResult(result);
    setRecordingUploaded(false);
    logger.log('Recording completed', result);
  }, []);

  const handleSubmit = async () => {
    if (!sessionId || !question || hasSubmitted || submitting) return;
    
    // Auto-stop recording if it's still running
    if (isRecording) {
      await stopRecording();
    }

    setSubmitting(true);
    setHasSubmitted(true);
    try {
      let finalAnswer = answer;
      
      // Handle speech mode processing
      if (answerMode === 'speech') {
        setUploadingRecording(true);
        try {
          // If we just stopped recording, wait a moment for the blob to be ready
          if (isRecording) await new Promise(resolve => setTimeout(resolve, 800));
          
          // Wait for recordingResult to be populated by the callback
          let currentResult = recordingResult;
          if (!currentResult && isRecording) {
            for (let i = 0; i < 20; i++) {
              await new Promise(resolve => setTimeout(resolve, 200));
              if (recordingResult) {
                currentResult = recordingResult;
                break;
              }
            }
          }

          if (currentResult) {
            const files = recordingService.createUploadFiles(currentResult);
            const uploadResponse = await recordingService.uploadRecording({
              sessionId: parseInt(sessionId),
              questionId: question.id,
              audioFile: files.audioFile,
              videoFile: files.videoFile
            });
            setRecordingUploaded(true);
            if (uploadResponse.transcription && !finalAnswer.trim()) {
              finalAnswer = uploadResponse.transcription;
              setAnswer(finalAnswer);
            }
          }
        } finally {
          setUploadingRecording(false);
        }
      }

      if (answerMode === 'text' && (finalAnswer || "").length < 5) { 
        setHasSubmitted(false);
        setSubmitting(false);
        setError('INPUT DEFICIENT: MIN 5 CHARS'); 
        return; 
      }

      const response = await apiService.post(`/interviews/${sessionId}/answers?question_id=${question.id}`, { answer_text: finalAnswer || "" });
      const { all_questions_answered, session_completed } = response.data as { all_questions_answered: boolean; session_completed: boolean };
      
      // Critical check to prevent 404 on last question
      const isLastQuestion = question.question_number >= (sessionInfo?.question_count || 5);
      
      if (all_questions_answered || session_completed || isLastQuestion) {
        navigate(`/interviews/${sessionId}/summary`);
      } else {
        loadQuestion(question.question_number + 1);
      }
    } catch (err: any) {
      setHasSubmitted(false);
      setError(err.message || 'Submission failure.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStopAndSubmit = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
      // Wait for state to settle then submit
      setTimeout(() => handleSubmit(), 1200);
    } else {
      handleSubmit();
    }
  }, [isRecording, stopRecording, handleSubmit]);

  useEffect(() => {
    if (timeRemaining > 0 && !submitting && !hasSubmitted) {
      countdownTimerRef.current = setInterval(() => setTimeRemaining((prev) => Math.max(0, prev - 1)), 1000);
      return () => { if (countdownTimerRef.current) clearInterval(countdownTimerRef.current); };
    } else if (timeRemaining === 0 && question && !loading && !submitting && !hasSubmitted) {
      logger.log("Timer expired, triggering safe auto-submit");
      handleStopAndSubmit();
    }
  }, [timeRemaining, question, loading, submitting, hasSubmitted, handleStopAndSubmit]);

  useEffect(() => {
    loadSessionInfo();
    loadQuestion(initialQuestionNumber);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <LoadingSpinner variant="fullPage" />;
  if (!question) return <Box sx={{ p: 4 }}><ErrorAlert message={error || 'Signal lost.'} onRetry={() => loadQuestion(1)} /></Box>;

  return (
    <Box sx={{ pb: 8 }}>
      {/* Session HUD */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
         <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron', mb: 0.5 }}>MISSION LOG: {question.question_number} / {sessionInfo?.question_count || '?'}</Typography>
            <Box sx={{ width: 250, height: 4, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 2, overflow: 'hidden' }}>
               <MotionBox 
                 initial={{ width: 0 }}
                 animate={{ width: `${(question.question_number / (sessionInfo?.question_count || 1)) * 100}%` }}
                 sx={{ height: '100%', bgcolor: 'primary.main', transition: { duration: 0.5 } }} 
               />
            </Box>
         </Box>
         <GlassCard sx={{ p: 1.5, px: 3, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, border: timeRemaining < 30 ? `2px solid ${theme.palette.error.main}` : undefined }}>
            <Timer sx={{ color: timeRemaining < 30 ? 'error.main' : 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'Orbitron', color: timeRemaining < 30 ? 'error.main' : 'text.primary' }}>
               {formatTime(timeRemaining)}
            </Typography>
         </GlassCard>
      </Box>

      {/* Primary Question Grid */}
      <Grid container spacing={4} sx={{ direction: sessionInfo?.interview_mode === 'mock' ? 'rtl' : 'ltr' }}>
         <Grid size={{ xs: 12, lg: sessionInfo?.interview_mode === 'mock' ? 6 : 7 }} sx={{ direction: 'ltr' }}>
            <Stack spacing={4}>
               {/* Question Section */}
               <GlassCard sx={{ p: 4, minHeight: 180, position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ position: 'absolute', top: -50, left: -50, width: 150, height: 150, bgcolor: 'primary.main', opacity: 0.05, filter: 'blur(50px)', borderRadius: '50%' }} />
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                     <Chip label={question.category.toUpperCase()} color="primary" size="small" sx={{ fontWeight: 800, borderRadius: 1 }} />
                     <Chip label={question.difficulty.toUpperCase()} variant="outlined" size="small" sx={{ fontWeight: 800, borderRadius: 1 }} />
                  </Stack>
                  <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.4 }}>
                    {question.question_text}
                  </Typography>
               </GlassCard>

               {/* Interaction Section */}
               <GlassCard sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                     <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>INPUT MODULE</Typography>
                     {uploadingRecording ? (
                      <Stack direction="row" spacing={2} alignItems="center">
                         <CircularProgress size={20} />
                         <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'Orbitron' }}>PROCESSING NEURAL AUDIO...</Typography>
                      </Stack>
                    ) : (
                      <ToggleButtonGroup
                        value={answerMode}
                        exclusive
                        onChange={(_, v) => {
                           if (v && sessionInfo?.interview_mode !== 'mock') setAnswerMode(v);
                        }}
                        size="small"
                      >
                        <ToggleButton value="text" disabled={sessionInfo?.interview_mode === 'mock'} sx={{ px: 2, fontWeight: 800 }}>TEXT</ToggleButton>
                        <ToggleButton value="speech" sx={{ px: 2, fontWeight: 800 }}>SPEECH</ToggleButton>
                      </ToggleButtonGroup>
                    )}
                  </Box>

                  {answerMode === 'text' ? (
                     <TextField
                        fullWidth
                        multiline
                        rows={12}
                        value={answer}
                        onChange={handleAnswerChange}
                        placeholder="TERMINAL READY: AWAITING INPUT..."
                        InputProps={{
                           sx: { 
                              borderRadius: 4, 
                              bgcolor: alpha(theme.palette.background.paper, 0.4),
                              fontFamily: 'Inter',
                              fontWeight: 500,
                              lineHeight: 1.6
                           }
                        }}
                     />
                  ) : (
                     <Box sx={{ p: 4, textAlign: 'center', border: `2px dashed ${alpha(theme.palette.divider, 0.2)}`, borderRadius: 4 }}>
                         <RecordingControls
                           onRecordingComplete={handleRecordingComplete}
                           onRecordingStart={() => {}} 
                           onRecordingStop={() => {}}
                           disabled={submitting}
                           maxDuration={question.time_limit_seconds}
                           includeVideo={sessionInfo?.recording_mode === 'video_audio'}
                           showVideoToggle={sessionInfo?.interview_mode !== 'mock'}
                           recorder={{
                             isRecording,
                             isPaused,
                             recordingTime,
                             hasPermission,
                             permissionError,
                             recordingError,
                             isSupported,
                             formattedTime,
                             stream,
                             requestPermissions,
                             startRecording,
                             pauseRecording,
                             resumeRecording,
                             stopRecording
                           }}
                        />
                        {recordingUploaded && answer && (
                           <Box sx={{ mt: 3, textAlign: 'left', p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`, borderRadius: 3 }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main', display: 'block', mb: 1 }}>TRANSCRIPTION SUCCEEDED</Typography>
                              <Typography variant="body2">{answer}</Typography>
                           </Box>
                        )}
                     </Box>
                  )}

                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 4 }}>
                     <Stack direction="row" spacing={1}>
                        <Button variant="outlined" onClick={() => handleNavigateQuestion('prev')} disabled={question.question_number <= 1} startIcon={<NavigateBefore />}>PREVIOUS</Button>
                        <Button variant="outlined" onClick={() => handleNavigateQuestion('next')} disabled={question.question_number >= (sessionInfo?.question_count || 1)} endIcon={<NavigateNext />}>NEXT</Button>
                     </Stack>
                     <Stack direction="row" spacing={2}>
                        <IconButton onClick={() => saveDraft(answer)} disabled={saving || answer === draft} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}><Save /></IconButton>
                        <GradientButton onClick={handleSubmit} disabled={submitting} startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Send />}>
                           {submitting ? 'PROCESSING...' : 'SUBMIT ANSWER'}
                        </GradientButton>
                     </Stack>
                  </Stack>
               </GlassCard>
            </Stack>
         </Grid>

         {/* Secondary Assets Column */}
         <Grid size={{ xs: 12, lg: sessionInfo?.interview_mode === 'mock' ? 6 : 5 }} sx={{ direction: 'ltr' }}>
            <Stack spacing={4}>
               {sessionInfo?.interview_mode !== 'mock' && (
               <GlassCard sx={{ p: 4, textAlign: 'center' }}>
                  <Psychology sx={{ fontSize: 60, color: 'primary.main', mb: 2, opacity: 0.3 }} />
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>AI COACHING TIPS</Typography>
                  <Typography variant="body2" color="text.secondary">Maintain steady eye contact and structured breathing. The AI identifies key metrics in your sentence structure and pauses.</Typography>
               </GlassCard>
               )}

                <GlassCard sx={{ p: 0, overflow: 'hidden', minHeight: 280, flex: 1, position: 'relative', border: isRecording ? `2px solid ${theme.palette.error.main}` : undefined }}>
                  <Box sx={{ p: 2, bgcolor: alpha(theme.palette.background.paper, 0.8), position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1, display: 'flex', justifyContent: 'space-between' }}>
                     <Typography variant="caption" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>VISUAL TELEMETRY</Typography>
                     {isRecording && <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'error.main', boxShadow: `0 0 10px ${theme.palette.error.main}`, animation: 'pulse 1s infinite' }} />}
                  </Box>
                  <VideoPreview 
                    stream={stream} 
                    isRecording={isRecording} 
                    showControls={true}
                    height="100%"
                  />
               </GlassCard>
            </Stack>
         </Grid>
      </Grid>
    </Box>
  );
}

export default InterviewSessionPage;
