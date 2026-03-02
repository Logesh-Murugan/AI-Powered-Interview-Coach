/**
 * Settings Page
 * User preferences and account management
 * Requirements: NEW-1.1 through NEW-1.8
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleTheme, setTheme } from '../../store/slices/uiSlice';
import { userService } from '../../services/userService';

interface UserPreferences {
  leaderboardOptOut: boolean;
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector((state) => state.ui.theme);
  const user = useAppSelector((state) => state.auth.user);

  const [preferences, setPreferences] = useState<UserPreferences>({
    leaderboardOptOut: false,
    language: 'en',
    emailNotifications: true,
    pushNotifications: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
      } catch (e) {
        console.error('Failed to parse saved preferences:', e);
      }
    }

    // Load leaderboard preference from backend if user is logged in
    if (user) {
      loadLeaderboardPreference();
    }
  }, [user]);

  const loadLeaderboardPreference = async () => {
    try {
      const response = await userService.getLeaderboardPreference();
      setPreferences((prev) => ({
        ...prev,
        leaderboardOptOut: response.leaderboard_opt_out,
      }));
    } catch (err) {
      console.error('Failed to load leaderboard preference:', err);
    }
  };

  const savePreferences = () => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    setSuccess('Preferences saved successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
    setSuccess('Theme changed successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleLanguageChange = (language: string) => {
    const newPreferences = { ...preferences, language };
    setPreferences(newPreferences);
    localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
    setSuccess('Preferences saved successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleLeaderboardToggle = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const newOptOut = !preferences.leaderboardOptOut;
      await userService.updateLeaderboardPreference(newOptOut);
      
      const newPreferences = { ...preferences, leaderboardOptOut: newOptOut };
      setPreferences(newPreferences);
      localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
      setSuccess(
        newOptOut
          ? 'You have opted out of the leaderboard'
          : 'You have opted in to the leaderboard'
      );
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update leaderboard preference');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = (type: 'email' | 'push') => {
    const newPreferences = {
      ...preferences,
      [type === 'email' ? 'emailNotifications' : 'pushNotifications']: 
        type === 'email' ? !preferences.emailNotifications : !preferences.pushNotifications
    };
    setPreferences(newPreferences);
    localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
    setSuccess('Preferences saved successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDeleteAccount = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = async () => {
    // TODO: Implement account deletion API call
    setDeleteDialogOpen(false);
    setError('Account deletion is not yet implemented');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your preferences and account settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Appearance Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Appearance
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <FormControlLabel
          control={
            <Switch
              checked={currentTheme === 'dark'}
              onChange={handleThemeToggle}
              color="primary"
            />
          }
          label={`Dark Mode ${currentTheme === 'dark' ? '(On)' : '(Off)'}`}
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 1 }}>
          Toggle between light and dark theme
        </Typography>
      </Paper>

      {/* Language Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Language
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <FormControl fullWidth>
          <InputLabel>Language</InputLabel>
          <Select
            value={preferences.language}
            label="Language"
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Español</MenuItem>
            <MenuItem value="fr">Français</MenuItem>
            <MenuItem value="de">Deutsch</MenuItem>
            <MenuItem value="zh">中文</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Select your preferred language
        </Typography>
      </Paper>

      {/* Notifications Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Notifications
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.emailNotifications}
                onChange={() => handleNotificationToggle('email')}
                color="primary"
              />
            }
            label="Email Notifications"
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
            Receive email notifications for achievements and updates
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={preferences.pushNotifications}
                onChange={() => handleNotificationToggle('push')}
                color="primary"
              />
            }
            label="Push Notifications"
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
            Receive push notifications in your browser
          </Typography>
        </Box>
      </Paper>

      {/* Privacy Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Privacy
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <FormControlLabel
          control={
            <Switch
              checked={!preferences.leaderboardOptOut}
              onChange={handleLeaderboardToggle}
              disabled={loading || !user}
              color="primary"
            />
          }
          label="Show on Leaderboard"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 1 }}>
          {preferences.leaderboardOptOut
            ? 'You are currently hidden from the leaderboard'
            : 'Your performance is visible on the leaderboard (anonymized)'}
        </Typography>
      </Paper>

      {/* Account Management Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Account Management
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Permanently delete your account and all associated data. This action cannot be undone.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteAccount}
            sx={{ alignSelf: 'flex-start' }}
          >
            Delete Account
          </Button>
        </Box>
      </Paper>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your account? This action cannot be undone.
            All your data, including interview sessions, resumes, and progress will be permanently deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteAccount} color="error" variant="contained">
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
