/**
 * Recording Service
 * 
 * Service for handling recording upload and processing.
 * Manages API communication for the recording system.
 * 
 * Requirements: Recording System Implementation
 */

import apiService from './api.service';
import type { 
  RecordingResult, 
  VoiceAnalysis, 
  RecordingUploadResponse 
} from '../types/recording';

export interface RecordingUploadRequest {
  sessionId: number;
  questionId: number;
  audioFile?: File;
  videoFile?: File;
}

export interface MediaHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  whisper_loaded: boolean;
  storage_accessible: boolean;
  ffmpeg_available: boolean;
  processing_ready: boolean;
  storage_paths?: {
    root: string;
    audio: string;
    video: string;
    temp: string;
  };
  error?: string;
}

export interface StorageStats {
  total_files: number;
  total_size: number;
  total_size_mb: number;
  audio_files: number;
  audio_size: number;
  audio_size_mb: number;
  video_files: number;
  video_size: number;
  video_size_mb: number;
  temp_files: number;
  temp_size: number;
  temp_size_mb: number;
  error?: string;
}

export interface UserFile {
  filename: string;
  url: string;
  size: number;
  created: string;
  modified: string;
  type: 'audio' | 'video';
}

export interface UserFilesResponse {
  files: UserFile[];
  total_count: number;
  media_type_filter?: string;
}

class RecordingService {
  /**
   * Upload recording files and get processing results
   */
  async uploadRecording(request: RecordingUploadRequest): Promise<RecordingUploadResponse> {
    try {
      const formData = new FormData();
      
      // Add form fields
      formData.append('session_id', request.sessionId.toString());
      formData.append('question_id', request.questionId.toString());
      
      // Add files if provided
      if (request.audioFile) {
        formData.append('audio_file', request.audioFile);
      }
      
      if (request.videoFile) {
        formData.append('video_file', request.videoFile);
      }
      
      const response = await apiService.post('/media/upload-recording', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Add timeout for large file uploads
        timeout: 300000, // 5 minutes
      });
      
      return response.data as RecordingUploadResponse;
      
    } catch (error: any) {
      console.error('Recording upload failed:', error);
      
      // Handle specific error cases
      if (error.response?.status === 413) {
        throw new Error('Recording file is too large. Please try a shorter recording.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.detail || 'Invalid recording file format.');
      } else if (error.response?.status === 404) {
        throw new Error('Please submit your text answer first before uploading a recording.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout. Please try again with a shorter recording.');
      }
      
      throw new Error(error.response?.data?.detail || 'Failed to upload recording. Please try again.');
    }
  }

  /**
   * Convert RecordingResult to upload request files
   */
  createUploadFiles(result: RecordingResult): { audioFile?: File; videoFile?: File } {
    const files: { audioFile?: File; videoFile?: File } = {};
    
    if (result.audioBlob) {
      // Determine file extension based on blob type
      const mimeType = result.audioBlob.type || 'audio/webm';
      const extension = this.getFileExtension(mimeType);
      
      files.audioFile = new File(
        [result.audioBlob],
        `recording_${Date.now()}.${extension}`,
        { type: mimeType }
      );
    }
    
    if (result.videoBlob) {
      const mimeType = result.videoBlob.type || 'video/webm';
      const extension = this.getFileExtension(mimeType);
      
      files.videoFile = new File(
        [result.videoBlob],
        `recording_${Date.now()}.${extension}`,
        { type: mimeType }
      );
    }
    
    return files;
  }

  /**
   * Get file extension from MIME type
   */
  private getFileExtension(mimeType: string): string {
    const mimeToExt: { [key: string]: string } = {
      'audio/webm': 'webm',
      'audio/mp4': 'm4a',
      'audio/wav': 'wav',
      'audio/mpeg': 'mp3',
      'video/webm': 'webm',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov'
    };
    
    return mimeToExt[mimeType] || 'webm';
  }

  /**
   * Check media service health
   */
  async checkHealth(): Promise<MediaHealthStatus> {
    try {
      const response = await apiService.get('/media/health');
      return response.data as MediaHealthStatus;
    } catch (error: any) {
      console.error('Media health check failed:', error);
      return {
        status: 'unhealthy',
        whisper_loaded: false,
        storage_accessible: false,
        ffmpeg_available: false,
        processing_ready: false,
        error: error.message || 'Health check failed'
      };
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      const response = await apiService.get('/media/storage/stats');
      return response.data as StorageStats;
    } catch (error: any) {
      console.error('Failed to get storage stats:', error);
      throw new Error(error.response?.data?.detail || 'Failed to retrieve storage statistics');
    }
  }

  /**
   * List user's media files
   */
  async getUserFiles(mediaType?: 'audio' | 'video'): Promise<UserFilesResponse> {
    try {
      const params = mediaType ? { media_type: mediaType } : {};
      const response = await apiService.get('/media/files', { params });
      return response.data as UserFilesResponse;
    } catch (error: any) {
      console.error('Failed to get user files:', error);
      throw new Error(error.response?.data?.detail || 'Failed to retrieve file list');
    }
  }

  /**
   * Delete a media file
   */
  async deleteFile(fileUrl: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.delete('/media/files', {
        params: { file_url: fileUrl }
      });
      return response.data as { success: boolean; message: string };
    } catch (error: any) {
      console.error('Failed to delete file:', error);
      throw new Error(error.response?.data?.detail || 'Failed to delete file');
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get voice analysis summary
   */
  getVoiceAnalysisSummary(analysis: VoiceAnalysis): string {
    const { speaking_pace_wpm, confidence_score, filler_word_count } = analysis;
    
    let summary = '';
    
    // Speaking pace feedback
    if (speaking_pace_wpm < 120) {
      summary += 'Consider speaking a bit faster. ';
    } else if (speaking_pace_wpm > 180) {
      summary += 'Consider speaking a bit slower. ';
    } else {
      summary += 'Good speaking pace. ';
    }
    
    // Filler words feedback
    if (filler_word_count > 5) {
      summary += 'Try to reduce filler words. ';
    } else if (filler_word_count <= 2) {
      summary += 'Excellent use of clear speech. ';
    }
    
    // Overall confidence
    if (confidence_score >= 0.8) {
      summary += 'Very confident delivery!';
    } else if (confidence_score >= 0.6) {
      summary += 'Good overall delivery.';
    } else {
      summary += 'Practice will help improve your delivery confidence.';
    }
    
    return summary;
  }

  /**
   * Check if browser supports recording
   */
  isRecordingSupported(): boolean {
    return (
      typeof MediaRecorder !== 'undefined' &&
      typeof navigator.mediaDevices !== 'undefined' &&
      typeof navigator.mediaDevices.getUserMedia !== 'undefined'
    );
  }

  /**
   * Get supported MIME types for recording
   */
  getSupportedMimeTypes(): string[] {
    if (!this.isRecordingSupported()) {
      return [];
    }

    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];

    return types.filter(type => MediaRecorder.isTypeSupported(type));
  }
}

export default new RecordingService();