import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, IconButton, Link, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import api from '../api/axios';
import OrderSummary from '../components/OrderSummary';
import ProductImage from '../components/ProductImage';
import QuantityPicker from '../components/QuantityPicker';
import { useCart } from '../context/CartContext';
import { formatPrice, plural } from '../utils/format';
import { colors } from '../theme';

export default function Cart() {
  const { items, count, subtotal, updateQty, removeItem, syncItems } = useCart();
  const [notice, setNotice] = useState('');

  // The cart was saved in the browser, maybe days ago. Check every item against the
  // API once, so prices and stock shown here are current.
  useEffect(() => {
    if (items.length === 0) return;
    Promise.allSettled(items.map((item) => api.get(`/products/${item._id}`))).then((results) => {
      const fresh = results.filter((r) => r.status === 'fulfilled').map((r) => r.value.data.product);
      const changed = items.some((item) => {
        const p = fresh.find((f) => f._id === item._id);
        return !p || p.price !== item.price || p.stock < item.qty;
      });
      syncItems(fresh);
      if (changed) setNotice('Some prices or stock changed since you added them. Your cart has been updated.');
    });
    // Run once when the page opens, not on every quantity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>
          Your cart is empty
        </Typography>
        {notice && (
          <Alert severity="info" sx={{ maxWidth: 520, mx: 'auto', mb: 2, textAlign: 'left' }}>
            {notice}
          </Alert>
        )}
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Find something you like and it will show up here.
        </Typography>
        <Button component={RouterLink} to="/" variant="contained">
          Browse products
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h1" sx={{ fontSize: 34, letterSpacing: '-0.02em', mb: 0.75 }}>
        Your cart
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3.5 }}>
        {plural(count, 'item')} · prices are checked again when you place the order
      </Typography>

      {notice && (
        <Alert severity="info" onClose={() => setNotice('')} sx={{ mb: 2.5 }}>
          {notice}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3.5, alignItems: 'flex-start' }}>
        <Box
          component="section"
          aria-label="Cart items"
          sx={{ flex: '999 1 560px', minWidth: 0, bgcolor: 'background.paper', border: `1px solid ${colors.border}`, borderRadius: 2.5 }}
        >
          {items.map((item) => (
            <Box
              key={item._id}
              sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, p: 2.5, borderBottom: `1px solid ${colors.border}` }}
            >
              <ProductImage product={item} label={false} sx={{ width: 96, height: 96, flex: 'none' }} />
              <Box sx={{ flex: '1 1 200px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{item.brand}</Typography>
                <Link component={RouterLink} to={`/product/${item._id}`} underline="hover" sx={{ fontWeight: 600, fontSize: 16, color: 'text.primary' }}>
                  {item.name}
                </Link>
                <Typography variant="mono" sx={{ fontSize: 14, color: 'text.secondary' }}>
                  {formatPrice(item.price)} each
                </Typography>
              </Box>
              <QuantityPicker size="small" value={item.qty} max={item.stock} onChange={(qty) => updateQty(item._id, qty)} />
              <Typography variant="mono" sx={{ fontSize: 16, minWidth: 80, textAlign: 'right' }}>
                {formatPrice(item.price * item.qty)}
              </Typography>
              <IconButton aria-label={`Remove ${item.name}`} onClick={() => removeItem(item._id)} sx={{ color: 'text.secondary' }}>
                <DeleteOutlineIcon />
              </IconButton>
            </Box>
          ))}
          <Box sx={{ px: 2.5, py: 2 }}>
            <Link component={RouterLink} to="/" underline="none" fontWeight={600} fontSize={14}>
              ← Continue shopping
            </Link>
          </Box>
        </Box>

        <OrderSummary
          title="Summary"
          subtotalLabel={`Subtotal (${plural(count, 'item')})`}
          subtotal={subtotal}
          footer={
            <>
              <Button component={RouterLink} to="/checkout" variant="contained" size="large" sx={{ mt: 0.5 }}>
                Proceed to checkout
              </Button>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.5 }}>
                Free delivery and cash on delivery on every order.
              </Typography>
            </>
          }
        />
      </Box>
    </>
  );
}
