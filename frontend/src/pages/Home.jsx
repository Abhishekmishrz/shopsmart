import { useEffect, useState } from 'react';
import { Alert, Typography } from '@mui/material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Temporary page: proves the frontend can talk to the backend.
// Step 8 replaces it with the product grid and filters.
export default function Home() {
  const { user } = useAuth();
  const [total, setTotal] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/products')
      .then(({ data }) => setTotal(data.total))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <>
      <Typography variant="h2" sx={{ mb: 1 }}>
        {user ? `Hi ${user.name.split(' ')[0]}` : 'Welcome to ShopSmart'}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {total !== null && <Typography color="text.secondary">Connected to the API: {total} products in the catalogue.</Typography>}
    </>
  );
}
