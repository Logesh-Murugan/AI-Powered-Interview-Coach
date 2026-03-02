/**
 * Profile Page Component
 * User profile management
 */

import { useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Alert } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateProfile, clearError } from '../../store/slices/authSlice';
import ErrorAlert from '../../components/common/ErrorAlert';
import ProfileEditForm from '../../components/profile/ProfileEditForm';

function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const error = useAppSelector((state) => state.auth.error);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleEditClick = () => {
    setIsEditMode(true);
    setSuccessMessage(null);
    dispatch(clearError());
  };

  const handleCancel = () => {
    setIsEditMode(false);
    dispatch(clearError());
  };

  const handleSubmit = async (data: { name: string; target_role?: string; experience_level?: string }) => {
    try {
      await dispatch(updateProfile(data)).unwrap();
      setSuccessMessage('Profile updated successfully!');
      setIsEditMode(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      // Error is handled by Redux state
      console.error('Profile update failed:', err);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Profile
        </Typography>
        {!isEditMode && (
          <Button variant="contained" onClick={handleEditClick}>
            Edit Profile
          </Button>
        )}
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {error && !isEditMode && (
        <ErrorAlert
          message={error}
          onRetry={handleEditClick}
          onDismiss={() => dispatch(clearError())}
        />
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Personal Information
          </Typography>
          
          {isEditMode ? (
            <ProfileEditForm
              initialName={user?.name || ''}
              initialTargetRole={user?.target_role}
              initialExperienceLevel={user?.experience_level}
              isLoading={isLoading}
              error={error}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          ) : (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                <strong>Name:</strong> {user?.name}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Email:</strong> {user?.email}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Target Role:</strong> {user?.target_role || 'Not set'}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Experience Level:</strong> {user?.experience_level || 'Not set'}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default ProfilePage;
