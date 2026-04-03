/**
 * Premium Not Found Page
 * High-end 404 "Signal Lost" interface
 */

import { Box, Typography, Container, alpha, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/app.config';
import { GlassCard, GradientButton, GradientText } from '../components/common/PremiumComponents';
import { motion } from 'framer-motion';
import { WifiOff, Home } from '@mui/icons-material';

const MotionBox = motion.create(Box);

function NotFoundPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Glow */}
        <MotionBox
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 5, repeat: Infinity }}
          sx={{
            position: 'absolute',
            width: 400,
            height: 400,
            bgcolor: 'error.main',
            filter: 'blur(150px)',
            borderRadius: '50%',
            zIndex: 0
          }}
        />

        <GlassCard sx={{ p: 6, position: 'relative', zIndex: 1, width: '100%' }}>
            <MotionBox
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              sx={{ mb: 4 }}
            >
               <WifiOff sx={{ fontSize: 100, color: 'error.main', opacity: 0.8 }} />
            </MotionBox>
            
            <Typography variant="h1" sx={{ fontWeight: 1000, fontFamily: 'Orbitron', mb: 1, fontSize: '5rem' }}>
              404
            </Typography>
            
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, fontFamily: 'Orbitron', letterSpacing: '0.1em' }}>
              SIGNAL <GradientText>LOST</GradientText>
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 6, fontWeight: 500, lineHeight: 1.6 }}>
              The requested data vector is outside the current lattice parameters. Coordinates invalid or unauthorized.
            </Typography>
            
            <GradientButton
              size="large"
              fullWidth
              startIcon={<Home />}
              onClick={() => navigate(ROUTES.DASHBOARD)}
              sx={{ py: 2, fontSize: '1.2rem', fontFamily: 'Orbitron' }}
            >
              RETURN TO COMMAND
            </GradientButton>
        </GlassCard>

        <Box sx={{ mt: 4, opacity: 0.3 }}>
           <Typography variant="caption" sx={{ fontWeight: 900, fontFamily: 'Orbitron', letterSpacing: '0.2em' }}>ERROR CODE: 0x404_NULL_VECTOR</Typography>
        </Box>
      </Box>
    </Container>
  );
}

export default NotFoundPage;
