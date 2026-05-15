/**
 * Premium Landing Page
 * State-of-the-art AI-coach entry point with high-end visuals and animations
 */

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Chip,
  useTheme,
  Grid,
  alpha,
  Stack,
  LinearProgress,
  Avatar,
  AvatarGroup,
  Divider,
} from '@mui/material';

import {
  PlayArrow,
  CheckCircle,
  Psychology,
  AutoAwesome,
  Star,
  Security,
  FlashOn,
  Timeline,
  RocketLaunch,
  KeyboardArrowRight,
  TrendingUp,
  School,
  Business,
  Insights,
} from '@mui/icons-material';
import { ROUTES } from '../config/app.config';
import { GlassCard, GradientButton, GradientText } from '../components/common/PremiumComponents';
import { useAppSelector } from '../store/hooks';
import AuthModal from '../components/auth/AuthModal';

const MotionBox = motion.create(Box);
const MotionTypography = motion.create(Typography);

const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [scrolled, setScrolled] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<0 | 1>(0);

  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const openLogin = () => {

     setAuthTab(0);
     setAuthModalOpen(true);
  };

  const openRegister = () => {
     setAuthTab(1);
     setAuthModalOpen(true);
  };

  const features = [
    { 
      icon: <Psychology />, 
      title: 'RESUME ANALYSIS', 
      desc: 'Our AI analyzes your experience to create practice interviews that match real-world roles.', 
      color: '#6366f1' 
    },
    { 
      icon: <AutoAwesome />, 
      title: 'SMART FEEDBACK', 
      desc: 'Get immediate feedback on your answers, helping you improve both what you say and how you say it.', 
      color: '#a855f7' 
    },
    { 
      icon: <Timeline />, 
      title: 'PROGRESS TRACKING', 
      desc: 'Track your improvement across multiple skills so you know exactly where you are getting better.', 
      color: '#ec4899' 
    },
    { 
      icon: <Business />, 
      title: 'ROLE-SPECIFIC PRACTICE', 
      desc: 'Practice for specific roles at top companies like FAANG with high-quality mock interviews.', 
      color: '#3b82f6' 
    },

  ];

  const steps = [
    { title: 'UPLOAD RESUME', desc: 'Securely upload your resume for our AI to analyze.', icon: <RocketLaunch color="primary" /> },
    { title: 'PRACTICE INTERVIEW', desc: 'Practice with an AI that simulates real-world interview conditions.', icon: <Insights color="secondary" /> },
    { title: 'GET BETTER', desc: 'Review your detailed performance report and improve your skills.', icon: <TrendingUp color="success" /> },
  ];


  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', overflowX: 'hidden', color: 'text.primary' }}>
      {/* Cursor Follower */}
      <MotionBox
        sx={{
          position: 'fixed',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 1,
          left: -200,
          top: -200,
        }}
        animate={{
          x: mousePos.x,
          y: mousePos.y,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.5 }}
      />

      {/* Auth Modal */}
      <AuthModal 
        open={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialTab={authTab} 
      />

      {/* Hero Background Elements */}
      <MotionBox 
        style={{ y: backgroundY }}
        sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.5 }}
      >
         <Box sx={{ position: 'absolute', top: '-10%', right: '-5%', width: 800, height: 800, bgcolor: alpha(theme.palette.primary.main, 0.15), filter: 'blur(180px)', borderRadius: '50%' }} />
         <Box sx={{ position: 'absolute', bottom: '5%', left: '-10%', width: 700, height: 700, bgcolor: alpha(theme.palette.secondary.main, 0.15), filter: 'blur(180px)', borderRadius: '50%' }} />
         <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)',
            backgroundSize: '40px 40px',
         }} />
      </MotionBox>

      {/* Navigation */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: scrolled ? alpha(theme.palette.background.paper, 0.7) : 'transparent',
          backdropFilter: scrolled ? 'blur(25px)' : 'none',
          borderBottom: scrolled ? `1px solid ${alpha(theme.palette.divider, 0.08)}` : 'none',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1100,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ py: { xs: 1.5, md: 2 }, justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
               <Box sx={{ 
                  width: 42, 
                  height: 42, 
                  borderRadius: 2, 
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 900, 
                  color: 'white', 
                  fontFamily: 'Orbitron',
                  boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`
               }}>IM</Box>
               <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'Orbitron', letterSpacing: '0.15em', display: { xs: 'none', sm: 'block' } }}>
                <GradientText>INTERVIEW</GradientText>MASTER
               </Typography>
            </Stack>
            
            <Stack direction="row" spacing={{ xs: 1, md: 4 }} alignItems="center">
               <Button sx={{ color: 'text.primary', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.1em', display: { xs: 'none', md: 'flex' } }}>TECHNOLOGY</Button>
               <Button sx={{ color: 'text.primary', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.1em', display: { xs: 'none', md: 'flex' } }}>ECOSYSTEM</Button>
               
               {isAuthenticated ? (
                 <GradientButton onClick={() => navigate(ROUTES.DASHBOARD)} sx={{ px: { xs: 2, sm: 4 }, borderRadius: 2.5, fontWeight: 900, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>DASHBOARD</GradientButton>
               ) : (
                 <Stack direction="row" spacing={{ xs: 1, sm: 2 }}>
                    <Button onClick={openLogin} sx={{ fontWeight: 900, color: 'text.primary', border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`, px: { xs: 1.5, sm: 3 }, fontSize: { xs: '0.75rem', sm: '0.875rem' }, borderRadius: 2.5 }}>SIGN IN</Button>
                    <GradientButton onClick={openRegister} sx={{ px: { xs: 2, sm: 4 }, fontSize: { xs: '0.75rem', sm: '0.875rem' }, borderRadius: 2.5, fontWeight: 900 }}>GET STARTED</GradientButton>
                 </Stack>
               )}

            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="xl" sx={{ pt: { xs: 16, md: 30 }, pb: { xs: 10, md: 20 }, position: 'relative', zIndex: 1 }}>
         <Grid container spacing={10} alignItems="center">
            <Grid size={{ xs: 12, lg: 7 }}>
               <MotionBox
                 initial={{ opacity: 0, y: 40 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, ease: "easeOut" }}
               >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
                    <Chip 
                      label="AI-POWERED INTELLIGENCE" 
                      icon={<FlashOn sx={{ fontSize: '0.9rem !important' }} />}
                      sx={{ 
                        fontWeight: 1000, 
                        fontFamily: 'Orbitron', 
                        fontSize: '0.7rem',
                        bgcolor: alpha(theme.palette.primary.main, 0.1), 
                        color: 'primary.main', 
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        letterSpacing: '0.1em',
                        px: 1
                      }} 
                    />
                    <Typography variant="caption" sx={{ fontWeight: 900, opacity: 0.5, letterSpacing: '0.2em' }}>READY</Typography>
                  </Stack>

                  
                  <MotionTypography variant="h1" sx={{ 
                    fontWeight: 900, 
                    lineHeight: 0.95, 
                    mb: 3, 
                    fontSize: { xs: '2.5rem', sm: '3.8rem', md: '5.5rem', lg: '6.5rem' }, 
                    fontFamily: 'Orbitron', 
                    color: 'text.primary',
                    letterSpacing: '-0.02em'
                  }}>
                    EVOLVE YOUR <br />
                    <GradientText shadow>INTERVIEW</GradientText> <br />
                    INTELLIGENCE
                  </MotionTypography>
                  
                  <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 700, mb: 8, lineHeight: 1.7, fontWeight: 500, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                    The world's most advanced AI-agent optimized for interview simulations. 
                    Augment your professional value and synchronize with global hiring benchmarks 
                    using our hybrid-reasoning engine.
                  </Typography>
                  
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                     <GradientButton 
                        size="large" 
                        onClick={isAuthenticated ? () => navigate(ROUTES.DASHBOARD) : openRegister} 
                        sx={{ 
                          py: 2.5, 
                          px: 6, 
                          fontSize: '1.1rem', 
                          fontFamily: 'Orbitron',
                          borderRadius: 3,
                          boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.25)}`
                        }}
                      >
                        GET STARTED
                      </GradientButton>
                     <Button 
                        variant="outlined" 
                        size="large" 
                        startIcon={<PlayArrow />} 
                        sx={{ 
                          py: 2, 
                          px: 4, 
                          borderRadius: 3, 
                          fontWeight: 900, 
                          borderWidth: 2, 
                          borderColor: alpha(theme.palette.text.primary, 0.1),
                          '&:hover': { borderWidth: 2, borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) } 
                        }}
                      >
                        SEE HOW IT WORKS
                      </Button>
                  </Stack>

                  
                  <Box sx={{ mt: 8 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                       <AvatarGroup max={4}>
                         {[1,2,3,4,5].map(i => (
                           <Avatar key={i} sx={{ width: 32, height: 32, border: `2px solid ${theme.palette.background.default}` }} src={`https://i.pravatar.cc/100?img=${i+10}`} />
                         ))}
                       </AvatarGroup>
                       <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.05em' }}>
                        <span style={{ color: theme.palette.text.primary, fontWeight: 1000 }}>50K+ CANDIDATES</span> JOINED THIS MONTH
                       </Typography>

                    </Stack>
                  </Box>
               </MotionBox>
            </Grid>
            
            <Grid size={{ xs: 12, lg: 5 }}>
               <MotionBox
                 initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
                 animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                 transition={{ delay: 0.2, duration: 1.2, ease: "easeOut" }}
                 sx={{ position: 'relative', perspective: '1000px' }}
               >
                  {/* Floating AI Analytics Preview */}
                  <GlassCard sx={{ 
                    p: 0, 
                    borderRadius: 8, 
                    overflow: 'hidden', 
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`, 
                    boxShadow: `0 40px 100px ${alpha(theme.palette.background.paper, 0.5)}, 0 0 40px ${alpha(theme.palette.primary.main, 0.1)}`,
                    transform: 'rotateX(2deg) rotateY(-5deg)',
                    transition: 'all 0.5s ease',
                    '&:hover': { transform: 'rotateX(0deg) rotateY(0deg)', borderColor: 'primary.main' }
                  }}>
                     <Box sx={{ p: 3.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha(theme.palette.background.paper, 0.6) }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                           <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main', boxShadow: '0 0 15px #f43f5e', animation: 'pulse 2s infinite' }} />
                           <Typography variant="caption" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', letterSpacing: '0.1em' }}>AI ANALYZER: READY</Typography>
                        </Stack>
                        <Chip label="SECURE" size="small" variant="outlined" sx={{ fontWeight: 900, height: 22, fontSize: '0.65rem' }} />
                     </Box>

                     
                     <Box sx={{ p: 5, bgcolor: alpha(theme.palette.background.paper, 0.2) }}>
                        <Stack spacing={4}>
                           {[
                             { t: 'RESUME ANALYSIS', v: 94, c: theme.palette.primary.main },
                             { t: 'SKILL ALIGNMENT', v: 82, c: theme.palette.secondary.main },
                             { t: 'INTERVIEW PERFORMANCE', v: 88, c: '#10b981' },
                           ].map((item, i) => (

                             <Box key={i}>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                                   <Typography variant="caption" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', letterSpacing: '0.05em', opacity: 0.8 }}>{item.t}</Typography>
                                   <Typography variant="caption" sx={{ fontWeight: 1000, color: item.c }}>{item.v}%</Typography>
                                </Stack>
                                <Box sx={{ height: 6, width: '100%', bgcolor: alpha(theme.palette.divider, 0.05), borderRadius: 3, overflow: 'hidden' }}>
                                   <MotionBox 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${item.v}%` }}
                                      transition={{ delay: 1 + (i * 0.2), duration: 1.5 }}
                                      sx={{ height: '100%', bgcolor: item.c, boxShadow: `0 0 10px ${alpha(item.c, 0.5)}` }} 
                                   />
                                </Box>
                             </Box>
                           ))}
                        </Stack>
                     </Box>
                     
                     <Box sx={{ p: 5, textAlign: 'center', borderTop: `1px solid ${alpha(theme.palette.divider, 0.05)}` }}>
                        <Typography variant="body2" sx={{ mb: 3, opacity: 0.6, fontStyle: 'italic', fontSize: '0.8rem' }}>
                          "AI Analysis: High confidence in technical sector 4, recommended focus on situational leadership vectors."
                        </Typography>
                        <GradientButton fullWidth size="large" sx={{ fontFamily: 'Orbitron', py: 2 }}>GET FULL REPORT</GradientButton>
                     </Box>

                  </GlassCard>

                  {/* Decorative Tech Elements */}
                  <Box sx={{ position: 'absolute', top: -40, right: -30, p: 2.5, borderRadius: 4, bgcolor: 'background.paper', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`, zIndex: 10 }}>
                     <Stack direction="row" spacing={1.5} alignItems="center">
                        <AutoAwesome color="primary" sx={{ fontSize: 28 }} />
                        <Typography variant="body2" sx={{ fontWeight: 1000, letterSpacing: '0.1em' }}>AUTO-OPTIMIZED</Typography>
                     </Stack>
                  </Box>
                  
                  <Box sx={{ position: 'absolute', bottom: 40, left: -50, p: 2.5, borderRadius: 4, bgcolor: 'background.paper', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`, zIndex: 10, display: { xs: 'none', md: 'block' } }}>
                     <Stack direction="row" spacing={1.5} alignItems="center">
                        <Security color="secondary" />
                        <Typography variant="body2" sx={{ fontWeight: 1000, letterSpacing: '0.1em' }}>SOC2 COMPLIANT</Typography>
                     </Stack>
                  </Box>
               </MotionBox>
            </Grid>
         </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ py: { xs: 10, md: 25 }, position: 'relative' }}>
         <Container maxWidth="xl">
            <Box sx={{ textAlign: 'center', mb: { xs: 8, md: 15 } }}>
               <Typography variant="overline" sx={{ fontWeight: 1000, color: 'primary.main', letterSpacing: '0.4em' }}>THE PROCESS</Typography>
               <Typography variant="h2" sx={{ fontWeight: 900, mt: 2, mb: 3, fontFamily: 'Orbitron', color: 'text.primary', fontSize: { xs: '2rem', md: '3.75rem' } }}>HOW TO <GradientText>GET STARTED</GradientText></Typography>
               <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto', fontWeight: 500, fontSize: { xs: '1rem', md: '1.25rem' } }}>Improve your interview skills in three simple steps.</Typography>

            </Box>
            
            <Grid container spacing={4}>
               {steps.map((step, i) => (
                 <Grid key={i} size={{ xs: 12, md: 4 }}>
                   <MotionBox
                     initial={{ opacity: 0, y: 30 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: i * 0.2 }}
                     sx={{ height: '100%' }}
                   >
                     <GlassCard sx={{ 
                       p: 6, 
                       height: '100%', 
                       textAlign: 'center', 
                       position: 'relative',
                       '&:hover': { transform: 'translateY(-10px)', borderColor: 'primary.main' }
                     }}>
                       <Box sx={{ 
                         width: 80, 
                         height: 80, 
                         borderRadius: '50%', 
                         bgcolor: alpha(theme.palette.background.paper, 0.5), 
                         display: 'flex', 
                         alignItems: 'center', 
                         justifyContent: 'center', 
                         mx: 'auto', 
                         mb: 4,
                         border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                         fontSize: 32
                       }}>
                         {step.icon}
                       </Box>
                       <Typography variant="h5" sx={{ fontWeight: 1000, mb: 2, fontFamily: 'Orbitron' }}>{step.title}</Typography>
                       <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, lineHeight: 1.8 }}>{step.desc}</Typography>
                       
                       {i < 2 && (
                         <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', right: -20, top: '40%', zIndex: 5 }}>
                            <KeyboardArrowRight sx={{ fontSize: 40, opacity: 0.2, color: 'primary.main' }} />
                         </Box>
                       )}
                     </GlassCard>
                   </MotionBox>
                 </Grid>
               ))}
            </Grid>
         </Container>
      </Box>

      {/* Capabilities Section */}
      <Box id="features" sx={{ py: { xs: 10, md: 25 }, bgcolor: alpha(theme.palette.background.paper, 0.3), position: 'relative' }}>
         <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.8)} 0%, transparent 50%, ${alpha(theme.palette.background.default, 0.8)} 100%)`, zIndex: 0 }} />
         
         <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ textAlign: 'center', mb: { xs: 8, md: 15 } }}>
               <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, fontFamily: 'Orbitron', color: 'text.primary', fontSize: { xs: '2rem', md: '3.75rem' } }}>AUGMENTED <GradientText>CAPABILITIES</GradientText></Typography>
               <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', fontWeight: 500, fontSize: { xs: '1rem', md: '1.25rem' } }}>Our neural network is trained on 10M+ data points from high-performance career paths to provide elite-level coaching.</Typography>
            </Box>
            
            <Grid container spacing={5}>
               {features.map((f, i) => (
                 <Grid key={i} size={{ xs: 12, md: 6, lg: 3 }}>
                    <MotionBox
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 }}
                      sx={{ height: '100%' }}
                    >
                       <GlassCard sx={{ 
                          p: 6, 
                          height: '100%', 
                          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)', 
                          display: 'flex',
                          flexDirection: 'column',
                          '&:hover': { 
                            borderColor: f.color, 
                            boxShadow: `0 30px 60px ${alpha(f.color, 0.1)}`,
                            transform: 'translateY(-12px)'
                          } 
                       }}>
                          <Box sx={{ 
                            p: 2.5, 
                            borderRadius: 4, 
                            bgcolor: alpha(f.color, 0.1), 
                            color: f.color, 
                            display: 'inline-flex', 
                            mb: 4,
                            width: 'fit-content',
                            boxShadow: `0 0 20px ${alpha(f.color, 0.2)}`
                          }}>{f.icon}</Box>
                          <Typography variant="h6" sx={{ fontWeight: 1000, mb: 2, fontFamily: 'Orbitron', letterSpacing: '0.02em' }}>{f.title}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, lineHeight: 1.8, mb: 4, flex: 1 }}>{f.desc}</Typography>
                          
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ opacity: 0.4, transition: 'all 0.3s', '&:hover': { opacity: 1 } }}>
                             <Typography variant="caption" sx={{ fontWeight: 1000, letterSpacing: '0.1em' }}>LEARN MORE</Typography>
                             <KeyboardArrowRight fontSize="small" />
                          </Stack>
                       </GlassCard>
                    </MotionBox>
                 </Grid>
               ))}
            </Grid>
         </Container>
      </Box>

      {/* Voice & Tone Analysis Feature Section */}
      <Box sx={{ py: { xs: 10, md: 25 }, position: 'relative', overflow: 'hidden' }}>
         <Container maxWidth="xl">
            <Grid container spacing={10} alignItems="center">
               <Grid size={{ xs: 12, lg: 6 }}>
                  <MotionBox
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    sx={{ position: 'relative' }}
                  >
                     <GlassCard sx={{ p: 0, borderRadius: 8, overflow: 'hidden', border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}` }}>
                        <Box sx={{ p: 3, bgcolor: alpha(theme.palette.secondary.main, 0.1), borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}` }}>
                           <Typography variant="caption" sx={{ fontWeight: 1000, color: 'secondary.main', fontFamily: 'Orbitron' }}>VOICE ANALYSIS MODULE</Typography>
                        </Box>
                        <Box sx={{ p: 5 }}>
                           <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ height: 60, mb: 4, justifyContent: 'center' }}>
                              {[0.4, 0.7, 0.3, 0.9, 0.5, 0.8, 0.4, 0.6, 0.9, 0.3, 0.7].map((h, i) => (
                                <MotionBox
                                  key={i}
                                  animate={{ height: [`${h * 100}%`, `${(1-h) * 100}%`, `${h * 100}%`] }}
                                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                  sx={{ width: 6, bgcolor: 'secondary.main', borderRadius: 3, opacity: 0.6 }}
                                />
                              ))}
                           </Stack>
                           
                           <Stack spacing={3}>
                              <Box>
                                 <Typography variant="caption" sx={{ fontWeight: 900, opacity: 0.6, display: 'block', mb: 1 }}>TONE CONFIDENCE</Typography>
                                 <LinearProgress variant="determinate" value={85} color="secondary" sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.secondary.main, 0.1) }} />
                              </Box>
                              <Box>
                                 <Typography variant="caption" sx={{ fontWeight: 900, opacity: 0.6, display: 'block', mb: 1 }}>SPEAKING PACE</Typography>
                                 <LinearProgress variant="determinate" value={92} color="success" sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.1) }} />
                              </Box>
                           </Stack>
                        </Box>
                     </GlassCard>
                  </MotionBox>
               </Grid>
               
               <Grid size={{ xs: 12, lg: 6 }}>
                  <MotionBox
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                  >
                     <Typography variant="h3" sx={{ fontWeight: 900, mb: 4, fontFamily: 'Orbitron', fontSize: { xs: '2rem', md: '3rem' } }}>VOICE & <GradientText shadow>TONE ANALYSIS</GradientText></Typography>
                     <Typography variant="body1" color="text.secondary" sx={{ mb: 6, fontSize: { xs: '1rem', md: '1.2rem' }, lineHeight: 1.8 }}>
                        Our AI doesn't just evaluate what you say—it analyzes how you say it. 
                        Get feedback on your speaking pace, confidence levels, and tone of voice 
                        to ensure you sound as professional as you are across all simulations.
                     </Typography>
                     <Button variant="outlined" color="secondary" size="large" sx={{ borderRadius: 3, px: 4, py: 1.5, fontWeight: 900, borderWidth: 2, '&:hover': { borderWidth: 2 } }}>TRY VOICE COACH</Button>
                  </MotionBox>
               </Grid>
            </Grid>
         </Container>
      </Box>

      {/* Intelligence Preview Section */}

      <Container maxWidth="xl" sx={{ py: { xs: 10, md: 25 } }}>
         <Grid container spacing={10} alignItems="center">
            <Grid size={{ xs: 12, lg: 6 }} sx={{ order: { xs: 2, lg: 1 } }}>
               <Box sx={{ position: 'relative' }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)', 
                    width: '120%', 
                    height: '120%', 
                    bgcolor: alpha(theme.palette.primary.main, 0.05), 
                    filter: 'blur(100px)', 
                    borderRadius: '50%',
                    zIndex: 0
                  }} />
                  <MotionBox
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    sx={{ position: 'relative', zIndex: 1 }}
                  >
                     <GlassCard sx={{ p: 6, borderRadius: 8, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                        <Stack spacing={4}>
                           <Box sx={{ borderLeft: `4px solid ${theme.palette.primary.main}`, pl: 3 }}>
                              <Typography variant="h6" fontWeight="1000" sx={{ mb: 1, fontFamily: 'Orbitron' }}>AI-DRIVEN FEEDBACK</Typography>
                              <Typography variant="body2" color="text.secondary">"Candidate demonstrates strong technical recursion knowledge but clarity in situational response lags by 15%."</Typography>
                           </Box>
                           <Box sx={{ borderLeft: `4px solid ${theme.palette.secondary.main}`, pl: 3 }}>
                              <Typography variant="h6" fontWeight="1000" sx={{ mb: 1, fontFamily: 'Orbitron' }}>GROWTH MAPPING</Typography>
                              <Typography variant="body2" color="text.secondary">Projected 34% increase in offer probability after 3 adaptive logic sessions.</Typography>
                           </Box>
                           <Box sx={{ borderLeft: `4px solid #10b981`, pl: 3 }}>
                              <Typography variant="h6" fontWeight="1000" sx={{ mb: 1, fontFamily: 'Orbitron' }}>SENTIMENT ANALYSIS</Typography>
                              <Typography variant="body2" color="text.secondary">Confidence vector is stable. Sentiment scores optimal for leadership-track interviews.</Typography>
                           </Box>
                        </Stack>
                     </GlassCard>
                  </MotionBox>
               </Box>
            </Grid>
            
            <Grid size={{ xs: 12, lg: 6 }} sx={{ order: { xs: 1, lg: 2 } }}>
               <MotionBox
                 initial={{ opacity: 0, x: 50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
               >
                  <Typography variant="overline" sx={{ fontWeight: 1000, color: 'primary.main', letterSpacing: '0.4em' }}>AUGMENTED REACH</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 900, my: 3, fontFamily: 'Orbitron', color: 'text.primary', fontSize: { xs: '2rem', md: '3rem' } }}>ELITE <GradientText>DIAGNOSTICS</GradientText></Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 6, fontSize: { xs: '1rem', md: '1.2rem' }, lineHeight: 2 }}>
                    Unlike traditional boards, we utilize real-time structural analysis of your answers. 
                    Our AI doesn't just listen—it reasons through your logic to identify depth 
                    irregularities and content gaps in milliseconds.
                  </Typography>
                  
                  <Stack spacing={3}>
                     {[
                       { icon: <School color="primary" />, text: 'Adaptive Study Plans tailored to your profile' },
                       { icon: <Business color="primary" />, text: 'Company-specific situational logic patterns' },
                       { icon: <Psychology color="primary" />, text: 'Behavioral telemetry and posture analysis' },
                     ].map((item, i) => (
                       <Stack key={i} direction="row" spacing={2} alignItems="center">
                          <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>{item.icon}</Box>
                          <Typography variant="body2" fontWeight="900" sx={{ letterSpacing: '0.05em' }}>{item.text.toUpperCase()}</Typography>
                       </Stack>
                     ))}
                  </Stack>
               </MotionBox>
            </Grid>
         </Grid>
      </Container>

      {/* Final CTA */}
      <Container maxWidth="lg" sx={{ py: { xs: 10, md: 25 } }}>
         <MotionBox
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
         >
            <GlassCard sx={{ 
              p: { xs: 6, md: 12 }, 
              textAlign: 'center', 
              position: 'relative', 
              overflow: 'hidden', 
              borderRadius: 10,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
            }}>
               <Box sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  opacity: 0.05, 
                  background: 'radial-gradient(circle at center, white 1px, transparent 1px)', 
                  backgroundSize: '30px 30px' 
               }} />
               <Typography variant="h2" sx={{ fontWeight: 900, mb: 4, fontFamily: 'Orbitron', color: 'text.primary', fontSize: { xs: '2.5rem', md: '4rem' } }}>
                READY TO <GradientText shadow>LAND THE OFFER?</GradientText>
               </Typography>
               <Typography variant="h6" color="text.secondary" sx={{ mb: 8, fontWeight: 500, maxWidth: 800, mx: 'auto' }}>
                Join the elite cohort of candidates using InterviewMaster AI to dominate their sectors and secure top-tier placements.
               </Typography>
               
               <GradientButton 
                  size="large" 
                  onClick={isAuthenticated ? () => navigate(ROUTES.DASHBOARD) : openRegister}  
                  sx={{ 
                    py: { xs: 2, md: 3 }, 
                    px: { xs: 4, md: 10 }, 
                    fontSize: { xs: '1.2rem', md: '1.6rem' }, 
                    fontFamily: 'Orbitron',
                    borderRadius: 4,
                    boxShadow: `0 20px 60px ${alpha(theme.palette.primary.main, 0.3)}`
                  }}
               >
                  GET STARTED
               </GradientButton>

            </GlassCard>
         </MotionBox>
      </Container>

      {/* Footer */}
      <Box component="footer" sx={{ py: { xs: 8, md: 15 }, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`, bgcolor: alpha(theme.palette.background.paper, 0.2) }}>
         <Container maxWidth="xl">
            <Grid container spacing={{ xs: 4, md: 8 }} sx={{ mb: { xs: 6, md: 10 } }}>
               <Grid size={{ xs: 12, md: 4 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                    <Box sx={{ 
                        width: 36, 
                        height: 36, 
                        borderRadius: 1.5, 
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: 900, 
                        color: 'white', 
                        fontFamily: 'Orbitron'
                    }}>IM</Box>
                    <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', letterSpacing: '0.1em' }}>INTERVIEWMASTER</Typography>
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 2, mb: 4, maxWidth: 300 }}>
                    Helping candidates land their dream jobs with the power of artificial intelligence.
                  </Typography>

               </Grid>
               
               <Grid size={{ xs: 12, md: 8 }}>
                  <Grid container spacing={4}>
                      {[
                        { title: 'PRODUCT', links: ['Neural Engine', 'AI Pro', 'Questions', 'Progress'] },
                        { title: 'ECOSYSTEM', links: ['FAANG Training', 'Mock Interviews', 'Study Plans', 'Leaderboards'] },
                        { title: 'RESOURCES', links: ['Career Advice', 'Achievements', 'Settings'] },
                        { title: 'LEGAL', links: ['Terms', 'Privacy', 'Security'] },
                      ].map((col, i) => (
                       <Grid key={i} size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" sx={{ fontWeight: 1000, display: 'block', mb: 3, letterSpacing: '0.2em', color: 'primary.main' }}>{col.title}</Typography>
                          <Stack spacing={2}>
                             {col.links.map(link => (
                               <Link key={link} href="#" sx={{ color: 'text.secondary', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, '&:hover': { color: 'text.primary' } }}>{link}</Link>
                             ))}
                          </Stack>
                       </Grid>
                     ))}
                  </Grid>
               </Grid>
            </Grid>
            
            <Divider sx={{ opacity: 0.05, mb: 6 }} />
            
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={4}>
               <Typography variant="caption" sx={{ fontWeight: 900, opacity: 0.4, color: 'text.secondary', letterSpacing: '0.1em' }}>
                © 2026 INTERVIEW MASTER AI. ALL RIGHTS RESERVED.
               </Typography>
               <Stack direction="row" spacing={3} sx={{ opacity: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 1000 }}>SECURE & PRIVATE</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 1000 }}>POWERED BY AI PRO</Typography>
               </Stack>
            </Stack>

         </Container>
      </Box>
    </Box>
  );
};

// Internal Link wrapper
const Link = ({ children, href, sx }: any) => {
  const theme = useTheme();
  return (
    <Typography
      component="a"
      href={href}
      sx={{
        color: 'text.secondary',
        textDecoration: 'none',
        fontSize: '0.85rem',
        fontWeight: 700,
        transition: 'all 0.3s',
        '&:hover': { color: 'primary.main' },
        ...sx
      }}
    >
      {children}
    </Typography>
  );
};

export default LandingPage;
