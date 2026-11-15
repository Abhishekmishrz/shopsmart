import { Box } from '@mui/material';

// Background and text colour for each order status, from the mockup
const STATUS_COLORS = {
  Placed: ['#E6EBFF', '#2445D6'],
  Shipped: ['#FFF1C7', '#6B4E00'],
  Delivered: ['#E3F1E8', '#1E6B42'],
  Cancelled: ['#FDE7E5', '#B42318'],
};

export default function StatusChip({ status }) {
  const [bg, color] = STATUS_COLORS[status] || ['#EEEEEA', '#3D3D45'];
  return (
    <Box component="span" sx={{ bgcolor: bg, color, fontSize: 13, fontWeight: 600, px: 1.25, py: 0.5, borderRadius: 1, whiteSpace: 'nowrap' }}>
      {status}
    </Box>
  );
}
