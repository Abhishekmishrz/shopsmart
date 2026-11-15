import { Box, Typography } from '@mui/material';
import { formatPrice } from '../utils/format';
import { colors } from '../theme';

// The white box on the right of Cart and Checkout: lines, subtotal, delivery, total, button
export default function OrderSummary({ title, subtotalLabel, subtotal, children, footer }) {
  return (
    <Box
      component="aside"
      aria-label="Order summary"
      sx={{
        flex: '1 1 300px',
        bgcolor: 'background.paper',
        border: `1px solid ${colors.border}`,
        borderRadius: 2.5,
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.75,
        position: { md: 'sticky' },
        top: { md: 24 },
      }}
    >
      <Typography variant="h4" component="h2">
        {title}
      </Typography>
      {children}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
        <Box component="span" sx={{ color: 'text.secondary' }}>
          {subtotalLabel}
        </Box>
        <Typography variant="mono">{formatPrice(subtotal)}</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
        <Box component="span" sx={{ color: 'text.secondary' }}>
          Delivery
        </Box>
        <Box component="span" sx={{ color: colors.success, fontWeight: 600 }}>
          Free
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `1px solid ${colors.border}`, pt: 1.75 }}>
        <Box component="span" sx={{ fontWeight: 600, fontSize: 16 }}>
          Total
        </Box>
        <Typography variant="mono" sx={{ fontSize: 24 }}>
          {formatPrice(subtotal)}
        </Typography>
      </Box>
      {footer}
    </Box>
  );
}
