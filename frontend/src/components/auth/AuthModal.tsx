/**
 * Auth Modal Component
 * Unified login/register modal for the landing page
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  IconButton,
  Tabs,
  Tab,
  Typography,
  useTheme,
  alpha,
  Fade,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import LoginPage from '../../pages/auth/LoginPage';
import RegisterPage from '../../pages/auth/RegisterPage';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: 0 | 1;
}

const MotionBox = motion.create(Box);

const AuthModal = ({ open, onClose, initialTab = 0 }: AuthModalProps) => {
  const [tabValue, setTabValue] = useState(initialTab);
  const theme = useTheme();

  useEffect(() => {
    setTabValue(initialTab);
  }, [initialTab, open]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue as 0 | 1);
  };


  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={400}
      PaperProps={{
        sx: {
          borderRadius: 6,
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: 'hidden',
        },
      }}
    >
      <Box sx={{ position: 'relative', pt: 4, pb: 2, px: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}` }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'text.secondary',
            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.05), color: 'error.main' },
          }}
        >
          <CloseIcon />
        </IconButton>

        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth"
          sx={{
            '& .MuiTabs-indicator': {
              height: 4,
              borderRadius: '4px 4px 0 0',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            },
          }}
        >
          <Tab 
            label="SIGN IN" 
            sx={{ fontWeight: 900, fontFamily: 'Orbitron', fontSize: '0.75rem', py: 2 }} 
          />
          <Tab 
            label="CREATE ACCOUNT" 
            sx={{ fontWeight: 900, fontFamily: 'Orbitron', fontSize: '0.75rem', py: 2 }} 
          />

        </Tabs>
      </Box>

      <DialogContent sx={{ p: 4, pt: 5, minHeight: 450 }}>
        <AnimatePresence mode="wait">
          <MotionBox
            key={tabValue}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {tabValue === 0 ? <LoginPage /> : <RegisterPage />}
          </MotionBox>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
