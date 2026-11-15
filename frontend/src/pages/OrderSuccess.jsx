import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import api from '../api/axios';
import { formatPrice, orderNumber } from '../utils/format';
import { colors, monoFont } from '../theme';

const labelSx = { fontFamily: monoFont, fontSize: 11, letterSpacing: '0.08em', color: 'text.secondary' };

// Loads the order from the API (not from memory), so refreshing this page still works
export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!order) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  const firstName = order.shippingAddress.fullName.split(' ')[0];

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', py: { xs: 2, sm: 4 }, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#E3F1E8', color: colors.success, display: 'grid', placeItems: 'center' }}>
          <CheckIcon fontSize="large" />
        </Box>
        <Typography variant="h1" sx={{ fontSize: { xs: 34, sm: 42 } }}>
          Order placed, {firstName}.
        </Typography>
        <Typography sx={{ fontSize: 16, lineHeight: 1.6, color: '#3D3D45' }}>
          We've reserved your items. You'll pay {formatPrice(order.totalAmount)} in cash when the order arrives at your{' '}
          {order.shippingAddress.city} address.
        </Typography>
      </Box>

      <Box sx={{ bgcolor: 'background.paper', border: `1px solid ${colors.border}`, borderRadius: 2.5 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, p: 2.5, borderBottom: `1px solid ${colors.border}` }}>
          {[
            ['ORDER ID', <Typography key="id" variant="mono">{orderNumber(order._id)}</Typography>],
            ['STATUS', <Typography key="status" fontWeight={600}>{order.status}</Typography>],
            ['TOTAL', <Typography key="total" variant="mono">{formatPrice(order.totalAmount)}</Typography>],
          ].map(([label, value]) => (
            <Box key={label} sx={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box component="span" sx={labelSx}>
                {label}
              </Box>
              {value}
            </Box>
          ))}
        </Box>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {order.items.map((item) => (
            <Box component="li" key={item.product} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, fontSize: 15 }}>
              <span>
                {item.name} × {item.qty}
              </span>
              <Typography variant="mono">{formatPrice(item.price * item.qty)}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <Button component={RouterLink} to="/orders" variant="contained" size="large" sx={{ flex: '1 1 200px' }}>
          Track this order
        </Button>
        <Button component={RouterLink} to="/" variant="outlined" size="large" sx={{ flex: '1 1 200px' }}>
          Continue shopping
        </Button>
      </Box>
    </Box>
  );
}
