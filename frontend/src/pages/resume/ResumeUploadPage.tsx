/**
 * Resume Upload Page
 * Upload resume files (PDF/DOCX) with drag & drop support
 * 
 * Requirements: 6.1-6.9
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
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
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Description,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { resumeService } from '../../services/resumeService';
import FadeIn from '../../components/animations/FadeIn';
import ScaleButton from '../../components/animations/ScaleButton';
import SuccessConfetti from '../../components/animations/SuccessConfetti';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

function ResumeUploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return 'Only PDF and DOCX files are supported';
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB';
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
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const response = await resumeService.uploadResume(file);
      setSuccess(true);
      
      // Navigate to resume detail page after 2 seconds
      setTimeout(() => {
        navigate(`/resumes/${response.resume_id}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {success && <SuccessConfetti show={success} />}
      
      <FadeIn delay={0.1}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Upload Resume
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Upload your resume to get personalized interview questions based on your experience
          </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircle />}>
            Resume uploaded successfully! Redirecting to details...
          </Alert>
        )}

        {/* Drag & Drop Zone */}
        <motion.div
          animate={{
            scale: dragActive ? 1.02 : 1,
            borderColor: dragActive ? 'primary.main' : 'grey.300',
          }}
          transition={{ duration: 0.2 }}
        >
          <Box
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              border: '2px dashed',
              borderColor: dragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: dragActive ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.3s',
              mb: 3,
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <motion.div
              animate={{ y: dragActive ? -10 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <CloudUpload sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            </motion.div>
            
            <Typography variant="h6" gutterBottom>
              Drag & drop your resume here
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              or click to browse files
            </Typography>
            <Chip label="PDF or DOCX" size="small" sx={{ mr: 1 }} />
            <Chip label="Max 10MB" size="small" />
            
            <input
              id="file-input"
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </Box>
        </motion.div>

        {/* Selected File Info */}
        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <List disablePadding>
                  <ListItem>
                    <ListItemIcon>
                      <Description color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={formatFileSize(file.size)}
                    />
                    <CheckCircle color="success" />
                  </ListItem>
                </List>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Progress */}
        {uploading && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Uploading resume...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <ScaleButton>
            <Button
              variant="outlined"
              onClick={() => navigate('/resumes')}
              disabled={uploading}
            >
              Cancel
            </Button>
          </ScaleButton>
          <ScaleButton>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!file || uploading || success}
              startIcon={<CloudUpload />}
            >
              {uploading ? 'Uploading...' : 'Upload Resume'}
            </Button>
          </ScaleButton>
        </Box>

        {/* Instructions */}
        <FadeIn delay={0.3}>
          <Box sx={{ mt: 4, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              What happens after upload?
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircle fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary="Text extraction from your resume" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircle fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary="Skills identification using AI" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircle fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary="Experience and education parsing" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircle fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary="Personalized interview questions generation" />
              </ListItem>
            </List>
          </Box>
        </FadeIn>
      </Paper>
      </FadeIn>
    </Container>
  );
}

export default ResumeUploadPage;
