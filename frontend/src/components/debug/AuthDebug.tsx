/**
 * Authentication Debug Component
 * Displays current authentication state for debugging
 */

import { Box, Typography, Paper, Button } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { clearCredentials } from '../../store/slices/authSlice';
import { getAuthTokensFromStorage } from '../../utils/authStateSync';

function AuthDebug() {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);
  const storageTokens = getAuthTokensFromStorage();

  const handleClearAuth = () => {
    dispatch(clearCredentials());
  };

  return (
    <Paper sx={{ p: 2, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        Authentication Debug
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2">Redux State:</Typography>
        <Typography variant="body2">
          isAuthenticated: {authState.isAuthenticated ? 'true' : 'false'}
        </Typography>
        <Typography variant="body2">
          isLoading: {authState.isLoading ? 'true' : 'false'}
        </Typography>
        <Typography variant="body2">
          user: {authState.user ? authState.user.email : 'null'}
        </Typography>
        <Typography variant="body2">
          accessToken: {authState.accessToken ? `${authState.accessToken.substring(0, 20)}...` : 'null'}
        </Typography>
        <Typography variant="body2">
          error: {authState.error || 'null'}
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2">LocalStorage:</Typography>
        <Typography variant="body2">
          accessToken: {storageTokens.accessToken ? `${storageTokens.accessToken.substring(0, 20)}...` : 'null'}
        </Typography>
        <Typography variant="body2">
          refreshToken: {storageTokens.refreshToken ? `${storageTokens.refreshToken.substring(0, 20)}...` : 'null'}
        </Typography>
        <Typography variant="body2">
          user: {storageTokens.user ? storageTokens.user.email : 'null'}
        </Typography>
      </Box>

      <Button variant="outlined" onClick={handleClearAuth}>
        Clear Authentication
      </Button>
    </Paper>
  );
}

export default AuthDebug;