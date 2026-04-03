/**
 * Premium Auth Layout
 * High-end identity verification environment for secure access
 */

import { Outlet } from 'react-router-dom';
import { Box, Container, Typography, Stack, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { GlassCard, GradientText } from '../common/PremiumComponents';
import { Security } from '@mui/icons-material';

const MotionBox = motion.create(Box);

function AuthLayout() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
        py: 8,
      }}
    >
      {/* Background Pulse Glows */}
      <MotionBox
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: 600,
          height: 600,
          bgcolor: 'primary.main',
          filter: 'blur(150px)',
          borderRadius: '50%',
          zIndex: 0,
        }}
      />
      <MotionBox
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '5%',
          width: 500,
          height: 500,
          bgcolor: 'secondary.main',
          filter: 'blur(180px)',
          borderRadius: '50%',
          zIndex: 0,
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ mb: 6, textAlign: 'center' }}>
           <MotionBox
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             sx={{ 
                width: 64, 
                height: 64, 
                borderRadius: 2, 
                bgcolor: 'primary.main', 
                mx: 'auto', 
                mb: 3, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white',
                boxShadow: `0 0 30px ${theme.palette.primary.main}66`
             }}
           >
              <Security sx={{ fontSize: 32 }} />
           </MotionBox>
           <Typography variant="h4" sx={{ fontWeight: 900, fontFamily: 'Orbitron', letterSpacing: '0.1em', mb: 1 }}>
              <GradientText>IDENTITY</GradientText> SECURED
           </Typography>
           <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.2em', display: 'block' }}>
              V4.0 VERIFICATION PROTOCOL
           </Typography>
        </Box>

        <GlassCard sx={{ p: 0, borderRadius: 6, overflow: 'hidden' }}>
          <Box sx={{ p: 5 }}>
            <Outlet />
          </Box>
        </GlassCard>

        {/* Status Line */}
        <Box sx={{ mt: 6, opacity: 0.5 }}>
           <Stack direction="row" spacing={3} justifyContent="center" alignItems="center">
              <Typography variant="caption" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>ENCRYPTION: AES-256</Typography>
              <Typography variant="caption" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>SIGNAL: NOMINAL</Typography>
              <Typography variant="caption" sx={{ fontWeight: 900, fontFamily: 'Orbitron' }}>LATENCY: 24MS</Typography>
           </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export default AuthLayout;
