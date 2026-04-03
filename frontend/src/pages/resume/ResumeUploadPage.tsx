/**
 * Premium Resume Upload Page
 * High-end interactive dropzone for ingesting data vectors
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  alpha,
  useTheme,
  Stack,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Description,
  AutoAwesome,
  ArrowBack,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { resumeService } from '../../services/resumeService';
import ErrorAlert from '../../components/common/ErrorAlert';
import SuccessConfetti from '../../components/animations/SuccessConfetti';
import { GlassCard, GradientButton, GradientText } from '../../components/common/PremiumComponents';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

const MotionBox = motion.create(Box);

function ResumeUploadPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File): string | null => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return 'ONLY PDF AND DOCX VECTORS ARE SUPPORTED';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'VECTOR MAGNITUDE EXCEEDS 10MB LIMIT';
    }
    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setFile(selectedFile);
    setError(null);
    setSuccess(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileSelect(selectedFile);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const response = await resumeService.uploadResume(file);
      setSuccess(true);
      setTimeout(() => navigate(`/resumes/${response.resume_id}`), 2500);
    } catch (err: any) {
      setError(err.message || 'Ingestion failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ pb: 8, maxWidth: 800, mx: 'auto' }}>
      {success && <SuccessConfetti show={success} />}

      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ mb: 6, textAlign: 'center' }}
      >
        <Typography variant="h3" sx={{ mb: 1, fontFamily: 'Orbitron' }}>
           INGEST <GradientText>DATA VECTOR</GradientText>
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
           Upload your primary record for AI reasoning and interview synthesis.
        </Typography>
      </MotionBox>

      {error && <ErrorAlert message={error} sx={{ mb: 4 }} onDismiss={() => setError(null)} />}
      
      <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {!success ? (
            <MotionBox
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              sx={{ p: 4 }}
            >
              {/* Dropzone */}
              <Box
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
                sx={{
                  border: '2px dashed',
                  borderColor: dragActive ? 'primary.main' : alpha(theme.palette.divider, 0.2),
                  borderRadius: 4,
                  p: 6,
                  textAlign: 'center',
                  bgcolor: dragActive ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                  },
                }}
              >
                <input id="file-input" type="file" accept=".pdf,.docx" onChange={handleFileInput} style={{ display: 'none' }} />
                
                <MotionBox
                  animate={dragActive ? { scale: 1.1, y: -5 } : {}}
                  sx={{ color: 'primary.main', mb: 3 }}
                >
                  <CloudUpload sx={{ fontSize: 64 }} />
                </MotionBox>

                <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, fontFamily: 'Orbitron' }}>
                  {file ? 'VECTOR DETECTED' : 'DROP DATA VECTOR'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 600 }}>
                  {file ? file.name.toUpperCase() : 'PDF OR DOCX FORMATS SUPPORTED (MAX 10MB)'}
                </Typography>
                
                <Stack direction="row" spacing={1} justifyContent="center">
                   <Chip label=".PDF" size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                   <Chip label=".DOCX" size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                </Stack>
              </Box>

              {file && !uploading && (
                <MotionBox
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  sx={{ mt: 4, textAlign: 'center' }}
                >
                  <GradientButton size="large" onClick={handleUpload} startIcon={<AutoAwesome />}>
                    SYNCHRONIZE DATA
                  </GradientButton>
                </MotionBox>
              )}

              {uploading && (
                <Box sx={{ mt: 4 }}>
                   <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'block' }}>INGESTING INTO CORE LATTICE...</Typography>
                   <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
                </Box>
              )}
            </MotionBox>
          ) : (
            <MotionBox
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              sx={{ p: 6, textAlign: 'center' }}
            >
               <Box sx={{ 
                 width: 80, 
                 height: 80, 
                 borderRadius: '50%', 
                 bgcolor: 'success.main', 
                 color: 'white', 
                 display: 'flex', 
                 alignItems: 'center', 
                 justifyContent: 'center', 
                 mx: 'auto', 
                 mb: 3,
                 boxShadow: `0 0 30px ${theme.palette.success.main}`
               }}>
                  <CheckCircle sx={{ fontSize: 40 }} />
               </Box>
               <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, fontFamily: 'Orbitron' }}>INGESTION COMPLETE</Typography>
               <Typography variant="body1" color="text.secondary">Your data vector has been synchronized. Initiating deep scan...</Typography>
            </MotionBox>
          )}
        </AnimatePresence>
      </GlassCard>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
         <Button startIcon={<ArrowBack />} onClick={() => navigate('/resumes')}>CANCEL OPERATION</Button>
      </Box>
    </Box>
  );
}

export default ResumeUploadPage;
