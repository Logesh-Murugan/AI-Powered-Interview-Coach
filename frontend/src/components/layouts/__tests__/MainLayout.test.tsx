/**
 * MainLayout Component Tests
 * Tests for the main layout with navigation menu
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MainLayout from '../MainLayout';
import authReducer from '../../../store/slices/authSlice';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

describe('MainLayout', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    target_role: 'Software Engineer',
    experience_level: 'Mid',
  };

  const createMockStore = (user = mockUser) => {
    return configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user,
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh-token',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
      },
    });
  };

  const renderWithProviders = (store = createMockStore()) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <MainLayout />
        </BrowserRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Navigation Structure', () => {
    it('should render all navigation sections', () => {
      renderWithProviders();

      // Check for section titles
      expect(screen.getByText('Main')).toBeInTheDocument();
      expect(screen.getByText('AI Tools')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
      // Profile appears twice (section title and nav item), so use getAllByText
      const profileItems = screen.getAllByText('Profile');
      expect(profileItems.length).toBeGreaterThan(0);
    });

    it('should render all main navigation items', () => {
      renderWithProviders();

      // Dashboard appears in both header and nav, so use getAllByText
      const dashboardItems = screen.getAllByText('Dashboard');
      expect(dashboardItems.length).toBeGreaterThan(0);
      expect(screen.getByText('Interviews')).toBeInTheDocument();
      expect(screen.getByText('Resumes')).toBeInTheDocument();
    });

    it('should render all AI Tools navigation items', () => {
      renderWithProviders();

      expect(screen.getByText('Resume Analysis')).toBeInTheDocument();
      expect(screen.getByText('Study Plans')).toBeInTheDocument();
      expect(screen.getByText('Company Coaching')).toBeInTheDocument();
    });

    it('should render all Progress navigation items', () => {
      renderWithProviders();

      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Achievements')).toBeInTheDocument();
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
      expect(screen.getByText('Streaks')).toBeInTheDocument();
    });

    it('should render all Profile navigation items', () => {
      renderWithProviders();

      // Profile appears twice - in navigation and in user menu
      const profileItems = screen.getAllByText('Profile');
      expect(profileItems.length).toBeGreaterThan(0);
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('User Display', () => {
    it('should display user name in header', () => {
      renderWithProviders();

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should display user avatar with first letter of name', () => {
      renderWithProviders();

      const avatar = screen.getByText('T');
      expect(avatar).toBeInTheDocument();
    });

    it('should display default avatar when user name is not available', () => {
      const storeWithoutName = createMockStore({
        ...mockUser,
        name: '',
      });
      renderWithProviders(storeWithoutName);

      const avatar = screen.getByText('U');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Navigation Behavior', () => {
    it('should navigate to dashboard when clicking Dashboard link', () => {
      renderWithProviders();

      // Dashboard appears in both header and nav, get the one in the nav (second one)
      const dashboardLinks = screen.getAllByText('Dashboard');
      fireEvent.click(dashboardLinks[1]); // Click the nav item, not the header

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should navigate to analytics when clicking Analytics link', () => {
      renderWithProviders();

      const analyticsLink = screen.getByText('Analytics');
      fireEvent.click(analyticsLink);

      expect(mockNavigate).toHaveBeenCalledWith('/analytics');
    });

    it('should navigate to study plans when clicking Study Plans link', () => {
      renderWithProviders();

      const studyPlansLink = screen.getByText('Study Plans');
      fireEvent.click(studyPlansLink);

      expect(mockNavigate).toHaveBeenCalledWith('/ai/study-plans');
    });

    it('should navigate to company coaching when clicking Company Coaching link', () => {
      renderWithProviders();

      const coachingLink = screen.getByText('Company Coaching');
      fireEvent.click(coachingLink);

      expect(mockNavigate).toHaveBeenCalledWith('/ai/company-coaching');
    });
  });

  describe('User Menu', () => {
    it('should open user menu when clicking user button', async () => {
      renderWithProviders();

      const userButton = screen.getByText('Test User');
      fireEvent.click(userButton);

      await waitFor(() => {
        // Check for menu items (Profile appears in both nav and menu, so we check for Logout)
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });
    });

    it('should navigate to profile when clicking Profile in user menu', async () => {
      renderWithProviders();

      const userButton = screen.getByText('Test User');
      fireEvent.click(userButton);

      await waitFor(() => {
        const profileMenuItems = screen.getAllByText('Profile');
        // Click the one in the menu (last one)
        fireEvent.click(profileMenuItems[profileMenuItems.length - 1]);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });

    it('should navigate to settings when clicking Settings in user menu', async () => {
      renderWithProviders();

      const userButton = screen.getByText('Test User');
      fireEvent.click(userButton);

      await waitFor(() => {
        const settingsMenuItems = screen.getAllByText('Settings');
        // Click the one in the menu (last one)
        fireEvent.click(settingsMenuItems[settingsMenuItems.length - 1]);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });
  });

  describe('Active Route Highlighting', () => {
    it('should highlight the active route', () => {
      renderWithProviders();

      // Dashboard should be highlighted (current route is /dashboard)
      // Get all Dashboard texts and find the one in the nav (second one)
      const dashboardItems = screen.getAllByText('Dashboard');
      const dashboardButton = dashboardItems[1].closest('[role="button"]');
      expect(dashboardButton).toHaveClass('Mui-selected');
    });
  });

  describe('Responsive Behavior', () => {
    it('should render navigation drawer on desktop', () => {
      renderWithProviders();

      // On desktop, the permanent drawer should be visible
      const nav = screen.getByLabelText('navigation menu');
      expect(nav).toBeInTheDocument();
    });
  });
});
