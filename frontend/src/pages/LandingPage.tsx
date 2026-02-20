/**
 * Landing Page - Material-UI Version
 * Next-level design using MUI components
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ArrowForward,
  PlayArrow,
  CheckCircle,
  School,
  TrendingUp,
  Assessment,
  Business,
  EmojiEvents,
  AttachMoney,
  Psychology,
  ChevronRight,
} from '@mui/icons-material';
import { ROUTES } from '../config/app.config';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <School sx={{ fontSize: 48 }} />,
      title: 'Resume-Aware AI',
      description: 'Questions tailored to YOUR experience and background',
      color: theme.palette.primary.main,
    },
    {
      icon: <Psychology sx={{ fontSize: 48 }} />,
      title: 'Hybrid Intelligence',
      description: 'Fast traditional AI + deep agent analysis for comprehensive feedback',
      color: theme.palette.secondary.main,
    },
    {
      icon: <Assessment sx={{ fontSize: 48 }} />,
      title: 'Progress Tracking',
      description: 'Multi-dimensional analytics to track your improvement',
      color: theme.palette.success.main,
    },
    {
      icon: <Business sx={{ fontSize: 48 }} />,
      title: 'Company Intel',
      description: 'Real questions from top companies in your industry',
      color: theme.palette.warning.main,
    },
    {
      icon: <EmojiEvents sx={{ fontSize: 48 }} />,
      title: 'Gamification',
      description: 'Achievements, streaks, and skill trees to keep you motivated',
      color: theme.palette.error.main,
    },
    {
      icon: <AttachMoney sx={{ fontSize: 48 }} />,
      title: '100% Free',
      description: 'Unlimited practice with zero cost, forever',
      color: theme.palette.info.main,
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 1 }}>
            {/* Logo */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexGrow: 1,
                cursor: 'pointer',
              }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 18,
                }}
              >
                IM
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                InterviewMaster.AI
              </Typography>
            </Box>

            {/* Desktop Menu */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Button color="inherit" href="#features">
                  Features
                </Button>
                <Button color="inherit" href="#how-it-works">
                  How It Works
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate(ROUTES.LOGIN)}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  }}
                >
                  Get Started Free
                </Button>
              </Box>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton
                color="inherit"
                onClick={() => setMobileMenuOpen(true)}
                edge="end"
              >
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <Box sx={{ width: 250, pt: 2 }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton href="#features" onClick={() => setMobileMenuOpen(false)}>
                <ListItemText primary="Features" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>
                <ListItemText primary="How It Works" />
              </ListItemButton>
            </ListItem>
            <ListItem sx={{ px: 2, pt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(ROUTES.LOGIN);
                }}
              >
                Get Started Free
              </Button>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Hero Section */}
      <Box
        sx={{
          pt: { xs: 12, md: 16 },
          pb: { xs: 8, md: 12 },
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)}, ${alpha(theme.palette.secondary.light, 0.1)})`,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            {/* Left Content */}
            <Grid item xs={12} md={6}>
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Chip
                  label="✨ AI-Powered Interview Mastery"
                  sx={{
                    mb: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  }}
                />

                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    mb: 2,
                    fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                    lineHeight: 1.2,
                  }}
                >
                  Transform Your
                </Typography>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    mb: 3,
                    fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                    lineHeight: 1.2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.error.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Interview Game
                </Typography>

                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ mb: 4, lineHeight: 1.6 }}
                >
                  Master interviews with AI-powered coaching that adapts to your resume,
                  tracks your progress, and helps you land offers at top companies.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate(ROUTES.REGISTER)}
                    sx={{
                      py: 1.5,
                      px: 4,
                      borderRadius: 2,
                      fontSize: '1.1rem',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    }}
                  >
                    Start Free Trial
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<PlayArrow />}
                    sx={{
                      py: 1.5,
                      px: 4,
                      borderRadius: 2,
                      fontSize: '1.1rem',
                      borderWidth: 2,
                      '&:hover': { borderWidth: 2 },
                    }}
                  >
                    Watch Demo
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle color="success" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      No credit card required
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle color="success" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      Free forever
                    </Typography>
                  </Box>
                </Box>
              </MotionBox>
            </Grid>

            {/* Right Content - Preview Card */}
            <Grid item xs={12} md={6}>
              <MotionBox
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <Card
                  elevation={8}
                  sx={{
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                        }}
                      >
                        <Psychology />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          AI Interview Coach
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          Ready to Practice
                        </Typography>
                      </Box>
                    </Box>

                    {['Resume Analysis', 'Mock Interview', 'AI Feedback'].map((feature, i) => (
                      <Card
                        key={feature}
                        sx={{
                          mb: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="h5">
                                {i === 0 ? '📄' : i === 1 ? '💬' : '✨'}
                              </Typography>
                              <Box>
                                <Typography variant="body1" fontWeight="600">
                                  {feature}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Active
                                </Typography>
                              </Box>
                            </Box>
                            <ChevronRight color="primary" />
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </MotionBox>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="features" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h3"
              component="h2"
              fontWeight="bold"
              sx={{ mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}
            >
              Everything You Need to{' '}
              <Box
                component="span"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Ace Interviews
              </Box>
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
              Powerful features designed to transform your interview preparation
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  elevation={2}
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box
                      sx={{
                        color: feature.color,
                        mb: 2,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.error.main})`,
          color: 'white',
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h3"
              component="h2"
              fontWeight="bold"
              sx={{ mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}
            >
              Ready to Land Your Dream Job?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
              Join thousands of successful candidates who used InterviewMaster AI
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate(ROUTES.REGISTER)}
              sx={{
                py: 2,
                px: 6,
                fontSize: '1.2rem',
                borderRadius: 2,
                bgcolor: 'white',
                color: theme.palette.primary.main,
                fontWeight: 'bold',
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.9),
                },
              }}
            >
              Start Practicing Free →
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 6,
          bgcolor: theme.palette.grey[900],
          color: theme.palette.grey[400],
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, color: 'white' }}>
              InterviewMaster<Box component="span" sx={{ color: theme.palette.primary.main }}>.AI</Box>
            </Typography>
            <Typography variant="body2">
              © 2026 InterviewMaster AI. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
