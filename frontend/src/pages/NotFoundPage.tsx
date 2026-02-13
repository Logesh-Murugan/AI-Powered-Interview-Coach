/**
 * Not Found Page Component
 * 404 error page
 */

import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/app.config';

function NotFoundPage() {
  const navigate = useNavigate();

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
        }}
      >
        <Typography variant="h1" component="h1" sx={{ fontSize: '6rem', fontWeight: 700 }}>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          The page you're looking for doesn't exist or has been moved.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate(ROUTES.DASHBOARD)}
        >
          Go to Dashboard
        </Button>
      </Box>
    </Container>
  );
}

export default NotFoundPage;
