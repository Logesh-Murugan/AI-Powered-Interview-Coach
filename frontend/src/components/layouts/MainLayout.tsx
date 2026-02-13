/**
 * Main Layout Component
 * Layout for authenticated pages with sidebar and header
 */

import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';

function MainLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}

export default MainLayout;
