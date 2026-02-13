/**
 * Profile Page Component
 * User profile management
 */

import { Box, Typography, Card, CardContent } from '@mui/material';
import { useAppSelector } from '../../store/hooks';

function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Personal Information
          </Typography>
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
        </CardContent>
      </Card>
    </Box>
  );
}

export default ProfilePage;
