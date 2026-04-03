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
  alpha,
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
import PageTransition from '../animations/PageTransition';

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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
    navigate('/');

  };

  const isActiveRoute = (path: string): boolean => {
    if (path === '/resumes' && location.pathname.startsWith('/ai/resume-analysis')) {
      return false;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ 
          p: 1, 
          borderRadius: 2, 
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          display: 'flex',
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`
        }}>
          <AIIcon sx={{ fontSize: 28, color: 'white' }} />
        </Box>
        <Typography variant="h6" fontWeight="900" sx={{ fontFamily: 'Orbitron', fontSize: '1.1rem', letterSpacing: '0.05em' }}>
          INTERVIEW<span style={{ color: theme.palette.primary.main }}>AI</span>
        </Typography>
      </Box>
      
      <Divider sx={{ opacity: 0.1 }} />

      <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
        {navigationSections.map((section) => (
          <Box key={section.title} sx={{ mb: 2 }}>
            <Typography
              variant="overline"
              sx={{ px: 3, mb: 1, display: 'block', color: 'text.secondary', fontWeight: 700, fontSize: '0.7rem' }}
            >
              {section.title}
            </Typography>
            <List sx={{ px: 1 }}>
              {section.items.map((item) => {
                const isActive = isActiveRoute(item.path);
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      selected={isActive}
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        borderRadius: 3,
                        py: 1,
                        px: 2,
                        transition: 'all 0.3s ease',
                        '&.Mui-selected': {
                          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 100%)`,
                          borderLeft: `4px solid ${theme.palette.primary.main}`,
                          '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
                          '& .MuiListItemText-primary': { fontWeight: 700, color: theme.palette.primary.main },
                        },
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          transform: 'translateX(4px)',
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'primary.main' : 'text.secondary' }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text} 
                        primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive ? 700 : 500 }} 
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: alpha(theme.palette.background.default, 0.8),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && (
              <IconButton color="inherit" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" fontWeight="800" sx={{ letterSpacing: '-0.02em' }}>
              {navigationSections
                .flatMap((section) => section.items)
                .find((item) => isActiveRoute(item.path))?.text || 'Dashboard'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              onClick={handleUserMenuOpen}
              sx={{ 
                borderRadius: 10,
                px: 2,
                py: 0.5,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  mr: 1.5,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Typography variant="body2" fontWeight="700" color="text.primary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {user?.name || 'User'}
              </Typography>
            </Button>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  borderRadius: 3,
                  minWidth: 180,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }
              }}
            >
              <MenuItem onClick={() => { handleUserMenuClose(); navigate('/profile'); }}>
                <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={() => { handleUserMenuClose(); navigate('/settings'); }}>
                <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: 'none',
              bgcolor: 'background.default'
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          minHeight: '100vh',
          background: theme.palette.mode === 'dark' 
            ? 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)'
            : 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.03) 0%, transparent 50%)',
        }}
      >
        <PageTransition>
          <Outlet />
        </PageTransition>
      </Box>
    </Box>
  );
}

export default MainLayout;
