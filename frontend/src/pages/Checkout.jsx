import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, MenuItem, Radio, Typography } from '@mui/material';
import api from '../api/axios';
import FormField from '../components/FormField';
import OrderSummary from '../components/OrderSummary';
import ProductImage from '../components/ProductImage';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice, INDIAN_STATES } from '../utils/format';
import { colors } from '../theme';

// Same rules as the Order model on the backend
const validate = (address) => {
  const errors = {};
  if (!address.fullName.trim()) errors.fullName = 'Enter the name for delivery';
  if (!/^[6-9]\d{9}$/.test(address.phone)) errors.phone = 'Enter a valid 10-digit mobile number';
  if (!address.address.trim()) errors.address = 'Enter your house no., street and area';
  if (!address.city.trim()) errors.city = 'Enter your city';
  if (!address.state) errors.state = 'Choose your state';
  if (!/^\d{6}$/.test(address.pincode)) errors.pincode = 'Enter a valid 6-digit pincode';
  return errors;
};

const cardSx = { bgcolor: 'background.paper', border: `1px solid ${colors.border}`, borderRadius: 2.5, p: 3 };

export default function Checkout() {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState({ fullName: user.name, phone: '', address: '', city: '', state: '', pincode: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [placing, setPlacing] = useState(false);

  // Nothing to check out. (Not while placing: the cart is cleared just before we leave.)
  if (items.length === 0 && !placing) return <Navigate to="/cart" replace />;

  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    const found = validate(address);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setServerError('');
    setPlacing(true);
    try {
      // Only ids and quantities: the server looks up the real prices
      const { data } = await api.post('/orders', {
        items: items.map((item) => ({ product: item._id, qty: item.qty })),
        shippingAddress: address,
      });
      clearCart();
      navigate(`/orders/${data.order._id}/success`, { replace: true });
    } catch (err) {
      setServerError(err.message); // e.g. "Only 1 left of Classic Denim Jacket"
      setPlacing(false);
    }
  };

  const field = (name, label, props = {}) => (
    <FormField
      label={label}
      name={name}
      value={address[name]}
      onChange={handleChange}
      error={Boolean(errors[name])}
      helperText={errors[name]}
      {...props}
    />
  );

  return (
    <>
      <Typography variant="h1" sx={{ fontSize: 34, letterSpacing: '-0.02em', mb: 3.5 }}>
        Checkout
      </Typography>

      {serverError && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {serverError}. Please update your cart and try again.
        </Alert>
      )}

      <Box
        component="form"
        id="checkout"
        noValidate
        onSubmit={placeOrder}
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 3.5, alignItems: 'flex-start' }}
      >
        <Box sx={{ flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box component="section" sx={cardSx}>
            <Typography variant="h4" component="h2" sx={{ mb: 2.5 }}>
              Delivery address
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 2 }}>
              {field('fullName', 'Full name', { autoComplete: 'name' })}
              {field('phone', 'Phone', {
                type: 'tel',
                placeholder: '10-digit mobile number',
                autoComplete: 'tel-national',
                slotProps: { htmlInput: { inputMode: 'numeric', maxLength: 10 } },
              })}
              <Box sx={{ gridColumn: '1 / -1' }}>
                {field('address', 'Address', { placeholder: 'House no., street, area', autoComplete: 'street-address' })}
              </Box>
              {field('city', 'City', { autoComplete: 'address-level2' })}
              {field('state', 'State', {
                select: true,
                children: INDIAN_STATES.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                )),
              })}
              {field('pincode', 'Pincode', {
                placeholder: '6 digits',
                autoComplete: 'postal-code',
                slotProps: { htmlInput: { inputMode: 'numeric', maxLength: 6 } },
              })}
            </Box>
          </Box>

          <Box component="fieldset" sx={{ ...cardSx, m: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography component="legend" variant="h4" sx={{ float: 'left', mb: 1 }}>
              Payment
            </Typography>
            <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, border: `2px solid ${colors.ink}`, borderRadius: 2, p: 1.5, cursor: 'pointer' }}>
              <Radio checked name="payment" value="COD" color="ink" sx={{ p: 0 }} />
              <span>
                <Box component="span" sx={{ display: 'block', fontWeight: 600 }}>
                  Cash on delivery
                </Box>
                <Box component="span" sx={{ fontSize: 13, color: 'text.secondary' }}>
                  Pay when your order arrives
                </Box>
              </span>
            </Box>
            <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, border: `1px solid ${colors.border}`, borderRadius: 2, p: 1.5, color: '#8A8A93' }}>
              <Radio disabled name="payment" value="online" sx={{ p: 0 }} />
              <span>
                <Box component="span" sx={{ display: 'block', fontWeight: 600 }}>
                  UPI / Card
                </Box>
                <Box component="span" sx={{ fontSize: 13 }}>
                  Coming soon
                </Box>
              </span>
            </Box>
          </Box>
        </Box>

        <OrderSummary
          title="Order summary"
          subtotalLabel="Subtotal"
          subtotal={subtotal}
          footer={
            <>
              <Button type="submit" variant="contained" size="large" loading={placing} sx={{ mt: 0.5 }}>
                Place order · {formatPrice(subtotal)}
              </Button>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.5 }}>
                Stock is reserved the moment you place the order.
              </Typography>
            </>
          }
        >
          {items.map((item) => (
            <Box key={item._id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <ProductImage product={item} label={false} sx={{ width: 48, height: 48, flex: 'none', borderRadius: 1.5, p: 0 }} />
              <Box component="span" sx={{ flex: 1, fontSize: 14, lineHeight: 1.35 }}>
                {item.name}{' '}
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  × {item.qty}
                </Box>
              </Box>
              <Typography variant="mono" sx={{ fontSize: 14 }}>
                {formatPrice(item.price * item.qty)}
              </Typography>
            </Box>
          ))}
        </OrderSummary>
      </Box>
    </>
  );
}
