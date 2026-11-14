import { Link } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';

export default function NotFound() {
  return (
    <Box sx={{ py: 10, textAlign: 'center' }}>
      <Typography variant="h2" sx={{ mb: 1 }}>
        Page not found
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        The page you're looking for doesn't exist.
      </Typography>
      <Button component={Link} to="/" variant="contained">
        Back to shop
      </Button>
    </Box>
  );
}
