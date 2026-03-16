"""
Media Storage Utilities

Utilities for managing media file storage, access control, and cleanup.

Requirements: Recording System Implementation
"""
import os
import logging
from pathlib import Path
from typing import Optional, List, Dict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class MediaStorageManager:
    """Manager for media file storage operations"""
    
    STORAGE_ROOT = Path("storage/media")
    AUDIO_DIR = STORAGE_ROOT / "audio"
    VIDEO_DIR = STORAGE_ROOT / "video"
    TEMP_DIR = STORAGE_ROOT / "temp"
    
    @classmethod
    def ensure_user_directory(cls, user_id: int, media_type: str) -> Path:
        """
        Ensure user-specific directory exists
        
        Args:
            user_id: User ID
            media_type: 'audio' or 'video'
            
        Returns:
            Path to user directory
        """
        base_dir = cls.AUDIO_DIR if media_type == 'audio' else cls.VIDEO_DIR
        user_dir = base_dir / f"user_{user_id}"
        user_dir.mkdir(parents=True, exist_ok=True)
        return user_dir
    
    @classmethod
    def get_file_path(cls, file_url: str) -> Optional[Path]:
        """
        Convert file URL to local file path
        
        Args:
            file_url: File URL (e.g., /media/audio/user_1/file.webm)
            
        Returns:
            Path object or None if invalid
        """
        try:
            # Remove leading /media/ from URL
            if file_url.startswith('/media/'):
                relative_path = file_url[7:]  # Remove '/media/'
                file_path = cls.STORAGE_ROOT / relative_path
                
                # Security check: ensure path is within storage root
                if cls.STORAGE_ROOT in file_path.parents or file_path == cls.STORAGE_ROOT:
                    return file_path
                    
        except Exception as e:
            logger.warning(f"Invalid file URL: {file_url}, error: {e}")
        
        return None
    
    @classmethod
    def verify_user_access(cls, file_url: str, user_id: int) -> bool:
        """
        Verify user has access to the file
        
        Args:
            file_url: File URL
            user_id: User ID requesting access
            
        Returns:
            True if user has access, False otherwise
        """
        try:
            file_path = cls.get_file_path(file_url)
            if not file_path:
                return False
            
            # Check if file path contains user directory
            user_dir_name = f"user_{user_id}"
            return user_dir_name in file_path.parts
            
        except Exception as e:
            logger.warning(f"Access verification failed for {file_url}, user {user_id}: {e}")
            return False
    
    @classmethod
    def delete_file(cls, file_url: str, user_id: int) -> bool:
        """
        Delete a file (with user access verification)
        
        Args:
            file_url: File URL to delete
            user_id: User ID (for access control)
            
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            # Verify user access
            if not cls.verify_user_access(file_url, user_id):
                logger.warning(f"Access denied: user {user_id} cannot delete {file_url}")
                return False
            
            file_path = cls.get_file_path(file_url)
            if file_path and file_path.exists():
                file_path.unlink()
                logger.info(f"File deleted: {file_path}")
                return True
            else:
                logger.warning(f"File not found: {file_path}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to delete file {file_url}: {e}")
            return False
    
    @classmethod
    def get_user_files(cls, user_id: int, media_type: Optional[str] = None) -> List[Dict]:
        """
        Get list of files for a user
        
        Args:
            user_id: User ID
            media_type: Optional filter by 'audio' or 'video'
            
        Returns:
            List of file information dictionaries
        """
        files = []
        
        try:
            # Determine directories to scan
            dirs_to_scan = []
            if media_type == 'audio' or media_type is None:
                dirs_to_scan.append(('audio', cls.AUDIO_DIR))
            if media_type == 'video' or media_type is None:
                dirs_to_scan.append(('video', cls.VIDEO_DIR))
            
            for dir_type, base_dir in dirs_to_scan:
                user_dir = base_dir / f"user_{user_id}"
                if user_dir.exists():
                    for file_path in user_dir.iterdir():
                        if file_path.is_file():
                            stat = file_path.stat()
                            files.append({
                                'filename': file_path.name,
                                'url': f"/media/{dir_type}/user_{user_id}/{file_path.name}",
                                'size': stat.st_size,
                                'created': datetime.fromtimestamp(stat.st_ctime),
                                'modified': datetime.fromtimestamp(stat.st_mtime),
                                'type': dir_type
                            })
            
            # Sort by creation time (newest first)
            files.sort(key=lambda x: x['created'], reverse=True)
            
        except Exception as e:
            logger.error(f"Failed to get user files for user {user_id}: {e}")
        
        return files
    
    @classmethod
    def cleanup_old_files(cls, days_old: int = 30) -> int:
        """
        Clean up files older than specified days
        
        Args:
            days_old: Delete files older than this many days
            
        Returns:
            Number of files deleted
        """
        deleted_count = 0
        cutoff_date = datetime.now() - timedelta(days=days_old)
        
        try:
            for directory in [cls.AUDIO_DIR, cls.VIDEO_DIR, cls.TEMP_DIR]:
                if directory.exists():
                    for file_path in directory.rglob('*'):
                        if file_path.is_file():
                            file_mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                            if file_mtime < cutoff_date:
                                try:
                                    file_path.unlink()
                                    deleted_count += 1
                                    logger.info(f"Deleted old file: {file_path}")
                                except Exception as e:
                                    logger.warning(f"Failed to delete old file {file_path}: {e}")
            
            logger.info(f"Cleanup completed: {deleted_count} files deleted")
            
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")
        
        return deleted_count
    
    @classmethod
    def get_storage_stats(cls) -> Dict:
        """
        Get storage usage statistics
        
        Returns:
            Dictionary with storage statistics
        """
        stats = {
            'total_files': 0,
            'total_size': 0,
            'audio_files': 0,
            'audio_size': 0,
            'video_files': 0,
            'video_size': 0,
            'temp_files': 0,
            'temp_size': 0
        }
        
        try:
            # Count audio files
            if cls.AUDIO_DIR.exists():
                for file_path in cls.AUDIO_DIR.rglob('*'):
                    if file_path.is_file():
                        size = file_path.stat().st_size
                        stats['audio_files'] += 1
                        stats['audio_size'] += size
            
            # Count video files
            if cls.VIDEO_DIR.exists():
                for file_path in cls.VIDEO_DIR.rglob('*'):
                    if file_path.is_file():
                        size = file_path.stat().st_size
                        stats['video_files'] += 1
                        stats['video_size'] += size
            
            # Count temp files
            if cls.TEMP_DIR.exists():
                for file_path in cls.TEMP_DIR.rglob('*'):
                    if file_path.is_file():
                        size = file_path.stat().st_size
                        stats['temp_files'] += 1
                        stats['temp_size'] += size
            
            # Calculate totals
            stats['total_files'] = stats['audio_files'] + stats['video_files'] + stats['temp_files']
            stats['total_size'] = stats['audio_size'] + stats['video_size'] + stats['temp_size']
            
            # Convert sizes to human readable format
            for key in ['total_size', 'audio_size', 'video_size', 'temp_size']:
                stats[f"{key}_mb"] = round(stats[key] / 1024 / 1024, 2)
            
        except Exception as e:
            logger.error(f"Failed to get storage stats: {e}")
            stats['error'] = str(e)
        
        return stats
    
    @classmethod
    def validate_storage_path(cls, path: str) -> bool:
        """
        Validate that a path is within allowed storage areas
        
        Args:
            path: Path to validate
            
        Returns:
            True if path is valid, False otherwise
        """
        try:
            path_obj = Path(path).resolve()
            storage_root = cls.STORAGE_ROOT.resolve()
            
            # Check if path is within storage root
            return storage_root in path_obj.parents or path_obj == storage_root
            
        except Exception:
            return False