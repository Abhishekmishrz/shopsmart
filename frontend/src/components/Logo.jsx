import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { colors } from '../theme';

// The "S" mark + name. onDark = true for the black login panel.
export default function Logo({ onDark = false }) {
  return (
    <Box
      component={Link}
      to="/"
      sx={{ display: 'flex', alignItems: 'center', gap: 1.25, textDecoration: 'none', color: onDark ? '#FFFFFF' : colors.ink }}
    >
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: '7px',
          display: 'grid',
          placeItems: 'center',
          bgcolor: onDark ? colors.accent : colors.ink,
          color: onDark ? colors.ink : colors.accent,
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 700,
          fontSize: 17,
        }}
      >
        S
      </Box>
      <Typography variant="h3" component="span" sx={{ fontSize: 21 }}>
        ShopSmart
      </Typography>
    </Box>
  );
}
