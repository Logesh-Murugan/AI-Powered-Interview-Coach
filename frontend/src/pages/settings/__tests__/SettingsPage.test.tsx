/**
 * Settings Page Tests
 * Requirements: NEW-1.1 through NEW-1.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import SettingsPage from '../SettingsPage';
import uiReducer from '../../../store/slices/uiSlice';
import authReducer from '../../../store/slices/authSlice';
import { userService } from '../../../services/userService';

// Mock userService
vi.mock('../../../services/userService', () => ({
  userService: {
    getLeaderboardPreference: vi.fn(),
    updateLeaderboardPreference: vi.fn(),
  },
}));

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      ui: uiReducer,
      auth: authReducer,
    },
    preloadedState: {
      ui: {
        theme: 'light',
        sidebarOpen: true,
        notifications: [],
        isLoading: false,
      },
      auth: {
        isAuthenticated: true,
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          target_role: 'Software Engineer',
          experience_level: 'Mid',
          account_status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        token: 'test-token',
        isLoading: false,
        error: null,
      },
      ...initialState,
    },
  });
};

const renderWithProviders = (component: React.ReactElement, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(userService.getLeaderboardPreference).mockResolvedValue({
      user_id: 1,
      leaderboard_opt_out: false,
    });
  });

  describe('Rendering', () => {
    it('should render settings page with all sections', () => {
      renderWithProviders(<SettingsPage />);

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getAllByText('Language')[0]).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Privacy')).toBeInTheDocument();
      expect(screen.getByText('Account Management')).toBeInTheDocument();
    });

    it('should display theme toggle', () => {
      renderWithProviders(<SettingsPage />);

      expect(screen.getByText(/Dark Mode/)).toBeInTheDocument();
    });

    it('should display language selector', () => {
      renderWithProviders(<SettingsPage />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should display notification toggles', () => {
      renderWithProviders(<SettingsPage />);

      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('Push Notifications')).toBeInTheDocument();
    });

    it('should display leaderboard toggle', () => {
      renderWithProviders(<SettingsPage />);

      expect(screen.getByText('Show on Leaderboard')).toBeInTheDocument();
    });

    it('should display delete account button', () => {
      renderWithProviders(<SettingsPage />);

      expect(screen.getByText('Delete Account')).toBeInTheDocument();
    });
  });

  describe('Theme Toggle', () => {
    it('should toggle theme when switch is clicked', async () => {
      const store = createTestStore();
      renderWithProviders(<SettingsPage />, store);

      const themeSwitch = screen.getByRole('switch', { name: /Dark Mode/ });
      expect(themeSwitch).not.toBeChecked();

      fireEvent.click(themeSwitch);

      await waitFor(() => {
        expect(store.getState().ui.theme).toBe('dark');
      });
    });

    it('should show success message after theme change', async () => {
      renderWithProviders(<SettingsPage />);

      const themeSwitch = screen.getByRole('switch', { name: /Dark Mode/ });
      fireEvent.click(themeSwitch);

      await waitFor(() => {
        expect(screen.getByText('Theme changed successfully')).toBeInTheDocument();
      });
    });

    it('should persist theme to localStorage', async () => {
      const store = createTestStore();
      renderWithProviders(<SettingsPage />, store);

      const themeSwitch = screen.getByRole('switch', { name: /Dark Mode/ });
      fireEvent.click(themeSwitch);

      await waitFor(() => {
        expect(localStorage.getItem('theme')).toBe('dark');
      });
    });
  });

  describe('Language Selection', () => {
    it('should save language preference to localStorage', async () => {
      renderWithProviders(<SettingsPage />);

      const languageSelect = screen.getByRole('combobox');
      fireEvent.mouseDown(languageSelect);

      const spanishOption = await screen.findByText('Español');
      fireEvent.click(spanishOption);

      await waitFor(() => {
        const savedPreferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
        expect(savedPreferences.language).toBe('es');
      });
    });
  });

  describe('Notification Preferences', () => {
    it('should toggle email notifications', async () => {
      renderWithProviders(<SettingsPage />);

      const emailSwitch = screen.getByRole('switch', { name: 'Email Notifications' });
      expect(emailSwitch).toBeChecked(); // Default is true

      fireEvent.click(emailSwitch);

      await waitFor(() => {
        const savedPreferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
        expect(savedPreferences.emailNotifications).toBe(false);
      });
    });

    it('should toggle push notifications', async () => {
      renderWithProviders(<SettingsPage />);

      const pushSwitch = screen.getByRole('switch', { name: 'Push Notifications' });
      expect(pushSwitch).not.toBeChecked(); // Default is false

      fireEvent.click(pushSwitch);

      await waitFor(() => {
        const savedPreferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
        expect(savedPreferences.pushNotifications).toBe(true);
      });
    });
  });

  describe('Leaderboard Preference', () => {
    it('should load leaderboard preference on mount', async () => {
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(userService.getLeaderboardPreference).toHaveBeenCalled();
      });
    });

    it('should update leaderboard preference when toggled', async () => {
      vi.mocked(userService.updateLeaderboardPreference).mockResolvedValue({
        user_id: 1,
        leaderboard_opt_out: true,
      });

      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(userService.getLeaderboardPreference).toHaveBeenCalled();
      });

      const leaderboardSwitch = screen.getByRole('switch', { name: 'Show on Leaderboard' });
      fireEvent.click(leaderboardSwitch);

      await waitFor(() => {
        expect(userService.updateLeaderboardPreference).toHaveBeenCalledWith(true);
      });
    });

    it('should show success message after updating leaderboard preference', async () => {
      vi.mocked(userService.updateLeaderboardPreference).mockResolvedValue({
        user_id: 1,
        leaderboard_opt_out: true,
      });

      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(userService.getLeaderboardPreference).toHaveBeenCalled();
      });

      const leaderboardSwitch = screen.getByRole('switch', { name: 'Show on Leaderboard' });
      fireEvent.click(leaderboardSwitch);

      await waitFor(() => {
        expect(screen.getByText('You have opted out of the leaderboard')).toBeInTheDocument();
      });
    });

    it('should handle leaderboard preference update error', async () => {
      vi.mocked(userService.updateLeaderboardPreference).mockRejectedValue(
        new Error('Failed to update preference')
      );

      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(userService.getLeaderboardPreference).toHaveBeenCalled();
      });

      const leaderboardSwitch = screen.getByRole('switch', { name: 'Show on Leaderboard' });
      fireEvent.click(leaderboardSwitch);

      await waitFor(() => {
        expect(screen.getByText('Failed to update preference')).toBeInTheDocument();
      });
    });
  });

  describe('Account Deletion', () => {
    it('should open confirmation dialog when delete button is clicked', async () => {
      renderWithProviders(<SettingsPage />);

      const deleteButton = screen.getByText('Delete Account');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete your account/)).toBeInTheDocument();
      });
    });

    it('should close dialog when cancel is clicked', async () => {
      renderWithProviders(<SettingsPage />);

      const deleteButton = screen.getByText('Delete Account');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should show not implemented message when delete is confirmed', async () => {
      renderWithProviders(<SettingsPage />);

      const deleteButton = screen.getByText('Delete Account');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Find the confirm button in the dialog (not the original delete button)
      const dialog = screen.getByRole('dialog');
      const confirmButton = within(dialog).getByRole('button', { name: 'Delete Account' });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Account deletion is not yet implemented')).toBeInTheDocument();
      });
    });
  });

  describe('Preferences Persistence', () => {
    it('should load saved preferences from localStorage on mount', () => {
      const savedPreferences = {
        leaderboardOptOut: true,
        language: 'es',
        emailNotifications: false,
        pushNotifications: true,
      };
      localStorage.setItem('userPreferences', JSON.stringify(savedPreferences));

      renderWithProviders(<SettingsPage />);

      const emailSwitch = screen.getByRole('switch', { name: 'Email Notifications' });
      const pushSwitch = screen.getByRole('switch', { name: 'Push Notifications' });

      expect(emailSwitch).not.toBeChecked();
      expect(pushSwitch).toBeChecked();
    });
  });
});
