import { Box, Typography } from '@mui/material';
import Logo from './Logo';
import { colors, monoFont } from '../theme';

const year = new Date().getFullYear();

const points = [
  'Search in plain words with the AI assistant',
  'Cash on delivery, free delivery above ₹999',
  'Track every order from placed to delivered',
];

// Shared by Login and Register: black brand panel on the left, the form on the right
export default function AuthLayout({ children }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap' }}>
      <Box
        component="section"
        sx={{
          flex: '1 1 420px',
          bgcolor: colors.ink,
          color: '#FFFFFF',
          p: { xs: 3, sm: 6 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 6,
        }}
      >
        <Logo onDark />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, maxWidth: 460 }}>
          <Typography variant="h1" sx={{ fontSize: { xs: 36, sm: 48 } }}>
            Tell us what you need. We'll find it.
          </Typography>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {points.map((point, i) => (
              <Box component="li" key={point} sx={{ display: 'flex', gap: 1.5, alignItems: 'baseline', color: '#D9D9DE' }}>
                <Box component="span" sx={{ fontFamily: monoFont, fontSize: 12, color: colors.accent }}>
                  {String(i + 1).padStart(2, '0')}
                </Box>
                {point}
              </Box>
            ))}
          </Box>
        </Box>
        <Typography sx={{ fontSize: 13, color: '#A3A3AD' }}>© {year} ShopSmart</Typography>
      </Box>

      <Box
        component="section"
        sx={{ flex: '1 1 420px', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3, py: 6 }}
      >
        <Box sx={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
}
