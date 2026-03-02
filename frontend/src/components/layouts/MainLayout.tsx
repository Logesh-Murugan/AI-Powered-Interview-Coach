/**
 * Main Layout Component
 * Layout for authenticated pages with sidebar and header
 */

import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  useMediaQuery,
  useTheme,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Description as ResumeIcon,
  QuestionAnswer as InterviewIcon,
  Psychology as AIIcon,
  TrendingUp as AnalyticsIcon,
  EmojiEvents as AchievementsIcon,
  Leaderboard as LeaderboardIcon,
  LocalFireDepartment as StreakIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AutoAwesome as ResumeAnalysisIcon,
  School as StudyPlanIcon,
  Business as CompanyCoachingIcon,
} from '@mui/icons-material';

const drawerWidth = 260;

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

const navigationSections: NavigationSection[] = [
  {
    title: 'Main',
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
      { text: 'Interviews', icon: <InterviewIcon />, path: '/interviews' },
      { text: 'Resumes', icon: <ResumeIcon />, path: '/resumes' },
    ],
  },
  {
    title: 'AI Tools',
    items: [
      { text: 'Resume Analysis', icon: <ResumeAnalysisIcon />, path: '/resumes' },
      { text: 'Study Plans', icon: <StudyPlanIcon />, path: '/ai/study-plans' },
      { text: 'Company Coaching', icon: <CompanyCoachingIcon />, path: '/ai/company-coaching' },
    ],
  },
  {
    title: 'Progress',
    items: [
      { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
      { text: 'Achievements', icon: <AchievementsIcon />, path: '/achievements' },
      { text: 'Leaderboard', icon: <LeaderboardIcon />, path: '/leaderboard' },
      { text: 'Streaks', icon: <StreakIcon />, path: '/streaks' },
    ],
  },
  {
    title: 'Profile',
    items: [
      { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    ],
  },
];

function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // < 768px
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await dispatch(logout());
    navigate('/login');
  };

  const isActiveRoute = (path: string): boolean => {
    // Special handling for Resume Analysis - it's accessed via resumes page
    if (path === '/resumes' && location.pathname.startsWith('/ai/resume-analysis')) {
      return false;
    }
    // Check if current path starts with the navigation path
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AIIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h6" noWrap component="div" color="primary">
          InterviewMaster AI
        </Typography>
      </Box>
      <Divider />

      {/* Navigation Sections */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {navigationSections.map((section) => (
          <Box key={section.title}>
            <Typography
              variant="overline"
              sx={{ px: 2, pt: 2, pb: 1, display: 'block', color: 'text.secondary' }}
            >
              {section.title}
            </Typography>
            <List>
              {section.items.map((item) => {
                const isActive = isActiveRoute(item.path);
                return (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton
                      selected={isActive}
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        mx: 1,
                        borderRadius: 1,
                        '&.Mui-selected': {
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          },
                          '& .MuiListItemIcon-root': {
                            color: 'primary.contrastText',
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isActive ? 'inherit' : 'text.secondary',
                          minWidth: 40,
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
            <Divider sx={{ my: 1 }} />
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Page Title */}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navigationSections
              .flatMap((section) => section.items)
              .find((item) => isActiveRoute(item.path))?.text || 'InterviewMaster AI'}
          </Typography>

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              color="inherit"
              onClick={handleUserMenuOpen}
              startIcon={
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'secondary.main',
                    fontSize: '0.875rem',
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              }
              sx={{ textTransform: 'none' }}
            >
              {user?.name || 'User'}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem
                onClick={() => {
                  handleUserMenuClose();
                  navigate('/profile');
                }}
              >
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleUserMenuClose();
                  navigate('/settings');
                }}
              >
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="navigation menu"
      >
        {/* Mobile Drawer */}
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better mobile performance
            }}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
          >
            {drawerContent}
          </Drawer>
        ) : (
          // Desktop Drawer
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8, // Account for AppBar height
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default MainLayout;
